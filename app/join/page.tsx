import {PageHeader} from '@/components/ui';
import {TransferForm} from '@/components/transfer-form';
import {kingdom} from '@/data/kingdom';
import {submissionsConfigured} from '@/lib/config';
import {pageMetadata} from '@/lib/metadata';
export const dynamic='force-dynamic';
export const metadata=pageMetadata('Transfer to Kingdom 2312','Apply directly to Kingdom 2312. Share your event availability, KvK participation, and contact details with kingdom leadership.');
export default function Join(){return <>
  <PageHeader number="08" title="JOIN KINGDOM 2312." intro="Forged in KvK. Built to win. Tell us about yourself and find your place in our kingdom."/>
  <div className="wrap page-body">
    <section className="prose transfer-requirements" aria-labelledby="requirements">
      <p className="eyebrow">01 / BEFORE YOU APPLY</p><h2 id="requirements">Built on teamwork.</h2>
      <ul><li>Be ready to contribute to KvK preparation and battles.</li><li>Respect kingdom rules, leadership coordination, and players from every alliance.</li><li>Share your available event times in UTC and a way for leadership to contact you.</li><li>Confirm current in-game transfer eligibility with leadership. Applying does not guarantee a transfer slot.</li></ul>
      <p>No website account or Google sign-in is needed. Applications go directly to Kingdom 2312 leadership for review.</p>
    </section>
    <p className="eyebrow">02 / YOUR APPLICATION</p>
    <TransferForm enabled={submissionsConfigured()&&kingdom.transfersOpen}/>
  </div>
</>;}
