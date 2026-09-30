import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('migration enforces member ownership, admin roles, published content, and rate limits',async()=>{
  const db=await PGlite.create();
  const alice='11111111-1111-4111-8111-111111111111',bob='22222222-2222-4222-8222-222222222222';
  try{
    // Model only the Supabase-owned surfaces needed by this migration.
    // Real email delivery, Auth sessions, and Storage uploads need a connected project.
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create schema storage;
      grant usage on schema public,auth,storage to anon,authenticated,service_role;
      create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security;
      grant select,insert,update,delete on storage.objects to anon,authenticated;
    `);
    await db.exec(await readFile(new URL('../supabase/migrations/001_kingdom_hub.sql',import.meta.url),'utf8'));
    const optionalAlliance=await readFile(new URL('../supabase/migrations/002_optional_registration_alliance.sql',import.meta.url),'utf8');
    await db.exec(optionalAlliance);await db.exec(optionalAlliance);
    const unassigned='00000000-0000-4000-8000-000000000099';
    await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[unassigned,'member-100099@members.kingdom2312.invalid',JSON.stringify({player_id:'100099',player_name:'Unassigned',consent:true})]);
    assert.equal((await db.query<{alliance:string|null}>('select alliance from members where id=$1',[unassigned])).rows[0].alliance,null);
    await db.query('delete from auth.users where id=$1',[unassigned]);

    for(const[id,player_id,player_name]of[[alice,'100001','Alice'],[bob,'100002','Bob']])await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[id,`${player_id}@example.test`,JSON.stringify({player_id,player_name,alliance:'404',consent:true})]);
    await db.query("insert into member_forms(user_id,kind,cycle,payload) values($1,'prep','2026-10-03',$2)",[bob,JSON.stringify({battle_date:'2026-10-03'})]);
    await db.exec("insert into events(title,kind,starts_at,ends_at,description,published) values('Public','KvK','2026-10-03 10:00Z','2026-10-03 22:00Z','Visible',true),('Private','KvK','2026-10-03 10:00Z','2026-10-03 22:00Z','Hidden',false)");
    await db.exec("insert into gallery(title,caption,category,storage_path,published) values('Public','Public','Test','public.webp',true),('Private','Private','Test','private.webp',false);insert into storage.objects(bucket_id,name) values('gallery','public.webp'),('gallery','private.webp');");
    await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[alice]);
    assert.equal((await db.query('select * from members')).rows.length,1);
    assert.equal((await db.query('select * from member_forms')).rows.length,0);
    await assert.rejects(()=>db.query("insert into member_forms(user_id,kind,cycle,payload) values($1,'profile','current',$2)",[bob,JSON.stringify({player_name:'Intruder',alliance:'404'})]),/row-level security/);
    await assert.rejects(()=>db.query('insert into admin_roles(user_id) values($1)',[alice]),/permission denied/);
    await assert.rejects(()=>db.query("select consume_submission_limit('forged')"),/permission denied/);
    await db.query("insert into member_forms(user_id,kind,cycle,payload) values($1,'profile','current',$2)",[alice,JSON.stringify({player_name:'Alice updated',alliance:'401'})]);
    assert.equal((await db.query<{player_name:string}>('select player_name from members')).rows[0].player_name,'Alice updated');
    assert.equal((await db.query('select * from member_forms')).rows.length,1);
    assert.equal((await db.query('select * from events')).rows.length,1);
    assert.equal((await db.query('select * from storage.objects')).rows.length,1);
    await assert.rejects(()=>db.exec("insert into events(title,kind,starts_at,ends_at,description,published) values('Unauthorized','KvK','2026-10-03 10:00Z','2026-10-03 22:00Z','Blocked',true)"),/row-level security/);
    await db.exec('reset role');await db.query('insert into admin_roles(user_id) values($1)',[alice]);
    await db.exec('set role authenticated');
    assert.equal((await db.query<{is_admin:boolean}>('select is_admin()')).rows[0].is_admin,true);
    assert.equal((await db.query('select * from member_forms')).rows.length,2);
    assert.equal((await db.query('select * from events')).rows.length,2);
    assert.equal((await db.query('select * from storage.objects')).rows.length,2);
    await db.exec('reset role;set role anon');
    await assert.rejects(()=>db.query('select * from members'),/permission denied/);
    await assert.rejects(()=>db.query('select * from member_forms'),/permission denied/);
    assert.equal((await db.query('select * from events')).rows.length,1);
    assert.equal((await db.query('select * from storage.objects')).rows.length,1);
    await db.exec('reset role;set role service_role');
    for(let i=0;i<30;i++)assert.equal((await db.query<{allowed:boolean}>("select consume_submission_limit('test-bucket') as allowed")).rows[0].allowed,true);
    assert.equal((await db.query<{allowed:boolean}>("select consume_submission_limit('test-bucket') as allowed")).rows[0].allowed,false);
  }finally{await db.close();}
});
