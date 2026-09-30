import Link from 'next/link';
import {PageHeader} from '@/components/ui';
import {TransferForm} from '@/components/transfer-form';
import {TransferLink, TransferNote} from '@/components/transfer-link';
import {kingdom} from '@/data/kingdom';
import {getExternalTransferUrl} from '@/data/transfers';
import {submissionsConfigured} from '@/lib/config';
import {pageMetadata} from '@/lib/metadata';

export const metadata = pageMetadata('Transfer to Kingdom 2312', 'Start your transfer application, check alliance schedules, and prepare to join Kingdom 2312.');

export default function Join() {
  const externalForm = getExternalTransferUrl();
  return <>
    <PageHeader number="08" title="YOUR NEXT KINGDOM." intro="Six alliances. One kingdom. Start your transfer journey to 2312."/>
    <div className="wrap page-body">
      {externalForm && <section className="card transfer-application-card" aria-labelledby="transfer-application-title">
        <p className="eyebrow">01 / TRANSFER APPLICATION</p>
        <h2 id="transfer-application-title">Your next chapter starts here.</h2>
        <p>Complete your application using the linked Google Form. You do not need a Kingdom 2312 website account to open it.</p>
        <div className="button-row">
          <TransferLink className="button">Open transfer application</TransferLink>
          <Link href="/#alliance-schedules" className="button secondary">Check alliance schedules</Link>
        </div>
        <TransferNote/>
        <p className="transfer-privacy-note">Your answers are submitted to the form owner through Google Forms. <Link href="/privacy" className="text-link">Privacy notice</Link></p>
      </section>}
      <section className="prose transfer-requirements" aria-labelledby="transfer-requirements-title">
        <h2 id="transfer-requirements-title">Before you apply</h2>
        <ul>
          <li>Check our alliance Bear Trap times and choose the schedule that fits you.</li>
          <li>Share your KvK preparation and battle availability honestly.</li>
          <li>Use contact details where leadership can reach you.</li>
          <li>Confirm current in-game transfer eligibility and alliance requirements with an R5. An application does not guarantee a transfer slot.</li>
        </ul>
      </section>
      {!externalForm && <TransferForm enabled={submissionsConfigured() && kingdom.transfersOpen}/>}
    </div>
  </>;
}
