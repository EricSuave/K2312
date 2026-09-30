import { NextResponse } from 'next/server';
import { sameOrigin, failure } from '@/lib/http';
import { sessionClient } from '@/lib/supabase/server';
export async function POST(request: Request) {
  try { sameOrigin(request); const client = await sessionClient(); const { error } = await client.auth.signOut(); if (error) throw error; return NextResponse.json({ success: true }); }
  catch (error) { return failure(error); }
}
