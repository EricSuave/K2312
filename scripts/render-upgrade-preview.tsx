import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import {build} from 'esbuild';
import {Showcase} from './upgrade-showcase';
async function main(){
 const bundled=await build({entryPoints:['scripts/upgrade-showcase-entry.tsx'],bundle:true,write:false,minify:true,platform:'browser',format:'iife',define:{'process.env.NODE_ENV':'"production"'},alias:{'next/link':path.resolve('scripts/preview-link.tsx')},plugins:[{name:'preview-icons',setup(b){b.onResolve({filter:/use-member-form$/},()=>({path:path.resolve('scripts/preview-member-form.ts')}));b.onResolve({filter:/^lucide-react$/},()=>({path:'icons',namespace:'preview'}));b.onLoad({filter:/.*/,namespace:'preview'},()=>({contents:'export const Search=()=>null,BookOpen=()=>null,Clock3=()=>null,Crown=()=>null,Shield=()=>null,Plus=()=>null,Trash2=()=>null,RotateCcw=()=>null,ArrowUpRight=()=>null,ArrowRight=()=>null,CalendarDays=()=>null,Compass=()=>null,Calculator=()=>null,UserRound=()=>null;',loader:'js'}))}}]});
 const css=postcss.parse(fs.readFileSync('app/globals.css','utf8'));
 css.walkAtRules(r=>{if(['theme','import'].includes(r.name))r.remove()});
 css.walkRules(r=>{r.selector=r.selectors.map(s=>[':root','html','body'].includes(s)?'#kingdom2312-upgrades':'#kingdom2312-upgrades '+s).join(',')});
 const asset='data:image/webp;base64,'+fs.readFileSync('public/art/fortress.webp').toString('base64');
 let shell=fs.readFileSync('scripts/upgrade-preview-shell.html','utf8');
 const markup=renderToStaticMarkup(<Showcase/>).replace(/<link[^>]+rel="preload"[^>]*>/g,'').replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/g,'');
 shell=shell.replace('<div id="kingdom2312-upgrades"></div>','<div id="kingdom2312-upgrades">'+markup+'</div>');
 const scopedCSS=css.toString().replaceAll("url('/art/fortress.webp')",'var(--preview-fortress)');
 const code=bundled.outputFiles[0].text.replaceAll(JSON.stringify('/art/fortress.webp'),'fortressData');
 const output='<style>'+scopedCSS+'</style>'+shell+'<script>(()=>{const fortressData='+JSON.stringify(asset)+';document.getElementById("kingdom2312-upgrades").style.setProperty("--preview-fortress","url("+fortressData+")");'+code.replaceAll('</script','<\\/script')+'})();</script>';
 if(Buffer.byteLength(output)>1e6)throw new Error('Preview too large: '+Buffer.byteLength(output));
 fs.writeFileSync(process.argv[2]||'/workspace/kingdom-2312-battle-timeline.html',output);console.log('Preview bytes:',Buffer.byteLength(output));
}
main();
