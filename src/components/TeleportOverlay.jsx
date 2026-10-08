const streaks = Array.from({ length: 20 }, (_, index) => ({ angle: index * 18, delay: ((index * 7) % 10) * 0.03, length: 38 + ((index * 13) % 9) * 6 }));

// Full-screen "teleport gate" shown while travelling between sections:
// light streaks, expanding rings and a destination readout over a darkened world.
export default function TeleportOverlay({ transition }) {
  if (!transition) return null;
  return <div key={transition.key} className="teleport" role="status" aria-live="polite">
    <i className="tp-grid" aria-hidden="true" />
    <span className="tp-streaks" aria-hidden="true">
      {streaks.map((streak) => <i key={streak.angle} style={{ "--a": `${streak.angle}deg`, "--d": `${streak.delay}s`, "--l": `${streak.length}vmax` }} />)}
    </span>
    <i className="tp-ring" aria-hidden="true" /><i className="tp-ring tp-ring-2" aria-hidden="true" /><i className="tp-ring tp-ring-3" aria-hidden="true" />
    <i className="tp-scan" aria-hidden="true" />
    <div className="tp-core">
      <span className="sao-diamond" aria-hidden="true" />
      <span className="tp-kicker">Teleporting to</span>
      <strong className="tp-label">{transition.label}</strong>
      {transition.subtitle && <span className="tp-sub">{transition.subtitle}</span>}
      <i className="tp-bar" aria-hidden="true" />
    </div>
    <i className="tp-flash" aria-hidden="true" />
  </div>;
}
