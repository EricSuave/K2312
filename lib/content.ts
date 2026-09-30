import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {databaseConfigured} from './config';
import {originalGallery,type GalleryItem,type KingdomEvent} from '@/data/kingdom';
function publicClient(){return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,cache:'no-store',signal:AbortSignal.timeout(8000)})}})}
export async function getEvents():Promise<{items:KingdomEvent[];error:boolean}>{
  if(!databaseConfigured())return{items:[],error:false};
  try{const{data,error}=await publicClient().from('events').select('*').eq('published',true).gte('ends_at',new Date().toISOString()).order('starts_at').limit(200);return{items:data??[],error:!!error};}catch{return{items:[],error:true};}
}
export async function getGallery():Promise<{items:GalleryItem[];error:boolean}>{
  if(!databaseConfigured())return{items:originalGallery,error:false};
  try{
    const client=publicClient();const{data,error}=await client.from('gallery').select('*').eq('published',true).order('created_at',{ascending:false}).limit(200);
    if(error)return{items:[],error:true};if(!data?.length)return{items:originalGallery,error:false};
    const{data:urls,error:storageError}=await client.storage.from('gallery').createSignedUrls(data.map(row=>row.storage_path),600);
    if(storageError)return{items:[],error:true};
    return{items:data.map((row,index)=>({...row,image_url:urls?.[index]?.signedUrl??''})),error:false};
  }catch{return{items:[],error:true};}
}
