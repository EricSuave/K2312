import Link from 'next/link';
import type {MouseEventHandler, ReactNode} from 'react';
import {getExternalTransferUrl} from '@/data/transfers';

type Props = {
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function TransferLink({children, className, onClick}: Props) {
  const externalUrl = getExternalTransferUrl();
  if (!externalUrl) return <Link href="/join" className={className} onClick={onClick}>{children}</Link>;
  return <a href={externalUrl} className={className} onClick={onClick} target="_blank" rel="noopener noreferrer" title="Google Forms · opens in a new tab · Google sign-in may be required">
    {children}<span className="transfer-link-arrow" aria-hidden="true"> ↗</span>
    <span className="sr-only"> (Google Forms, opens in a new tab; Google sign-in may be required)</span>
  </a>;
}

export function TransferNote() {
  return getExternalTransferUrl() ? <p className="small-note transfer-external-note">Opens Google Forms in a new tab. Google sign-in may be required.</p> : null;
}
