import {NextResponse} from 'next/server';
import {sameOrigin,readJson,failure,HttpError} from '@/lib/http';
import {sessionClient} from '@/lib/supabase/server';
import {rateLimit} from '@/lib/supabase/service';
import {signInSchema,signUpSchema,newPasswordSchema} from '@/lib/member-validation';

export async function POST(request:Request,{params}:{params:Promise<{action:string}>}){
  try{
    sameOrigin(request);const{action}=await params;
    if(!['signin','signup','password'].includes(action))throw new HttpError(404,'Action not found.');
    const raw=await readJson(request);const service=await rateLimit(request,`member-${action}`);const client=await sessionClient();
    if(action==='signin'){
      const values=signInSchema.parse(raw);
      const{data:member,error:lookupError}=await service.from('members').select('id').eq('player_id',values.player_id).maybeSingle();
      if(lookupError)throw lookupError;
      let email='missing-member@invalid.example';
      if(member){const{data,error}=await service.auth.admin.getUserById(member.id);if(error)throw error;email=data.user.email||email;}
      const{error}=await client.auth.signInWithPassword({email,password:values.password});
      if(error)throw new HttpError(401,'Unable to sign in. Check your member ID and password. Contact leadership if you need help.');
      return NextResponse.json({success:true},{headers:{'Cache-Control':'private, no-store'}});
    }
    if(action==='signup'){
      const{password,player_id,player_name,alliance}=signUpSchema.parse(raw);
      // Internal identifier only: this reserved domain cannot receive mail.
      // Existing users still sign in through the members -> auth user lookup above.
      const email=`member-${player_id}@members.kingdom2312.invalid`;
      const{error}=await service.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{player_id,player_name,alliance,consent:true}});
      if(error)throw new HttpError(400,'Unable to create this account. Sign in if you already registered, or contact leadership if your member ID is already in use.');
      const{error:signInError}=await client.auth.signInWithPassword({email,password});
      return NextResponse.json({success:true,signed_in:!signInError,message:signInError?'Your account was created. Sign in with your member ID and password.':'Account created.'},{headers:{'Cache-Control':'private, no-store'}});
    }
    const{password}=newPasswordSchema.parse(raw);
    const{data:{user},error:authError}=await client.auth.getUser();
    if(authError||!user)throw new HttpError(401,'Sign in first to change your password.');
    const{error}=await client.auth.updateUser({password});if(error)throw new HttpError(400,'Unable to update your password. Use a different password or contact leadership.');
    return NextResponse.json({success:true,message:'Your website password has been updated.'},{headers:{'Cache-Control':'private, no-store'}});
  }catch(error){return failure(error);}
}
