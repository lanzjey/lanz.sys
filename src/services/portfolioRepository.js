import { profile } from "../data/profile";
import { skills } from "../data/skills";
import { projects } from "../data/projects";
import { services } from "../data/services";
import { education } from "../data/education";
import { experience } from "../data/experience";
import { certificates } from "../data/certificates";
import { resume } from "../data/resume";
import { socialLinks } from "../data/socialLinks";
import { tools } from "../data/tools";
import { testimonials } from "../data/testimonials";
import { worldDestinations } from "../data/worldDestinations";
import { LIST_TABLES, OPTIONAL_TABLES, SINGLETON_TABLES, mapPortfolio } from "./content";
import { SUPABASE_KEY, SUPABASE_URL, isSupabaseConfigured } from "../lib/config";

// Backup content, used when the database is unreachable:
//   1. the snapshot taken from Supabase at build time (scripts/snapshot.mjs), else
//   2. the starting content in src/data.
const snapshots = import.meta.glob("../data/snapshot.json", { eager: true, import: "default" });
const snapshot = Object.values(snapshots)[0];

const localContent = { profile, skills, projects, services, education, experience, certificates, resume, socialLinks, tools, testimonials };
export const fallbackPortfolio = { ...(snapshot || localContent), worldDestinations };

async function fetchTable(table, signal) {
  const order = SINGLETON_TABLES.includes(table) ? "" : "&order=sort_order.asc,created_at.asc";
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*${order}`, {
    headers: { apikey: SUPABASE_KEY, Accept: "application/json" },
    signal,
  });
  if (!response.ok) {
    if (OPTIONAL_TABLES.includes(table)) return [];
    throw new Error(`${table}: ${response.status}`);
  }
  const rows = await response.json();
  return SINGLETON_TABLES.includes(table) ? rows[0] || null : rows;
}

// Loads published content straight from the database REST API (no SDK needed
// on the public site, keeping it light). Resolves to the backup on any failure.
export async function loadPortfolio({ timeout = 7000 } = {}) {
  if (!isSupabaseConfigured) return { content: fallbackPortfolio, source: "local" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const tables = [...SINGLETON_TABLES, ...LIST_TABLES];
    const results = await Promise.all(tables.map((table) => fetchTable(table, controller.signal)));
    const raw = Object.fromEntries(tables.map((table, index) => [table, results[index]]));
    if (!raw.profile) throw new Error("profile row missing");
    return { content: { ...mapPortfolio(raw), worldDestinations }, source: "database" };
  } catch (error) {
    console.warn("[portfolio] Using backup content:", error.message);
    return { content: fallbackPortfolio, source: "backup" };
  } finally {
    clearTimeout(timer);
  }
}
