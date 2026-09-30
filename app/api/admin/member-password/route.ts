import {NextResponse} from 'next/server';
import {adminClient} from '@/lib/supabase/server';
import {rateLimit} from '@/lib/supabase/service';
import {sameOrigin,readJson,failure,HttpError} from '@/lib/http';
import {adminResetSchema} from '@/lib/member-validation';

export async function POST(request:Request){
  try{
    sameOrigin(request);
    await adminClient();
    const values=adminResetSchema.parse(await readJson(request));
    const service=await rateLimit(request,'admin-password-reset');
    const{data:member,error}=await service.from('members').select('id').eq('player_id',values.player_id).maybeSingle();
    if(error)throw error;
    if(!member)throw new HttpError(404,'Member ID not found.');
    // Admin recovery is reserved for the project owner, outside this member tool.
    const{data:role,error:roleError}=await service.from('admin_roles').select('user_id').eq('user_id',member.id).maybeSingle();
    if(roleError)throw roleError;
    if(role)throw new HttpError(403,'Administrator accounts must be recovered by the Supabase project owner.');
    const{error:resetError}=await service.auth.admin.updateUserById(member.id,{password:values.password,email_confirm:true});
    if(resetError)throw new HttpError(400,'Unable to reset this password. Try a different password.');
    return NextResponse.json({success:true,message:'Password updated. Share it privately with the verified member in-game and ask them to change it under Password after signing in.'},{headers:{'Cache-Control':'private, no-store'}});
  }catch(error){return failure(error);}
}
