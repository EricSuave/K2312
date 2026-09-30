import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const allowed = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url).origin;
  if (!origin || origin !== allowed) throw new HttpError(403, 'Refresh this page and try again.');
}
export async function readJson(request: Request) {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new HttpError(415, 'Expected a JSON request.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'No form data was received.');
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 32768) { await reader.cancel(); throw new HttpError(413, 'Your entry is too long.'); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new HttpError(400, 'The form could not be read.'); }
}
export function failure(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message || 'Check your entries.', fields: error.flatten().fieldErrors }, { status: 400 });
  if (error instanceof HttpError) return NextResponse.json({ error: error.message }, { status: error.status });
  // Do not log contact details, form bodies, cookies, or credentials.
  console.error('Kingdom hub request failed:', error instanceof Error ? error.name : 'ServiceError');
  return NextResponse.json({ error: 'The service is unavailable. Your information has not been saved. Please try again later.' }, { status: 503 });
}
