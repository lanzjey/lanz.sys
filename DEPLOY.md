# Deploy and operations

The site is a **Cloudflare Workers** project (static assets plus a tiny Worker) connected to the GitHub repo `lanzjey/lanz.sys`.

- **Production:** <https://lanz-sys.macatuggaljayzellance.workers.dev>. Published automatically when `main` is pushed.
- **Previews:** every other branch is built too, at `https://<branch-name>-lanz-sys.macatuggaljayzellance.workers.dev` (for example `p3r-scenes`). Use these to test on a real phone before merging.
- **Rollback:** Cloudflare dashboard → Workers & Pages → `lanz-sys` → Deployments → pick an earlier deployment → Rollback. Or `git revert` the change on `main` and push.

## What `wrangler.jsonc` does (do not change without a reason)

- `assets.directory: ./dist` serves the Vite build; unknown paths (like `/admin`) load the app (`single-page-application`).
- `run_worker_first: ["/__keepalive"]` sends only that path to `cloudflare/keepalive-worker.js`; the daily cron (`0 3 * * *`) pings Supabase so the free project never pauses. Visit `/__keepalive` to check it: it returns `ok`.
- `vars` are runtime values for that Worker. They are **not** used by the Vite build.
- `public/_headers` adds security headers and `noindex` / no-cache for `/admin`.

## Build settings in Cloudflare

Workers & Pages → `lanz-sys` → Settings → Build. These are the values the project expects; confirm them in the dashboard, since Cloudflare settings are not stored in the repo:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Node | 22 (the repo has a `.nvmrc`) |
| **Build variables** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_TURNSTILE_SITE_KEY` |

The three `VITE_` values must be **build** variables (Vite inlines them). Without them the site still builds, but shows placeholder content and the contact form can only open an email draft.

## One-time and per-hostname checklist

1. **Supabase** (project `xojhmfihdcitldvzfcim`): `supabase/schema.sql` then `seed.sql`; create the admin user and disable public sign-ups; deploy the `contact` Edge Function with JWT verification OFF; secrets `TURNSTILE_SECRET_KEY`, `IP_HASH_SALT`, and `ALLOWED_ORIGINS`.
2. **`ALLOWED_ORIGINS`** must list every site address that sends messages, comma-separated, for example `https://lanz-sys.macatuggaljayzellance.workers.dev,http://localhost:5173`. Add a preview address here only when you want to test real sending from it.
3. **Turnstile** (Cloudflare dashboard → Turnstile → your widget → Hostnames): add the production hostname, and any preview or custom hostname you want the contact form to work on.
4. **Supabase Authentication → URL Configuration:** set the Site URL to the production address so admin login redirects work.

## Adding a custom domain later (optional)

Buy a domain (for example through Cloudflare Registrar), then Workers & Pages → `lanz-sys` → Settings → Domains & Routes → Add → Custom domain. Afterwards: add the domain to Turnstile hostnames and to `ALLOWED_ORIGINS`, and update the three URLs (`og:url`, `og:image`, `canonical`) in `index.html`.

## Troubleshooting

| What you see | Cause and fix |
| --- | --- |
| Placeholder projects or "Project Example" on the live site | Build variables are missing, or the content is not filled in yet at `/admin`. |
| Contact form opens an email draft instead of sending | Turnstile cannot run on this hostname (console shows `110200`): add the hostname in Turnstile and in `ALLOWED_ORIGINS`. |
| Admin login fails | Check Supabase URL Configuration and that the admin user exists. |
| Build fails on Node errors | Make sure Node 22 is selected (`.nvmrc`); Vite 8 needs Node 20.19+ or 22.12+. |
| Preview looks different from production | Previews use the same variables; check that the branch was merged and pushed. |
