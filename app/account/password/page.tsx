export const dynamic='force-dynamic';
import {redirect} from 'next/navigation';
import {sessionClient} from '@/lib/supabase/server';
import {submissionsConfigured} from '@/lib/config';
import {AccountForm} from '@/components/account-form';
import {PageHeader} from '@/components/ui';
import {pageMetadata} from '@/lib/metadata';
export const metadata=pageMetadata('Website password','Update the password for your Kingdom 2312 member account.');
export default async function Password(){
  const configured=submissionsConfigured();
  if(configured){const client=await sessionClient();const{data:{user}}=await client.auth.getUser();if(!user)redirect('/account');}
  return <><PageHeader number="09" title="WEBSITE PASSWORD" intro="Keep your kingdom account secure."/><div className="wrap page-body"><AccountForm configured={configured} passwordOnly/></div></>;
}
