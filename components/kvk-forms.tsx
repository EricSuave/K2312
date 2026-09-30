'use client';
import {useState,type FormEvent} from 'react';
import {battleFormSchema,type BattleForm} from '@/lib/member-validation';
import {useMemberForm} from './use-member-form';
import {DraftNotice,FormBack,MemberIdentity,FormLoadState} from './member-form-fields';

const windows=[
  {id:'first',label:'First half (12:00–14:30 UTC)',start:'12:00',end:'14:30'},
  {id:'second',label:'Second half (14:30–17:00 UTC)',start:'14:30',end:'17:00'},
  {id:'full',label:'Full castle battle (12:00–17:00 UTC)',start:'12:00',end:'17:00'},
  {id:'unavailable',label:'Not available',start:'',end:''},
] as const;

export function AvailabilityForm(){
  const saved=useMemberForm<BattleForm>('availability');
  if(saved.loading||saved.loadFailed)return <FormLoadState loading={saved.loading} message={saved.status} retry={saved.retry}/>;
  return <AvailabilityEditor key={saved.revision} saved={saved}/>;
}
function AvailabilityEditor({saved}:{saved:ReturnType<typeof useMemberForm<BattleForm>>}){
  const{status,setStatus}=saved;
  const initial=saved.initial;
  const initialChoice=initial?.attendance==='unavailable'?'unavailable':initial?.attendance==='available'?windows.find(w=>w.start===initial.starts_at?.slice(11,16)&&w.end===initial.ends_at?.slice(11,16))?.id??'':'';
  const[choice,setChoice]=useState<string>(initialChoice);
  const[date,setDate]=useState(initial?.event_date??'');
  async function checkEntries(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const data=new FormData(event.currentTarget);
    const window=windows.find(w=>w.id===choice);
    if(!window){saved.setError(true);setStatus('Choose your battle availability.');return;}
    const unavailable=window.id==='unavailable';
    const result=battleFormSchema.safeParse({event_date:date,attendance:unavailable?'unavailable':'available',
      ...(unavailable?{}:{starts_at:`${date}T${window.start}:00Z`,ends_at:`${date}T${window.end}:00Z`,role:initial?.role??'Not sure'}),
      notes:data.get('notes')||'',
    });
    if(!result.success){saved.setError(true);setStatus(result.error.issues[0].message);return;}
    await saved.save(result.data);
  }
  return <div className="wrap page-body"><FormBack/>
    <form className="profile-form" onSubmit={checkEntries} onChange={()=>setStatus('')}>
      <DraftNotice/>
      <section>
        <div className="eyebrow">01 / KVK AVAILABILITY</div><h2>Tell us when you can join.</h2>
        <MemberIdentity/>
      </section>
      <section>
        <div className="eyebrow">02 / TIMING</div><h2>Battle availability</h2>
        <p>Select the window your rally planners can count on. These choices cover the castle battle; all times are UTC.</p>
        <label>Battle date (UTC)<input name="event_date" type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label>
        {initial&&!initialChoice&&<p className="notice">Your previous response {initial.attendance==='tentative'?'was tentative':'used a different time window'}{initial.starts_at&&initial.ends_at?` (${initial.starts_at.slice(11,16)}–${initial.ends_at.slice(11,16)} UTC)`:''}. Choose an option below to update it. Your saved response stays unchanged until you save.</p>}
        <fieldset className="simple-battle-options">
          <legend>Select one availability option</legend>
          {windows.map(window=><label key={window.id} className={`simple-battle-choice ${choice===window.id?'selected':''}`}>
            <input type="radio" name="battle_window" value={window.id} required checked={choice===window.id} onChange={()=>setChoice(window.id)}/>
            <span>{window.label}</span>
          </label>)}
        </fieldset>
        <label>Notes for leadership (optional)<textarea name="notes" defaultValue={initial?.notes??''} maxLength={1500} placeholder="Anything else your coordinators should know."/></label>
      </section>
      <button className="button" type="submit" disabled={saved.busy}>{saved.busy?'Saving…':saved.canSave?'Save battle availability':'Check entries'}</button>{status&&<p role={saved.error?'alert':'status'} className={`form-message ${saved.error?'error':''}`}>{status}</p>}
    </form>
    <style jsx>{`
      .simple-battle-options{border:0;padding:0;margin:28px 0;display:grid;gap:10px;min-width:0}
      .simple-battle-options legend{margin-bottom:12px;color:#e9cd88;font-size:14px}
      .simple-battle-choice{display:flex;align-items:center;gap:12px;min-height:54px;padding:14px 18px;border:1px solid #494031;border-radius:8px;background:#171c22;color:#e6dcc8;cursor:pointer;transition:background .15s,border-color .15s}
      .simple-battle-choice:hover{background:#22262a;border-color:#c99f48}
      .simple-battle-choice.selected{border-color:#ecc66b;background:#30291b;color:#ffe3a0}
      .simple-battle-choice:focus-within{outline:2px solid #ffe3a0;outline-offset:3px}
      .simple-battle-choice input{width:18px;height:18px;margin:0;flex:0 0 18px;accent-color:#ecc66b}
      .simple-battle-choice span{flex:1;text-align:center;font-weight:600}
    `}</style>
  </div>;
}
