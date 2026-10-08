import { createClient } from "@supabase/supabase-js";
import { MEDIA_BUCKET, SUPABASE_KEY, SUPABASE_URL, isSupabaseConfigured } from "../lib/config";

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

export const MEDIA_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/`;
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_EDGE = 2000;

const slugify = (name) => name.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "file";

// Large JPEG/PNG/WebP images are resized (max 2000px) and re-encoded as WebP.
async function prepareImage(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 600_000) { bitmap.close(); return file; }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", .85));
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], `${slugify(file.name)}.webp`, { type: "image/webp" });
}

export async function uploadMedia(file, folder) {
  const prepared = await prepareImage(file);
  if (prepared.size > MAX_UPLOAD_BYTES) throw new Error(`"${file.name}" is larger than 50 MB. For long videos, upload to YouTube or Vimeo and paste the link instead.`);
  const extension = prepared.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${folder}/${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}-${slugify(prepared.name)}.${extension}`;
  const { error } = await supabase.storage.from("media").upload(path, prepared, { contentType: prepared.type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

// Every uploaded-file URL found anywhere inside a value (strings, arrays, gallery objects).
export function collectMediaUrls(value, found = new Set()) {
  if (typeof value === "string") { if (value.startsWith(MEDIA_PREFIX)) found.add(value); }
  else if (Array.isArray(value)) value.forEach((item) => collectMediaUrls(item, found));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => collectMediaUrls(item, found));
  return found;
}

export async function removeMedia(urls) {
  const paths = [...urls].map((url) => decodeURIComponent(url.slice(MEDIA_PREFIX.length).split("?")[0]));
  if (!paths.length) return;
  const { error } = await supabase.storage.from("media").remove(paths);
  if (error) console.warn("[admin] Could not remove old files:", error.message);
}
