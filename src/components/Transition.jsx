// Full-screen scene transitions. Each kind is a different 2D motion (CSS only, transform and
// clip-path), about 0.8s end to end: 0.38s covering, then 0.44s revealing the new scene.
// The overlay never captures input, so navigation is never blocked while one plays.
const range = (count) => Array.from({ length: count }, (_, index) => index);

export default function Transition({ tx }) {
  if (!tx) return null;
  const { kind, phase, label } = tx;

  if (kind === "hub" || kind === "rays") {
    return <div className={`burst is-${phase}`} aria-hidden="true">
      <i className="burst-rays" /><i className="burst-slab" />{kind === "hub" && <b>{label}</b>}
    </div>;
  }

  return <div className={`tx tx-${kind} is-${phase}`} aria-hidden="true">
    {kind === "slash" && <><i /><i /><u className="tx-line" /></>}
    {kind === "iris" && <><i /><u className="tx-ring" /></>}
    {kind === "streaks" && range(6).map((n) => <i key={n} style={{ "--n": n }} />)}
    {kind === "grid" && range(24).map((n) => <i key={n} style={{ "--n": (n % 6) + Math.floor(n / 6) }} />)}
    {kind === "slats" && range(10).map((n) => <i key={n} style={{ "--n": n }} />)}
    {kind === "split" && <><i /><i /><u className="tx-line" /></>}
  </div>;
}
