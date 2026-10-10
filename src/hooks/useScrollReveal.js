import { useLayoutEffect } from "react";
import { prefersReducedMotion } from "../lib/utils";

// Scroll-triggered reveals inside a scene. Anything that starts below the fold is held back
// (fade and slide up), then released with a short stagger as it scrolls into view, once.
// Elements already on screen when the scene opens keep the normal entrance animation.
//
// It works from touch swipes and momentum scrolling the same as from a wheel: an
// IntersectionObserver does the job, and a passive scroll listener sweeps up anything the
// observer missed, so nothing can stay invisible. Reduced motion skips the whole thing.
const TARGETS = [
  ".sec-head", ".filter-bar", ".subsection > *", ".about-grid > *", ".card", ".proj-list > li", ".proj-preview",
  ".tool", ".steps li", ".timeline-item", ".facts > div", ".resume-card", ".contact-info > *", ".contact-form > *",
  ".scene-nav", ".footer",
].join(", ");

export function useScrollReveal(scene) {
  useLayoutEffect(() => {
    if (!scene || scene === "home" || prefersReducedMotion()) return undefined;
    const root = document.querySelector(".scene");
    if (!root) return undefined;

    const pending = new Set();
    const seen = new WeakSet();
    const reveal = (elements) => {
      elements.forEach((element, index) => {
        element.style.setProperty("--sr-d", `${Math.min(index, 6) * 70}ms`);
        element.classList.add("is-in");
        pending.delete(element);
        observer?.unobserve(element);
      });
    };

    const observer = "IntersectionObserver" in window
      ? new IntersectionObserver((entries) => reveal(entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target)), { root, threshold: .06, rootMargin: "0px 0px -5% 0px" })
      : null;

    const hold = (element) => {
      if (seen.has(element)) return;
      seen.add(element);
      if (element.getBoundingClientRect().top < root.clientHeight * .95) return;
      element.setAttribute("data-sr", "");
      pending.add(element);
      observer?.observe(element);
    };
    const scan = () => root.querySelectorAll(TARGETS).forEach(hold);

    let frame = 0;
    const sweep = () => {
      frame = 0;
      const limit = root.getBoundingClientRect().top + root.clientHeight * .97;
      const due = [...pending].filter((element) => element.getBoundingClientRect().top < limit);
      if (due.length) reveal(due);
    };
    const onScroll = () => { if (pending.size && !frame) frame = requestAnimationFrame(sweep); };

    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(root, { childList: true, subtree: true });
    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // A last safety net: whatever is still held after a while and on screen is shown.
    const safety = window.setInterval(sweep, 1500);

    return () => {
      observer?.disconnect();
      mutations.disconnect();
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.clearInterval(safety);
      cancelAnimationFrame(frame);
    };
  }, [scene]);
}
