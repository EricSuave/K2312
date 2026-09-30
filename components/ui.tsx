import Link from 'next/link';
import { Crown, Shield } from 'lucide-react';
import type { ReactNode } from 'react';
import {TransferLink, TransferNote} from './transfer-link';
export function Brand({ small = false }: { small?: boolean }) { return <Link href="/" className={`brand ${small ? 'small' : ''}`} aria-label="Kingdom 2312 home"><span className="brand-mark"><Crown size={23} strokeWidth={1.4}/></span><span><strong>KINGDOM <b>2312</b></strong><small>FORGED IN KVK</small></span></Link>; }
export function Eyebrow({ number, children }: { number?: string; children: ReactNode }) { return <div className="eyebrow">{number && <span>{number}</span>}{children}</div>; }
export function PageHeader({ number, title, intro }: { number: string; title: string; intro: string }) { return <header className="page-header wrap"><Eyebrow number={number}>KINGDOM 2312</Eyebrow><h1>{title}</h1><p className="lede">{intro}</p></header>; }
export function SectionHeading({ number, title, text, action }: { number: string; title: string; text?: string; action?: ReactNode }) { return <div className="section-heading"><div><Eyebrow number={number}>THE KINGDOM HUB</Eyebrow><h2>{title}</h2>{text && <p>{text}</p>}</div>{action}</div>; }
export function TransferBanner() { return <section className="transfer-banner"><div className="banner-icon"><Shield size={46} strokeWidth={1}/></div><div><Eyebrow>YOUR NEXT CHAPTER</Eyebrow><h2>Find your people. Build your legacy.</h2><p>Looking for your next kingdom? Get to know 2312.</p><TransferNote/></div><TransferLink className="button">Apply for a transfer</TransferLink></section>; }
export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' | 'success' }) { return <div className={`notice ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>; }
