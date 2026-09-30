import {z} from 'zod';
import {allowedHeroNames} from '@/data/heroes';
import {gearOptions,gearSlots,charmOptions} from '@/data/equipment';
import {truegoldLevels,troopTiers} from '@/data/progression';
import {battleRoles} from '@/data/battle';
import {prepTimeSlots} from '@/data/prep';
import {battleWindowError} from './battle-availability';

export const allianceSchema=z.enum(['404','401','FXF','BLO','OMG','GLX']);
export const memberIdSchema=z.string().trim().regex(/^\d{3,20}$/,'Enter your numeric member ID.');
const nameSchema=z.string().trim().min(1,'Enter your player name.').max(80);
const amount=z.number().finite().min(0).max(1e12);
const slots=gearSlots.map(slot=>slot.id);
const gear=z.record(z.string(),z.enum(gearOptions.map(option=>option.value)).or(z.literal(''))).refine(value=>Object.keys(value).length===slots.length&&slots.every(slot=>slot in value),'Select a value for each gear slot.');
const charms=z.record(z.string(),z.array(z.enum(charmOptions.map(option=>option.value)).or(z.literal(''))).length(3)).refine(value=>Object.keys(value).length===slots.length&&slots.every(slot=>slot in value),'Include the three charms for each gear slot.');
const troop=z.object({tier:z.enum(troopTiers).or(z.literal('')),tg:z.enum(truegoldLevels).or(z.literal(''))}).strict();
export const memberProfileSchema=z.object({
  player_name:nameSchema,alliance:allianceSchema,
  troops:z.object({Infantry:troop,Cavalry:troop,Archer:troop}).strict(),
  heroes:z.array(z.enum(allowedHeroNames)).max(allowedHeroNames.length).refine(names=>new Set(names).size===names.length,'Choose each hero once.'),
  gear,charms,hero_power:amount.int(),pet_power:amount.int(),mystic_trial_score:amount.int(),
}).strict();

export const battleFormSchema=z.object({
  event_date:z.iso.date(),attendance:z.enum(['available','tentative','unavailable']),
  starts_at:z.iso.datetime().optional(),ends_at:z.iso.datetime().optional(),
  role:z.enum(battleRoles).optional(),notes:z.string().trim().max(1500).default(''),
}).strict().superRefine((data,ctx)=>{
  const error=battleWindowError(data);
  if(error)ctx.addIssue({code:'custom',message:error,path:['ends_at']});
  if(data.attendance!=='unavailable'&&!data.role)ctx.addIssue({code:'custom',message:'Choose your preferred role.',path:['role']});
});
const times=z.array(z.enum(prepTimeSlots)).max(48).refine(values=>new Set(values).size===values.length,'Choose each time once.');
const days=z.number().finite().min(0).max(1e6);
export const prepFormSchema=z.object({
  battle_date:z.iso.date(),construction_targets:z.array(z.enum(['TG1','TG2','TG3'])).max(3),
  truegold:amount.int(),construction_speedup_days:days,research_speedup_days:days,training_speedup_days:days,
  day_1_minister:z.enum(['yes','no']),day_2_minister:z.enum(['yes','no']),day_4_minister:z.enum(['yes','no']),
  day_1_times:times,day_2_times:times,day_4_times:times,day_5_times:times,
}).strict().superRefine((data,ctx)=>{
  for(const day of [1,2,4] as const)if(data[`day_${day}_minister`]==='yes'&&!data[`day_${day}_times`].length)ctx.addIssue({code:'custom',path:[`day_${day}_times`],message:`Select at least one available time for Day ${day}.`});
});
export const memberFormSchemas={profile:memberProfileSchema,availability:battleFormSchema,prep:prepFormSchema};
export type MemberFormKind=keyof typeof memberFormSchemas;
export type MemberProfile=z.infer<typeof memberProfileSchema>;
export type BattleForm=z.infer<typeof battleFormSchema>;
export type PrepFormValues=z.infer<typeof prepFormSchema>;

const password=z.string().min(12,'Use at least 12 characters for your website password.').max(128);
export const signInSchema=z.object({player_id:memberIdSchema,password:z.string().min(1).max(128)}).strict();
export const signUpSchema=z.object({player_id:memberIdSchema,player_name:nameSchema,alliance:allianceSchema,password,consent:z.literal(true,{error:'Agree to the privacy notice to create an account.'})}).strict();
export const adminResetSchema=z.object({player_id:memberIdSchema,password,verified:z.literal(true,{error:'Verify this member in-game before resetting access.'})}).strict();
export const newPasswordSchema=z.object({password}).strict();
