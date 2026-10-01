import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {adminPrepEntrySchema} from '../lib/admin-prep-validation';
const admin='11111111-1111-4111-8111-111111111111',member='22222222-2222-4222-8222-222222222222',later='33333333-3333-4333-8333-333333333333';
const payload={battle_date:'2026-10-03',construction_targets:['TG3'],truegold:100,construction_speedup_days:12.5,research_speedup_days:5,training_speedup_days:7.25,day_1_minister:'yes',day_2_minister:'no',day_4_minister:'no',day_1_times:['18:15','06:15'],day_2_times:[],day_4_times:[],day_5_times:[]};
type Loaded={expected_revision:string|null;expected_self_updated_at:string|null;expected_member_updated_at:string|null;payload:typeof payload|null;has_account:boolean;entry_source:string|null};
test('admin-managed prep is private, attributed, conflict-checked, and merges with later member registration',async()=>{
 const db=await PGlite.create();
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;grant usage on schema public,auth,storage to anon,authenticated,service_role;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant all on storage.objects to anon,authenticated;`);
  for(const name of ['001_kingdom_hub.sql','002_optional_registration_alliance.sql','004_admin_member_prep.sql','004_admin_member_prep.sql'])await db.exec(await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8'));
  for(const[id,player_id,player_name]of[[admin,'100001','Admin'],[member,'100002','Member']])await db.query('insert into auth.users(id,raw_user_meta_data) values($1,$2)',[id,JSON.stringify({player_id,player_name,consent:true})]);
  await db.query('insert into admin_roles values($1)',[admin]);
  const role=async(id:string)=>{await db.exec('reset role;set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);};
  const load=async(id='777777777')=>(await db.query<{value:Loaded}>('select load_admin_prep($1,$2) as value',[id,payload.battle_date])).rows[0].value;
  const save=async(token:Loaded,p=payload,id='777777777')=>db.query('select * from save_admin_prep($1,$2,$3,$4,$5,$6,$7)',[id,'Managed Player','404',JSON.stringify(p),token.expected_revision,token.expected_self_updated_at,token.expected_member_updated_at]);
  await role(admin);const empty=await load();assert.equal(empty.has_account,false);assert.equal(empty.payload,null);
  await save(empty);const first=await load();assert.ok(first.expected_revision);assert.equal(adminPrepEntrySchema.safeParse({player_id:'777777777',player_name:'Managed Player',alliance:'404',payload,expected_revision:first.expected_revision,expected_self_updated_at:first.expected_self_updated_at,expected_member_updated_at:first.expected_member_updated_at}).success,true);assert.equal(first.entry_source,'admin');assert.deepEqual(first.payload?.day_1_times,['18:15','06:15']);
  assert.equal((await db.query('select * from admin_prep_entries')).rows.length,1);
  assert.equal((await db.query<{entered_by:string}>('select entered_by from managed_prep_forms')).rows[0].entered_by,admin);
  await assert.rejects(()=>save(empty),/PREP_EDIT_CONFLICT/);
  await save(first,{...payload,truegold:200});assert.equal((await load()).payload?.truegold,200);
  await assert.rejects(()=>save(first),/PREP_EDIT_CONFLICT/);
  await assert.rejects(()=>db.query('update managed_prep_forms set entered_by=$1',[member]),/permission denied/);
  await assert.rejects(()=>db.query('insert into managed_members(player_id,player_name) values($1,$2)',['888888888','Direct bypass']),/permission denied/);
  await db.exec('reset role');assert.equal((await db.query('select * from auth.users')).rows.length,2);assert.equal((await db.query('select * from members')).rows.length,2);
  await role(member);assert.equal((await db.query('select * from managed_members')).rows.length,0);assert.equal((await db.query('select * from managed_prep_forms')).rows.length,0);assert.equal((await db.query('select * from admin_prep_entries')).rows.length,0);
  await assert.rejects(()=>load(),/Administrator access required/);await assert.rejects(()=>save(first),/Administrator access required/);
  await db.exec('reset role;set role anon');await assert.rejects(()=>load(),/permission denied/);await assert.rejects(()=>db.query('select * from admin_prep_entries'),/permission denied/);
  // A player can later register freely; no automatic access to admin-only data is granted.
  await db.exec('reset role');await db.query('insert into auth.users(id,raw_user_meta_data) values($1,$2)',[later,JSON.stringify({player_id:'777777777',player_name:'Registered Player',consent:true})]);
  await role(later);assert.equal((await db.query('select * from managed_prep_forms')).rows.length,0);assert.equal((await db.query('select * from member_forms')).rows.length,0);
  await role(admin);const beforeSelfSave=await load();assert.equal(beforeSelfSave.has_account,true);
  await role(later);await db.query("insert into member_forms(user_id,kind,cycle,payload,updated_at) values($1,'prep',$2,$3,clock_timestamp())",[later,payload.battle_date,JSON.stringify({...payload,truegold:300})]);
  await role(admin);const withSelf=await load();assert.equal(withSelf.entry_source,'member');assert.equal(withSelf.payload?.truegold,300);
  assert.equal((await db.query('select * from admin_prep_entries')).rows.length,1);
  await assert.rejects(()=>save(beforeSelfSave),/PREP_EDIT_CONFLICT/);
  await save(withSelf,{...payload,truegold:400});const afterAdmin=await load();assert.equal(afterAdmin.entry_source,'admin');assert.equal(afterAdmin.payload?.truegold,400);
  assert.equal((await db.query('select * from admin_prep_entries')).rows.length,1);
  // Member's own original submission remains intact; admin writes are separate and attributed.
  await role(later);assert.equal((await db.query<{payload:typeof payload}>('select payload from member_forms')).rows[0].payload.truegold,300);
 }finally{await db.close();}
});
test('admin entry validation accepts no account credentials and rejects unsupported prep data',()=>{
 const entry={player_id:'777777777',player_name:'Managed Player',alliance:'404',payload,expected_revision:null,expected_self_updated_at:null,expected_member_updated_at:null};
 assert.equal(adminPrepEntrySchema.safeParse(entry).success,true);
 for(const extra of [{password:'unused-password'},{email:'unused@example.test'},{entered_by:admin},{role:'admin'},{player_id:'abc'}])assert.equal(adminPrepEntrySchema.safeParse({...entry,...extra}).success,false);
 assert.equal(adminPrepEntrySchema.safeParse({...entry,payload:{...payload,gear:123}}).success,false);
 assert.equal(adminPrepEntrySchema.safeParse({...entry,payload:{...payload,day_1_times:['18:15','18:15']}}).success,false);
});
