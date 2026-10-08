import { useEffect, useState } from "react";

export function Eyebrow({ index, children }) {
  return <p className="eyebrow"><span className="sao-diamond" aria-hidden="true" /><span className="eyebrow-index">{index}</span>{children}</p>;
}

// Section title with a giant outlined word drifting behind it as you scroll.
export function SectionHeader({ index, eyebrow, title, text, id, word }) {
  return <>
    {word && <span className="bg-word scroll-fx" aria-hidden="true">{word}</span>}
    <header className="section-header scroll-fx">
      <Eyebrow index={index}>{eyebrow}</Eyebrow>
      <h2 id={id}>{title}</h2>
      {text && <p className="section-lead">{text}</p>}
    </header>
  </>;
}

// Player HUD: name tag + segmented HP gauge.
export function HPBar({ name, value = 100, max = 100, className = "" }) {
  return <div className={`hp-hud ${className}`} role="img" aria-label={`${name}: HP ${value} of ${max}`}>
    <span className="hp-name">{name}</span>
    <span className="hp-track"><i style={{ "--hp": value / max }} /></span>
    <span className="hp-value">{value}<small>/{max}</small></span>
  </div>;
}

export function Typewriter({ words, reducedMotion }) {
  const [text, setText] = useState(reducedMotion ? words[0] : "");
  useEffect(() => {
    if (reducedMotion || !words.length) return undefined;
    let word = 0;
    let char = 0;
    let deleting = false;
    let timer;
    const tick = () => {
      const current = words[word];
      char += deleting ? -1 : 1;
      setText(current.slice(0, char));
      if (!deleting && char === current.length) { deleting = true; timer = window.setTimeout(tick, 2000); return; }
      if (deleting && char === 0) { deleting = false; word = (word + 1) % words.length; timer = window.setTimeout(tick, 380); return; }
      timer = window.setTimeout(tick, deleting ? 26 : 58);
    };
    timer = window.setTimeout(tick, 900);
    return () => window.clearTimeout(timer);
  }, [words, reducedMotion]);
  return <span className="typewriter">
    <span aria-hidden="true">{text}</span><span className="caret" aria-hidden="true" />
    <span className="sr-only">{words.join(", ")}</span>
  </span>;
}

export function Arrow({ direction = "up-right" }) {
  const paths = { "up-right": "M7 17 17 7M8 7h9v9", right: "M5 12h14M13 6l6 6-6 6", down: "M12 5v14M6 13l6 6 6-6", up: "M12 19V5M6 11l6-6 6 6" };
  return <svg className="icon-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[direction]} /></svg>;
}
