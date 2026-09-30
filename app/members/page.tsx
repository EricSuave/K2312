import Link from 'next/link';
import {PageHeader} from '@/components/ui';
import {pageMetadata} from '@/lib/metadata';
export const metadata=pageMetadata('Member forms','Your Kingdom 2312 player profile, KvK battle availability, and preparation forms.');
export default function Members(){return <><PageHeader number="09" title="MEMBER FORMS" intro="One kingdom. Every member ready."/><div className="wrap page-body"><div className="member-hub-intro"><div><p className="eyebrow">KINGDOM 2312 / GEN 2 · TG3</p><h2>Choose your next task.</h2><p>Keep your profile current and help leadership plan our next KvK.</p></div><span className="tag">Member portal</span></div><div className="member-form-cards">{[
  {number:'01',title:'Player Profile',text:'Your troop tiers, eligible heroes, Governor Gear, and charms. Select heroes with at least 4 stars and a level-5 skill.',href:'/members/profile',action:'Open player profile'},
  {number:'02',title:'KvK Battle Availability',text:'Choose your UTC time window within 10:00–22:00. Castle battle runs 12:00–17:00. Share your preferred role.',href:'/members/availability',action:'Set battle availability'},
  {number:'03',title:'KvK Prep',text:'Plan your TG1–TG3 upgrades, record Truegold and speedup days, and request a minister appointment.',href:'/members/prep',action:'Plan KvK preparation'},
].map(c=><Link className="member-form-card" key={c.href} href={c.href}><span className="eyebrow">{c.number} / MEMBER TASK</span><h2>{c.title}</h2><p>{c.text}</p><span className="text-link">{c.action} →</span></Link>)}</div><p className="field-help">Your saved profile and KvK forms are shared with kingdom leadership. Update your availability whenever your plans change.</p></div></>}
