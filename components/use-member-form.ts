'use client';
import {useEffect,useState,useCallback} from 'react';
import {useMember} from './member-session';
import type {MemberFormKind} from '@/lib/member-validation';

export function useMemberForm<T>(kind:MemberFormKind){
  const{member}=useMember();
  const[initial,setInitial]=useState<T|null>(null);
  const[loading,setLoading]=useState(!!member);
  const[loadFailed,setLoadFailed]=useState(false);
  const[busy,setBusy]=useState(false);
  const[status,setStatus]=useState('');
  const[error,setError]=useState(false);
  const[revision,setRevision]=useState(0);
  const[reload,setReload]=useState(0);
  useEffect(()=>{
    if(!member){setLoading(false);return;}
    const controller=new AbortController();setLoading(true);setLoadFailed(false);
    fetch(`/api/member/${kind}`,{signal:controller.signal,cache:'no-store'}).then(async response=>{
      const data=await response.json();if(!response.ok)throw new Error(data.error||'Unable to load your saved form.');
      setInitial(data.payload??null);setRevision(value=>value+1);setStatus(data.updated_at?'Your latest saved form is loaded.':'');setError(false);
    }).catch(cause=>{if(cause.name!=='AbortError'){setStatus(cause.message||'Unable to load your saved form. Please retry.');setError(true);setLoadFailed(true);}}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});
    return()=>controller.abort();
  },[kind,member,reload]);
  const save=useCallback(async(payload:T)=>{
    if(!member){setError(false);setStatus('Entries checked. Online saving is not connected; your information has not been submitted.');return;}
    setBusy(true);setStatus('');setError(false);
    try{
      const response=await fetch(`/api/member/${kind}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Unable to save. Please retry.');
      setStatus(kind==='prep'?'Preparation saved. Appointment requests still need leadership confirmation.':'Saved. Leadership can now see your latest information.');
    }catch(cause){setStatus(cause instanceof Error?cause.message:'Unable to save. Please retry.');setError(true);}
    finally{setBusy(false);}
  },[kind,member]);
  return {initial,loading,loadFailed,busy,status,error,revision,save,setStatus,setError,retry:()=>setReload(value=>value+1),canSave:!!member};
}
