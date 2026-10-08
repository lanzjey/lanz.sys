// Visual identity of the eight teleport gates. Every gate shares one drawing
// language (dark body, glowing outline, portal light, line emblem) but has its
// own silhouette, emblem and colour pair, themed after the section it leads to.
//
// Gate-local coordinates: x is centred, y runs up from the gate's feet (y = 0).

export const gateTheme = {
  profile: { a: "#d7f1ff", b: "#5fe3ff" },
  skills: { a: "#5fe3ff", b: "#9c87ff" },
  services: { a: "#c4b5ff", b: "#ff8fd0" },
  missions: { a: "#ffcb7a", b: "#ff8a2b" },
  experience: { a: "#9dff7a", b: "#5fe3ff" },
  loadout: { a: "#ffe0a0", b: "#ffa53d" },
  resume: { a: "#ffd6e0", b: "#ff6b9a" },
  contact: { a: "#7fd4ff", b: "#6a8dff" },
};

// Outline of each gate and the vertical centre of its portal.
export const gateShapes = {
  // Player: an arched doorway.
  profile: { d: "M-30 0 V-62 A30 32 0 0 1 30 -62 V0 Z", cy: -46 },
  // Skill tree: a tall hexagonal crystal.
  skills: { d: "M0 -94 L30 -76 V-26 L0 -8 L-30 -26 V-76 Z", cy: -51 },
  // Class: a heraldic shield.
  services: { d: "M0 -96 L30 -84 V-50 C30 -24 16 -9 0 -2 C-16 -9 -30 -24 -30 -50 V-84 Z", cy: -49 },
  // Quest: a pointed notice-board pylon.
  missions: { d: "M-26 0 V-84 L0 -98 L26 -84 V0 Z", cy: -49 },
  // Level: a stepped tower, one tier per level.
  experience: { d: "M-34 0 V-30 H-24 V-54 H-14 V-78 H-5 L0 -86 L5 -78 H14 V-54 H24 V-30 H34 V0 Z", cy: -43 },
  // Equipment: a bolted vault door.
  loadout: { d: "M-30 0 V-86 Q-30 -94 -22 -94 H22 Q30 -94 30 -86 V0 Z", cy: -47 },
  // Record: a keyhole, the seal on the player record.
  resume: { d: "M-16 0 L-11 -43 A28 28 0 1 1 11 -43 L16 0 Z", cy: -62 },
  // Communication: a round signal ring.
  contact: { d: "M-34 -50 A34 34 0 1 1 34 -50 A34 34 0 1 1 -34 -50 Z", cy: -50 },
};
