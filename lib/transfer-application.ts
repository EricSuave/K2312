import {z} from 'zod';
import {transferSchema} from './validation';
import {truegoldLevels,troopTiers} from '@/data/progression';
const count=z.number().int().min(0).max(1e9);
const answer=z.enum(['Yes','No','Sometimes']);
export const applicationDetailsSchema=z.object({
  intake_month:z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/,'Choose your preferred transfer month.'),
  troop_tier:z.enum(troopTiers),truegold_level:z.enum(truegoldLevels),
  truegold_available:count,mystic_trial_stages:count,
  transfer_passes_owned:count,transfer_passes_required:count.nullable(),
  active_events:answer,save_for_kvk:answer,battle_participation:answer,
  spending:z.enum(['Free to play','Occasional','Regular','High','Prefer not to say']),
}).strict();
export const transferApplicationSchema=transferSchema.extend({details:applicationDetailsSchema}).strict();
export const transferSteps=['Your identity','Transfer plans','Your progression','Your commitment','Evidence & review'] as const;
export const evidenceLimit=750000;
export function imageType(bytes:Uint8Array){
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'jpeg';
 if([137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))return 'png';
 if(String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'webp';
 return null;
}
