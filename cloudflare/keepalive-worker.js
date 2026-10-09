// Cloudflare Worker: daily keep-alive for the Supabase free tier.
// Supabase pauses free projects after ~7 days without activity; one tiny
// read per day keeps the portfolio database awake.
//
// Runs as part of the site's Worker (see wrangler.jsonc): the cron trigger and the
// SUPABASE_* variables are configured there, so `git push` deploys it with the site.
// Visiting /__keepalive on the site runs a manual check and returns only "ok" or "failed".
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
