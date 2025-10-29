export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  tags?: string[];
  starred?: boolean; // personal highlight
  pinned?: boolean; // show first
  repoUrl?: string;
  liveUrl?: string;
  updatedAt?: string; // ISO string, used for sort fallback
}

// Put this near the top of the file
const LANGUAGE_ALIASES: Record<string, string> = {
  // JS/TS
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  ts: "TypeScript",
  // Python
  python: "Python",
  py: "Python",
  python3: "Python",
  // C family
  c: "C",
  "c++": "C++",
  cpp: "C++",
  cxx: "C++",
  "c#": "C#",
  csharp: "C#",
  // Mobile / JVM
  java: "Java",
  kotlin: "Kotlin",
  swift: "Swift",
  // Web / Markup
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  sass: "SCSS",
  // Others
  go: "Go",
  golang: "Go",
  rust: "Rust",
  ruby: "Ruby",
  php: "PHP",
  r: "R",
  dart: "Dart",
  scala: "Scala",
  matlab: "MATLAB",
  perl: "Perl",
  haskell: "Haskell",
  elixir: "Elixir",
  clojure: "Clojure",
  "objective-c": "Objective-C",
  "objective c": "Objective-C",
  objc: "Objective-C",
  shell: "Shell",
  bash: "Shell",
  sh: "Shell",
  zsh: "Shell",
  powershell: "PowerShell",
  pwsh: "PowerShell",
  sql: "SQL",
  lua: "Lua",
  zig: "Zig",
  solidity: "Solidity",
};

const TAG_ALIAS_CANON: Record<string, string> = {
  // Node
  node: "nodejs",
  nodejs: "nodejs",
  "node.js": "nodejs",
  // Next
  next: "nextjs",
  nextjs: "nextjs",
  "next.js": "nextjs",
  // React
  react: "react",
  reactjs: "react",
  "react.js": "react",
  // Express
  express: "express",
  expressjs: "express",
  "express.js": "express",
  // Tailwind
  tailwind: "tailwind",
  tailwindcss: "tailwind",
  "tailwind css": "tailwind",
  // Common others
  firebase: "firebase",
  prisma: "prisma",
  supabase: "supabase",
  mongodb: "mongodb",
  postgres: "postgres",
  postgresql: "postgres",
  mysql: "mysql",
  docker: "docker",
  kubernetes: "kubernetes",
  jest: "jest",
  vitest: "vitest",
};

export { TAG_ALIAS_CANON, LANGUAGE_ALIASES };
