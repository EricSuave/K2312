export const dynamic='force-dynamic';
import Link from 'next/link';
import {AdminPasswordReset} from '@/components/admin-password-reset';
import {redirect} from 'next/navigation';
import {PageHeader,Notice} from '@/components/ui';
import {AdminDashboard} from '@/components/admin-dashboard';
import {adminClient} from '@/lib/supabase/server';
import {submissionsConfigured} from '@/lib/config';
import {HttpError} from '@/lib/http';
import {pageMetadata} from '@/lib/metadata';
export const metadata={...pageMetadata('Kingdom administration','Private administration for Kingdom 2312 leadership.'),robots:{index:false,follow:false}};
export default async function Admin(){
  if(!submissionsConfigured())return <><PageHeader number="10" title="KINGDOM ADMIN" intro="A private workspace for kingdom leadership."/><div className="wrap page-body"><Notice>Administration is unavailable until the kingdom’s account service is connected.</Notice></div></>;
  try{await adminClient();}catch(error){
    if(error instanceof HttpError&&error.status===401)redirect('/account');
    return <><PageHeader number="10" title="KINGDOM ADMIN" intro="This area is restricted to authorized kingdom leadership."/><div className="wrap page-body"><Notice tone="error">{error instanceof HttpError&&error.status===403?'Your member account does not have administrator access.':'Administration could not be loaded. Please retry.'}</Notice><Link className="button" href="/members">Back to member forms</Link></div></>;
  }
  return <><PageHeader number="10" title="KINGDOM ADMIN" intro="Review member forms, coordinate events, and manage your kingdom gallery."/><AdminDashboard/><AdminPasswordReset/></>;
}
