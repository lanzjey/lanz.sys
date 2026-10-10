// Motion preference. Phones often have "Reduce motion" / "Remove animations" switched on (iOS and
// Android battery-saver modes do it too), which turns every animation off here, as it should by default.
// Visitors can opt back in for this site: the choice is remembered and applied by reloading.
const KEY = "lanz-motion";

export const motionOverride = () => {
  try { return window.localStorage.getItem(KEY); } catch { return null; }
};
export const deviceReducesMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export function setMotionOverride(value) {
  try { if (value) window.localStorage.setItem(KEY, value); else window.localStorage.removeItem(KEY); } catch { /* choice not remembered */ }
}

document.documentElement.classList.toggle("motion-full", motionOverride() === "full");
