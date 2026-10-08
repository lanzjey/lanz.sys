// Supabase Edge Function: contact
// Receives the portfolio contact form, applies spam protection, and stores the
// message in public.messages (readable only by the admin).
//
// Required secrets (Supabase → Edge Functions → Secrets):
//   TURNSTILE_SECRET_KEY   Cloudflare Turnstile secret key
// Optional secrets:
//   ALLOWED_ORIGINS        Comma-separated site origins, e.g. https://lanz.pages.dev,http://localhost:5173
//   IP_HASH_SALT           Any random string; makes stored IP hashes non-reversible
// Provided automatically by Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Deploy with JWT verification OFF (the public site has no user session).
import { createClient } from "npm:@supabase/supabase-js@2";

const PER_IP_PER_HOUR = 3;
const GLOBAL_PER_HOUR = 40;
const MIN_FILL_MS = 3000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "").split(",").map((origin) => origin.trim()).filter(Boolean);

function corsHeaders(origin: string | null) {
  const allow = !allowedOrigins.length ? "*" : origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  const headers = { ...corsHeaders(origin), "Content-Type": "application/json" };
  const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers });

  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return reply(405, { error: "Method not allowed." });
  if (allowedOrigins.length && origin && !allowedOrigins.includes(origin)) return reply(403, { error: "Origin not allowed." });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return reply(400, { error: "Invalid request." });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();
  const honeypot = String(body.website ?? "");
  const startedAt = Number(body.startedAt);
  const token = String(body.turnstileToken ?? "");

  // 1. Honeypot and timing: silently accept so bots learn nothing.
  const elapsed = Date.now() - startedAt;
  if (honeypot || !Number.isFinite(startedAt) || elapsed < MIN_FILL_MS || elapsed > 86_400_000) return reply(200, { ok: true });

  // 2. Field validation
  if (!name || name.length > 120) return reply(400, { error: "Please enter your name (up to 120 characters)." });
  if (!EMAIL_PATTERN.test(email) || email.length > 254) return reply(400, { error: "Please enter a valid email address." });
  if (message.length < 10 || message.length > 5000) return reply(400, { error: "Your message should be between 10 and 5000 characters." });

  // 3. Cloudflare Turnstile
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) return reply(500, { error: "The contact form is not configured yet." });
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  }).then((response) => response.json()).catch(() => ({ success: false }));
  if (!verification.success) return reply(400, { error: "Verification failed. Please refresh the page and try again." });

  // 4. Rate limits
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const ipHash = await sha256(`${Deno.env.get("IP_HASH_SALT") || "lanz.sys"}:${ip}`);
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const [perIp, global] = await Promise.all([
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since),
    supabase.from("messages").select("id", { count: "exact", head: true }).gte("created_at", since),
  ]);
  if (perIp.error || global.error) return reply(500, { error: "Could not send right now. Please try again later." });
  if ((perIp.count ?? 0) >= PER_IP_PER_HOUR || (global.count ?? 0) >= GLOBAL_PER_HOUR) {
    return reply(429, { error: "Too many messages. Please try again in an hour, or email me directly." });
  }

  // 5. Store
  const { error } = await supabase.from("messages").insert({ name, email, message, ip_hash: ipHash });
  if (error) return reply(500, { error: "Could not send right now. Please try again later." });
  return reply(200, { ok: true });
});
