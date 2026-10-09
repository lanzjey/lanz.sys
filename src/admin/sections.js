// Every admin editor is generated from these definitions.
// To add a field: add the column in supabase/schema.sql, then add it here.
import { PLATFORM_LABELS, PROJECT_RANKS, PROJECT_STATUSES, RANK_GUIDE, SERVICE_AVAILABILITY, SKILL_LEVELS, SOCIAL_PLATFORMS } from "../services/content";

const httpUrl = (value) => (!value || /^https?:\/\/\S+$/i.test(value) ? "" : "Use a full link starting with https://");

const platformHints = {
  facebook: "https://www.facebook.com/yourprofile",
  messenger: "https://m.me/yourusername",
  instagram: "https://www.instagram.com/yourusername",
  linkedin: "https://www.linkedin.com/in/yourname",
  github: "https://github.com/yourusername",
  email: "you@example.com",
  x: "https://x.com/yourusername",
  youtube: "https://www.youtube.com/@yourchannel",
  tiktok: "https://www.tiktok.com/@yourusername",
  website: "https://yourwebsite.com",
  other: "https://…",
};

export const SECTIONS = [
  {
    id: "profile", table: "profile", label: "Profile", group: "Identity", singleton: true,
    description: "Your name, hero text and About section.",
    fields: [
      { name: "name", label: "Full name", type: "text", required: true },
      { name: "roles", label: "Typing-effect roles", type: "tags", help: "Shown one at a time in the hero. Press Enter after each." },
      { name: "role", label: "Role line", type: "text", help: "Shown on the intro welcome screen." },
      { name: "intro", label: "Short intro", type: "textarea", rows: 3, help: "Hero paragraph under your name." },
      { name: "about", label: "About / bio", type: "textarea", rows: 5, help: "The large statement in the Profile section." },
      { name: "image", label: "Profile photo", type: "image", folder: "profile" },
      { name: "image_alt", label: "Photo description", type: "text", help: "For screen readers, e.g. “Portrait of Jayzel smiling”." },
      { name: "player_class", label: "Discipline", type: "text" },
      { name: "specialization", label: "Focus", type: "text" },
      { name: "availability", label: "Availability", type: "text", help: "e.g. “Open to freelance projects”." },
      { name: "location", label: "Location", type: "text" },
      { name: "email", label: "Contact email", type: "email" },
      { name: "tagline", label: "Tagline", type: "text" },
      { name: "career_goal", label: "Career goal", type: "textarea", rows: 2 },
    ],
  },
  {
    id: "resume", table: "resume", label: "Resume / CV", group: "Identity", singleton: true,
    description: "Upload a PDF, or link to one hosted elsewhere.",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "description", label: "Description", type: "textarea", rows: 2 },
      { name: "file", label: "Resume PDF", type: "file", accept: "application/pdf", folder: "resume", help: "Visitors get a Download button." },
      { name: "url", label: "External link", type: "url", validate: httpUrl, help: "Used only when no PDF is uploaded (e.g. Google Drive)." },
      { name: "status", label: "Status note", type: "text" },
    ],
  },
  {
    id: "projects", table: "projects", label: "Projects", group: "Showcase", featured: true,
    titleField: "name", subtitle: (row) => [row.category, row.status, row.year].filter(Boolean).join(" · "), thumbField: "cover_image",
    fields: [
      { name: "name", label: "Project name", type: "text", required: true },
      { name: "category", label: "Category", type: "category" },
      { name: "status", label: "Status", type: "select", options: PROJECT_STATUSES },
      { name: "year", label: "Year / date", type: "text", help: "e.g. 2026" },
      {
        name: "rank", label: "Dungeon rank (E to S)", type: "select", options: PROJECT_RANKS,
        optionLabels: Object.fromEntries(PROJECT_RANKS.map((rank) => [rank, `${rank}-rank: ${RANK_GUIDE[rank]}`])),
        help: "Rate the real complexity and scope, not how proud you are. E = a day of work, S = exceptional. Leave empty to show no rank.",
      },
      {
        name: "rank_reason", label: "Why this rank?", type: "text",
        help: "One honest line, e.g. “Three connected systems, several weeks, used by real people”.",
        validate: (value, form) => (form.rank && !value ? "Add one line explaining the rank." : ""),
      },
      { name: "featured", label: "Featured (shown large at the top)", type: "toggle" },
      { name: "description", label: "Summary", type: "textarea", rows: 3, required: true },
      { name: "cover_image", label: "Cover image", type: "image", folder: "projects" },
      { name: "video", label: "Main video", type: "video", folder: "projects", help: "Upload an MP4/WebM up to 50 MB, or paste a YouTube/Vimeo link." },
      { name: "gallery", label: "Gallery", type: "gallery", folder: "projects", help: "Screenshots, clips, or YouTube/Vimeo links." },
      { name: "role", label: "My role", type: "text" },
      { name: "objective", label: "Objective", type: "textarea", rows: 2 },
      { name: "challenge", label: "Challenge", type: "textarea", rows: 2 },
      { name: "solution", label: "Solution", type: "textarea", rows: 2 },
      { name: "features", label: "Features", type: "tags" },
      { name: "results", label: "Results", type: "tags" },
      { name: "tech", label: "Technologies", type: "tags" },
      { name: "github_url", label: "GitHub link", type: "url", validate: httpUrl },
      { name: "live_url", label: "Live demo link", type: "url", validate: httpUrl },
    ],
  },
  {
    id: "services", table: "services", label: "Services", group: "Showcase", featured: true,
    titleField: "name", subtitle: (row) => [row.category, row.availability].filter(Boolean).join(" · "),
    fields: [
      { name: "name", label: "Service name", type: "text", required: true },
      { name: "category", label: "Category", type: "category" },
      { name: "availability", label: "Availability", type: "select", options: SERVICE_AVAILABILITY },
      { name: "featured", label: "Featured", type: "toggle" },
      { name: "description", label: "Description", type: "textarea", rows: 3, required: true },
      { name: "capabilities", label: "What's included", type: "tags" },
      { name: "deliverables", label: "Deliverables", type: "tags" },
      { name: "tools", label: "Tools used", type: "tags" },
      { name: "starting_price", label: "Starting price", type: "text", help: "Optional, e.g. “From ₱1,500”." },
      { name: "turnaround", label: "Turnaround time", type: "text", help: "Optional, e.g. “3–5 days”." },
      { name: "image", label: "Thumbnail", type: "image", folder: "services" },
      { name: "related_projects", label: "Related projects", type: "tags", help: "Project names." },
      { name: "cta", label: "Button text", type: "text", help: "e.g. “Discuss video editing”." },
    ],
  },
  {
    id: "highlights", table: "highlights", label: "Highlights", group: "Showcase",
    description: "The big numbers shown right under the hero, e.g. clients served or projects delivered. Only add real figures.",
    titleField: "label", subtitle: (row) => row.value,
    fields: [
      { name: "value", label: "Number / value", type: "text", required: true, help: "Short and bold, e.g. “12+”, “3 years”, “24h”." },
      { name: "label", label: "What it measures", type: "text", required: true, help: "e.g. “Clients served”, “Projects delivered”, “Average reply time”." },
      { name: "note", label: "Small note", type: "text", help: "Optional, one short line under the label." },
    ],
  },
  {
    id: "skills", table: "skills", label: "Skills", group: "Showcase",
    titleField: "name", subtitle: (row) => [row.category, row.level].filter(Boolean).join(" · "),
    fields: [
      { name: "name", label: "Skill", type: "text", required: true },
      { name: "category", label: "Category", type: "category" },
      { name: "level", label: "Level", type: "select", options: SKILL_LEVELS },
      { name: "description", label: "Description", type: "textarea", rows: 2 },
      { name: "experience", label: "Experience", type: "text", help: "Optional, e.g. “2 years”." },
      { name: "related", label: "Related skills / technologies", type: "tags" },
    ],
  },
  {
    id: "tools", table: "tools", label: "Tools", group: "Showcase",
    titleField: "name", subtitle: (row) => row.category,
    fields: [
      { name: "name", label: "Tool", type: "text", required: true },
      { name: "category", label: "Category", type: "category" },
      { name: "usage", label: "How I use it", type: "textarea", rows: 2 },
      { name: "proficiency", label: "Proficiency", type: "text" },
    ],
  },
  {
    id: "experience", table: "experience", label: "Experience", group: "Journey",
    titleField: "title", subtitle: (row) => [row.organization, row.period].filter(Boolean).join(" · "),
    fields: [
      { name: "title", label: "Position / title", type: "text", required: true },
      { name: "organization", label: "Organization", type: "text" },
      { name: "period", label: "Period", type: "text", help: "e.g. “2024 — Present”." },
      { name: "description", label: "Description", type: "textarea", rows: 3 },
    ],
  },
  {
    id: "education", table: "education", label: "Education", group: "Journey",
    titleField: "title", subtitle: (row) => [row.organization, row.period].filter(Boolean).join(" · "),
    fields: [
      { name: "title", label: "Program / degree", type: "text", required: true },
      { name: "organization", label: "School", type: "text" },
      { name: "period", label: "Period", type: "text", help: "e.g. “2023 — 2027”." },
      { name: "description", label: "Description", type: "textarea", rows: 3 },
    ],
  },
  {
    id: "certificates", table: "certificates", label: "Certificates", group: "Journey",
    titleField: "title", subtitle: (row) => [row.issuer, row.issued_on].filter(Boolean).join(" · "), thumbField: "image",
    fields: [
      { name: "title", label: "Certificate name", type: "text", required: true },
      { name: "issuer", label: "Issuing organization", type: "text" },
      { name: "issued_on", label: "Date issued", type: "date" },
      { name: "expires_on", label: "Expiration date", type: "date", help: "Leave empty if it doesn't expire." },
      { name: "credential_id", label: "Credential ID", type: "text" },
      { name: "credential_url", label: "Verification link", type: "url", validate: httpUrl },
      { name: "image", label: "Certificate image", type: "image", folder: "certificates" },
      { name: "file", label: "Certificate PDF", type: "file", accept: "application/pdf", folder: "certificates" },
      { name: "description", label: "Description", type: "textarea", rows: 2 },
      { name: "related_skills", label: "Related skills", type: "tags" },
    ],
  },
  {
    id: "social", table: "social_links", label: "Social links", group: "Connect",
    titleField: "label", subtitle: (row) => row.url || "Coming soon (no link yet)",
    fields: [
      { name: "platform", label: "Platform", type: "select", options: SOCIAL_PLATFORMS, optionLabels: PLATFORM_LABELS, required: true, defaultValue: "facebook" },
      { name: "label", label: "Label", type: "text", required: true, help: "Text shown on the button, e.g. “Instagram”." },
      {
        name: "url", label: "Link", type: "url",
        placeholder: (form) => platformHints[form.platform] || platformHints.other,
        help: "Leave empty to show it as “Coming soon”.",
        normalize: (value, form) => (form.platform === "email" && value && !value.startsWith("mailto:") && value.includes("@") ? `mailto:${value}` : value),
        validate: (value, form) => {
          if (!value) return "";
          if (form.platform === "email") return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value) ? "" : "Enter a valid email address.";
          if (!/^https?:\/\/\S+$/i.test(value)) return "Use a full link starting with https://";
          if (form.platform === "messenger" && !/^https?:\/\/(m\.me|www\.messenger\.com)\//i.test(value)) return "Messenger links look like https://m.me/yourusername";
          return "";
        },
      },
    ],
  },
  {
    id: "testimonials", table: "testimonials", label: "Testimonials", group: "Connect",
    titleField: "name", subtitle: (row) => [row.role, row.project].filter(Boolean).join(" · "),
    fields: [
      { name: "name", label: "Client name", type: "text", required: true },
      { name: "role", label: "Role / company", type: "text" },
      { name: "project", label: "Project", type: "text" },
      { name: "message", label: "Message", type: "textarea", rows: 4, required: true },
    ],
  },
];

export const GROUPS = ["Identity", "Showcase", "Journey", "Connect"];
