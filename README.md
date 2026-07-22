# Jade & Paws

Production-ready Next.js website for Jade & Paws, a professional pet sitting business in Frederick, Maryland.

## Required environment variables

Copy `.env.example` to `.env.local` for local development. In Vercel, add the same values under **Settings → Environment Variables**:

- `RESEND_API_KEY` — a Resend API key with sending permission.
- `RESEND_FROM` — a verified Resend sender such as `Jade & Paws <hello@yourdomain.com>`.
- `NEXT_PUBLIC_SITE_URL` — your final public URL, including `https://`.

The booking form securely calls a server-only Next.js route, which sends the owner notification and customer confirmation through Resend. No secret is sent to the browser.

## Deploy to Vercel

1. Create an empty GitHub repository called `jade-and-paws` (do not add a README or `.gitignore`).
2. In this project folder, run `git init`, `git add .`, `git commit -m "Prepare Jade & Paws for launch"`, then add your GitHub repository as `origin` and push your `main` branch.
3. Go to [Vercel](https://vercel.com/new), sign in with GitHub, select `jade-and-paws`, and choose **Import**. Vercel detects Next.js automatically.
4. Add the three environment variables above before deploying. In Resend, verify your sending domain before using it in `RESEND_FROM`; the onboarding sender is only for limited testing.
5. Click **Deploy**. Copy the generated `*.vercel.app` URL and set it as `NEXT_PUBLIC_SITE_URL`, then redeploy once so canonical URLs, sitemap, robots, and structured data use the live address.
6. Optionally add a custom domain in **Vercel → Settings → Domains**, then update `NEXT_PUBLIC_SITE_URL` to that domain and redeploy.

## Local checks

```bash
pnpm install
pnpm typecheck
pnpm build
```
