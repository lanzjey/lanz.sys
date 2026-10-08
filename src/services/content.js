// Shared, framework-free content helpers. Used by the public site, the admin
// dashboard and the build-time snapshot script (scripts/snapshot.mjs).

export const PROJECT_STATUSES = ["Planned", "Ongoing", "In Progress", "Completed", "On Hold", "Archived"];
export const SERVICE_AVAILABILITY = ["Available", "Limited Availability", "Not Currently Available", "Coming Soon"];
export const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
export const SOCIAL_PLATFORMS = ["facebook", "messenger", "instagram", "linkedin", "github", "email", "x", "youtube", "tiktok", "website", "other"];
export const PLATFORM_LABELS = {
  facebook: "Facebook", messenger: "Messenger", instagram: "Instagram", linkedin: "LinkedIn", github: "GitHub",
  email: "Email", x: "X (Twitter)", youtube: "YouTube", tiktok: "TikTok", website: "Website", other: "Other",
};

// Tables loaded by the public site, in the order they are fetched.
export const SINGLETON_TABLES = ["profile", "resume"];
export const LIST_TABLES = ["skills", "services", "tools", "projects", "experience", "education", "certificates", "social_links", "testimonials"];

const list = (value) => (Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()) : []);
const text = (value) => (typeof value === "string" ? value : value == null ? "" : String(value));

export function formatMonth(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? text(value) : date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// YouTube / Vimeo page URL → embeddable player URL. Returns "" for anything else.
export function toEmbedUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}`;
    if (host === "youtube.com") {
      const id = parsed.searchParams.get("v") || parsed.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : "";
    }
    if (host === "vimeo.com") {
      const id = parsed.pathname.match(/\/(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : "";
    }
    if (host === "player.vimeo.com" || host.endsWith("youtube-nocookie.com")) return url;
  } catch {
    return "";
  }
  return "";
}

export const isVideoFile = (url) => /\.(mp4|webm)(\?|$)/i.test(url || "");

// Database rows → the shape the portfolio components render.
export function mapPortfolio(raw) {
  const profile = raw.profile || {};
  const resume = raw.resume || {};
  return {
    profile: {
      name: text(profile.name),
      roles: list(profile.roles),
      role: text(profile.role),
      tagline: text(profile.tagline),
      intro: text(profile.intro),
      about: text(profile.about),
      image: profile.image || "/assets/profile-placeholder.svg",
      imageAlt: text(profile.image_alt) || `Portrait of ${text(profile.name)}`,
      playerClass: text(profile.player_class),
      specialization: text(profile.specialization),
      availability: text(profile.availability),
      location: text(profile.location),
      email: text(profile.email),
      careerGoal: text(profile.career_goal),
    },
    resume: {
      title: text(resume.title) || "Resume / CV",
      description: text(resume.description),
      file: resume.file || null,
      url: resume.url || null,
      status: text(resume.status),
    },
    skills: (raw.skills || []).map((row) => ({
      name: text(row.name), category: text(row.category), level: text(row.level), description: text(row.description),
      experience: text(row.experience), related: list(row.related),
    })),
    services: (raw.services || []).map((row) => ({
      name: text(row.name), category: text(row.category), description: text(row.description),
      capabilities: list(row.capabilities), deliverables: list(row.deliverables), tools: list(row.tools),
      availability: text(row.availability), startingPrice: text(row.starting_price), turnaround: text(row.turnaround),
      image: row.image || null, relatedProjects: list(row.related_projects), cta: text(row.cta), featured: Boolean(row.featured),
    })),
    tools: (raw.tools || []).map((row) => ({ name: text(row.name), category: text(row.category), usage: text(row.usage), proficiency: text(row.proficiency) })),
    projects: (raw.projects || []).map((row) => ({
      name: text(row.name), category: text(row.category), status: text(row.status), year: text(row.year),
      description: text(row.description), objective: text(row.objective), challenge: text(row.challenge), solution: text(row.solution),
      role: text(row.role), features: list(row.features), results: list(row.results), tech: list(row.tech),
      media: row.cover_image || null, video: row.video || null,
      gallery: Array.isArray(row.gallery) ? row.gallery.filter((item) => item?.src) : [],
      githubUrl: row.github_url || null, liveUrl: row.live_url || null, featured: Boolean(row.featured),
    })),
    experience: (raw.experience || []).map((row) => ({ title: text(row.title), organization: text(row.organization), period: text(row.period), description: text(row.description) })),
    education: (raw.education || []).map((row) => ({ title: text(row.title), organization: text(row.organization), period: text(row.period), description: text(row.description) })),
    certificates: (raw.certificates || []).map((row) => ({
      title: text(row.title), issuer: text(row.issuer), date: formatMonth(row.issued_on), expires: formatMonth(row.expires_on),
      credentialId: text(row.credential_id), credentialUrl: row.credential_url || null, description: text(row.description),
      image: row.image || null, pdf: row.file || null, relatedSkills: list(row.related_skills),
    })),
    socialLinks: (raw.social_links || []).map((row) => ({ platform: text(row.platform) || "other", label: text(row.label), href: row.url || null, placeholder: !row.url })),
    testimonials: (raw.testimonials || []).map((row) => ({ name: text(row.name), role: text(row.role), message: text(row.message), project: text(row.project) })),
  };
}
