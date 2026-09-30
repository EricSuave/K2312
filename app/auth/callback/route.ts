import {NextResponse} from 'next/server';
import {sessionClient} from '@/lib/supabase/server';
export async function GET(request:Request){
  const url=new URL(request.url);const origin=new URL(process.env.NEXT_PUBLIC_SITE_URL||url.origin).origin;
  const next=url.searchParams.get('next')==='/account/password'?'/account/password':'/members';
  try{const code=url.searchParams.get('code');if(code){const client=await sessionClient();const{error}=await client.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(next,origin));}}catch{}
  return NextResponse.redirect(new URL('/account?notice=link-expired',origin));
}
