import {NextResponse} from 'next/server';
import {sessionClient} from '@/lib/supabase/server';
export async function GET(request:Request){
  const url=new URL(request.url);const origin=new URL(process.env.NEXT_PUBLIC_SITE_URL||url.origin).origin;
  const token_hash=url.searchParams.get('token_hash'),type=url.searchParams.get('type');
  try{if(token_hash&&(type==='email'||type==='signup'||type==='recovery')){const client=await sessionClient();const{error}=await client.auth.verifyOtp({token_hash,type});if(!error)return NextResponse.redirect(new URL(type==='recovery'?'/account/password':'/members',origin));}}catch{}
  return NextResponse.redirect(new URL('/account?notice=link-expired',origin));
}
