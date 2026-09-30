import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { databaseConfigured } from '@/lib/config';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (databaseConfigured()) {
    const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      cookieOptions: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10000) }) },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    try { await client.auth.getClaims(); } catch { /* Protected pages and APIs deny access independently. */ }
  }
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  return response;
}
export const config = { matcher: ['/members/:path*','/account/:path*','/auth/:path*','/admin/:path*','/api/admin/:path*','/api/auth/:path*','/api/member/:path*','/api/member-auth/:path*'] };
