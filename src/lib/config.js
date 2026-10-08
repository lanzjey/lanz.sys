// Public configuration. These values are safe to ship in the browser bundle:
// the publishable key only allows what the database security rules permit.
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";
export const MEDIA_BUCKET = "media";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
