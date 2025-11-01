"use client";

import Header from "@/app/main components/stickyheader";
import { ProjectItem } from "@/app/types/project";
import { db } from "@/app/utils/firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import {
  Loader2,
  CalendarDays,
  Clock,
  Tag as TagIcon,
  Github,
  ExternalLink,
  Star,
  Pin,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Chips from "@/app/components/chips";

// --------------------------------------
// Utils
// --------------------------------------
const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : undefined;

const splitIntoParagraphs = (text: string): string[] => {
  const normalized = (text || "").replace(/\r\n?/g, "\n").trim();
  const byBlank = normalized.split(/\n\s*\n/).filter(Boolean);
  if (byBlank.length > 1) return byBlank;
  return normalized.split(/\n/).filter(Boolean);
};

// Normalize Firestore Timestamp | string -> string ISO
const toIso = (v: unknown): string | undefined => {
  if (!v) return undefined;
  if (typeof v === "string") return v;
  if (v instanceof Timestamp) return v.toDate().toISOString();
  return undefined;
};

// --------------------------------------
// Data
// --------------------------------------
const getProjectById = async (id: string): Promise<ProjectItem | null> => {
  const cleanedId = id.split("%", 1)[0];
  const ref = doc(db, "projects", cleanedId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const raw = snap.data() as unknown as ProjectItem;

  // Ensure we always include the doc id, and normalize shapes
  const project: ProjectItem = {
    id: snap.id,
    title: raw.title ?? "Untitled",
    description: raw.description ?? "",
    content: raw.content ?? "",
    additionalInfo: Array.isArray(raw.additionalInfo) ? raw.additionalInfo : [],
    coverImage: raw.coverImage,
    tags: Array.isArray(raw.tags) ? raw.tags : undefined,
    starred: !!raw.starred,
    pinned: !!raw.pinned,
    repoUrl: raw.repoUrl,
    liveUrl: raw.liveUrl,
    updatedAt: toIso(raw.updatedAt),
  };
  return project;
};

function ExpandableContent({
  content,
  collapsedLines = 8,
}: {
  content: string;
  collapsedLines?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const paragraphs = useMemo(() => splitIntoParagraphs(content), [content]);

  return (
    <div className="relative">
      <AnimatePresence initial={false}>
        {!expanded ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className={cx(
                "prose prose-neutral max-w-none text-gray-800",
                "[&>p]:mb-4 [&>p:last-child]:mb-0"
              )}
              style={{
                display: "-webkit-box",
                WebkitLineClamp: collapsedLines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 from-white to-transparent" />
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="prose prose-neutral max-w-none text-gray-800 [&>p]:mb-4 [&>p:last-child]:mb-0">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdditionalInfo({
  items,
}: {
  items: { title: string; answer: string }[];
}) {
  const [open, setOpen] = useState<number | null>(null);
  if (!items?.length) return null;

  return (
    <div className="mt-6 space-y-3">
      {items.map((it, idx) => {
        const isOpen = open === idx;
        return (
          <div
            key={`${it.title}-${idx}`}
            className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : idx)}
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left"
            >
              <span className="font-medium text-gray-900">{it.title}</span>
              <span
                className={cx(
                  "ml-4 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-transform",
                  isOpen && "rotate-45"
                )}
                aria-hidden
              >
                +
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <div className="px-4 pb-4 pt-0 text-gray-700">
                    <div className="prose prose-neutral max-w-none whitespace-pre-wrap">
                      {it.answer}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// --------------------------------------
// Viewer
// --------------------------------------
function ProjectViewer({ item }: { item: ProjectItem }) {
  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 backdrop-blur-2xl">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {item.pinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                <Pin className="h-3.5 w-3.5" /> Pinned
              </span>
            )}
            {item.starred && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">
                <Star className="h-3.5 w-3.5" /> Highlight
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {item.title}
          </h1>

          <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {item.repoUrl && (
              <a
                href={item.repoUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
              >
                <Github className="h-4 w-4" /> Repository
              </a>
            )}
            {item.liveUrl && (
              <a
                href={item.liveUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
              >
                Live Demo <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          <Chips chips={item?.tags ?? []} />
        </div>
      </div>

      {/* Cover Image (optional) */}
      {item.coverImage && (
        <div className="mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.coverImage}
            alt={`${item.title} — cover`}
            className="h-auto w-full rounded-2xl object-cover shadow-sm ring-1 ring-black/5"
          />
        </div>
      )}

      {/* Description */}
      {item.description && (
        <div className="mb-4 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            {item.description}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-2xl">
        <ExpandableContent content={item.content} collapsedLines={10} />
      </div>

      {/* Additional Info (Collapsible) */}
      {item.additionalInfo?.length ? (
        <AdditionalInfo items={item.additionalInfo} />
      ) : null}
    </div>
  );
}

// --------------------------------------
// Page Component
// --------------------------------------
export default function SeeMoreProject() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!id) {
        setError("Missing id");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const item = await getProjectById(id);
        if (!active) return;
        if (!item) {
          setError("no project with that id was found");
          setIsLoading(false);
          return;
        }
        setProject(item);
        setError(null);
      } catch (e) {
        console.error(e);
        if (active) setError("Something went wrong");
      } finally {
        if (active) setIsLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen w-full overflow-hidden">
      <Header currentRoute="project" />

      {isLoading && (
        <div className="mx-auto max-w-3xl p-4 sm:p-6">
          <div className="mb-4 h-6 w-2/3 animate-pulse rounded bg-gray-200" />
          <div className="mb-6 aspect-[16/9] w-full animate-pulse rounded-2xl bg-gray-200" />
          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="mx-auto max-w-3xl p-6 text-center">
          <h1 className="mb-2 text-2xl font-semibold">
            {error === "no project with that id was found"
              ? "Project not found"
              : "Something went wrong"}
          </h1>
          <p className="text-gray-600">
            {error === "no project with that id was found"
              ? "That project could not be found"
              : "Please try again later."}
          </p>
        </div>
      )}

      {!isLoading && !error && project && (
        <div className="pt-3 py-12">
          <ProjectViewer item={project} />
        </div>
      )}
    </div>
  );
}
