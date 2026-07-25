# Jade & Paws

Production-ready Next.js website for Jade & Paws, a professional pet sitting business in Frederick, Maryland.

## Required environment variables

Copy `.env.example` to `.env.local` for local development. In Vercel, add the same values under **Settings → Environment Variables**:

- `RESEND_API_KEY` — a Resend API key with sending permission.
- `RESEND_FROM` — a verified Resend sender such as `Jade & Paws <hello@yourdomain.com>`.
- `NEXT_PUBLIC_SITE_URL` — your final public URL, including `https://`.
- `POSTGRES_URL` — added automatically once you connect a Postgres database (see below).
- `BLOB_READ_WRITE_TOKEN` — added automatically once you connect a Blob store (see below).
- `ADMIN_PASSWORD` — the password used to sign in at `/admin/login`.
- `ADMIN_SESSION_SECRET` — a random string used to sign the admin session cookie. Generate one with `openssl rand -hex 32`.

The booking form and the review system both call server-only Next.js routes, which send mail through Resend. No secret is ever sent to the browser.

## Review system setup (Vercel Postgres + Blob)

The review system needs two pieces of Vercel Storage. Both have a free Hobby tier and both are configured the same way — connect them in the dashboard, then redeploy.

1. In your Vercel project, go to **Storage → Create Database → Postgres** (powered by Neon). Choose the free plan and connect it to this project. Vercel automatically adds `POSTGRES_URL` (and a few related variables) to your project's environment variables.
2. Back in **Storage**, choose **Create Database → Blob**. Connect it to this project the same way. Vercel automatically adds `BLOB_READ_WRITE_TOKEN`.
3. Under **Settings → Environment Variables**, add `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` (Production, Preview, and Development).
4. Redeploy so the new variables take effect.

No manual SQL is required — the two tables the review system needs (`reviews` and `review_tokens`) are created automatically, the first time either is queried, using `CREATE TABLE IF NOT EXISTS`. You can view or query them any time from **Storage → your Postgres database → Query**.

### How it works day to day

- Sign in at `/admin/reviews` (redirects to `/admin/login` if you're not signed in).
- Use **Create Client Review Link** to generate a one-time link for a specific client, then tap **Copy Link** and send it to them however you like (text, email, etc.). Links expire automatically after 60 days if unused, and can only ever be submitted once.
- When a client submits a review, you get an email with the details and a direct link to it in the dashboard. It's saved as **Pending** and isn't shown on the site yet.
- From the dashboard you can **Approve**, **Edit**, **Feature/Unfeature**, or **Delete** any review, and search or filter both the reviews list and the links list.
- Approved reviews appear on the homepage automatically — featured ones first, then newest first. The average rating, pets-cared-for count, and review count on the homepage are all calculated live from approved reviews.

## Deploy to Vercel

1. Create an empty GitHub repository called `jade-and-paws` (do not add a README or `.gitignore`).
2. In this project folder, run `git init`, `git add .`, `git commit -m "Prepare Jade & Paws for launch"`, then add your GitHub repository as `origin` and push your `main` branch.
   - If you're updating an existing repository instead, just commit and push your changes: `git add .`, `git commit -m "Add verified client review system"`, `git push`.
3. Go to [Vercel](https://vercel.com/new), sign in with GitHub, select `jade-and-paws`, and choose **Import**. Vercel detects Next.js automatically.
   - If this repo is already connected to Vercel, pushing to `main` triggers a new deployment automatically — you can skip to step 4.
4. Add all environment variables listed above before deploying (or add them now if this is a redeploy). In Resend, verify your sending domain before using it in `RESEND_FROM`; the onboarding sender is only for limited testing.
5. Connect Postgres and Blob storage as described in **Review system setup** above.
6. Click **Deploy** (or trigger a redeploy if variables were added after the fact). Copy the generated `*.vercel.app` URL and set it as `NEXT_PUBLIC_SITE_URL`, then redeploy once more so canonical URLs, sitemap, robots, structured data, and review links all use the live address.
7. Optionally add a custom domain in **Vercel → Settings → Domains**, then update `NEXT_PUBLIC_SITE_URL` to that domain and redeploy.

## Local checks

```bash
pnpm install
pnpm typecheck
pnpm build
```

`sharp` (used to resize and optimize uploaded pet photos) requires a native build step. If pnpm prompts you to approve it, run `pnpm approve-builds` and allow `sharp`.

