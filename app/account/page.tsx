import {PageHeader} from '@/components/ui';
import {AccountForm} from '@/components/account-form';
import {submissionsConfigured} from '@/lib/config';
import {pageMetadata} from '@/lib/metadata';
export const metadata=pageMetadata('Member sign-in','Create your Kingdom 2312 member account or sign in with your member ID.');
export default async function Account({searchParams}:{searchParams:Promise<{notice?:string}>}){
  const{notice}=await searchParams;
  return <><PageHeader number="09" title="MEMBER ACCESS" intro="Your ID. Your account. Your kingdom."/><div className="wrap page-body"><AccountForm configured={submissionsConfigured()} notice={notice==='link-expired'?'That email link could not be verified. Sign in or contact kingdom leadership for help.':''}/></div></>;
}
