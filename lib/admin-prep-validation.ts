import {z} from 'zod';
import {allianceSchema,memberIdSchema,prepFormSchema} from './member-validation';

export const adminPrepLookupSchema=z.object({player_id:memberIdSchema,cycle:z.iso.date()}).strict();
export const adminPrepEntrySchema=z.object({
  player_id:memberIdSchema,
  player_name:z.string().trim().min(1,'Enter the player name.').max(80),
  alliance:allianceSchema.nullable(),
  payload:prepFormSchema,
  expected_revision:z.uuid().nullable(),
  expected_self_updated_at:z.iso.datetime({offset:true}).nullable(),
  expected_member_updated_at:z.iso.datetime({offset:true}).nullable(),
}).strict();
