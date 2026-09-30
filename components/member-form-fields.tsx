'use client';
import Link from 'next/link';
import {alliances} from '@/data/kingdom';
import {useMember,MemberSaveNotice} from './member-session';
export function FormBack(){return <Link href="/members" className="text-link form-back">← All member forms</Link>}
export const DraftNotice=MemberSaveNotice;
export function MemberIdentity(){
  const{member}=useMember();
  if(member)return <dl className="member-identity"><div><dt>Player</dt><dd>{member.player_name}</dd></div><div><dt>Member ID</dt><dd>{member.player_id}</dd></div><div><dt>Alliance</dt><dd>{member.alliance}</dd></div></dl>;
  return <div className="form-grid"><label>Player name<input name="player_name" required maxLength={80} autoComplete="off"/></label><label>Member ID<input name="player_id" required inputMode="numeric" pattern="[0-9]{3,20}" maxLength={20}/></label><label>Alliance<select name="alliance" required defaultValue=""><option value="" disabled>Select your alliance</option>{alliances.map(alliance=><option key={alliance.tag}>{alliance.tag}</option>)}</select></label></div>;
}
export function FormLoadState({loading,message,retry}:{loading:boolean;message:string;retry:()=>void}){
  return <div className="wrap page-body"><FormBack/>{loading?<p role="status">Loading your saved form…</p>:<div className="notice error" role="alert"><p>{message||'Unable to load your saved form.'}</p><button className="button" type="button" onClick={retry}>Try again</button></div>}</div>;
}
