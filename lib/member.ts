import 'server-only';
import {sessionClient} from './supabase/server';
import {databaseConfigured} from './config';
import {HttpError} from './http';

export type Member={id:string;player_id:string;player_name:string;alliance:string};
export async function memberSession(){
  if(!databaseConfigured())return null;
  const client=await sessionClient();
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user)return null;
  const {data:member,error:lookupError}=await client.from('members').select('id,player_id,player_name,alliance').eq('id',user.id).single();
  if(lookupError||!member)throw new HttpError(503,'Your member account could not be loaded. Please try again.');
  return {client,user,member:member as Member};
}
export async function requireMember(){
  const session=await memberSession();
  if(!session)throw new HttpError(401,'Sign in with your member ID to continue.');
  return session;
}
