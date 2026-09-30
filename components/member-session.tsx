'use client';
import {createContext,useContext,type ReactNode} from 'react';
import Link from 'next/link';
import type {Member} from '@/lib/member';

const MemberContext=createContext<{member:Member|null;configured:boolean}>({member:null,configured:false});
export function MemberSessionProvider({member,configured,children}:{member:Member|null;configured:boolean;children:ReactNode}){
  return <MemberContext.Provider value={{member,configured}}>{children}</MemberContext.Provider>;
}
export const useMember=()=>useContext(MemberContext);
export function MemberSaveNotice(){
  const{member,configured}=useMember();
  if(member)return <p className="member-private">Signed in as <strong>{member.player_name}</strong> · ID {member.player_id}. Your saved forms are visible to you and kingdom leadership.</p>;
  return <div className="notice">{configured?<><Link className="text-link" href="/account">Sign in with your member ID</Link> to save your form.</>:<>Online saving is not available until the kingdom’s account service is connected. You can fill out and check the form here.</>}</div>;
}
