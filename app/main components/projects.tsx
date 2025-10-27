import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ExternalLink, Github, Pin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectItem } from "../types/project";

function sortProjects(items: ProjectItem[]): ProjectItem[] {
  const byDate = (a: ProjectItem, b: ProjectItem) =>
    +new Date(b.updatedAt || 0) - +new Date(a.updatedAt || 0);
  const pinned = items.filter((i) => i.pinned).sort(byDate);
  const rest = items.filter((i) => !i.pinned).sort(byDate);
  return [...pinned, ...rest];
}

function fallback(src?: string) {
  return src || "/placeholder/cover.png"; // ensure you have a placeholder or change this
}

export default function Projects({
  items = [],
  title = "Selected Projects",
  ctaHref = "/projects",
  maxDesktop = 6,
}: {
  items?: ProjectItem[];
  title?: string;
  ctaHref?: string;
  maxDesktop?: number;
}) {
  const ordered = sortProjects(items);
  const topForDesktop = ordered.slice(0, Math.max(3, maxDesktop));
  const topForMobile = ordered.slice(0, 2);

  return (
    <section className="relative flex w-full items-center justify-center overflow-hidden px-6 py-12 sm:px-10">
      {/* Background (matches Landing/News look) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />
        <motion.div
          className="absolute -top-24 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 50%, hsl(var(--primary)/0.22) 0%, transparent 70%)",
          }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-20 right-10 h-72 w-72 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 50%, hsl(var(--muted-foreground)/0.22) 0%, transparent 70%)",
          }}
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex items-center justify-between gap-4"
        >
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h2>
          {ordered.length > topForDesktop.length && (
            <Button
              asChild
              variant="outline"
              size="sm"
              aria-label="See more projects"
            >
              <Link href={ctaHref}>
                See more
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          )}
        </motion.div>

        {/* Mobile: show 2 cards */}
        <div className="grid grid-cols-1 gap-6 sm:hidden">
          {topForMobile.length ? (
            topForMobile.map((p) => <ProjectCard key={p.id} item={p} />)
          ) : (
            <EmptyProjects />
          )}
        </div>

        {/* Desktop: show up to maxDesktop */}
        <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          {topForDesktop.length ? (
            topForDesktop.map((p) => <ProjectCard key={p.id} item={p} />)
          ) : (
            <div className="col-span-full">
              <EmptyProjects />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ item }: { item: ProjectItem }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.45 }}
      className="group relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/50 shadow-lg"
    >
      {item.coverImage && (
        <div className="relative aspect-[16/9] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fallback(item.coverImage)}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-background/10 to-transparent" />
        </div>
      )}

      <div className="p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {item.pinned && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
              <Pin className="h-3 w-3" aria-hidden="true" /> Pinned
            </span>
          )}
          {item.starred && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
              <Star className="h-3 w-3" aria-hidden="true" /> Highlight
            </span>
          )}
          {item.tags?.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5"
            >
              {t}
            </span>
          ))}
        </div>

        <h3 className="text-lg font-semibold">
          <Link
            href={`/projects/${item.slug}`}
            className="after:absolute after:inset-0"
          >
            {item.title}
          </Link>
        </h3>

        {item.description && (
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
            {item.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {item.liveUrl && (
            <Button asChild size="sm" variant="default" className="group/btn">
              <Link
                href={item.liveUrl}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`Open ${item.title} live`}
              >
                Live demo
                <ExternalLink
                  className="ml-1.5 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </Button>
          )}
          {item.repoUrl && (
            <Button asChild size="sm" variant="outline" className="group/btn">
              <Link
                href={item.repoUrl}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`Open ${item.title} repo`}
              >
                <Github className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Code
              </Link>
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function EmptyProjects() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card/60 p-8 text-center text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-card/50"
      role="status"
      aria-live="polite"
    >
      No projects to show yet—check back soon!
    </motion.div>
  );
}

// Optional: full list page renderer
export function AllProjectsList({
  items = [],
  title = "All Projects",
}: {
  items?: ProjectItem[];
  title?: string;
}) {
  const ordered = sortProjects(items);
  return (
    <section className="relative w-full px-6 py-12 sm:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-balance text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {title}
        </motion.h1>
        {ordered.length === 0 ? (
          <EmptyProjects />
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {ordered.map((item) => (
              <li key={item.id}>
                <ProjectCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
