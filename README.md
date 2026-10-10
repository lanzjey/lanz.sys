# lanz.sys

Portfolio of Jayzel Lance Macatuggal: a cinematic, scene-based single-page site inspired by the look of Persona 3 Reload, built with original artwork and interface elements. Live at <https://lanz-sys.macatuggaljayzellance.workers.dev>.

> Fan-inspired design. Persona belongs to its respective owners; this site is not affiliated with or endorsed by them.

## How it works

- **Stack:** Vite 8, React 19, Supabase (content, admin login, contact messages), Cloudflare Workers (hosting).
- **Scenes, not pages.** `Home` is the hub. `About`, `Projects`, `Skills`, `Services`, `Certificates`, `Resume` and `Contact` each open as a full-screen scene that scrolls inside itself. There is no router: the scene lives in the URL hash (`/#projects`), every scene change adds one browser-history entry, and Back/Forward step through scenes. `/admin` is the only real path.
- **Navigation:** hero menu (mouse, tap, arrow keys + Enter), side menu / phone menu sheet, `Back to Menu` and `Esc` to go Home, `←` `→` and the Previous / Next prompts to walk the journey in order.
- **Motion:** one animated backdrop per scene (a small WebGL shader at reduced resolution, cross-faded on change), an SVG/CSS "stage" composition per scene, and seven narrative transitions of about 0.8 s. Reduced-motion users get instant scene changes and static compositions. On slow devices the backdrop steps its quality down, down to plain CSS colours.
- **Scroll reveals:** inside a scene, anything below the fold fades and slides up as it scrolls into view (`src/hooks/useScrollReveal.js`; works with touch swipes and momentum scrolling, never takes over scrolling), and a few stage layers drift slightly against the scroll (`SceneStage.jsx`). Reduced motion turns both off.
- **Reduced motion:** phones often have "Reduce motion" (iOS) or "Remove animations" / battery saver (Android) switched on. By default that turns the site's animations off. A small note on Home and in the phone menu then offers **Turn on animations** (remembered per browser; `src/lib/motion.js`). Open the site with `?debug=1` to see a status line (motion, WebGL, data-saver, touch) when troubleshooting a device.
- **Touch:** there is no hover on phones, so touching a hero menu item slides the slash to it first and then opens the scene.
- **Admin** (`/admin`) is a normal scrolling page. Only the public site locks the page for scenes (`html.has-scenes`).
- **Content** lives in Supabase and is edited at `/admin`. The build saves a copy to `src/data/snapshot.json` (git-ignored, regenerated on every build); the site falls back to it if the database is slow or down, and to `src/data/*.js` if there is no snapshot.

## Project map

| Path | What it is |
| --- | --- |
| `src/App.jsx` | Scene state, history, keyboard, transitions, intro |
| `src/components/Hero.jsx` | Home: cut-out name, slash menu, portrait, "Now" cards |
| `src/components/Sections.jsx`, `Resume.jsx` | About, Projects, Skills, Services, Certificates, Contact; Resume |
| `src/components/ProjectPanel.jsx` | Project detail (expands out of the chosen row) |
| `src/components/Backdrop.jsx` | Per-scene shader backdrop and light motes |
| `src/components/SceneStage.jsx` | Per-scene SVG/CSS composition |
| `src/components/Transition.jsx` | The seven narrative transitions and the hub burst |
| `src/lib/scenes.js`, `menu.js` | Scene order, URL ↔ scene mapping, which transition plays |
| `src/styles.css` | All public styles (the admin has its own `src/admin/admin.css`) |
| `public/assets/portrait*.{jpg,webp}` | Hero portrait and the blue duotone cutout used on About |
| `supabase/` | SQL schema and seed, and the `contact` Edge Function |
| `cloudflare/keepalive-worker.js`, `wrangler.jsonc` | Worker config, keep-alive cron |

## Commands

```bash
npm install
npm run dev            # http://localhost:5173
npm run dev -- --host  # also reachable from a phone on the same Wi-Fi
npm run lint
npm run build          # saves the content snapshot, then builds to dist/
```

Environment variables (see `.env.example`; real values go in `.env`, never committed): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_TURNSTILE_SITE_KEY`.

## Deploying

See [DEPLOY.md](DEPLOY.md). In short: Cloudflare Workers builds from GitHub. Pushing `main` publishes the live site; every other branch gets a preview at `https://<branch>-lanz-sys.macatuggaljayzellance.workers.dev`.

## Restore points

If a redesign ever needs to be undone, these tags are the known-good versions:

| Tag | Design |
| --- | --- |
| `sao-v1` | The original portfolio |
| `solo-leveling-v2` | The Solo Leveling version |
| `p3r-v1` | The Persona 3 Reload hero, before the scene system |

Restore with `git switch --detach <tag>` to look, or `git revert` the merge on `main` to go back for good. An offline bundle and zip of the Solo Leveling version, plus a copy of the untracked config, were saved in `C:\portfolio-website-backups\solo-leveling-v2` on the author's computer (contains secrets, keep private).

## Accessibility and compatibility notes

- Keyboard: every control is reachable and shows a visible focus outline; `Esc` returns Home; the project panel traps focus.
- Touch: tested with emulated Android Chrome (320 to 412 px wide phones and an 800 px tablet). Not yet verified on a physical device, Samsung Internet or Firefox for Android.
- Contact form: sends through the `contact` Edge Function with a Cloudflare Turnstile check. If the check cannot run (for example the hostname is not allowed for the Turnstile key), the form opens an email draft instead and says so; it never claims a message was sent unless the function answered OK.
