import React,{useState} from 'react';
import {InventoryPlanner} from '../components/inventory-planner';
import {GuideBrowser} from '../components/guide-browser';
import {MemberProfile} from '../components/member-profile';
import {PageHeader} from '../components/ui';
import {guides} from '../data/guides';
import {planners} from '../data/tools';
import Home from '../app/page';
import Members from '../app/members/page';
import {PrepForm} from '../components/prep-form';
import {AvailabilityForm} from '../components/kvk-forms';
import {KingdomTimeline} from '../components/kingdom-timeline';
import {nav} from '../data/kingdom';

export function Showcase(){const[view,setView]=useState('/members/availability');const[menu,setMenu]=useState(false);const planner=planners.find(p=>view===`/tools/${p.slug}`);const guide=guides.find(g=>view===`/guides/${g.slug}`);
 function navigate(path:string){setView(path);setMenu(false);document.getElementById('kingdom2312-upgrades')?.scrollIntoView({block:'start'});}
 return <div onClickCapture={e=>{const a=(e.target as HTMLElement).closest('a');const path=a?.getAttribute('href');if(path?.startsWith('/')){e.preventDefault();navigate(path)}}}>
 <header className="showcase-header"><a className="brand" href="/"><span><strong>KINGDOM <b>2312</b></strong></span></a><button className="showcase-menu" type="button" aria-expanded={menu} onClick={()=>setMenu(!menu)}>Menu</button><nav className={menu?'open':''} aria-label="Preview navigation">{nav.map(([label,href])=><a href={href} key={href} aria-current={view===href?'page':undefined}>{label}</a>)}</nav></header>
 <main>{view==='/'?<Home/>:view==='/timeline'?<KingdomTimeline/>:view==='/members'?<Members/>:view==='/members/prep'?<PrepForm/>:view==='/members/availability'?<><PageHeader number="02" title="BATTLE AVAILABILITY" intro="Your time. Our battle plan. All times in UTC."/><AvailabilityForm/></>:view==='/members/profile'?<><PageHeader number="09" title="PLAYER PROFILE" intro="Your strength. Your preparation. Your place in Kingdom 2312."/><div className="wrap page-body"><MemberProfile/></div></>:view==='/guides'?<><PageHeader number="03" title="GAME GUIDES" intro="Researched game references and kingdom guidance, together."/><div className="wrap page-body"><GuideBrowser/></div></>:guide?<><PageHeader number="03" title={guide.title} intro={guide.summary}/><article className="wrap page-body"><div className="prose">{guide.sections.map(s=><section key={s.heading}><h2>{s.heading}</h2><p>{s.text}</p></section>)}{guide.toolHref&&<a className="button" href={guide.toolHref}>Open upgrade planner →</a>}{guide.sources&&<section className="guide-references"><h2>Reference guides</h2><ul>{guide.sources.map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a></li>)}</ul></section>}<a className="text-link form-back" href="/guides">← All guides</a></div></article></>:planner?<><PageHeader number="07" title={planner.title} intro={planner.description}/><div className="wrap page-body"><a href="/tools" className="text-link form-back">← All upgrade tools</a><InventoryPlanner key={planner.type} kind={planner.type}/></div></>:<><PageHeader number="07" title="UPGRADE TOOLS" intro="Your current level. Your inventory. See how far you can go."/><div className="wrap page-body"><div className="three-grid">{planners.map((p,i)=><a href={`/tools/${p.slug}`} className="tool-card card" key={p.slug}><p className="eyebrow">0{i+1} / PLANNER</p><h2>{p.short}</h2><p>{p.description}</p><span className="text-link">Open planner →</span></a>)}</div></div></>}</main>
 <footer className="site-footer wrap"><p>Kingdom 2312 · Unofficial fan site.</p><div className="footer-bottom">Not affiliated with or endorsed by the game&apos;s developer.</div></footer>
 </div>
}
