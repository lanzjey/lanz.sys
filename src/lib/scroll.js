import Lenis from "lenis";
import { prefersReducedMotion } from "./utils";

// Shared, render-free scroll state read by the canvases and 3D scenes every frame.
export const scrollState = { y: 0, velocity: 0, hero: 0 };

let lenis = null;

export function startSmoothScroll() {
  if (prefersReducedMotion() || lenis) return () => {};
  lenis = new Lenis({ lerp: .085, wheelMultiplier: .9, smoothWheel: true });
  document.documentElement.classList.add("has-smooth-scroll");
  let frame = requestAnimationFrame(function raf(time) {
    lenis?.raf(time);
    frame = requestAnimationFrame(raf);
  });
  return () => {
    cancelAnimationFrame(frame);
    lenis?.destroy();
    lenis = null;
    document.documentElement.classList.remove("has-smooth-scroll");
  };
}

export function scrollToElement(element, { immediate = false } = {}) {
  if (!element) return;
  const offset = element.matches("main > section") ? 0 : -96;
  if (lenis) lenis.scrollTo(element, { offset, immediate, duration: immediate ? 0 : 1.4 });
  else element.scrollIntoView({ behavior: immediate || prefersReducedMotion() ? "auto" : "smooth", block: "start" });
}

export function setScrollLocked(locked) {
  if (!lenis) return;
  if (locked) lenis.stop();
  else lenis.start();
}
