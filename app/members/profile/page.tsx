import {PageHeader} from '@/components/ui';
import {MemberProfile} from '@/components/member-profile';
import {pageMetadata} from '@/lib/metadata';
export const metadata=pageMetadata('Player profile','Kingdom 2312 member profile: troops, Generation 1–2 heroes, Governor Gear, and charms.');
export default function Profile(){return <><PageHeader number="09" title="PLAYER PROFILE" intro="Your strength. Your preparation. Your place in Kingdom 2312."/><div className="wrap page-body"><MemberProfile/></div></>}
