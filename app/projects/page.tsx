"use client";

import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { ProjectItem } from "../types/project";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../utils/firebase";
import Header from "../main components/stickyheader";
import {
  Loader2,
  Filter,
  X,
  Tag,
  ExternalLink,
  Github,
  ChevronDown,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// shadcn/ui
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Chips from "../components/chips";
import { TAG_ALIAS_CANON, LANGUAGE_ALIASES } from "../types/project";

function normalizeTagToLanguage(tag: string): string | null {
  if (!tag) return null;
  let t = tag.trim().toLowerCase();

  if (t.startsWith("lang:")) t = t.slice(5);
  if (t === "c++17" || t === "c++20" || t === "c++14") t = "c++";
  if (t === "python 3" || t === "py3") t = "python";
  if (t === "objective c") t = "objective-c";

  t = t.replace(/(\d+)$/, "");

  return LANGUAGE_ALIASES[t] ?? null;
}

function cleanToken(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeTagToken(s: string): string {
  const c = cleanToken(s);
  return TAG_ALIAS_CANON[c] ?? TAG_ALIAS_CANON[s.toLowerCase().trim()] ?? c;
}

export default function Projects() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // language filter
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [search, setSearch] = useState(""); // quick text search by title/desc

  // mobile scroll hint
  const [showHint, setShowHint] = useState(true);
  const [hasMoreMobile, setHasMoreMobile] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const qy = query(collection(db, "projects"), orderBy("updatedAt", "desc"));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        try {
          const next: ProjectItem[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as unknown as Omit<ProjectItem, "id">),
          }));
          setProjects(next);
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setIsLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const allLanguages = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) {
      const tags = (p as ProjectItem).tags as string[] | undefined;
      tags?.forEach((tag) => {
        const lang = normalizeTagToLanguage(tag);
        if (lang) set.add(lang);
      });
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const filtered = useMemo(() => {
    const q = search.trim();
    const hasQuery = q.length > 0;
    const qLower = q.toLowerCase();
    const qClean = cleanToken(q); // for “node js” vs “nodejs”
    const qNorm = normalizeTagToken(q); // apply alias canon (e.g., node -> nodejs)

    return projects.filter((p) => {
      const title = (p.title || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      const tags = (
        ((p as ProjectItem).tags as string[] | undefined) ?? []
      ).filter(Boolean);

      // Build a normalized tag-key set for this project
      const tagKeys = new Set<string>();
      for (const t of tags) {
        // raw normalized tag token (framework/tool) e.g. "nodejs", "nextjs"
        tagKeys.add(normalizeTagToken(t));
        // also include normalized language names from tags, e.g. "JavaScript"
        const lang = normalizeTagToLanguage(t);
        if (lang) tagKeys.add(cleanToken(lang)); // store cleaned form for matching
      }

      // Text search: title/description OR tags
      const matchesText = !hasQuery
        ? true
        : title.includes(qLower) ||
          desc.includes(qLower) ||
          // tag string matching (raw):
          tags.some((t) => t.toLowerCase().includes(qLower)) ||
          // normalized token matching (handles “node js” vs “nodejs”):
          tagKeys.has(qNorm) ||
          tagKeys.has(qClean);

      // Language filter (selectedLanguages are display names like "JavaScript")
      // Normalize selectedLanguages to cleaned tokens and test against this project's tags/langs.
      const selectedLangKeys = selectedLanguages.map((l) => cleanToken(l));
      const matchesLang =
        selectedLanguages.length === 0 ||
        selectedLangKeys.every((lk) => tagKeys.has(lk));

      return matchesText && matchesLang;
    });
  }, [projects, selectedLanguages, search]);

  // measure content height on mobile to decide showing hint
  useLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const check = () => {
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      if (!mobile) {
        setHasMoreMobile(false);
        setShowHint(false);
        return;
      }
      const more = el.scrollHeight > window.innerHeight * 1.05; // a bit of cushion
      setHasMoreMobile(more);
    };

    const ro = new ResizeObserver(check);
    ro.observe(el);
    check();

    const onScroll = () => {
      if (window.scrollY > 40) setShowHint(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const timer = setTimeout(() => setShowHint(false), 4500);

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, [filtered.length, isLoading]);

  const clearFilters = () => setSelectedLanguages([]);

  return (
    <div className="w-full min-h-screen">
      <AnimatePresence>
        {!isLoading && hasMoreMobile && showHint && (
          <motion.div
            key="mobile-more-hint"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.35 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 md:hidden z-[60] pointer-events-none"
            aria-hidden
          >
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="rounded-full border border-border/60 bg-card/70 backdrop-blur px-3 py-2 shadow"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <ChevronDown className="h-5 w-5" />
                <span className="text-xs">Scroll for more</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header />

      {isLoading && (
        <div className="flex flex-col justify-center min-h-screen">
          <Loader2 className="animate-spin self-center justify-self-center" />
        </div>
      )}

      {!isLoading && (
        <section
          ref={sectionRef}
          className="relative w-full px-6 py-12 sm:px-10 bg-background min-h-screen"
        >
          {/* Background */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />
          </div>

          {/* Toolbar */}
          <div className="mx-auto w-full max-w-6xl">
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 text-balance text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Projects
            </motion.h2>

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Input
                  placeholder="Search by title or description"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="sm:w-80"
                />

                <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant={
                        selectedLanguages.length ? "secondary" : "outline"
                      }
                      className="gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      Filters
                      {selectedLanguages.length
                        ? ` • ${selectedLanguages.length}`
                        : ""}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Filter by languages</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                      {allLanguages.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          There are no filters available.
                        </p>
                      ) : (
                        allLanguages.map((lang) => {
                          const checked = selectedLanguages.includes(lang);
                          return (
                            <label
                              key={lang}
                              className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer hover:bg-accent"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => {
                                  setSelectedLanguages((prev) =>
                                    v
                                      ? Array.from(new Set([...prev, lang]))
                                      : prev.filter((x) => x !== lang)
                                  );
                                }}
                              />
                              <span className="text-sm flex items-center gap-2">
                                <Tag className="h-3.5 w-3.5" /> {lang}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>

                    <DialogFooter className="justify-between sm:justify-end gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedLanguages([])}
                      >
                        Clear all
                      </Button>
                      <Button onClick={() => setIsFilterOpen(false)}>
                        Done
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Active language chips */}
              {selectedLanguages.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {selectedLanguages.map((l) => (
                    <Badge
                      key={l}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Tag className="h-3 w-3" />
                      {l}
                    </Badge>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearFilters}
                    className="gap-1"
                  >
                    <X className="h-4 w-4" /> Clear
                  </Button>
                </div>
              )}
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border bg-card/60 p-8 text-center text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-card/50"
                role="status"
                aria-live="polite"
              >
                {projects.length === 0
                  ? "There seems to be no projects."
                  : "No projects match your current filters."}
              </motion.div>
            ) : (
              <ul className="grid grid-cols-1 gap-8 md:gap-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((p) => (
                    <GridCard key={p.id} p={p} />
                  ))}
                </div>
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function GridCard({ p }: { p: ProjectItem }) {
  const tags = ((p as any).tags as string[] | undefined) ?? [];
  const title = (p as any).title || (p as any).name || "Untitled";
  const desc = (p as any).description || "";
  const repo = (p as any).repoUrl as string | undefined;
  const live = (p as any).liveUrl as string | undefined;
  const cover =
    (p.coverImage as string | undefined)?.trim() || "/project_default.png";

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.45 }}
      className="relative rounded-2xl border bg-card/60 p-5 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/50"
    >
      {/* Cover image */}
      <div className="mb-4 overflow-hidden rounded-xl border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt={`${title} cover`}
          className="h-40 w-full object-cover sm:h-44 md:h-48"
        />
      </div>

      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="p-0">
          <CardTitle className="text-lg line-clamp-1">{title}</CardTitle>
          {desc && (
            <CardDescription className="line-clamp-2">{desc}</CardDescription>
          )}
        </CardHeader>

        <CardContent className="p-0 mt-4">
          {tags.length > 0 && <Chips chips={tags} />}

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {repo && (
                <a
                  className="inline-flex items-center gap-1 hover:underline"
                  href={repo}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github className="h-3.5 w-3.5" /> Repo
                </a>
              )}
              {live && (
                <a
                  className="inline-flex items-center gap-1 hover:underline"
                  href={live}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Live
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.article>
  );
}
