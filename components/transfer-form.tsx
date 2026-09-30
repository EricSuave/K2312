'use client';
import {useState,type FormEvent} from 'react';
import Link from 'next/link';
export function TransferForm({enabled}:{enabled:boolean}){
  const[busy,setBusy]=useState(false);const[status,setStatus]=useState('');const[error,setError]=useState(false);const[reference,setReference]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError(false);const values=new FormData(event.currentTarget);const id=reference||crypto.randomUUID();setReference(id);
    const body={player_name:values.get('player_name'),player_id:values.get('player_id'),current_kingdom:Number(values.get('current_kingdom')),preferred_times:values.get('preferred_times'),kvk_participation:values.get('kvk_participation'),languages:values.get('languages'),contact:values.get('contact'),notes:values.get('notes'),consent:values.get('consent')==='on',website:values.get('website'),request_id:id};
    try{const response=await fetch('/api/submissions/transfers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Please retry.');setStatus('Application received. Kingdom 2312 leadership will review your information and contact you using the details you provided.');}catch(cause){setError(true);setStatus(cause instanceof Error?cause.message:'Unable to submit. Please retry.');}finally{setBusy(false);}
  }
  return <form className="profile-form" onSubmit={submit}>
    {!enabled&&<div className="notice">Online applications are not available yet. Contact an alliance R5 in the game to discuss transferring.</div>}
    <section><h2>Apply to Kingdom 2312.</h2><div className="form-grid">
      <label>Player name<input name="player_name" required maxLength={80}/></label><label>Player ID<input name="player_id" required inputMode="numeric" pattern="[0-9]{3,20}" maxLength={20}/></label>
      <label>Current kingdom<input name="current_kingdom" type="number" required min="1" max="999999" step="1"/></label>
      <label>Preferred event times (UTC)<input name="preferred_times" required maxLength={240} placeholder="For example, 12:00–18:00 UTC"/></label><label>Languages<input name="languages" required maxLength={160}/></label>
    </div><label>Your KvK participation<textarea name="kvk_participation" required maxLength={1500} placeholder="Tell us how you help with preparation and battles."/></label><label>How should leadership contact you?<input name="contact" required maxLength={160} placeholder="In-game name/ID or Discord username"/></label><label>Anything else to share?<textarea name="notes" maxLength={2000}/></label><label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label><label className="inline-check"><input type="checkbox" name="consent" required/><span>I agree to share this application with kingdom leadership. <Link className="text-link" href="/privacy">Privacy notice</Link></span></label></section>
    <button className="button" disabled={!enabled||busy||(!error&&!!status)}>{busy?'Submitting…':'Submit transfer application'}</button>{status&&<p role={error?'alert':'status'} className={`form-message ${error?'error':''}`}>{status}</p>}
  </form>;
}
