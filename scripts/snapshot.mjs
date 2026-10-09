// Runs before every build: saves the current database content to
// src/data/snapshot.json, which the site uses if Supabase is ever unreachable.
// It never fails the build — on any error the previous backup is kept.
import { writeFileSync } from "node:fs";
import { loadEnv } from "vite";
import { LIST_TABLES, OPTIONAL_TABLES, SINGLETON_TABLES, mapPortfolio } from "../src/services/content.js";

const env = { ...loadEnv("production", process.cwd(), "VITE_"), ...process.env };
const url = (env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

if (!url || !key) {
  console.log("[snapshot] Supabase is not configured — skipping.");
  process.exit(0);
}

try {
  const tables = [...SINGLETON_TABLES, ...LIST_TABLES];
  const raw = {};
  for (const table of tables) {
    const order = SINGLETON_TABLES.includes(table) ? "" : "&order=sort_order.asc,created_at.asc";
    const response = await fetch(`${url}/rest/v1/${table}?select=*${order}`, { headers: { apikey: key }, signal: AbortSignal.timeout(15000) });
    if (!response.ok && OPTIONAL_TABLES.includes(table)) { raw[table] = []; continue; }
    if (!response.ok) throw new Error(`${table}: HTTP ${response.status}`);
    const rows = await response.json();
    raw[table] = SINGLETON_TABLES.includes(table) ? rows[0] || null : rows;
  }
  if (!raw.profile) throw new Error("profile row missing");
  writeFileSync(new URL("../src/data/snapshot.json", import.meta.url), JSON.stringify(mapPortfolio(raw), null, 2));
  console.log("[snapshot] Saved database content as the offline backup.");
} catch (error) {
  console.warn(`[snapshot] Skipped (${error.message}). The previous backup will be used.`);
}
