// Scene transitions. Each one tells the story of the step it connects and borrows the motifs of
// the two scenes: a light that concentrates and sweeps (home to about), angular panels that
// part (about to projects), interface lines that grow into a grid (projects to skills), lines
// that reorganise into a structure (skills to services), cards that recede and reform as an
// archive (services to certificates), cards that align into a document (certificates to resume),
// and a cyan light that leads out of the grid (resume to contact).
// CSS transform and opacity only, about 0.8s end to end (0.38s covering, 0.44s revealing).
// The overlay never captures input, so navigation is never blocked while one plays.
const range = (count) => Array.from({ length: count }, (_, index) => index);

export default function Transition({ tx }) {
  if (!tx) return null;
  const { kind, phase, label } = tx;

  if (kind === "hub") {
    return <div className={`burst is-${phase}`} aria-hidden="true">
      <i className="burst-rays" /><i className="burst-slab" /><b>{label}</b>
    </div>;
  }

  return <div className={`tx tx-${kind} is-${phase}`} aria-hidden="true">
    {kind === "light" && <><i className="lt-slab" /><i className="lt-edge" /></>}
    {kind === "panels" && range(5).map((n) => <i key={n} style={{ "--n": n }} />)}
    {kind === "grid" && <>
      <i className="veil" />
      {range(7).map((n) => <i key={`h${n}`} className="h" style={{ "--n": n }} />)}
      {range(9).map((n) => <i key={`v${n}`} className="v" style={{ "--n": n }} />)}
    </>}
    {kind === "truss" && <>
      <i className="veil" />
      {range(6).map((n) => <i key={n} className="line" style={{ "--a": `${n * 30}deg` }} />)}
    </>}
    {kind === "archive" && <>
      <i className="veil" />
      {range(4).map((n) => <i key={n} className="card" style={{ "--n": n }} />)}
    </>}
    {kind === "align" && <>
      <i className="veil" />
      {range(5).map((n) => <i key={n} className="card" style={{ "--n": n, "--r": `${(n - 2) * 7}deg`, "--x": `${(n - 2) * 9}%`, "--y": `${(n % 2 ? 1 : -1) * 6}%` }} />)}
    </>}
    {kind === "guide" && <>
      <i className="veil" />
      {range(5).map((n) => <i key={n} className="h" style={{ "--n": n }} />)}
      <u className="beam" />
    </>}
  </div>;
}
