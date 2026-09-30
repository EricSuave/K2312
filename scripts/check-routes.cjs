const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {JSDOM,VirtualConsole}=require('jsdom');
require('@next/env').loadEnvConfig(process.cwd(),false,{info(){},error(){}});
const port=4181,origin=`http://127.0.0.1:${port}`;
const trustedOrigin=new URL(process.env.NEXT_PUBLIC_SITE_URL||origin).origin;
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{stdio:['ignore','pipe','pipe']});
let diagnostics='';server.stderr.on('data',chunk=>diagnostics+=chunk.toString());
async function get(path){const response=await fetch(origin+path);return{path,status:response.status,html:await response.text()};}
(async()=>{
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Test server did not start: '+diagnostics)),15000);server.stdout.on('data',chunk=>{if(chunk.toString().includes('Ready')){clearTimeout(timer);resolve()}});server.on('exit',code=>{clearTimeout(timer);reject(new Error(`Test server exited: ${code} ${diagnostics}`))});});
  const paths=['/','/about','/members','/members/profile','/members/prep','/members/availability','/guides','/tools','/tools/gear','/tools/charms','/tools/construction','/timeline','/events','/gallery','/join','/admin','/account','/account/password','/privacy','/support'];
  const pages=await Promise.all(paths.map(get));const links=new Set();
  for(const page of pages){assert.equal(page.status,200,page.path);const dom=new JSDOM(page.html,{virtualConsole:new VirtualConsole()});const doc=dom.window.document;assert.ok(doc.title,page.path);assert.ok(doc.querySelector('meta[name=description]'),page.path);for(const anchor of doc.querySelectorAll('a[href]')){const href=anchor.getAttribute('href');if(href.startsWith('/')&&!href.startsWith('//'))links.add(new URL(href,origin).pathname)}dom.window.close();}
  const extras=await Promise.all([...links].filter(path=>!paths.includes(path)).map(get));for(const page of extras)assert.equal(page.status,200,page.path);
  for(const path of ['/tools/pets','/tools/event-shop'])assert.equal((await get(path)).status,404,path);
  for(const path of ['/api/member/profile','/api/admin/forms?kind=profile'])assert.ok([401,503].includes((await get(path)).status),path);
  const missingOrigin=await fetch(origin+'/api/member/profile',{method:'PUT',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(missingOrigin.status,403);
  const candidates=[trustedOrigin,origin,`http://localhost:${port}`,'http://localhost:3000'];let retiredStatus;for(const candidate of [...new Set(candidates)]){const retired=await fetch(origin+'/api/submissions/profiles',{method:'POST',headers:{'Content-Type':'application/json',Origin:candidate},body:'{}'});retiredStatus=retired.status;if(retiredStatus===404)break;}assert.equal(retiredStatus,404);
  process.stdout.write(`PASS: ${pages.length+extras.length} linked pages, metadata, retired tool routes, private API access, and origin validation.\n`);
})().catch(error=>{process.stderr.write(error.stack+'\n');process.exitCode=1}).finally(()=>server.kill('SIGTERM'));
