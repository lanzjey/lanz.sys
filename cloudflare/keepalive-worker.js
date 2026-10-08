// Cloudflare Worker: daily keep-alive for the Supabase free tier.
// Supabase pauses free projects after ~7 days without activity; one tiny
// read per day keeps the portfolio database awake.
//
// Setup (Cloudflare dashboard → Workers & Pages → Create → Worker):
//   1. Paste this file as the Worker code and deploy.
//   2. Settings → Variables: add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.
//   3. Settings → Triggers → Cron Triggers: add  0 3 * * *  (daily, 03:00 UTC).
export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(ping(env));
  },
  // Visiting the Worker URL runs a manual check (returns only "ok"/"failed").
  async fetch(_request, env) {
    const ok = await ping(env);
    return new Response(ok ? "ok" : "failed", { status: ok ? 200 : 502 });
  },
};

async function ping(env) {
  try {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/profile?select=id&limit=1`, {
      headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY },
    });
    return response.ok;
  } catch {
    return false;
  }
}
