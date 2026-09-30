import {NextResponse} from 'next/server';
import {sameOrigin,readJson,failure,HttpError} from '@/lib/http';
import {sessionClient} from '@/lib/supabase/server';
import {rateLimit} from '@/lib/supabase/service';
import {signInSchema,signUpSchema,resetPasswordSchema,newPasswordSchema} from '@/lib/member-validation';

export async function POST(request:Request,{params}:{params:Promise<{action:string}>}){
  try{
    sameOrigin(request);const{action}=await params;
    if(!['signin','signup','reset','password'].includes(action))throw new HttpError(404,'Action not found.');
    const raw=await readJson(request);const service=await rateLimit(request,`member-${action}`);const client=await sessionClient();
    const origin=new URL(process.env.NEXT_PUBLIC_SITE_URL||request.url).origin;
    if(action==='signin'){
      const values=signInSchema.parse(raw);
      const{data:member,error:lookupError}=await service.from('members').select('id').eq('player_id',values.player_id).maybeSingle();
      if(lookupError)throw lookupError;
      let email='missing-member@invalid.example';
      if(member){const{data,error}=await service.auth.admin.getUserById(member.id);if(error)throw error;email=data.user.email||email;}
      const{error}=await client.auth.signInWithPassword({email,password:values.password});
      if(error)throw new HttpError(401,'Unable to sign in. Check your member ID and password, and confirm your email if you just registered.');
      return NextResponse.json({success:true},{headers:{'Cache-Control':'private, no-store'}});
    }
    if(action==='signup'){
      const{email,password,player_id,player_name,alliance}=signUpSchema.parse(raw);
      const{data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:`${origin}/auth/callback`,data:{player_id,player_name,alliance,consent:true}}});
      if(error)throw new HttpError(400,'Unable to create this account. Check your details, or sign in if you already registered. Contact leadership if your member ID is already in use.');
      return NextResponse.json({success:true,signed_in:!!data.session,message:data.session?'Account created.':'Check your email to confirm your account, then sign in with your member ID.'},{headers:{'Cache-Control':'private, no-store'}});
    }
    if(action==='reset'){
      const{email}=resetPasswordSchema.parse(raw);
      const{error}=await client.auth.resetPasswordForEmail(email,{redirectTo:`${origin}/auth/callback?next=/account/password`});
      if(error)throw new HttpError(503,'Password reset is temporarily unavailable. Please try again later.');
      return NextResponse.json({success:true,message:'If that address has an account, a password reset email has been sent.'},{headers:{'Cache-Control':'private, no-store'}});
    }
    const{password}=newPasswordSchema.parse(raw);
    const{data:{user},error:authError}=await client.auth.getUser();
    if(authError||!user)throw new HttpError(401,'Open a valid password reset link or sign in first.');
    const{error}=await client.auth.updateUser({password});if(error)throw new HttpError(400,'Unable to update your password. Use a different password or request a fresh reset link.');
    return NextResponse.json({success:true,message:'Your website password has been updated.'},{headers:{'Cache-Control':'private, no-store'}});
  }catch(error){return failure(error);}
}
