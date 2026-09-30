'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Menu, X, Heart } from 'lucide-react';
import { nav } from '@/data/kingdom';
import { Brand } from './ui';
import { TransferLink } from './transfer-link';
export function Navigation() {
  const pathname = usePathname(); const [open,setOpen] = useState(false); const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => { const close = (e: KeyboardEvent) => { if(e.key === 'Escape' && open) {setOpen(false);toggle.current?.focus();} }; window.addEventListener('keydown',close); return () => window.removeEventListener('keydown',close); },[open]);
  const activeHref=[...nav].filter(([,href])=>pathname===href||(href!=='/'&&pathname.startsWith(href+'/'))).sort((a,b)=>b[1].length-a[1].length)[0]?.[1];
  const support = process.env.NEXT_PUBLIC_SUPPORT_URL;
  const validSupport = support && /^https:\/\//.test(support);
  return <header className="site-header"><div className="nav-wrap"><Brand/><button className="menu-toggle" ref={toggle} aria-controls="main-navigation" aria-expanded={open} onClick={()=>setOpen(!open)} aria-label={open?'Close menu':'Open menu'}>{open?<X/>:<Menu/>}</button><nav id="main-navigation" aria-label="Main navigation" className={open?'open':''}>{nav.map(([label,href])=>href==='/join'?<TransferLink key={href} onClick={()=>setOpen(false)}>{label}</TransferLink>:<Link key={href} href={href} aria-current={activeHref===href ? 'page':undefined} onClick={()=>setOpen(false)}>{label}</Link>)}<a className="support-link" href={validSupport?support:'/support'} {...(validSupport?{target:'_blank',rel:'noopener noreferrer'}:{})} onClick={()=>setOpen(false)}><Heart size={14}/>Support</a></nav></div></header>;
}
