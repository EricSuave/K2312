import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { databaseConfigured } from '@/lib/config';
import { HttpError } from '@/lib/http';

export async function sessionClient() {
  if (!databaseConfigured()) throw new HttpError(503, 'Member sign-in is not available yet.');
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookieOptions: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(10000) }) },
    cookies: {
      getAll: () => jar.getAll(),
      setAll(values) {
        // Server Components cannot write cookies; proxy.ts refreshes their sessions.
        try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch {}
      },
    },
  });
}
export async function adminClient() {
  const client = await sessionClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new HttpError(401, 'Please sign in to continue.');
  const { data: isAdmin, error: roleError } = await client.rpc('is_admin');
  if (roleError || isAdmin !== true) throw new HttpError(403, 'This account does not have kingdom admin access.');
  return { client, user };
}
