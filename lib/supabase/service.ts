import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'node:crypto';
import { submissionsConfigured } from '@/lib/config';
import { HttpError } from '@/lib/http';

export function serviceClient() {
  if (!submissionsConfigured()) throw new HttpError(503, 'Submissions are not available yet. Please check back soon.');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(10000) }) },
  });
}
export async function rateLimit(request: Request, kind: string) {
  const client = serviceClient();
  // Vercel overwrites x-forwarded-for. Outside Vercel, use a shared development bucket.
  const ip = process.env.VERCEL === '1' ? (request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown') : 'development';
  const subject = createHmac('sha256', process.env.RATE_LIMIT_SALT!).update(`${kind}:${ip}`).digest('hex');
  const { data, error } = await client.rpc('consume_submission_limit', { p_subject: subject });
  if (error) throw new HttpError(503, 'Submissions are temporarily unavailable. Please try again later.');
  if (data !== true) throw new HttpError(429, 'Too many submissions from this connection. Please wait 15 minutes and try again.');
  return client;
}
