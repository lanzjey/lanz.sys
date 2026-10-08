export const skills = [
  { name: "React", category: "Technical", level: "Intermediate", description: "Component-driven interfaces and responsive web experiences.", related: ["JavaScript", "CSS"] },
  { name: "JavaScript", category: "Technical", level: "Intermediate", description: "Interactive frontend applications and browser APIs.", related: ["React", "Vite"] },
  { name: "Python", category: "Technical", level: "Intermediate", description: "Scripting, automation, APIs, and experimentation.", related: ["AI / ML", "GIS"] },
  { name: "GIS", category: "Technical", level: "Intermediate", description: "Interactive maps and location-based application concepts.", related: ["Leaflet", "FloodWatch GIS"] },
  { name: "AI / ML", category: "Technical", level: "Beginner", description: "Computer vision and machine-learning experimentation.", related: ["Python", "YOLO"] },
  { name: "UI / UX", category: "Creative", level: "Intermediate", description: "Visual hierarchy, interface structure, and practical user flows.", related: ["Figma", "Web"] },
  { name: "Video Editing", category: "Creative", level: "Intermediate", description: "Short-form edits, presentations, and digital content.", related: ["Motion", "Audio"] },
  { name: "Virtual Assistance", category: "Digital", level: "Intermediate", description: "Organized digital support, research, and admin workflows.", related: ["Research", "Documentation"] },
  { name: "Research", category: "Digital", level: "Add level", description: "Add a short description of research and information-gathering workflows.", related: ["Documentation"] },
  { name: "Data Management", category: "Administrative", level: "Add level", description: "Add details about data organization and record-keeping workflows.", related: ["Spreadsheets"] },
  { name: "Social Media", category: "Social", level: "Add level", description: "Add details about content and social-platform workflows.", related: ["Content planning"] },
];

export const skillCategories = ["All", ...new Set(skills.map((skill) => skill.category))];
