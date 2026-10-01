import {NextResponse} from 'next/server';
import {adminClient} from '@/lib/supabase/server';
import {rateLimit} from '@/lib/supabase/service';
import {sameOrigin,readJson,failure,HttpError} from '@/lib/http';
import {adminPrepEntrySchema,adminPrepLookupSchema} from '@/lib/admin-prep-validation';
import {prepStorageError} from '@/lib/prep-storage-error';
const headers={'Cache-Control':'private, no-store'};

export async function GET(request:Request){
 try{
  const{client}=await adminClient();const url=new URL(request.url);
  const{player_id,cycle}=adminPrepLookupSchema.parse({player_id:url.searchParams.get('player_id'),cycle:url.searchParams.get('cycle')});
  const{data,error}=await client.rpc('load_admin_prep',{p_player_id:player_id,p_cycle:cycle});
  if(error)throw prepStorageError(error);
  return NextResponse.json(data,{headers});
 }catch(error){return failure(error);}
}
export async function POST(request:Request){
 try{
  sameOrigin(request);const{client}=await adminClient();await rateLimit(request,'admin-prep-entry');
  const values=adminPrepEntrySchema.parse(await readJson(request));
  const{data,error}=await client.rpc('save_admin_prep',{
   p_player_id:values.player_id,p_player_name:values.player_name,p_alliance:values.alliance,p_payload:values.payload,
   p_expected_revision:values.expected_revision,p_expected_self_updated_at:values.expected_self_updated_at,p_expected_member_updated_at:values.expected_member_updated_at,
  });
  if(error){if(error.message.includes('PREP_EDIT_CONFLICT'))throw new HttpError(409,'This player’s record changed after you loaded it. Load the player again to review the latest information before saving.');throw prepStorageError(error);}
  const saved=data?.[0];if(!saved)throw new HttpError(503,'The save could not be confirmed. Reload the player before trying again.');
  return NextResponse.json({success:true,revision:saved.revision,updated_at:saved.updated_at,message:'Prep saved for this player. The admin ranking and schedule have been refreshed.'},{headers});
 }catch(error){return failure(error);}
}
