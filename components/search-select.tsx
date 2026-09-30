'use client';
import {useId,useState} from 'react';

export function SearchSelect({name,label,options,initialValue=''}:{name:string;label:string;options:{value:string;label:string}[];initialValue?:string}){
  const id=useId();const[text,setText]=useState(options.find(option=>option.value===initialValue)?.label??'');
  const selected=options.find(option=>option.label===text);
  return <label>{label}<input list={id} value={text} autoComplete="off" placeholder="Type to search levels…" onChange={event=>{
    const next=event.target.value;setText(next);
    event.target.setCustomValidity(next&&!options.some(option=>option.label===next)?'Choose a matching level from the list, or clear this field.':'');
  }}/><datalist id={id}>{options.map(option=><option key={option.value} value={option.label}/>)}</datalist><input type="hidden" name={name} value={selected?.value??''}/></label>;
}
