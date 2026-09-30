'use client';
import {useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {alliances} from '@/data/kingdom';
import type {Member} from '@/lib/member';

export function AccountForm({configured,passwordOnly=false,notice=''}:{configured:boolean;passwordOnly?:boolean;notice?:string}){
  const router=useRouter();const[mode,setMode]=useState(passwordOnly?'password':'signin');
  const[status,setStatus]=useState(notice);const[error,setError]=useState(!!notice);const[busy,setBusy]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setStatus('');setError(false);const data=new FormData(event.currentTarget);
    const body=mode==='signin'?{player_id:data.get('player_id'),password:data.get('password')}:mode==='signup'?{player_id:data.get('player_id'),player_name:data.get('player_name'),alliance:data.get('alliance'),password:data.get('password'),consent:data.get('consent')==='on'}:{password:data.get('password')};
    try{const response=await fetch(`/api/member-auth/${mode}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Please try again.');
      if(mode==='signin'||result.signed_in){router.push('/members');router.refresh();}else setStatus(result.message);
    }catch(cause){setStatus(cause instanceof Error?cause.message:'Unable to connect. Please try again.');setError(true);}finally{setBusy(false);}
  }
  return <div className="account-panel card">
    {!passwordOnly&&<div className="guide-tabs"><button type="button" aria-pressed={mode==='signin'} onClick={()=>{setMode('signin');setStatus('')}}>Sign in</button><button type="button" aria-pressed={mode==='signup'} onClick={()=>{setMode('signup');setStatus('')}}>Create account</button></div>}
    <h2>{mode==='signup'?'Your place in 2312.':mode==='password'?'Choose a new password.':'Welcome back.'}</h2>
    <p>{mode==='signup'?'Registration is open. Use your Kingshot member ID and create a separate website password. No email is required.':'Your member ID identifies your account. Your website password keeps it private.'}</p>
    {!configured&&<div className="notice">Member accounts are not available until the kingdom’s account service is connected.</div>}
    <form key={mode} onSubmit={submit}>
      {(mode==='signin'||mode==='signup')&&<label>Member ID<input name="player_id" required inputMode="numeric" pattern="[0-9]{3,20}" maxLength={20} autoComplete="username"/></label>}
      {mode==='signup'&&<><label>Player name<input name="player_name" required maxLength={80}/></label><label>Alliance<select name="alliance" required defaultValue=""><option value="" disabled>Select your alliance</option>{alliances.map(a=><option key={a.tag}>{a.tag}</option>)}</select></label></>}
      {mode!=='reset'&&<label>Website password<input name="password" type="password" required minLength={mode==='signin'?1:12} maxLength={128} autoComplete={mode==='signin'?'current-password':'new-password'}/><span className="field-help">{mode==='signin'?'Use your website password.':'At least 12 characters. Use a password different from your game account.'}</span></label>}
      {mode==='signup'&&<label className="inline-check"><input type="checkbox" name="consent" required/><span>I agree to share my member forms with kingdom leadership and have read the <Link className="text-link" href="/privacy">privacy notice</Link>.</span></label>}
      <button className="button" type="submit" disabled={!configured||busy}>{busy?'Please wait…':mode==='signin'?'Sign in with member ID':mode==='signup'?'Create my account':'Update password'}</button>
      {status&&<p className={`form-message ${error?'error':''}`} role={error?'alert':'status'}>{status}</p>}
    </form>
    {!passwordOnly&&<details className="reset-link"><summary className="text-link">Forgot your password?</summary><p>Contact your R5 or kingdom leadership in-game with your member ID. An administrator can reset your website password after verifying it is you. Never share your game password.</p></details>}
    {passwordOnly&&<Link className="text-link form-back" href="/members">Back to member forms</Link>}
  </div>;
}

export function AccountBar({member}:{member:Member}){
  const router=useRouter();const[busy,setBusy]=useState(false);const[error,setError]=useState('');
  async function signOut(){setBusy(true);try{const response=await fetch('/api/auth/logout',{method:'POST'});if(!response.ok)throw new Error();router.push('/account');router.refresh();}catch{setError('Could not sign out. Please retry.');}finally{setBusy(false);}}
  return <div className="account-bar wrap"><span>{member.player_name} · ID {member.player_id} · [{member.alliance}]</span><div><Link href="/account/password" className="text-link">Password</Link><button className="text-link" onClick={signOut} disabled={busy}>{busy?'Signing out…':'Sign out'}</button></div>{error&&<p role="alert">{error}</p>}</div>;
}
