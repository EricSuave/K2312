import {prepDays,prepTimeSlots} from '@/data/prep';
import {prepEstimate,type PrepRankingInput} from './prep-ranking';

export type PrepDay=typeof prepDays[number];
type PreferenceFields=Partial<Record<`day_${PrepDay}_times`,string[]>&Record<`day_${1|2|4}_minister`,'yes'|'no'>>;
export type PrepSubmission={
  user_id:string;cycle:string;updated_at:string;entry_source?:'member'|'admin';entered_by?:string|null;
  payload:PrepRankingInput&PreferenceFields;
  members?:{player_id:string;player_name:string;alliance:string|null};
};
export type ScheduleStatus='assigned'|'waitlisted'|'missing_points'|'no_preferences'|'not_requested'|'no_spending'|'covered';
export type ScheduledMember={
  submission:PrepSubmission;points:number|null;preferences:string[];status:ScheduleStatus;
  rank:number|null;assigned_slot:string|null;preference_number:number|null;
  construction_included:boolean;research_included:boolean;
};
export type PrepDaySchedule={day:PrepDay;members:ScheduledMember[];slots:{start:string;member:ScheduledMember|null}[]};
export const scheduleStatusLabels:Record<ScheduleStatus,string>={
  assigned:'Assigned',waitlisted:'Waiting · preferred slots full',missing_points:'Needs point estimate',
  no_preferences:'Needs preferred times',not_requested:'Not requested',no_spending:'No planned spending',covered:'Covered on Days 1 / 2',
};
const slots=new Set(prepTimeSlots);
const compareText=(a:string,b:string)=>a<b?-1:a>b?1:0;
const savedAt=(r:PrepSubmission)=>Number.isFinite(Date.parse(r.updated_at))?Date.parse(r.updated_at):Number.MAX_SAFE_INTEGER;
function compareMembers(a:ScheduledMember,b:ScheduledMember){
  return (b.points??-1)-(a.points??-1)||savedAt(a.submission)-savedAt(b.submission)
    ||compareText(a.submission.members?.player_id??a.submission.user_id,b.submission.members?.player_id??b.submission.user_id)
    ||compareText(a.submission.user_id,b.submission.user_id);
}

/** Allocate globally for one KvK cycle BEFORE applying any display filters. */
export function createPrepSchedule(records:PrepSubmission[],cycle:string):Record<PrepDay,PrepDaySchedule>{
  // The database is unique on member/kind/cycle; also defend against repeated pagination rows.
  const unique=new Map<string,PrepSubmission>();
  for(const record of records){
    if(record.cycle!==cycle)continue;
    const previous=unique.get(record.user_id);
    if(!previous||savedAt(record)>savedAt(previous))unique.set(record.user_id,record);
  }
  const assignedConstruction=new Set<string>(),assignedResearch=new Set<string>();
  const result={} as Record<PrepDay,PrepDaySchedule>;
  for(const day of prepDays){
    const candidates:ScheduledMember[]=[...unique.values()].map(submission=>{
      const p=submission.payload;
      const raw=p[`day_${day}_times`];
      const preferences=[...new Set(Array.isArray(raw)?raw.filter(time=>slots.has(time)):[])];
      const construction_included=day===1||(day===5&&!assignedConstruction.has(submission.user_id));
      const research_included=day===2||(day===5&&!assignedResearch.has(submission.user_id));
      const scoringInput=day===5?{...p,...(!construction_included?{truegold:0,construction_speedup_days:0}:{}),...(!research_included?{research_speedup_days:0}:{})}:p;
      const points=prepEstimate(scoringInput,day);
      const requested=day===5?preferences.length>0:p[`day_${day}_minister`]==='yes';
      let status:ScheduleStatus='waitlisted';
      if(!requested)status='not_requested';
      else if(day===5&&!construction_included&&!research_included)status='covered';
      else if(points===null)status='missing_points';
      else if(points<=0)status='no_spending';
      else if(preferences.length===0)status='no_preferences';
      return {submission,points,preferences,status,rank:null,assigned_slot:null,preference_number:null,construction_included,research_included};
    });
    const eligible=candidates.filter(c=>c.status==='waitlisted').sort(compareMembers);
    const unranked=candidates.filter(c=>c.status!=='waitlisted').sort(compareMembers);
    const booked=new Map<string,ScheduledMember>();
    let rank=0;
    eligible.forEach((member,index)=>{
      if(index===0||member.points!==eligible[index-1].points)rank=index+1;
      member.rank=rank;
      const start=member.preferences.find(time=>!booked.has(time));
      if(!start)return;
      member.status='assigned';member.assigned_slot=start;member.preference_number=member.preferences.indexOf(start)+1;
      booked.set(start,member);
      if(day===1)assignedConstruction.add(member.submission.user_id);
      if(day===2)assignedResearch.add(member.submission.user_id);
    });
    result[day]={day,members:[...eligible,...unranked],slots:[...prepTimeSlots].sort().map(start=>({start,member:booked.get(start)??null}))};
  }
  return result;
}

export function prepSlotLabel(start:string){
  const [hours,minutes]=start.split(':').map(Number);
  const end=hours*60+minutes+30;
  const endLabel=`${String(Math.floor(end/60)%24).padStart(2,'0')}:${String(end%60).padStart(2,'0')}`;
  return `${start}–${endLabel}${end>=1440?' (+1 UTC day)':''}`;
}

// Escape cells as text so member names cannot execute formulas in spreadsheet software.
function csvCell(value:unknown){
  const text=String(value??'');
  return '"'+(/^[\s]*[=+@-]|^[\t\r\n]/.test(text)?"'"+text:text).replaceAll('"','""')+'"';
}
export function prepScheduleCsv(cycle:string,schedule:PrepDaySchedule){
  const rows:unknown[][]=[['Battle date','Prep day','UTC slot','Status','Rank','Member','Member ID','Alliance','Estimated points','Preference used','Entry source']];
  for(const slot of schedule.slots){const m=slot.member;rows.push([cycle,schedule.day,prepSlotLabel(slot.start),m?'Assigned':'Open',m?.rank,m?.submission.members?.player_name,m?.submission.members?.player_id,m?.submission.members?.alliance,m?.points,m?.preference_number,m?(m.submission.entry_source==='admin'?'Admin entered':'Member submitted'):'']);}
  for(const m of schedule.members.filter(m=>m.status!=='assigned'))rows.push([cycle,schedule.day,'',scheduleStatusLabels[m.status],m.rank,m.submission.members?.player_name,m.submission.members?.player_id,m.submission.members?.alliance,m.points,'',m.submission.entry_source==='admin'?'Admin entered':'Member submitted']);
  return '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
}
