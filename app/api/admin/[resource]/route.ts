import {NextResponse} from 'next/server';
import {z} from 'zod';
import {adminClient} from '@/lib/supabase/server';
import {sameOrigin,readJson,failure,HttpError} from '@/lib/http';
import {eventSchema,gallerySchema,reviewSchema} from '@/lib/validation';
import {prepStorageError} from '@/lib/prep-storage-error';
import {rateLimit} from '@/lib/supabase/service';

const resources=['transfers','forms','events','gallery'] as const;
function resourceName(value:string){if(!resources.includes(value as typeof resources[number]))throw new HttpError(404,'Admin section not found.');return value as typeof resources[number];}
const tables={transfers:'transfer_applications',forms:'member_forms',events:'events',gallery:'gallery'};
const privateHeaders={'Cache-Control':'private, no-store'};

export async function GET(request:Request,{params}:{params:Promise<{resource:string}>}){
  try{
    const{client}=await adminClient();const resource=resourceName((await params).resource);const url=new URL(request.url);
    const offset=z.coerce.number().int().min(0).max(100000).parse(url.searchParams.get('offset')??0);
    if(resource==='forms'&&url.searchParams.get('kind')==='prep'){
      const{data,error}=await client.from('admin_prep_entries').select('*').order('updated_at',{ascending:false}).order('player_id',{ascending:true}).order('cycle',{ascending:true}).range(offset,offset+100);
      if(error)throw prepStorageError(error);
      const items=(data??[]).slice(0,100).map(row=>({...row,members:{player_id:row.player_id,player_name:row.player_name,alliance:row.alliance}}));
      return NextResponse.json({items,has_more:(data?.length??0)>100},{headers:privateHeaders});
    }
    let query=client.from(tables[resource]).select('*').order(resource==='forms'?'updated_at':'created_at',{ascending:false});
    if(resource==='forms'){const kind=z.enum(['profile','availability','prep']).parse(url.searchParams.get('kind'));query=query.eq('kind',kind).order('user_id',{ascending:true}).order('cycle',{ascending:true});}
    const{data,error}=await query.range(offset,offset+100);if(error)throw error;
    let items=(data??[]).slice(0,100);
    if(resource==='forms'&&items.length){const{data:members,error:memberError}=await client.from('members').select('id,player_id,player_name,alliance').in('id',[...new Set(items.map(item=>item.user_id))]);if(memberError)throw memberError;items=items.map(item=>({...item,members:members?.find(member=>member.id===item.user_id)}));}
    if(resource==='transfers'&&items.length){
      items=await Promise.all(items.map(async item=>{
        const paths=Array.isArray(item.evidence_paths)?item.evidence_paths:[];
        if(!paths.length)return {...item,evidence_urls:[]};
        const{data:urls,error}=await client.storage.from('transfer-evidence').createSignedUrls(paths,600);
        if(error)throw error;
        return {...item,evidence_urls:urls?.map(entry=>entry.signedUrl).filter(Boolean)??[]};
      }));
    }
    if(resource==='gallery'&&items.length){
      const{data:urls,error:storageError}=await client.storage.from('gallery').createSignedUrls(items.map(item=>item.storage_path),600);
      if(storageError)throw storageError;
      items=items.map((item,index)=>({...item,image_url:urls?.[index]?.signedUrl??''}));
    }
    return NextResponse.json({items,has_more:(data?.length??0)>100},{headers:privateHeaders});
  }catch(error){return failure(error);}
}

export async function POST(request:Request,{params}:{params:Promise<{resource:string}>}){
  try{
    sameOrigin(request);const{client}=await adminClient();const resource=resourceName((await params).resource);await rateLimit(request,'admin-write');
    const raw=await readJson(request);
    if(resource==='events'){
      const event=eventSchema.parse(raw);const{error}=await client.from('events').upsert(event);if(error)throw error;
    }else if(resource==='transfers'){
      const{id,...values}=reviewSchema.parse(raw);const{error}=await client.from('transfer_applications').update(values).eq('id',id);if(error)throw error;
    }else if(resource==='gallery'){
      const{id,...values}=gallerySchema.extend({id:z.uuid()}).parse(raw);const{error}=await client.from('gallery').update(values).eq('id',id);if(error)throw error;
    }else throw new HttpError(405,'Member submissions are read-only for administrators.');
    return NextResponse.json({success:true},{headers:privateHeaders});
  }catch(error){return failure(error);}
}

export async function DELETE(request:Request,{params}:{params:Promise<{resource:string}>}){
  try{
    sameOrigin(request);const{client}=await adminClient();const resource=resourceName((await params).resource);await rateLimit(request,'admin-delete');
    if(resource!=='events'&&resource!=='gallery')throw new HttpError(405,'Deletion is not available in this section.');
    const{id}=z.object({id:z.uuid()}).strict().parse(await readJson(request));
    if(resource==='gallery'){
      const{data,error}=await client.from('gallery').select('storage_path').eq('id',id).single();if(error)throw error;
      const{error:deleteError}=await client.storage.from('gallery').remove([data.storage_path]);if(deleteError)throw deleteError;
    }
    const{error}=await client.from(tables[resource]).delete().eq('id',id);if(error)throw error;
    return NextResponse.json({success:true},{headers:privateHeaders});
  }catch(error){return failure(error);}
}
