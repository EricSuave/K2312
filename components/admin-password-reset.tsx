'use client';
import {useState,type FormEvent} from 'react';
export function AdminPasswordReset(){
  const[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const form=event.currentTarget;const data=new FormData(form);
    setBusy(true);setMessage('');setError(false);
    try{
      const response=await fetch('/api/admin/member-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({player_id:data.get('player_id'),password:data.get('password'),verified:data.get('verified')==='on'})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Reset failed.');
      setMessage(result.message);form.reset();
    }catch(cause){setError(true);setMessage(cause instanceof Error?cause.message:'Reset failed.');}finally{setBusy(false);}
  }
  return <section className="wrap page-body"><details className="card admin-upload"><summary>Reset a member’s website password</summary><p>Verify the request with the actual player in-game first. A member ID alone is not proof of identity. This tool cannot reset administrator accounts.</p><form onSubmit={submit}><label>Member ID<input name="player_id" required inputMode="numeric" pattern="[0-9]{3,20}" maxLength={20}/></label><label>New temporary website password<input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password"/></label><label className="inline-check"><input name="verified" type="checkbox" required/>I verified this player’s identity in-game and will share this password privately.</label><button className="button" disabled={busy}>{busy?'Updating…':'Reset member password'}</button>{message&&<p className={`form-message ${error?'error':''}`} role={error?'alert':'status'}>{message}</p>}</form></details></section>;
}
