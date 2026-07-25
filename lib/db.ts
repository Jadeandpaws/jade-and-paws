import { sql } from '@vercel/postgres';

// Creates the tables the review system needs the first time they're
// touched. Every statement is idempotent (IF NOT EXISTS), so this is safe
// to run on every cold start — no manual migration step for Vercel Postgres.
let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS review_tokens (
          id SERIAL PRIMARY KEY,
          token TEXT UNIQUE NOT NULL,
          label TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          expires_at TIMESTAMPTZ NOT NULL,
          used_at TIMESTAMPTZ
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS reviews (
          id SERIAL PRIMARY KEY,
          token_id INTEGER REFERENCES review_tokens(id),
          first_name TEXT NOT NULL,
          pet_name TEXT,
          service TEXT NOT NULL,
          rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
          body TEXT NOT NULL,
          photo_url TEXT,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
          featured BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          approved_at TIMESTAMPTZ
        );
      `;
    })();
  }
  return schemaReady;
}

// Wrap every query function with this so the schema is guaranteed to exist
// before the query runs, without repeating the CREATE TABLE calls everywhere.
export async function withSchema<T>(run: () => Promise<T>): Promise<T> {
  await ensureSchema();
  return run();
}

export { sql };
