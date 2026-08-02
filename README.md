<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/0305d3a0-ef2b-415e-affb-18e97214d527

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set:
   - `VITE_SUPABASE_ANON_KEY` (Supabase Publishable key)
3. Run the frontend:
   `npm run dev`
4. (Optional) Full Express + SQLite backend locally:
   `npm run dev:server`

## Deploy on Vercel

1. Framework preset: **Vite** (or use the included `vercel.json`)
2. Build command: `npm run build`
3. Output directory: `dist`
4. In Vercel → Project Settings → Environment Variables:
   - **Delete** any old `VITE_SUPABASE_URL` entry (do not keep editing it — Vercel Sensitive vars often fail to update)
   - Add only `VITE_SUPABASE_ANON_KEY` = Supabase **Publishable** key (`sb_publishable_...`)
   - Keep **Sensitive** OFF while creating it, then Save
5. Redeploy after saving env vars

> The Supabase project URL is already set in code (`https://wffkgzzrninmcbtqbdcf.supabase.co`), so you do not need `VITE_SUPABASE_URL` on Vercel.
>
> Note: The old Express/SQLite API (`server.ts`) does not run on Vercel serverless. The current Vercel deploy is the Vite frontend talking to Supabase.
