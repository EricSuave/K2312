'use client';
import {useEffect,useMemo,useState} from 'react';
import {alliances} from '@/data/kingdom';
import {createPrepSchedule,prepScheduleCsv,prepSlotLabel,scheduleStatusLabels,type PrepDay,type PrepSubmission,type ScheduledMember} from '@/lib/prep-schedule';
import styles from './prep-schedule.module.css';

const labels:Record<PrepDay,string>={1:'Day 1 · Construction buff',2:'Day 2 · Research buff',4:'Day 4 · Training buff',5:'Day 5 · Construction / research overflow'};
const pointsLabel=(member:ScheduledMember)=>member.points===null?'Needs estimate':member.points.toLocaleString('en-US');
function MemberName({member}:{member:ScheduledMember}){return <>{member.submission.members?.player_name??'Member'}<small>ID {member.submission.members?.player_id??member.submission.user_id}</small>{member.submission.entry_source==='admin'&&<small>Admin entered</small>}</>;}
function Spending({member,day}:{member:ScheduledMember;day:PrepDay}){
 const p=member.submission.payload;
 if(day===4)return <>{p.training_speedup_days??'—'} training days</>;
 return <>{member.construction_included&&<>{p.truegold?.toLocaleString('en-US')??'—'} Truegold<small>{p.construction_speedup_days??'—'} construction days</small></>}{member.research_included&&<small>{p.research_speedup_days??'—'} research days</small>}{!member.construction_included&&!member.research_included&&'Already allocated'}</>;
}

export function PrepRankings({refreshKey=0}:{refreshKey?:number}){
 const[rows,setRows]=useState<PrepSubmission[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[reload,setReload]=useState(0);
 const[cycle,setCycle]=useState(''),[alliance,setAlliance]=useState(''),[day,setDay]=useState<PrepDay>(1),[requested,setRequested]=useState(true),[slot,setSlot]=useState('');
 const[loadedAt,setLoadedAt]=useState('');
 useEffect(()=>{
  const controller=new AbortController();setLoading(true);setError('');
  (async()=>{
   const all:PrepSubmission[]=[];
   for(let offset=0;;offset+=100){
    const response=await fetch(`/api/admin/forms?kind=prep&offset=${offset}`,{signal:controller.signal,cache:'no-store'});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||'Unable to load rankings.');
    all.push(...data.items);
    if(!data.has_more)break;
    if(offset>=100000)throw new Error('Too many records to build a complete schedule.');
   }
   if(controller.signal.aborted)return;
   setRows(all);
   const dates=[...new Set(all.map(r=>r.cycle))].sort().reverse();
   setCycle(previous=>dates.includes(previous)?previous:dates[0]??'');setLoadedAt(new Date().toISOString());
  })().catch(e=>{if(!controller.signal.aborted)setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[reload,refreshKey]);
 const dates=[...new Set(rows.map(r=>r.cycle))].sort().reverse();
 const schedules=useMemo(()=>createPrepSchedule(rows,cycle),[rows,cycle]);
 const schedule=schedules[day];
 // All allocation happens above. Filtering must never release another alliance's slots.
 const matchesAlliance=(member:ScheduledMember)=>!alliance||member.submission.members?.alliance===alliance;
 const ranked=schedule.members.filter(m=>matchesAlliance(m)&&(!requested||m.status!=='not_requested')&&(!slot||m.preferences.includes(slot)));
 const visibleSlots=schedule.slots.filter(s=>(!slot||s.start===slot)&&(!alliance||(s.member!==null&&matchesAlliance(s.member))));
 const waiting=ranked.filter(m=>['waitlisted','missing_points','no_preferences'].includes(m.status));
 const assigned=schedule.members.filter(m=>m.status==='assigned');
 function download(){
  const url=URL.createObjectURL(new Blob([prepScheduleCsv(cycle,schedule)],{type:'text/csv;charset=utf-8;'}));
  const link=document.createElement('a');link.href=url;link.download=`kingdom-2312-${cycle}-day-${day}-schedule.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <section className={`card ${styles.panel}`}>
  <div className="eyebrow">LEADERSHIP PLANNING</div><h2>Prep rankings &amp; automatic schedule</h2>
  <p>Highest estimated appointment points choose first. Each member gets their first free preferred time, then their next choice if necessary. One member per 30-minute slot and one appointment per member per day.</p>
  <div className="form-grid">
   <label>Battle date<select value={cycle} onChange={e=>{setCycle(e.target.value);setSlot('')}}><option value="">Select date</option>{dates.map(d=><option key={d}>{d}</option>)}</select></label>
   <label>Buff day<select value={day} onChange={e=>{setDay(Number(e.target.value) as PrepDay);setSlot('')}}>{Object.entries(labels).map(([d,l])=><option value={d} key={d}>{l}</option>)}</select></label>
   <label>Show alliance<select value={alliance} onChange={e=>setAlliance(e.target.value)}><option value="">All alliances</option>{alliances.map(a=><option key={a.tag}>{a.tag}</option>)}</select></label>
   <label>Show preferred start (UTC)<select value={slot} onChange={e=>setSlot(e.target.value)}><option value="">All times</option>{schedule.slots.map(s=><option key={s.start}>{s.start}</option>)}</select></label>
  </div>
  <label className="inline-check"><input type="checkbox" checked={requested} onChange={e=>setRequested(e.target.checked)}/>Only show members who requested this day</label>
  <div className={styles.toolbar}><button className="button secondary small" type="button" disabled={loading} onClick={()=>setReload(r=>r+1)}>Refresh rankings &amp; schedule</button><button className="button secondary small" type="button" disabled={loading||!!error||!cycle} onClick={download}>Download full day schedule (CSV)</button></div>
  <p className="field-help">Filters only change what is displayed. Rankings and bookings always use the whole kingdom. Existing forms use the order in which times were selected; members can reorder them in the prep form.</p>
  <p className="notice">Automatic draft from saved submissions. Loading or refreshing recalculates the schedule; new or edited forms may move bookings. Leadership must confirm appointments in game. {loadedAt&&<>Last loaded: {new Date(loadedAt).toLocaleString('en-GB',{timeZone:'UTC'})} UTC.</>}</p>
  {day===5&&<p className="notice">Overflow counts only construction or research plans that have no assigned Day 1 or Day 2 slot in this schedule. A member booked on both days receives no duplicate Day 5 appointment. Keep spending plans up to date if items have already been used.</p>}
  {day===4&&<p className="field-help">Day 4 needs training batch details to estimate troop points from speedups. Missing estimates go to the waiting list and do not take a slot.</p>}
  {loading?<p role="status">Loading every prep submission and filling the schedule…</p>:error?<p role="alert">{error}</p>:!cycle?<p>No preparation submissions yet. Saved member preferences will fill this list automatically.</p>:<>
   <div className={styles.summary} aria-label="Whole kingdom schedule totals"><span>{assigned.length} / {schedule.slots.length} slots filled</span><span>{schedule.members.filter(m=>m.status==='waitlisted').length} waiting for a preferred slot</span><span>{schedule.members.filter(m=>m.status==='missing_points'||m.status==='no_preferences').length} need more details</span></div>
   <section className={styles.section} aria-labelledby="prep-ranking-title"><h3 id="prep-ranking-title">Point ranking &amp; assigned times</h3><p>{ranked.length} matching members. Equal point totals share a rank; earlier saved submissions get first choice in a tie, then member ID.</p>
    <div className={styles.tableWrap}><table className={styles.table}><caption>{labels[day]} · battle date {cycle}</caption><thead><tr><th scope="col">Rank</th><th scope="col">Member</th><th scope="col">Alliance</th><th scope="col">Estimated points</th><th scope="col">Planned spending</th><th scope="col">Preferred starts · UTC</th><th scope="col">Assigned time · UTC</th><th scope="col">Status</th></tr></thead><tbody>{ranked.map(m=><tr key={m.submission.user_id}><td>{m.rank??'—'}</td><td><MemberName member={m}/></td><td>{m.submission.members?.alliance??'Not set'}</td><td>{pointsLabel(m)}</td><td><Spending member={m} day={day}/></td><td>{m.preferences.length?<details><summary>1. {m.preferences[0]}{m.preferences.length>1?` + ${m.preferences.length-1} backups`:''}</summary><ol>{m.preferences.map(time=><li key={time}>{time} UTC</li>)}</ol></details>:'None selected'}</td><td>{m.assigned_slot?<>{prepSlotLabel(m.assigned_slot)}<small>Preference #{m.preference_number}</small></>:'—'}</td><td><span className={styles.status} data-status={m.status}>{scheduleStatusLabels[m.status]}</span></td></tr>)}</tbody></table></div>
    {!ranked.length&&<p>No members match these filters.</p>}
   </section>
   <section className={styles.section} aria-labelledby="prep-schedule-title"><h3 id="prep-schedule-title">Appointment schedule · UTC</h3><p>Listed in time order for {labels[day]}. The 23:45 appointment ends at 00:15 on the next UTC day.</p>
    <div className={styles.tableWrap}><table className={styles.table}><caption>Automatic schedule · {alliance?`[${alliance}] assignments`:'whole kingdom, including open slots'}</caption><thead><tr><th scope="col">Time · UTC</th><th scope="col">Member</th><th scope="col">Alliance</th><th scope="col">Rank</th><th scope="col">Estimated points</th><th scope="col">Preference used</th></tr></thead><tbody>{visibleSlots.map(s=><tr key={s.start}><td>{prepSlotLabel(s.start)}</td><td>{s.member?<MemberName member={s.member}/>:<span className={styles.status}>Open</span>}</td><td>{s.member?.submission.members?.alliance??'—'}</td><td>{s.member?.rank??'—'}</td><td>{s.member?pointsLabel(s.member):'—'}</td><td>{s.member?`#${s.member.preference_number}`:'—'}</td></tr>)}</tbody></table></div>
    {!visibleSlots.length&&<p>No assigned slots match these filters.</p>}
   </section>
   <section className={styles.section} aria-labelledby="prep-waiting-title"><h3 id="prep-waiting-title">Waiting list / needs details</h3>{waiting.length?<ul>{waiting.map(m=><li key={m.submission.user_id}><strong>{m.submission.members?.player_name??'Member'}</strong> · ID {m.submission.members?.player_id} · {scheduleStatusLabels[m.status]}{m.points!==null?` · ${m.points.toLocaleString('en-US')} points`:''}</li>)}</ul>:<p>No waiting members match these filters.</p>}</section>
  </>}
  <details className={styles.section}><summary>How the ranking and schedule work</summary><p>Day 1: Truegold × 2,000 + construction speedup days × 43,200. Day 2: research speedup days × 43,200. Day 4: estimated trained troops × tier points; promotions use the difference between starting and target tiers. Training assumes the reported batch can be repeated with the listed speedups and expected buffs. It excludes natural training time and resource limits.</p><p>Only appointment-related spending counts. Gear, charms, heroes and other unrelated activities are excluded. These are planned points, not extra points awarded by the buff itself. General speedups must be assigned to one activity only.</p><p>Only members requesting a buff with a positive estimate and valid preferred times receive an automatic appointment. The highest estimate is processed first; if every preferred time is booked, the member waits rather than being assigned an unavailable time. The saved preference order survives a page refresh.</p><p>Day 5 priority uses only plans without a Day 1/2 appointment. This avoids booking the same planned spending twice. The draft does not track items actually spent or set any in-game appointments.</p><p>Community values checked September 30, 2026. Confirm scoring against the current event screen.</p><a className="text-link" href="https://www.kingshotguide.org/guide/kingshot-kvk-event" target="_blank" rel="noopener noreferrer">Scoring reference ↗</a></details>
 </section>;
}
