'use client';
import {useState,type FormEvent} from 'react';
import {DraftNotice,FormBack,MemberIdentity,FormLoadState} from './member-form-fields';
import {prepTimeSlots} from '@/data/prep';
import {prepFormSchema,type PrepFormValues} from '@/lib/member-validation';
import {useMemberForm} from './use-member-form';

function YesNo({name,label,value}:{name:string;label:string;value?:string}){return <label>{label}<select name={name} required defaultValue={value??''}><option value="" disabled>Select</option><option value="yes">Yes</option><option value="no">No</option></select></label>}
function DaysInput({name,value}:{name:string;value?:number}){return <label>How many days of speedups will you use? (Include allocated general speedups)<div className="prep-days-input"><input type="number" name={name} min="0" max="1000000" step="0.01" required defaultValue={value??''} placeholder="0"/><span>days</span></div></label>}
function TimeSlots({day,title,initial=[]}:{day:number;title:string;initial?:string[]}){
  const[selected,setSelected]=useState<string[]>(initial);
  return <fieldset className="prep-time-slots" data-day={day}><legend>Available Times — Day {day} ({title})</legend><span className="prep-slot-count" aria-live="polite">{selected.length} selected</span><p className="prep-slot-help">30-minute start times · UTC</p><div className="prep-slot-grid">{prepTimeSlots.map(time=><button type="button" key={time} aria-pressed={selected.includes(time)} aria-label={`Day ${day}, ${time} UTC`} onClick={()=>setSelected(selected.includes(time)?selected.filter(value=>value!==time):[...selected,time])}>{time}</button>)}</div>{selected.length>0&&<p className="prep-selected-times">Selected (UTC): {[...selected].sort().join(', ')}</p>}{selected.map(time=><input type="hidden" key={time} name={`day_${day}_times`} value={time}/>)}</fieldset>;
}
export function PrepForm(){
  const saved=useMemberForm<PrepFormValues>('prep');
  if(saved.loading||saved.loadFailed)return <FormLoadState loading={saved.loading} message={saved.status} retry={saved.retry}/>;
  return <PrepEditor key={saved.revision} saved={saved}/>;
}
function PrepEditor({saved}:{saved:ReturnType<typeof useMemberForm<PrepFormValues>>}){
  const initial=saved.initial;
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const data=new FormData(event.currentTarget);
    const result=prepFormSchema.safeParse({battle_date:data.get('battle_date'),construction_targets:data.getAll('construction_targets'),truegold:Number(data.get('truegold')),
      construction_speedup_days:Number(data.get('construction_speedup_days')),research_speedup_days:Number(data.get('research_speedup_days')),training_speedup_days:Number(data.get('training_speedup_days')),
      day_1_minister:data.get('day_1_minister'),day_2_minister:data.get('day_2_minister'),day_4_minister:data.get('day_4_minister'),
      day_1_times:data.getAll('day_1_times'),day_2_times:data.getAll('day_2_times'),day_4_times:data.getAll('day_4_times'),day_5_times:data.getAll('day_5_times'),
    });
    if(!result.success){saved.setError(true);saved.setStatus(result.error.issues[0].message);return;}
    await saved.save(result.data);
  }
  return <div className="wrap prep-page"><FormBack/><form className="prep-form" onSubmit={submit}>
    <header className="prep-heading"><p className="eyebrow">MINISTER’S HALL</p><h1>BACKPACK AMOUNTS & MINISTER POSITION BOOKINGS</h1><p>Kingdom 2312 · KvK preparation</p></header>
    <DraftNotice/><div className="prep-identity"><MemberIdentity/><label>KvK battle date (UTC)<input type="date" name="battle_date" required defaultValue={initial?.battle_date??''}/><span className="field-help">Choose the battle date that follows this preparation phase.</span></label></div>
    <p className="prep-instructions">Enter speedups in days, including any general speedups allocated to that activity. Count each general speedup only once. Select all times you are available; leadership will confirm appointments.</p>
    <div className="prep-columns">
      <section className="prep-day"><span className="prep-day-badge">DAY 1</span><h2>CHIEF MINISTER — CONSTRUCTION</h2><YesNo name="day_1_minister" label="Do you want the construction Chief Minister buff?" value={initial?.day_1_minister}/><fieldset className="prep-upgrades"><legend>Construction Upgrades</legend><div>{(['TG1','TG2','TG3'] as const).map(target=><label key={target}><input type="checkbox" name="construction_targets" value={target} defaultChecked={initial?.construction_targets.includes(target)}/>{target}</label>)}</div></fieldset><label>How much Truegold will you use?<input name="truegold" type="number" min="0" max="1000000000000" step="1" required defaultValue={initial?.truegold??''} placeholder="0"/></label><DaysInput name="construction_speedup_days" value={initial?.construction_speedup_days}/><TimeSlots day={1} title="Construction" initial={initial?.day_1_times}/></section>
      <section className="prep-day"><span className="prep-day-badge">DAY 2</span><h2>CHIEF MINISTER — RESEARCH</h2><YesNo name="day_2_minister" label="Do you want Chief Minister for research?" value={initial?.day_2_minister}/><DaysInput name="research_speedup_days" value={initial?.research_speedup_days}/><TimeSlots day={2} title="Research" initial={initial?.day_2_times}/></section>
      <section className="prep-day"><span className="prep-day-badge">DAY 4</span><h2>NOBLE ADVISOR — TROOP TRAINING</h2><YesNo name="day_4_minister" label="Do you want a troop training appointment?" value={initial?.day_4_minister}/><DaysInput name="training_speedup_days" value={initial?.training_speedup_days}/><TimeSlots day={4} title="Troop Training" initial={initial?.day_4_times}/></section>
      <section className="prep-day"><span className="prep-day-badge overflow">DAY 5</span><h2>OVERFLOW — CONSTRUCTION & RESEARCH SECOND CHANCE</h2><p className="prep-overflow-copy">If you are not scheduled on Day 1 or Day 2, leadership may offer you a Day 5 appointment. Pick any times you are available.</p><TimeSlots day={5} title="Overflow" initial={initial?.day_5_times}/></section>
    </div>
    <div className="prep-bottom"><p>Times are UTC on the selected prep day. A 23:45 slot continues into the next UTC day. These selections are availability requests, not confirmed reservations.</p><button type="submit" className="button" disabled={saved.busy}>{saved.busy?'Saving…':saved.canSave?'Save KvK preparation':'Check entries'}</button>{saved.status&&<p role={saved.error?'alert':'status'} className={`form-message ${saved.error?'error':''}`}>{saved.status}</p>}</div>
  </form></div>;
}
