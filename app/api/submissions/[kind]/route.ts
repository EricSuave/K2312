import { NextResponse } from 'next/server';
import { schemas, type SubmissionKind } from '@/lib/validation';
import { sameOrigin, readJson, failure, HttpError } from '@/lib/http';
import { rateLimit } from '@/lib/supabase/service';
import { kingdom } from '@/data/kingdom';
import {transferSettings} from '@/data/transfers';

export const runtime = 'nodejs';
const tables = { transfers: 'transfer_applications' };
export async function POST(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  try {
    sameOrigin(request);
    const { kind } = await params;
    if (!Object.hasOwn(schemas, kind)) throw new HttpError(404, 'Form not found.');
    if (kind === 'transfers' && !kingdom.transfersOpen) throw new HttpError(503, 'Transfer applications are not open yet. Please contact leadership in the game.');
    if(kind==='transfers')throw new HttpError(410,'Please use the five-step transfer application at /join.');
    if (kind === 'transfers' && transferSettings.formUrl) throw new HttpError(409, 'Transfer applications are collected through Google Forms. Open the Transfer page to apply.');
    const { website, consent, request_id, ...data } = schemas[kind as SubmissionKind].parse(await readJson(request));
    void website;
    const client = await rateLimit(request, kind);
    const { error } = await client.from(tables[kind as SubmissionKind]).insert({ ...data, id: request_id, consent, consent_at: new Date().toISOString() });
    // A retry with the same random submission ID cannot create a second record.
    if (error && error.code !== '23505') throw error;
    return NextResponse.json({ success: true, reference: request_id }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}
