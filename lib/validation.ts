import { z } from 'zod';
const text = (max: number) => z.string().trim().min(1, 'This field is required.').max(max);
const alliance = z.enum(['404', '401', 'FXF', 'BLO', 'OMG', 'GLX']);
const player = {
  player_name: text(80),
  player_id: z.string().trim().regex(/^\d{3,20}$/, 'Use your numeric player ID.'),
  contact: text(160),
  consent: z.literal(true, { error: 'Please agree to share this information with kingdom leadership.' }),
  website: z.string().max(0).default(''),
  request_id: z.uuid(),
};
export const transferSchema = z.object({
  ...player, current_kingdom: z.number().int().min(1).max(999999),
  preferred_alliance: z.union([alliance,z.literal('No preference')]).default('No preference'),
  preferred_times: text(240), kvk_participation: text(1500), languages: text(160),
  notes: z.string().trim().max(2000).default(''),
});
export const schemas = { transfers: transferSchema };
export const eventSchema = z.object({
  id: z.uuid().optional(), title: text(120), kind: z.enum(['Bear Hunt', 'KvK', 'Alliance']),
  alliance: alliance.nullable(), starts_at: z.iso.datetime(), ends_at: z.iso.datetime(),
  description: text(3000), published: z.boolean(),
}).refine(d => d.ends_at > d.starts_at, { message: 'Event end must be after its start.', path: ['ends_at'] });
export const gallerySchema = z.object({
  title: text(120), caption: text(1000), category: text(60),
  taken_on: z.iso.date().nullable(), published: z.boolean(),
});
export const reviewSchema = z.object({
  id: z.uuid(), status: z.enum(['new', 'reviewing', 'approved', 'declined']),
  admin_notes: z.string().trim().max(4000),
});
export type SubmissionKind = keyof typeof schemas;

