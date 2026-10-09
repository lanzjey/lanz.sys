import { useEffect, useState } from "react";

// Phones: an always-reachable "Hire me" button once the visitor has scrolled past the hero.
// It hides while the contact section itself is on screen.
export default function FloatingCta({ onNavigate }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const contact = document.getElementById("contact")?.getBoundingClientRect();
      const inContact = contact && contact.top < window.innerHeight * .75 && contact.bottom > 0;
      setVisible(window.scrollY > window.innerHeight * .8 && !inContact);
    };
    const request = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", request); window.removeEventListener("resize", request); };
  }, []);
  return <button type="button" className={`floating-cta ${visible ? "is-visible" : ""}`} tabIndex={visible ? 0 : -1} aria-hidden={!visible} onClick={() => onNavigate("contact")}>Hire me</button>;
}
