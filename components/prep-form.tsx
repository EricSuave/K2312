'use client';
import {useState,type FormEvent} from 'react';
import {DraftNotice,FormBack,MemberIdentity,FormLoadState} from './member-form-fields';
import {TimeSlots} from './prep-time-preferences';
import {prepFormSchema,type PrepFormValues} from '@/lib/member-validation';
import {useMemberForm} from './use-member-form';

function YesNo({name,label,value}:{name:string;label:string;value?:string}){return <label>{label}<select name={name} required defaultValue={value??''}><option value="" disabled>Select</option><option value="yes">Yes</option><option value="no">No</option></select></label>}
function DaysInput({name,value}:{name:string;value?:number}){return <label>How many days of speedups will you use? (Include allocated general speedups)<div className="prep-days-input"><input type="number" name={name} min="0" max="1000000" step="0.01" required defaultValue={value??''} placeholder="0"/><span>days</span></div></label>}
export function PrepForm(){
  const saved=useMemberForm<PrepFormValues>('prep');
  if(saved.loading||saved.loadFailed)return <FormLoadState loading={saved.loading} message={saved.status} retry={saved.retry}/>;
  return <PrepEditor key={saved.revision} saved={saved}/>;
}
function PrepEditor({saved}:{saved:ReturnType<typeof useMemberForm<PrepFormValues>>}){
  const initial=saved.initial;
  const[trainingEstimate,setTrainingEstimate]=useState(!!initial?.training_batch);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const data=new FormData(event.currentTarget);
    const result=prepFormSchema.safeParse({...(trainingEstimate?{training_batch:{tier:Number(data.get('training_tier')),from_tier:Number(data.get('training_from')),quantity:Number(data.get('training_quantity')),duration_days:Number(data.get('training_duration'))}}:{}),battle_date:data.get('battle_date'),construction_targets:data.getAll('construction_targets'),truegold:Number(data.get('truegold')),
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
    <p className="prep-instructions">Enter speedups in days, including any general speedups allocated to that activity. Count each general speedup only once. Leadership ranks each buff day using its planned speedups and, for construction, regular Truegold. Gear and charms do not count toward appointment rankings. Select times in preference order. The highest estimated point producer is scheduled first, followed by the next member using their first remaining preferred time. Leadership will confirm appointments.</p>
    <div className="prep-columns">
      <section className="prep-day"><span className="prep-day-badge">DAY 1</span><h2>CHIEF MINISTER — CONSTRUCTION</h2><YesNo name="day_1_minister" label="Do you want the construction Chief Minister buff?" value={initial?.day_1_minister}/><fieldset className="prep-upgrades"><legend>Construction Upgrades</legend><div>{(['TG1','TG2','TG3'] as const).map(target=><label key={target}><input type="checkbox" name="construction_targets" value={target} defaultChecked={initial?.construction_targets.includes(target)}/>{target}</label>)}</div></fieldset><label>How much Truegold will you use?<input name="truegold" type="number" min="0" max="1000000000000" step="1" required defaultValue={initial?.truegold??''} placeholder="0"/></label><DaysInput name="construction_speedup_days" value={initial?.construction_speedup_days}/><TimeSlots day={1} title="Construction" initial={initial?.day_1_times}/></section>
      <section className="prep-day"><span className="prep-day-badge">DAY 2</span><h2>CHIEF MINISTER — RESEARCH</h2><YesNo name="day_2_minister" label="Do you want Chief Minister for research?" value={initial?.day_2_minister}/><DaysInput name="research_speedup_days" value={initial?.research_speedup_days}/><TimeSlots day={2} title="Research" initial={initial?.day_2_times}/></section>
      <section className="prep-day"><span className="prep-day-badge">DAY 4</span><h2>NOBLE ADVISOR — TROOP TRAINING</h2><YesNo name="day_4_minister" label="Do you want a troop training appointment?" value={initial?.day_4_minister}/><DaysInput name="training_speedup_days" value={initial?.training_speedup_days}/><label className="inline-check"><input type="checkbox" checked={trainingEstimate} onChange={e=>setTrainingEstimate(e.target.checked)}/>Add training details for a points estimate</label>
      {trainingEstimate&&<fieldset><legend>Planned training batch · T1–T10</legend><p className="field-help">Use a batch shown in your training building with the buffs you expect to have. This is a planned batch, not your total army. Use promotion duration when promoting. The estimate assumes enough resources and eligible troops to repeat this batch with your listed speedups.</p><label>Target troop tier<select name="training_tier" defaultValue={initial?.training_batch?.tier??10}>{Array.from({length:10},(_,i)=><option key={i+1} value={i+1}>T{i+1}</option>)}</select></label><label>Training or promotion?<select name="training_from" defaultValue={initial?.training_batch?.from_tier??0}><option value={0}>Train new troops</option>{Array.from({length:9},(_,i)=><option key={i+1} value={i+1}>Promote from T{i+1}</option>)}</select></label><label>Troops in this planned batch<input type="number" name="training_quantity" min="1" max="1000000" step="1" required defaultValue={initial?.training_batch?.quantity??''}/></label><label>Batch duration in days<input type="number" name="training_duration" min="0.000001" max="1000" step="any" required defaultValue={initial?.training_batch?.duration_days??''}/><span className="field-help">For example, 12 hours = 0.5 days; 6 hours = 0.25 days.</span></label></fieldset>}
      <TimeSlots day={4} title="Troop Training" initial={initial?.day_4_times}/></section>
      <section className="prep-day"><span className="prep-day-badge overflow">DAY 5</span><h2>OVERFLOW — CONSTRUCTION & RESEARCH SECOND CHANCE</h2><p className="prep-overflow-copy">If you are not scheduled on Day 1 or Day 2, leadership may offer you a Day 5 appointment. Choose backup times in preference order. The schedule uses construction or research plans that did not receive a Day 1 or Day 2 appointment.</p><TimeSlots day={5} title="Overflow" initial={initial?.day_5_times}/></section>
    </div>
    <div className="prep-bottom"><p>Times are UTC on the selected prep day. A 23:45 slot continues into the next UTC day. Your selected order is your scheduling preference. New or updated submissions can change the automatic schedule until leadership confirms it.</p><button type="submit" className="button" disabled={saved.busy}>{saved.busy?'Saving…':saved.canSave?'Save KvK preparation':'Check entries'}</button>{saved.status&&<p role={saved.error?'alert':'status'} className={`form-message ${saved.error?'error':''}`}>{saved.status}</p>}</div>
  </form></div>;
}
