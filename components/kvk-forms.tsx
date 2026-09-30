'use client';
import {useState,type FormEvent} from 'react';
import {battleSchedule,battleSources,battleRoles,battleTimeOptions} from '@/data/battle';
import {battleFormSchema,type BattleForm} from '@/lib/member-validation';
import {useMemberForm} from './use-member-form';
import {DraftNotice,FormBack,MemberIdentity,FormLoadState} from './member-form-fields';

export function AvailabilityForm(){
  const saved=useMemberForm<BattleForm>('availability');
  if(saved.loading||saved.loadFailed)return <FormLoadState loading={saved.loading} message={saved.status} retry={saved.retry}/>;
  return <AvailabilityEditor key={saved.revision} saved={saved}/>;
}
function AvailabilityEditor({saved}:{saved:ReturnType<typeof useMemberForm<BattleForm>>}){
  const{status,setStatus}=saved;
  const[attendance,setAttendance]=useState(saved.initial?.attendance??'');
  const[date,setDate]=useState(saved.initial?.event_date??'');
  const[from,setFrom]=useState(saved.initial?.starts_at?.slice(11,16)??'');
  const[until,setUntil]=useState(saved.initial?.ends_at?.slice(11,16)??'');
  const unavailable=attendance==='unavailable';

  function selectWindow(start:string,end:string){setFrom(start);setUntil(end);setStatus('');}
  async function checkEntries(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const data=new FormData(event.currentTarget);
    const result=battleFormSchema.safeParse({event_date:date,attendance,
      ...(unavailable?{}:{starts_at:`${date}T${from}:00Z`,ends_at:`${date}T${until}:00Z`,role:data.get('role')}),
      notes:data.get('notes')||'',
    });
    if(!result.success){saved.setError(true);setStatus(result.error.issues[0].message);return;}
    await saved.save(result.data);
  }

  return <div className="wrap page-body"><FormBack/>
    <form className="profile-form" onSubmit={checkEntries} onChange={()=>setStatus('')}>
      <DraftNotice/>
      <section>
        <div className="eyebrow">01 / YOUR ACCOUNT</div><h2>Who is joining?</h2>
        <MemberIdentity/>
      </section>
      <section>
        <div className="eyebrow">02 / BATTLE AVAILABILITY</div><h2>When can you fight?</h2>
        <div className="battle-schedule" aria-label="KvK battle times in UTC">
          <div><span>Full battle window</span><strong>{battleSchedule.start}–{battleSchedule.end} <small>UTC</small></strong></div>
          <div><span>Castle battle window</span><strong>{battleSchedule.castleStart}–{battleSchedule.castleEnd} <small>UTC</small></strong></div>
        </div>
        <p>Use the battle date announced by leadership. Select the part of the battle you can attend; all times below are UTC.</p>
        <div className="form-grid">
          <label>Battle date (UTC)<input name="event_date" type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label>
          <label>Availability<select name="attendance" required value={attendance} onChange={e=>setAttendance(e.target.value)}>
            <option value="" disabled>Choose availability</option><option value="available">Available</option><option value="tentative">Tentative</option><option value="unavailable">Not available</option>
          </select></label>
        </div>
        <fieldset className="availability-window" disabled={unavailable} hidden={unavailable}>
          <legend>Your time window · UTC</legend>
          <div className="battle-presets" aria-label="Quick time selections">
            <button type="button" className="filter" aria-pressed={from===battleSchedule.start&&until===battleSchedule.end} onClick={()=>selectWindow(battleSchedule.start,battleSchedule.end)}>Full battle · {battleSchedule.start}–{battleSchedule.end}</button>
            <button type="button" className="filter" aria-pressed={from===battleSchedule.castleStart&&until===battleSchedule.castleEnd} onClick={()=>selectWindow(battleSchedule.castleStart,battleSchedule.castleEnd)}>Castle battle · {battleSchedule.castleStart}–{battleSchedule.castleEnd}</button>
          </div>
          <div className="form-grid">
            <label>Available from (UTC)<select name="start_time" required={!unavailable} value={from} onChange={e=>{setFrom(e.target.value);if(until&&until<=e.target.value)setUntil('')}}>
              <option value="" disabled>Select start time</option>{battleTimeOptions.slice(0,-1).map(time=><option key={time} value={time}>{time} UTC</option>)}
            </select></label>
            <label>Available until (UTC)<select name="end_time" required={!unavailable} value={until} onChange={e=>setUntil(e.target.value)}>
              <option value="" disabled>Select end time</option>{battleTimeOptions.slice(1).map(time=><option key={time} value={time} disabled={!!from&&time<=from}>{time} UTC</option>)}
            </select></label>
            <label>Preferred role<select name="role" required={!unavailable} defaultValue={saved.initial?.role??''}><option value="" disabled>Choose a role</option>{battleRoles.map(role=><option key={role}>{role}</option>)}</select></label>
          </div>
          {from&&until&&<p className="battle-selection" role="status">Your selected window: <strong>{from}–{until} UTC</strong>{date&&<> on <time dateTime={date}>{date}</time></>}.</p>}
          <p className="field-help">Times are offered in 30-minute steps. Add any shorter or separate windows in the notes.</p>
        </fieldset>
        <label>Notes for leadership<textarea name="notes" defaultValue={saved.initial?.notes??''} maxLength={1500} placeholder="Additional time windows, rally capacity, or anything your coordinators should know."/></label>
        <details className="battle-references"><summary>Battle schedule references</summary><ul>{battleSources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></li>)}</ul></details>
      </section>
      <button className="button" type="submit" disabled={saved.busy}>{saved.busy?'Saving…':saved.canSave?'Save battle availability':'Check entries'}</button>{status&&<p role={saved.error?'alert':'status'} className={`form-message ${saved.error?'error':''}`}>{status}</p>}
    </form>
  </div>;
}
