# Deploy to Vercel (fastest path)

You cannot deploy “for you” from chat without **your** Vercel login or a **VERCEL_TOKEN**. Pick **A** (easiest) or **B** (CLI).

## A) Dashboard deploy (recommended)

1. Push this folder to a **GitHub** repo (private is fine).
2. Open [https://vercel.com/new](https://vercel.com/new) and sign in.
3. **Import** your GitHub repository.
4. Vercel should auto-detect **Next.js**. Root directory: **`ai-enthusiasts-qazi-family`** if the repo contains other folders; otherwise leave default **`.`**.
5. In **Environment Variables**, add **every** variable from `.env.example` (same names as local `.env.local`):

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (**secret**)
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET` (**secret**)
   - `GEMINI_API_KEY` (**secret**)
   - `ADMIN_PASSWORD` (**secret**)
   - `ADMIN_JWT_SECRET` (**secret**)
   - Optional: `GEMINI_MODEL` (defaults to `gemini-2.0-flash`)

6. Click **Deploy**. When it finishes, open the **`.vercel.app`** URL.

After deploy: run `supabase/schema.sql` in Supabase (if you have not already), then sign in at `/admin/login`.

## B) CLI deploy (from your PC)

In PowerShell, from the **`ai-enthusiasts-qazi-family`** folder:

```powershell
npm install
npm run build
npx vercel@latest login
npx vercel@latest link --yes
npx vercel@latest deploy --prod --yes
```

Non-interactive / CI: create a token at [https://vercel.com/account/tokens](https://vercel.com/account/tokens), then:

```powershell
$env:VERCEL_TOKEN = "YOUR_TOKEN_HERE"
npx vercel@latest deploy --prod --yes
```

## After first deploy

1. **Supabase**: confirm `supabase/schema.sql` was applied.
2. **Smoke test**: homepage loads, `/admin/login` works, upload a small image first (large uploads can hit platform body limits).

## If builds fail on Vercel

- Open the failed deployment log in Vercel and read the first **red** error.
- Common fixes: wrong **root directory**, missing env var, or Node version (Vercel defaults are usually fine for Next 15).
