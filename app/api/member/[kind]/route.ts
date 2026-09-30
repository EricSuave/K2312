import {NextResponse} from 'next/server';
import {requireMember} from '@/lib/member';
import {sameOrigin,readJson,failure,HttpError} from '@/lib/http';
import {rateLimit} from '@/lib/supabase/service';
import {memberFormSchemas,type MemberFormKind} from '@/lib/member-validation';

function formKind(kind:string):MemberFormKind{
  if(!Object.hasOwn(memberFormSchemas,kind))throw new HttpError(404,'Form not found.');
  return kind as MemberFormKind;
}
export async function GET(_request:Request,{params}:{params:Promise<{kind:string}>}){
  try{
    const kind=formKind((await params).kind);const{client,user}=await requireMember();
    const{data,error}=await client.from('member_forms').select('payload,updated_at').eq('user_id',user.id).eq('kind',kind).order('updated_at',{ascending:false}).limit(1).maybeSingle();
    if(error)throw error;
    return NextResponse.json(data??{payload:null},{headers:{'Cache-Control':'private, no-store'}});
  }catch(error){return failure(error);}
}
export async function PUT(request:Request,{params}:{params:Promise<{kind:string}>}){
  try{
    sameOrigin(request);const kind=formKind((await params).kind);const{client,user}=await requireMember();
    await rateLimit(request,'member-save');
    const payload=memberFormSchemas[kind].parse(await readJson(request));
    const cycle='event_date' in payload?payload.event_date:'battle_date' in payload?payload.battle_date:'current';
    const{error}=await client.from('member_forms').upsert({user_id:user.id,kind,cycle,payload,updated_at:new Date().toISOString()},{onConflict:'user_id,kind,cycle'});
    if(error)throw error;
    return NextResponse.json({success:true},{headers:{'Cache-Control':'private, no-store'}});
  }catch(error){return failure(error);}
}
