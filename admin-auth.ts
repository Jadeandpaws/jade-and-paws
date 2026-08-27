import { createHmac } from 'crypto';

// This file only runs in Node.js API routes (e.g. the login route). The
// matching verification logic in middleware.ts is intentionally a separate,
// self-contained implementation using the Web Crypto API, because Next.js
// middleware runs on the Edge runtime, which doesn't have Node's `crypto`
// module. Both implement the same HMAC-SHA256 scheme, so a cookie created
// here verifies correctly there.

export const ADMIN_COOKIE_NAME = 'jp_admin_session';
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

function requireSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not configured.');
  return secret;
}

// A session cookie is just "<timestamp>.<hmac of timestamp>". There's no
// user data to protect here (only one admin), so the timestamp alone is
// enough payload — the signature is what proves it wasn't forged, and the
// timestamp is what lets both sides independently expire it.
export function createSessionCookieValue(): string {
  const issuedAt = Date.now().toString();
  const signature = createHmac('sha256', requireSecret()).update(issuedAt).digest('hex');
  return `${issuedAt}.${signature}`;
}
