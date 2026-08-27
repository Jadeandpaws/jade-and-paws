import { randomBytes } from 'crypto';
import { sql, withSchema } from './db';

const TOKEN_LIFETIME_MS = 1000 * 60 * 60 * 24 * 60; // 60 days

export type ReviewStatus = 'pending' | 'approved';

export type AdminReview = {
  id: number;
  firstName: string;
  petName: string | null;
  service: string;
  rating: number;
  body: string;
  photoUrl: string | null;
  status: ReviewStatus;
  featured: boolean;
  createdAt: string;
  approvedAt: string | null;
};

export type TokenStatus = 'unused' | 'used' | 'expired';

export type AdminToken = {
  id: number;
  token: string;
  label: string | null;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  status: TokenStatus;
};

export type PublicReview = {
  id: number;
  firstName: string;
  petName: string | null;
  service: string;
  rating: number;
  body: string;
  photoUrl: string | null;
  createdAt: string;
};

export type ReviewStats = {
  average: number;
  total: number;
  pets: number;
};

/* -------------------------------------------------------------------- */
/* Row -> JS mapping                                                     */
/* -------------------------------------------------------------------- */

// Postgres rows come back snake_case; the app works in camelCase.
function mapReviewRow(row: Record<string, unknown>): AdminReview {
  return {
    id: row.id as number,
    firstName: row.first_name as string,
    petName: (row.pet_name as string | null) ?? null,
    service: row.service as string,
    rating: row.rating as number,
    body: row.body as string,
    photoUrl: (row.photo_url as string | null) ?? null,
    status: row.status as ReviewStatus,
    featured: row.featured as boolean,
    createdAt: (row.created_at as Date).toISOString(),
    approvedAt: row.approved_at ? (row.approved_at as Date).toISOString() : null,
  };
}

function tokenStatusOf(row: { used_at: Date | null; expires_at: Date }): TokenStatus {
  if (row.used_at) return 'used';
  if (new Date(row.expires_at).getTime() < Date.now()) return 'expired';
  return 'unused';
}

function mapTokenRow(row: Record<string, unknown>): AdminToken {
  const usedAt = (row.used_at as Date | null) ?? null;
  const expiresAt = row.expires_at as Date;
  return {
    id: row.id as number,
    token: row.token as string,
    label: (row.label as string | null) ?? null,
    createdAt: (row.created_at as Date).toISOString(),
    expiresAt: expiresAt.toISOString(),
    usedAt: usedAt ? usedAt.toISOString() : null,
    status: tokenStatusOf({ used_at: usedAt, expires_at: expiresAt }),
  };
}

/* -------------------------------------------------------------------- */
/* Token lifecycle                                                       */
/* -------------------------------------------------------------------- */

// Mints a one-time link for a specific client. Called from the admin
// dashboard's "Create Client Review Link" action.
export async function generateToken(label: string | null) {
  return withSchema(async () => {
    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_MS);
    await sql`
      INSERT INTO review_tokens (token, label, expires_at)
      VALUES (${token}, ${label}, ${expiresAt.toISOString()})
    `;
    return { token, expiresAt: expiresAt.toISOString() };
  });
}

// Read-only check used when the /review/[token] page first loads, so we can
// show "this link is no longer valid" before the client fills out a form.
export async function getTokenStatus(token: string): Promise<TokenStatus | 'not_found'> {
  return withSchema(async () => {
    const { rows } = await sql`
      SELECT used_at, expires_at FROM review_tokens WHERE token = ${token} LIMIT 1
    `;
    if (rows.length === 0) return 'not_found';
    return tokenStatusOf({ used_at: rows[0].used_at, expires_at: rows[0].expires_at });
  });
}

// Atomically claims a token: only succeeds once, for the first request that
// gets here. The WHERE clause makes this a single round-trip compare-and-set,
// which is what prevents two near-simultaneous submissions (or a page
// refresh) from both going through on the same link.
export async function claimToken(token: string): Promise<number | null> {
  return withSchema(async () => {
    const { rows } = await sql`
      UPDATE review_tokens
      SET used_at = now()
      WHERE token = ${token} AND used_at IS NULL AND expires_at > now()
      RETURNING id
    `;
    return rows.length ? (rows[0].id as number) : null;
  });
}

// If something fails after a token was claimed (e.g. the email send throws),
// release it so the client's link still works and they aren't punished for
// a server-side error.
export async function releaseToken(tokenId: number): Promise<void> {
  await withSchema(async () => {
    await sql`UPDATE review_tokens SET used_at = NULL WHERE id = ${tokenId}`;
  });
}

export async function listAllTokens(): Promise<AdminToken[]> {
  return withSchema(async () => {
    const { rows } = await sql`SELECT * FROM review_tokens ORDER BY created_at DESC`;
    return rows.map(mapTokenRow);
  });
}

/* -------------------------------------------------------------------- */
/* Review CRUD                                                           */
/* -------------------------------------------------------------------- */

export type NewReview = {
  tokenId: number;
  firstName: string;
  petName: string | null;
  service: string;
  rating: number;
  body: string;
  photoUrl: string | null;
};

export async function createReview(input: NewReview): Promise<AdminReview> {
  return withSchema(async () => {
    const { rows } = await sql`
      INSERT INTO reviews (token_id, first_name, pet_name, service, rating, body, photo_url, status)
      VALUES (${input.tokenId}, ${input.firstName}, ${input.petName}, ${input.service}, ${input.rating}, ${input.body}, ${input.photoUrl}, 'pending')
      RETURNING *
    `;
    return mapReviewRow(rows[0]);
  });
}

// Admin list, ordered so anything needing action surfaces first, then
// featured reviews, then everything else newest-first.
export async function listAllReviewsForAdmin(): Promise<AdminReview[]> {
  return withSchema(async () => {
    const { rows } = await sql`
      SELECT * FROM reviews
      ORDER BY (status = 'pending') DESC, featured DESC, created_at DESC
    `;
    return rows.map(mapReviewRow);
  });
}

export async function approveReview(id: number): Promise<AdminReview | null> {
  return withSchema(async () => {
    const { rows } = await sql`
      UPDATE reviews SET status = 'approved', approved_at = now()
      WHERE id = ${id} AND status = 'pending'
      RETURNING *
    `;
    return rows.length ? mapReviewRow(rows[0]) : null;
  });
}

export async function setFeatured(id: number, featured: boolean): Promise<AdminReview | null> {
  return withSchema(async () => {
    const { rows } = await sql`
      UPDATE reviews SET featured = ${featured}
      WHERE id = ${id} AND status = 'approved'
      RETURNING *
    `;
    return rows.length ? mapReviewRow(rows[0]) : null;
  });
}

export type ReviewEdit = {
  firstName: string;
  petName: string | null;
  service: string;
  rating: number;
  body: string;
};

export async function editReview(id: number, edit: ReviewEdit): Promise<AdminReview | null> {
  return withSchema(async () => {
    const { rows } = await sql`
      UPDATE reviews
      SET first_name = ${edit.firstName}, pet_name = ${edit.petName}, service = ${edit.service}, rating = ${edit.rating}, body = ${edit.body}
      WHERE id = ${id}
      RETURNING *
    `;
    return rows.length ? mapReviewRow(rows[0]) : null;
  });
}

// Returns the deleted row (so the caller can best-effort clean up its
// photo in Blob storage) or null if it didn't exist.
export async function deleteReview(id: number): Promise<AdminReview | null> {
  return withSchema(async () => {
    const { rows } = await sql`DELETE FROM reviews WHERE id = ${id} RETURNING *`;
    return rows.length ? mapReviewRow(rows[0]) : null;
  });
}

/* -------------------------------------------------------------------- */
/* Public homepage data                                                  */
/* -------------------------------------------------------------------- */

export async function getPublicReviews(): Promise<{ reviews: PublicReview[]; stats: ReviewStats }> {
  return withSchema(async () => {
    const { rows } = await sql`
      SELECT * FROM reviews
      WHERE status = 'approved'
      ORDER BY featured DESC, created_at DESC
    `;

    const reviews: PublicReview[] = rows.map((row) => ({
      id: row.id as number,
      firstName: row.first_name as string,
      petName: (row.pet_name as string | null) ?? null,
      service: row.service as string,
      rating: row.rating as number,
      body: row.body as string,
      photoUrl: (row.photo_url as string | null) ?? null,
      createdAt: (row.created_at as Date).toISOString(),
    }));

    const total = reviews.length;
    const average = total ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    const pets = new Set(reviews.map((r) => r.petName).filter((name): name is string => Boolean(name))).size;

    return { reviews, stats: { average: Math.round(average * 10) / 10, total, pets } };
  });
}
