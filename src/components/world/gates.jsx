// Line emblems for the seven teleport gates (see gateData.js for colours and outlines).
// Line emblem drawn on a 64 × 64 grid. Stroke colour comes from `currentColor`.
export function GateEmblem({ id }) {
  switch (id) {
    case "profile": // player avatar over an HP bar
      return <g><circle cx="32" cy="20" r="9" /><path d="M13 50c2-12 9-18 19-18s17 6 19 18" /><path d="M16 58h32" strokeWidth="3" /></g>;
    case "skills": // skill tree
      return <g><path d="M32 16v8M32 24 14 34M32 24v10M32 24l18 10M14 34v10M50 34v10" />
        <circle cx="32" cy="12" r="5" /><circle cx="14" cy="34" r="4.5" /><circle cx="32" cy="38" r="4.5" /><circle cx="50" cy="34" r="4.5" /><circle cx="14" cy="50" r="4" /><circle cx="50" cy="50" r="4" /></g>;
    case "services": // class crest: four-point star
      return <g><path d="M32 8 37 27 56 32 37 37 32 56 27 37 8 32 27 27Z" /><circle cx="32" cy="32" r="4" /></g>;
    case "missions": // quest marker
      return <g><path d="M32 4 58 32 32 60 6 32Z" /><path d="M32 18v18" strokeWidth="3.5" /><circle cx="32" cy="45" r="2.6" fill="currentColor" /></g>;
    case "experience": // level up chevrons
      return <g><path d="M12 56 32 38 52 56M12 40 32 22 52 40M12 24 32 6 52 24" /></g>;
    case "loadout": // inventory slots
      return <g><rect x="6" y="6" width="22" height="22" rx="3" /><rect x="36" y="6" width="22" height="22" rx="3" /><rect x="6" y="36" width="22" height="22" rx="3" /><rect x="36" y="36" width="22" height="22" rx="3" />
        <path d="M12 22 22 12M15 12h7v7" /><circle cx="47" cy="17" r="5" /><path d="M17 41v12M11 47h12" /><path d="M42 52 47 41 52 52Z" /></g>;
    case "contact": // chat bubble with signal
      return <g><path d="M8 12h48v30H34L22 54V42H8Z" /><circle cx="22" cy="27" r="2.6" fill="currentColor" /><circle cx="32" cy="27" r="2.6" fill="currentColor" /><circle cx="42" cy="27" r="2.6" fill="currentColor" /></g>;
    default:
      return null;
  }
}
