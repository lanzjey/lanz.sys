# Deploy checklist

1. **Supabase** (project `xojhmfihdcitldvzfcim`)
   - SQL Editor: run `supabase/schema.sql`, then `supabase/seed.sql`.
   - Authentication → Users: create your admin user (email + password); disable public sign-ups.
   - Edge Functions: deploy `contact` with JWT verification OFF.
   - Edge Function secrets: `TURNSTILE_SECRET_KEY`, `ALLOWED_ORIGINS` (your pages.dev / custom domain + `http://localhost:5173`), `IP_HASH_SALT` (any random string).
2. **Turnstile** (Cloudflare dashboard → Turnstile → Add widget): copy the site key into `VITE_TURNSTILE_SITE_KEY`, the secret into the Supabase secret above.
3. **Cloudflare Pages**: connect the Git repo. Build command `npm run build`, output `dist`. Add the three `VITE_*` variables from `.env.example`.
4. **Keep-alive**: deploy `cloudflare/keepalive-worker.js` as a Worker, add `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` variables and a cron trigger `0 3 * * *`. (Replaces the Vercel cron idea.)
