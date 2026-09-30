import {NextResponse} from 'next/server';
import {sameOrigin,failure,HttpError} from '@/lib/http';
import {rateLimit} from '@/lib/supabase/service';
import {transferApplicationSchema,evidenceLimit,imageType} from '@/lib/transfer-application';
import {kingdom} from '@/data/kingdom';

export const runtime='nodejs';
export async function POST(request:Request){
 let service:Awaited<ReturnType<typeof rateLimit>>|undefined;const uploaded:string[]=[];
 try{
  sameOrigin(request);
  if(!kingdom.transfersOpen)throw new HttpError(503,'Transfer applications are currently closed.');
  service=await rateLimit(request,'transfers');
  if(!request.headers.get('content-type')?.startsWith('multipart/form-data'))throw new HttpError(415,'Expected an application with screenshots.');
  const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'No application received.');
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const{done,value}=await reader.read();if(done)break;size+=value.length;if(size>3200000){await reader.cancel();throw new HttpError(413,'Use up to four screenshots of 750 KB each.');}chunks.push(value);}
  const form=await new Request(request.url,{method:'POST',headers:{'content-type':request.headers.get('content-type')!},body:Buffer.concat(chunks)}).formData();
  const raw=form.get('application');if(typeof raw!=='string'||raw.length>24000)throw new HttpError(400,'Invalid application.');
  let parsed:unknown;try{parsed=JSON.parse(raw);}catch{throw new HttpError(400,'Invalid application.');}
  const{request_id,website,...application}=transferApplicationSchema.parse(parsed);void website;
  const files=form.getAll('screenshots');
  if(files.length<1||files.length>4)throw new HttpError(400,'Upload between one and four screenshots.');
  const images=[];
  for(const file of files){
   if(!(file instanceof File)||file.size<1||file.size>evidenceLimit)throw new HttpError(400,'Each screenshot must be no larger than 750 KB.');
   const bytes=Buffer.from(await file.arrayBuffer());const type=imageType(bytes);if(!type)throw new HttpError(400,'Use JPEG, PNG, or WebP screenshots.');
   images.push({bytes,type});
  }
  // Do not expose previous application contents on a retry.
  const{data:existing,error:lookupError}=await service.from('transfer_applications').select('id').eq('id',request_id).maybeSingle();
  if(lookupError)throw lookupError;
  if(existing)return NextResponse.json({success:true,reference:request_id},{headers:{'Cache-Control':'no-store'}});
  for(const image of images){const path=`${request_id}/${crypto.randomUUID()}.${image.type}`;const{error}=await service.storage.from('transfer-evidence').upload(path,image.bytes,{contentType:`image/${image.type}`,upsert:false});if(error)throw error;uploaded.push(path);}
  const{error}=await service.from('transfer_applications').insert({...application,id:request_id,evidence_paths:uploaded,consent_at:new Date().toISOString()});
  if(error)throw error;
  return NextResponse.json({success:true,reference:request_id},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(error){
  if(service&&uploaded.length){try{await service.storage.from('transfer-evidence').remove(uploaded);}catch{/* Best-effort cleanup; do not expose private file paths. */}}
  return failure(error);
 }
}
