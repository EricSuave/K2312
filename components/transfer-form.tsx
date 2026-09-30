'use client';
import {useRef,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {alliances} from '@/data/kingdom';
import {truegoldLevels,troopTiers} from '@/data/progression';
import {transferSteps,transferApplicationSchema,evidenceLimit} from '@/lib/transfer-application';

const romans=['I','II','III','IV','V'];
function Choice({name,title}:{name:string;title:string}){return <fieldset className="transfer-question"><legend>{title}</legend><div className="transfer-choices">{['Yes','No','Sometimes'].map(value=><label key={value}><input type="radio" name={name} value={value} required/>{value}</label>)}</div></fieldset>}
export function TransferForm({enabled}:{enabled:boolean}){
 const[step,setStep]=useState(0),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[success,setSuccess]=useState(false);
 const[files,setFiles]=useState<File[]>([]);const[review,setReview]=useState<Record<string,unknown>>({});
 const form=useRef<HTMLFormElement>(null),heading=useRef<HTMLHeadingElement>(null),requestId=useRef('');
 function values(){
  const d=new FormData(form.current!);const num=(key:string)=>Number(d.get(key));
  return {preferred_alliance:d.get('preferred_alliance'),player_name:d.get('player_name'),player_id:d.get('player_id'),current_kingdom:num('current_kingdom'),contact:d.get('contact'),languages:d.get('languages'),preferred_times:d.get('preferred_times'),kvk_participation:d.get('kvk_participation'),notes:d.get('notes'),consent:d.get('consent')==='on',website:d.get('website'),request_id:requestId.current||crypto.randomUUID(),details:{
   intake_month:d.get('intake_month'),troop_tier:d.get('troop_tier'),truegold_level:d.get('truegold_level'),truegold_available:num('truegold_available'),mystic_trial_stages:num('mystic_trial_stages'),transfer_passes_owned:num('transfer_passes_owned'),transfer_passes_required:d.get('transfer_passes_required')===''?null:num('transfer_passes_required'),active_events:d.get('active_events'),save_for_kvk:d.get('save_for_kvk'),battle_participation:d.get('battle_participation'),spending:d.get('spending')
  }};
 }
 function move(next:number){
  if(next>step){const panel=form.current?.querySelector<HTMLElement>(`[data-step="${step}"]`);for(const input of panel?.querySelectorAll<HTMLInputElement>('input,select,textarea')??[]){if(!input.reportValidity())return;}}
  setStatus('');if(next===4){const v=values();setReview({'Player name':v.player_name,'Member ID':v.player_id,'Current kingdom':v.current_kingdom,'Preferred alliance':v.preferred_alliance,'Contact':v.contact,'Languages':v.languages,'Preferred times (UTC)':v.preferred_times,'KvK experience':v.kvk_participation,...v.details,'Notes':v.notes});}
  setStep(next);setTimeout(()=>heading.current?.focus(),0);
 }
 async function submit(e:FormEvent){e.preventDefault();if(step<4){move(step+1);return;}setStatus('');
  if(files.length<1||files.length>4||files.some(f=>f.size>evidenceLimit||!f.size)){setStatus('Choose 1–4 screenshots, each no larger than 750 KB.');return;}
  if(!requestId.current)requestId.current=crypto.randomUUID();
  const parsed=transferApplicationSchema.safeParse(values());if(!parsed.success){setStatus(parsed.error.issues[0]?.message||'Check your answers.');return;}
  setBusy(true);
  try{const body=new FormData();body.set('application',JSON.stringify(parsed.data));files.forEach(f=>body.append('screenshots',f));
   const response=await fetch('/api/transfer-application',{method:'POST',body});const result=await response.json();if(!response.ok)throw new Error(result.error||'Unable to submit.');
   setSuccess(true);setStatus('Your application has been received. Kingdom 2312 leadership will contact you using the details you provided.');
  }catch(error){setStatus(error instanceof Error?error.message:'Connection failed. Your answers are still here; please retry.');}finally{setBusy(false);}
 }
 if(success)return <section className="card transfer-success" role="status"><p className="eyebrow">APPLICATION RECEIVED</p><h2>Thank you for applying to 2312.</h2><p>{status}</p><p>Reference: {requestId.current}</p><Link className="button secondary" href="/">Back to home</Link></section>;
 return <form ref={form} className="profile-form transfer-wizard" onSubmit={submit} noValidate>
  {!enabled&&<p className="notice">Applications are currently unavailable. Contact kingdom leadership in-game.</p>}
  <nav className="transfer-steps" aria-label="Application progress">{transferSteps.map((title,i)=><button key={title} type="button" disabled={busy||i>step} aria-current={i===step?'step':undefined} onClick={()=>move(i)}><span>{romans[i]}</span> {title}</button>)}</nav>
  <h2 ref={heading} tabIndex={-1} className="transfer-step-heading"><span>{romans[step]}</span>{transferSteps[step]}</h2>
  <div data-step="0" hidden={step!==0}><p className="eyebrow">IDENTITY</p><div className="form-grid">
   <label>In-game name<input name="player_name" required maxLength={80}/></label><label>Player ID<input name="player_id" required inputMode="numeric" pattern="[0-9]{3,20}" maxLength={20}/></label>
   <label>Discord username or in-game contact<input name="contact" required maxLength={160}/></label><label>Current kingdom<input name="current_kingdom" type="number" min={1} max={999999} step={1} required/></label>
   <label>Languages you use<input name="languages" required maxLength={160}/></label></div></div>
  <div data-step="1" hidden={step!==1}><fieldset className="transfer-question"><legend>Which alliance would you like to join?</legend><div className="transfer-choices alliance-choices"><label><input type="radio" name="preferred_alliance" value="No preference" defaultChecked/>No preference</label>{alliances.map(a=><label key={a.tag}><input type="radio" name="preferred_alliance" value={a.tag}/><span>[{a.tag}]<small>Bear Trap: {a.bearTrap1} / {a.bearTrap2} UTC</small></span></label>)}</div></fieldset><p className="eyebrow">YOUR MOVE TO 2312</p><div className="form-grid"><label>Preferred transfer month<input name="intake_month" type="month" required/><span className="field-help">A preference, not a confirmed transfer window.</span></label><label>Preferred event times (UTC)<input name="preferred_times" placeholder="For example, 12:00–18:00 UTC" required maxLength={240}/></label><label>Transfer passes you own<input name="transfer_passes_owned" type="number" min={0} max={1e9} step={1} required/></label><label>Passes required, if known<input name="transfer_passes_required" type="number" min={0} max={1e9} step={1}/><span className="field-help">Copy the in-game estimate or leave blank if unknown.</span></label></div></div>
  <div data-step="2" hidden={step!==2}><p className="eyebrow">GEN 2 · TG3 · T10</p><div className="form-grid">
   <label>Highest troop tier<select name="troop_tier" required defaultValue=""><option value="" disabled>Select troop tier</option>{troopTiers.map(t=><option key={t}>{t}</option>)}</select></label>
   <label>Highest troop Truegold level<select name="truegold_level" required defaultValue=""><option value="" disabled>Select Truegold level</option>{truegoldLevels.map(t=><option key={t}>{t}</option>)}</select><span className="field-help">Report your troop building progression, not your Town Center.</span></label>
   <label>Regular Truegold available<input name="truegold_available" type="number" min={0} max={1e9} step={1} required/></label><label>Mystic Trial stages completed<input name="mystic_trial_stages" type="number" min={0} max={1e9} step={1} required/></label></div>
   <p>Use the final step to provide screenshots of your governor gear, charms, and Gen 1–2 hero equipment.</p></div>
  <div data-step="3" hidden={step!==3}>
   <Choice name="active_events" title="Can you regularly join alliance events?"/><Choice name="save_for_kvk" title="Will you save resources for coordinated KvK preparation?"/><Choice name="battle_participation" title="Do you take part in Sanctuary, Castle, and KvK battles?"/>
   <label>Your KvK experience and availability<textarea name="kvk_participation" required maxLength={1500}/></label>
   <div className="form-grid"><label>Spending preference (optional)<select name="spending" defaultValue="Prefer not to say">{['Free to play','Occasional','Regular','High','Prefer not to say'].map(v=><option key={v}>{v}</option>)}</select></label></div>
   <label>Anything else leadership should know? (optional)<textarea name="notes" maxLength={2000}/></label></div>
  <div data-step="4" hidden={step!==4}><p className="eyebrow">BATTLE REPORT & EQUIPMENT</p><label className="transfer-upload">Upload 1–4 screenshots<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>{setFiles(Array.from(e.target.files??[]));setStatus('')}}/><span className="field-help">JPEG, PNG, or WebP · up to 750 KB each. Show your in-game name, battle report, governor gear/charms, and Gen 1–2 hero equipment. Crop out private messages. Only authorized kingdom admins can access these files.</span></label>{files.length>0&&<ul>{files.map((f,i)=><li key={i}>{f.name} · {Math.ceil(f.size/1000)} KB</li>)}</ul>}
   <details className="transfer-review"><summary>Review your answers</summary><dl className="submission-details">{Object.entries(review).map(([k,v])=><div key={k}><dt>{k.replaceAll('_',' ')}</dt><dd>{String(v??'Not provided')}</dd></div>)}</dl></details>
   <label className="inline-check"><input type="checkbox" name="consent" required/><span>I confirm these details are accurate and agree to share this application and screenshots with Kingdom 2312 leadership. <Link className="text-link" href="/privacy">Privacy notice</Link></span></label></div>
  <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
  {status&&<p className="form-message error" role="alert">{status}</p>}
  <footer className="transfer-actions"><span>STEP {step+1} OF 5</span><div className="button-row">{step>0&&<button className="button secondary" type="button" disabled={busy} onClick={()=>move(step-1)}>Back</button>}<button className="button" disabled={busy||!enabled} type="submit">{busy?'Submitting…':step===4?'Submit application':'Continue'}</button></div></footer>
 </form>;
}
