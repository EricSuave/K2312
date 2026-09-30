import test from 'node:test';
import assert from 'node:assert/strict';
import {createPrepSchedule,prepSlotLabel,prepScheduleCsv,type PrepSubmission} from '../lib/prep-schedule';
import {prepFormSchema} from '../lib/member-validation';
import {prepTimeSlots} from '../data/prep';

const cycle='2026-10-03';
function member(id:string,days:number,times=['12:15']):PrepSubmission{
 return {user_id:id,cycle,updated_at:'2026-09-30T10:00:00Z',members:{player_name:`Player ${id}`,player_id:id,alliance:'404'},payload:{truegold:0,construction_speedup_days:days,research_speedup_days:days,training_speedup_days:days,day_1_minister:'yes',day_2_minister:'no',day_4_minister:'no',day_1_times:times,day_2_times:[],day_4_times:[],day_5_times:[]}};
}
function assignments(records:PrepSubmission[]){return createPrepSchedule(records,cycle)[1].members.map(m=>[m.submission.user_id,m.assigned_slot]);}
test('highest points get first SELECTED time, with lower scores using their next free choice',()=>{
 const high=member('high',30,['18:15','06:15']);const low=member('low',10,['18:15','09:15']);const mid=member('mid',20,['18:15','06:15']);
 assert.deepEqual(assignments([low,high,mid]),[['high','18:15'],['mid','06:15'],['low','09:15']]);
 assert.equal(createPrepSchedule([low,high,mid],cycle)[1].members[1].preference_number,2);
});
test('do not invent unavailable times; only requested buffs with estimates are scheduled',()=>{
 const high=member('high',20),blocked=member('blocked',10),noRequest=member('no',100),noTimes=member('times',15,[]),empty=member('zero',0),unknown=member('unknown',100);
 noRequest.payload.day_1_minister='no';delete unknown.payload.construction_speedup_days;
 const s=createPrepSchedule([blocked,unknown,empty,noTimes,noRequest,high],cycle)[1];
 const status=Object.fromEntries(s.members.map(m=>[m.submission.user_id,m.status]));
 assert.deepEqual(status,{high:'assigned',blocked:'waitlisted',no:'not_requested',times:'no_preferences',zero:'no_spending',unknown:'missing_points'});
 assert.equal(s.slots.filter(slot=>slot.member).length,1);
});
test('ties use earlier saved time then member ID, independent of query ordering',()=>{
 const early=member('300',10,['12:15','12:45','13:15']);early.updated_at='2026-09-29T10:00:00Z';
 const b=member('200',10,['12:15','12:45','13:15']),a=member('100',10,['12:15','12:45','13:15']);
 assert.deepEqual(assignments([a,b,early]),[['300','12:15'],['100','12:45'],['200','13:15']]);
 assert.deepEqual(assignments([early,b,a]),assignments([a,b,early]));
 assert.deepEqual(createPrepSchedule([a,b,early],cycle)[1].members.map(m=>m.rank),[1,1,1]);
});
test('one booking per member per day, no duplicate slots, across more than one API page',()=>{
 const records=Array.from({length:105},(_,i)=>member(String(i+1),i+1,[...prepTimeSlots]));
 const s=createPrepSchedule(records,cycle)[1];const booked=s.members.filter(m=>m.status==='assigned');
 assert.equal(s.members.length,105);assert.equal(booked.length,48);assert.equal(s.members.filter(m=>m.status==='waitlisted').length,57);
 assert.equal(new Set(booked.map(m=>m.assigned_slot)).size,48);assert.equal(new Set(booked.map(m=>m.submission.user_id)).size,48);
 assert.equal(booked[0].submission.user_id,'105');assert.equal(booked[0].assigned_slot,'23:45');
});
test('cycle isolation, latest duplicate wins, original preference data stays unchanged',()=>{
 const old=member('1',10,['12:15']);const recent=member('1',20,['18:15']);recent.updated_at='2026-09-30T11:00:00Z';
 const other=member('outside',900);other.cycle='2026-11-01';
 const s=createPrepSchedule([old,other,recent,old],cycle);
 assert.equal(s[1].members.length,1);assert.equal(s[1].members[0].assigned_slot,'18:15');assert.deepEqual(recent.payload.day_1_times,['18:15']);
 assert.equal(createPrepSchedule([old],other.cycle)[1].members.length,0);
});
test('Day 5 only allocates remaining unscheduled activities and recalculates priority',()=>{
 const blocker=member('blocker',1000,['12:15']);
 const constructionBooked=member('construction',200,['14:15']);constructionBooked.payload.day_2_minister='yes';constructionBooked.payload.day_2_times=['12:15'];constructionBooked.payload.day_5_times=['18:15','18:45'];constructionBooked.payload.research_speedup_days=2;
 const researchBooked=member('research',50,['12:15']);researchBooked.payload.day_2_minister='yes';researchBooked.payload.day_2_times=['12:15'];researchBooked.payload.day_5_times=['18:15','18:45'];researchBooked.payload.research_speedup_days=100;
 const both=member('both',10,['20:15']);both.payload.day_2_minister='yes';both.payload.day_2_times=['20:15'];both.payload.day_5_times=['20:15'];
 const s=createPrepSchedule([blocker,constructionBooked,researchBooked,both],cycle);
 const overflow=Object.fromEntries(s[5].members.map(m=>[m.submission.user_id,m]));
 assert.equal(overflow.research.points,50*43200);assert.equal(overflow.research.assigned_slot,'18:15');assert.equal(overflow.research.research_included,false);
 assert.equal(overflow.construction.points,2*43200);assert.equal(overflow.construction.assigned_slot,'18:45');assert.equal(overflow.construction.construction_included,false);
 assert.equal(overflow.both.status,'covered');assert.equal(overflow.both.assigned_slot,null);
});
test('Day 4 excludes missing estimates and ranks only training-related point contributions',()=>{
 const unknown=member('unknown',100);unknown.payload.day_4_minister='yes';unknown.payload.day_4_times=['12:15'];
 const train=member('train',1);train.payload.day_4_minister='yes';train.payload.day_4_times=['12:15'];train.payload.training_batch={tier:10,from_tier:0,quantity:1000,duration_days:.5};
 const s=createPrepSchedule([unknown,train],cycle)[4];assert.equal(s.members[0].points,120000);assert.equal(s.members[0].assigned_slot,'12:15');assert.equal(s.members[1].status,'missing_points');
});
test('preference order survives form validation; unknown and duplicate slots are rejected',()=>{
 const p={...member('1',1,['18:15','06:15']).payload,battle_date:cycle,construction_targets:[]};
 assert.deepEqual(prepFormSchema.parse(p).day_1_times,['18:15','06:15']);
 assert.equal(prepFormSchema.safeParse({...p,day_1_times:['18:15','18:15']}).success,false);
 assert.equal(prepFormSchema.safeParse({...p,day_1_times:['25:15']}).success,false);
});
test('UTC midnight labels and CSV spreadsheet formula protection',()=>{
 assert.equal(prepSlotLabel('23:45'),'23:45–00:15 (+1 UTC day)');assert.equal(prepSlotLabel('12:15'),'12:15–12:45');
 const row=member('1',1);row.members!.player_name='=SUM(1,2)';
 const csv=prepScheduleCsv(cycle,createPrepSchedule([row],cycle)[1]);
 assert.ok(csv.includes('"\'=SUM(1,2)"'));assert.ok(csv.includes('"12:15–12:45"'));assert.equal(csv.split('\r\n').length,49);
});
