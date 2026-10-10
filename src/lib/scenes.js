import { menuItems } from "./menu";

// The journey, in narrative order. Home is the hub; every other id is a scene opened from it.
export const SCENES = ["home", ...menuItems.map((item) => item.id)];

const aliases = { missions: "projects", profile: "about", loadout: "skills", experience: "about", education: "about" };

// Adjacent scenes use their own transition; any other jump uses the hub burst.
// Index = lower scene index of the pair: home/about, about/projects, projects/skills, ...
const PAIR_KINDS = ["slash", "iris", "streaks", "rays", "grid", "slats", "split"];

export function transitionKind(from, to) {
  const a = SCENES.indexOf(from);
  const b = SCENES.indexOf(to);
  return Math.abs(a - b) === 1 ? PAIR_KINDS[Math.min(a, b)] : "hub";
}

export function sceneFromLocation() {
  const raw = window.location.hash.slice(1);
  let hash;
  try { hash = decodeURIComponent(raw); } catch { hash = raw; }
  const id = aliases[hash] || hash;
  return SCENES.includes(id) ? id : "home";
}

export const urlFor = (id) => `${window.location.pathname}${window.location.search}${id === "home" ? "" : `#${id}`}`;
