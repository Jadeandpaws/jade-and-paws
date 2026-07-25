import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'jp_admin_session';
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days — mirrors lib/admin-auth.ts

// Verifies the signed session cookie using the Web Crypto API (available on
// the Edge runtime, unlike Node's `crypto` module). See lib/admin-auth.ts
// for why this logic is duplicated rather than imported.
async function isSessionValid(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const [issuedAt, signature] = value.split('.');
  if (!issuedAt || !signature) return false;
  if (Date.now() - Number(issuedAt) > MAX_AGE_MS) return false;

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(issuedAt));
  const expected = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');

  return expected === signature;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isAdminApi = pathname.startsWith('/api/admin') && pathname !== '/api/admin/login';

  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  const valid = await isSessionValid(request.cookies.get(COOKIE_NAME)?.value);
  if (valid) return NextResponse.next();

  if (isAdminApi) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
