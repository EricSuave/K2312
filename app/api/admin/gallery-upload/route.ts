import {NextResponse} from 'next/server';
import {adminClient} from '@/lib/supabase/server';
import {sameOrigin,failure,HttpError} from '@/lib/http';
import {gallerySchema} from '@/lib/validation';
import {rateLimit} from '@/lib/supabase/service';

async function boundedForm(request:Request){
  const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Choose an image.');
  const chunks:Uint8Array[]=[];let length=0;
  while(true){const{done,value}=await reader.read();if(done)break;length+=value.length;if(length>4100000){await reader.cancel();throw new HttpError(413,'Use an image smaller than 4 MB.');}chunks.push(value);}
  return new Request(request.url,{method:'POST',headers:{'content-type':request.headers.get('content-type')||''},body:Buffer.concat(chunks)}).formData();
}
export async function POST(request:Request){
  try{
    sameOrigin(request);const{client}=await adminClient();await rateLimit(request,'gallery-upload');const data=await boundedForm(request);const file=data.get('image');
    if(!(file instanceof File)||file.size>4000000||file.size===0)throw new HttpError(400,'Choose a JPEG, PNG, or WebP image smaller than 4 MB.');
    const bytes=Buffer.from(await file.arrayBuffer());
    const type=bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff?'jpeg':bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'png':bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP'?'webp':null;
    if(!type)throw new HttpError(400,'Only JPEG, PNG, and WebP images are supported.');
    const values=gallerySchema.parse({title:data.get('title'),caption:data.get('caption'),category:data.get('category'),taken_on:data.get('taken_on')||null,published:data.get('published')==='on'});
    const path=`${crypto.randomUUID()}.${type}`;
    const{error:uploadError}=await client.storage.from('gallery').upload(path,bytes,{contentType:`image/${type}`,upsert:false});if(uploadError)throw uploadError;
    const{error}=await client.from('gallery').insert({...values,storage_path:path});
    if(error){await client.storage.from('gallery').remove([path]);throw error;}
    return NextResponse.json({success:true},{headers:{'Cache-Control':'private, no-store'}});
  }catch(error){return failure(error);}
}
