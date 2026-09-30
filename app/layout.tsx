import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import '@fontsource-variable/inter';
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import './globals.css';
import {Navigation} from '@/components/navigation';
import {Brand} from '@/components/ui';
import {UtcClock} from '@/components/clock';
import {communityNav} from '@/data/kingdom';
const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const metadata:Metadata={metadataBase:new URL(origin),title:{default:'Kingdom 2312 | Forged in KvK. Built to win.',template:'%s | Kingdom 2312'},description:'The unofficial Kingdom 2312 community hub. Six alliances, shared ambition. Find events, guides, member tools, and transfer information.',openGraph:{type:'website',siteName:'Kingdom 2312',title:'Kingdom 2312',description:'Never outnumbered, never outworked. The unofficial community hub for Kingdom 2312.'},twitter:{card:'summary',title:'Kingdom 2312',description:'Forged in KvK. Built to win.'},icons:{icon:'/favicon.svg'}};
export const viewport:Viewport={themeColor:'#0b0e13',width:'device-width',initialScale:1};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to content</a><Navigation/><main id="main-content" tabIndex={-1}>{children}</main><footer className="site-footer wrap"><div className="footer-top"><Brand small/><p>Six alliances. One kingdom.<br/>Never outnumbered, never outworked.</p><div><span className="muted-label">KINGDOM TIME</span><UtcClock/></div></div><nav className="footer-community" aria-label="Community links">{communityNav.map(([label,href])=><Link key={href} href={href}>{label}</Link>)}</nav><div className="footer-bottom"><span>© {new Date().getUTCFullYear()} Kingdom 2312 · Unofficial fan site.</span><span>Not affiliated with or endorsed by the game&apos;s developer.</span><Link href="/privacy">Privacy</Link></div></footer></body></html>}
