export const dynamic='force-dynamic';
import {redirect} from 'next/navigation';
import {memberSession} from '@/lib/member';
import {submissionsConfigured} from '@/lib/config';
import {MemberSessionProvider} from '@/components/member-session';
import {AccountBar} from '@/components/account-form';
import {Notice} from '@/components/ui';

export default async function MemberLayout({children}:{children:React.ReactNode}){
  const configured=submissionsConfigured();
  let session=null;
  try{session=await memberSession();}catch{return <div className="wrap page-body"><Notice tone="error">Your member account could not be loaded. Refresh to try again.</Notice></div>;}
  if(configured&&!session)redirect('/account');
  return <MemberSessionProvider member={session?.member??null} configured={configured}>{session&&<AccountBar member={session.member}/>} {children}</MemberSessionProvider>;
}
