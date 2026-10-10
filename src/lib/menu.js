// Section order shared by the hero menu, the side menu, the scene journey and the transitions.
export const menuItems = [
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "services", label: "Services" },
  { id: "certificates", label: "Certificates" },
  { id: "resume", label: "Resume" },
  { id: "contact", label: "Contact" },
];

export const labelFor = (id) => (id === "home" ? "Home" : menuItems.find((item) => item.id === id)?.label || "");

export const toRoman = (value) => {
  const map = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let rest = value;
  return map.reduce((out, [n, s]) => { while (rest >= n) { out += s; rest -= n; } return out; }, "");
};
