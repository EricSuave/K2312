'use client';
import {useState,type FormEvent} from 'react';
import {alliances} from '@/data/kingdom';
import {adminPrepLookupSchema} from '@/lib/admin-prep-validation';
import type {PrepFormValues} from '@/lib/member-validation';
import {PrepEditor} from './prep-form';

type LoadedEntry={player_id:string;cycle:string;player_name:string;alliance:string|null;has_account:boolean;exists:boolean;payload:PrepFormValues|null;entry_source:'admin'|'member'|null;updated_at:string|null;expected_revision:string|null;expected_self_updated_at:string|null;expected_member_updated_at:string|null};
export function AdminPrepEntry({onSaved}:{onSaved:()=>void}){
 const[target,setTarget]=useState<LoadedEntry|null>(null),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false);
 const[name,setName]=useState(''),[alliance,setAlliance]=useState(''),[status,setStatus]=useState(''),[error,setError]=useState(false),[loadError,setLoadError]=useState(''),[revision,setRevision]=useState(0);
 async function lookup(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const data=new FormData(event.currentTarget);
  const values=adminPrepLookupSchema.safeParse({player_id:data.get('player_id'),cycle:data.get('cycle')});
  if(!values.success){setLoadError(values.error.issues[0].message);return;}
  setLoading(true);setLoadError('');setStatus('');setTarget(null);
  try{
   const response=await fetch(`/api/admin/prep-entry?${new URLSearchParams(values.data)}`,{cache:'no-store'});
   const result=await response.json();if(!response.ok)throw new Error(result.error||'Unable to load this player.');
   setTarget(result);setName(result.player_name);setAlliance(result.alliance??'');setError(false);setRevision(r=>r+1);
  }catch(cause){setLoadError(cause instanceof Error?cause.message:'Unable to load. Please retry.');}
  finally{setLoading(false);}
 }
 async function save(payload:PrepFormValues){
  if(!target)return;
  if(!name.trim()){setError(true);setStatus('Enter the player name above before saving.');return;}
  if(payload.battle_date!==target.cycle){setError(true);setStatus('Load this player with the matching battle date before saving.');return;}
  setBusy(true);setStatus('');setError(false);
  try{
   const response=await fetch('/api/admin/prep-entry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    player_id:target.player_id,player_name:name,alliance:alliance||null,payload,
    expected_revision:target.expected_revision,expected_self_updated_at:target.expected_self_updated_at,expected_member_updated_at:target.expected_member_updated_at,
   })});
   const result=await response.json();if(!response.ok)throw new Error(result.error||'Unable to save this preparation.');
   setTarget({...target,exists:true,player_name:name.trim(),alliance:alliance||null,payload,entry_source:'admin',updated_at:result.updated_at,expected_revision:result.revision,expected_member_updated_at:result.updated_at});
   setStatus(result.message);onSaved();
  }catch(cause){setError(true);setStatus(cause instanceof Error?cause.message:'Unable to save. Please retry.');}
  finally{setBusy(false);}
 }
 return <details className="card admin-upload">
  <summary>Add member / enter prep for a player</summary>
  <p>Enter preparation on a player’s behalf using their game member ID. Saving creates a member record if needed and includes it in the ranking and schedule. No email, password or player registration is required.</p>
  <form onSubmit={lookup}>
   <div className="form-grid"><label>Player’s member ID<input name="player_id" required inputMode="numeric" pattern="[0-9]{3,20}" maxLength={20} autoComplete="off"/></label><label>KvK battle date (UTC)<input type="date" name="cycle" required/></label></div>
   <button className="button secondary" type="submit" disabled={loading||busy}>{loading?'Loading…':'Load or add player'}</button>
   {loadError&&<p className="form-message error" role="alert">{loadError}</p>}
  </form>
  {target&&<div style={{marginTop:24}}>
   <p className="notice">{target.exists?`Loaded ${target.player_name}.`:'New player — the member record will be created when you save prep.'} {target.has_account?'This player also has a website account.':'This player has no website account.'} {target.entry_source&&<>Latest prep: {target.entry_source==='admin'?'admin entered':'member submitted'}.</>}</p>
   <div className="form-grid"><label>Player name<input value={name} onChange={e=>setName(e.target.value)} maxLength={80} required aria-required="true" disabled={busy}/></label><label>Alliance<select value={alliance} onChange={e=>setAlliance(e.target.value)} disabled={busy}><option value="">Not assigned</option>{alliances.map(a=><option key={a.tag}>{a.tag}</option>)}</select></label></div>
   <PrepEditor key={revision} fixedDate={target.cycle} adminIdentity={<p>Entering prep for <strong>{name||'new player'}</strong> · ID {target.player_id}. Saved entries are marked “Admin entered”. The latest saved prep per member ID and battle date is used in the schedule.</p>} saved={{initial:target.payload,save,busy,status,error,setStatus,setError,canSave:true}}/>
  </div>}
 </details>;
}
