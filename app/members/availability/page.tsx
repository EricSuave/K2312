import {PageHeader} from '@/components/ui';
import {AvailabilityForm} from '@/components/kvk-forms';
import {pageMetadata} from '@/lib/metadata';
export const metadata=pageMetadata('KvK battle availability','Tell Kingdom 2312 leadership when you can participate in KvK.');
export default function Availability(){return <><PageHeader number="02" title="BATTLE AVAILABILITY" intro="Your time. Our battle plan. All times in UTC."/><AvailabilityForm/></>}
