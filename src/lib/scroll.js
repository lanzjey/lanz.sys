import Lenis from "lenis";
import { prefersReducedMotion } from "./utils";

let lenis = null;

// Smooth wheel scrolling is for mouse users only. Touch devices keep their native, momentum-based scroll.
export function startSmoothScroll() {
  if (prefersReducedMotion() || lenis || !window.matchMedia("(pointer: fine)").matches) return () => {};
  lenis = new Lenis({ lerp: .09, wheelMultiplier: .9, smoothWheel: true });
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
  if (lenis) lenis.scrollTo(element, { offset, immediate, duration: immediate ? 0 : 1.3 });
  else element.scrollIntoView({ behavior: immediate || prefersReducedMotion() ? "auto" : "smooth", block: "start" });
}

export function setScrollLocked(locked) {
  document.documentElement.classList.toggle("scroll-locked", locked);
  if (!lenis) return;
  if (locked) lenis.stop();
  else lenis.start();
}
