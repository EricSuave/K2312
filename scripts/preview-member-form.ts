import {useState} from 'react';
// The inline presentation never sends requests or saves member information.
export function useMemberForm<T>(){
  const[status,setStatus]=useState('');const[error,setError]=useState(false);
  return {initial:null as T|null,loading:false,loadFailed:false,busy:false,status,error,revision:0,canSave:false,
    setStatus,setError,retry:()=>{},save:async(_payload:T)=>{setError(false);setStatus('Entries checked. This presentation does not submit or save your information.');},
  };
}
