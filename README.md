# AI Enthusiasts – Qazi Family

Private family website for an AI image competition: daily prompts, Cloudinary storage, Supabase records, Gemini judging, and a cinematic public homepage with an admin control room.

## What you get

- **Next.js (App Router) + Tailwind** responsive UI (dark, glassy, neon accents)
- **Supabase Postgres** for cousins, challenges, submissions, hall of fame
- **Cloudinary** for durable image hosting
- **Google Gemini** vision judging (scores + feedback + roast + improvement tips)
- **Vercel-ready** deployment
- **Single admin login** (password + signed cookie)

## 1) Prerequisites

Install **Node.js 20+** and **npm** on your computer.

You will create accounts (free tiers are fine to start) for:

- Supabase
- Cloudinary
- Google AI Studio (Gemini API key)
- Vercel (for hosting)

## 2) Create the Supabase project

1. Go to [https://supabase.com](https://supabase.com) and create a project.
2. Wait until the database is ready.
3. Open **SQL Editor** → **New query**.
4. Paste the entire contents of `supabase/schema.sql` from this repo and click **Run**.
5. Open **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (**keep this secret**)

> The service role key is used only on the server (admin actions). Never paste it into client code or public repos.

## 3) Create the Cloudinary account

1. Go to [https://cloudinary.com](https://cloudinary.com) and sign up.
2. From the dashboard, copy:
   - **Cloud name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

This app uploads from the server using your API secret (no browser unsigned upload preset required).

## 4) Create the Gemini API key

1. Go to [https://aistudio.google.com](https://aistudio.google.com) (Google AI Studio).
2. Create an API key.
3. Put it in `GEMINI_API_KEY`.

Optional: set `GEMINI_MODEL` if you want to override the default model name (default: `gemini-2.0-flash`).

## 5) Configure environment variables locally

1. Copy `.env.example` to `.env.local` in the project root.
2. Fill every variable:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `GEMINI_API_KEY`
- `ADMIN_PASSWORD` (pick a long random password only you know)
- `ADMIN_JWT_SECRET` (long random string; used to sign admin cookies)

Generate secrets (examples):

```bash
# macOS / Linux
openssl rand -hex 32
```

On Windows PowerShell:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 } | ForEach-Object { [byte]$_ }))
```

## 6) Install dependencies and run locally

From the project folder:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Admin login: `http://localhost:3000/admin/login`

## 7) Upload profile photos + first submission

Profile photos map to cousin slugs (in Admin, upload under the matching name):

1. `bilal-sajid` — Bilal Sajid  
2. `talha-qazi` — Talha Qazi  
3. `abdul-rehman` — Abdul Rehman  
4. `sufyan-qazi` — Sufyan  
5. `abdullah` — Abdullah  
6. `abdul-qadoos` — Abdul Qadoos  
7. `abdul-basit` — Abdul Basit

Then:

1. Sign in to **Admin**.
2. In **Profile photos**, upload each cousin’s portrait (order matches your list).
3. Create a **challenge** (prompt + date + difficulty).
4. Use **Upload a submission** to upload under the correct cousin.

After upload, the server will:

1. Store the image on Cloudinary
2. Insert a row in Supabase
3. Call Gemini with the challenge prompt + image bytes
4. Save scores + feedback + roast

## 8) Deploy to Vercel (recommended path)

Follow the step-by-step guide in **`DEPLOY_VERCEL.md`** (dashboard import is the easiest if you are not using the CLI).

### Important Vercel notes

- **Server upload size limits** apply to Server Actions. If uploads fail, compress images before uploading or switch to a direct-to-Cloudinary browser upload flow in a future iteration.
- Set **Production** environment variables for all keys.
- Ensure `ADMIN_PASSWORD` and `ADMIN_JWT_SECRET` are strong in production.

## 9) Operating the competition (day-to-day)

- **Change the daily challenge**: Admin → Challenges → edit prompt/date/difficulty/active flag.
- **Upload results**: Admin → Upload section.
- **Fix a bad score**: Admin → Submissions → edit **final score**.
- **Re-run Gemini**: Admin → Submissions → **Re-judge**.
- **Delete a submission**: Admin → Submissions → **Delete** (also attempts Cloudinary cleanup).
- **Hall of Fame**: Admin → Submissions → **Add to Hall of Fame** (one pick per submission).
- **Nuclear reset**: Admin → Danger zone → type `RESET` (deletes all submissions).

## 10) Troubleshooting

### Gemini errors

- Verify `GEMINI_API_KEY` is valid.
- If a model is unavailable in your region/account, set `GEMINI_MODEL` to a model you can access (for example `gemini-1.5-flash-latest`) and redeploy.

### Cloudinary errors

- Verify all three Cloudinary variables.
- Check Cloudinary dashboard logs for rejected uploads.

### Supabase errors

- Re-run `supabase/schema.sql` if tables are missing.
- If RLS blocks reads, confirm the public `SELECT` policies exist (they are included in the schema file).

### Images not showing on the homepage

- Cloudinary URLs should render if `next.config.ts` remotePatterns includes `res.cloudinary.com` (already configured).

## Folder map (high level)

- `app/page.tsx` public homepage (server-rendered data)
- `components/home/HomePage.tsx` public UI + lightbox
- `app/admin/*` admin UI + server actions (`app/admin/actions.ts`)
- `lib/gemini.ts` Gemini vision judging
- `lib/cloudinary.ts` uploads + deletes
- `lib/supabase/*` database clients
- `supabase/schema.sql` database setup

## Safety

- Keep `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDINARY_API_SECRET`, `GEMINI_API_KEY`, `ADMIN_PASSWORD`, and `ADMIN_JWT_SECRET` private.
- Prefer a **private GitHub repo** for this project because it is family-specific.
