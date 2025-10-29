import {
  SiGo,
  SiPython,
  SiTypescript,
  SiReact,
  SiGithub,
  SiJavascript,
  SiPostgresql,
  SiSqlite,
  SiNodedotjs,
  SiExpo,
  SiFastapi,
} from "@icons-pack/react-simple-icons";

type ChipsProps = {
  chips: string[];
  type?: "row" | "grid";
  hideOnMobile?: boolean;
};

export default function Chips({
  chips,
  type = "row",
  hideOnMobile = false,
}: ChipsProps) {
  const containerClass =
    type === "grid"
      ? "mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2"
      : "mt-3 flex flex-wrap items-center gap-2";

  return (
    <ul className={containerClass}>
      {chips.map((raw) => {
        const key = normalize(raw);
        const Icon = pickIcon(key);
        return (
          <li
            key={raw}
            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
            title={raw}
          >
            {Icon ? <Icon size={14} aria-hidden /> : null}
            {hideOnMobile && <span className="hidden md:block">{raw}</span>}
            {!hideOnMobile && <span className="">{raw}</span>}
          </li>
        );
      })}
    </ul>
  );
}

/* ---------------- helpers ---------------- */

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickIcon(key: string) {
  // normalize aliases
  if (key === "go" || key === "golang") return SiGo;
  if (key === "python") return SiPython;
  if (key === "ts" || key === "typescript") return SiTypescript;
  if (key === "js" || key === "javascript") return SiJavascript;
  if (key === "react" || key === "react native") return SiReact; // RN reuses React logo
  if (key === "github") return SiGithub;
  if (key === "postgres" || key === "postgresql" || key === "postgress")
    return SiPostgresql;
  if (key === "sql") return SiSqlite; // generic SQL fallback
  if (key === "node js") return SiNodedotjs;
  if (key === "expo") return SiExpo;
  if (key === "fastapi") return SiFastapi;

  return undefined;
}
