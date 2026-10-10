import { prefersReducedMotion } from "./utils";

// Scrolls an element to the top of its scene. Scenes scroll inside themselves, not the window.
export function scrollToElement(element, { immediate = false } = {}) {
  element?.scrollIntoView({ behavior: immediate || prefersReducedMotion() ? "auto" : "smooth", block: "start" });
}

// Freezes the scene underneath the project panel and the mobile menu.
export function setScrollLocked(locked) {
  document.documentElement.classList.toggle("scroll-locked", locked);
}
