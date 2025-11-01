"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarDays,
  Tag as TagIcon,
  ExternalLink,
} from "lucide-react";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/app/utils/firebase";
import { NewsItem } from "@/app/types/news";
import Header from "@/app/main components/stickyheader";

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
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  const byBlank = normalized.split(/\n\s*\n/).filter(Boolean);
  if (byBlank.length > 1) return byBlank;
  return normalized.split(/\n/).filter(Boolean);
};

// --------------------------------------
// Carousel Component
// --------------------------------------
function ImageCarousel({
  images,
}: {
  images: { src: string; alt?: string }[];
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: images.length > 1,
    align: "start",
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (i: number) => emblaApi?.scrollTo(i),
    [emblaApi]
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi]);

  if (!images.length) return null;

  return (
    <div className="relative bg-[]">
      <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex">
          {images.map((img, idx) => (
            <div className="min-w-0 flex-[0_0_100%]" key={`${img.src}-${idx}`}>
              <div className="relative aspect-[16/9] w-full bg-[]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={img.alt || `image ${idx + 1}`}
                  className="h-full w-full rounded-2xl object-cover"
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white focus:outline-none"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white focus:outline-none"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-white/80 px-3 py-1 shadow">
            {images.map((_, i) => (
              <button
                key={i}
                className={cx(
                  "h-2 w-2 rounded-full transition",
                  selectedIndex === i
                    ? "bg-gray-900"
                    : "bg-gray-400 hover:bg-gray-500"
                )}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => scrollTo(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// --------------------------------------
// Expandable Content
// --------------------------------------
function ExpandableContent({
  content,
  collapsedLines = 6,
}: {
  content: string;
  collapsedLines?: number;
}) {
  const [expanded, setExpanded] = useState(false);
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

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-black focus:outline-none"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      </div>
    </div>
  );
}

// --------------------------------------
// Tags
// --------------------------------------
function Tags({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
        <TagIcon className="h-4 w-4" /> Tags
      </span>
      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

// --------------------------------------
// NewsItem Viewer (UI only)
// --------------------------------------
function NewsItemViewer({
  item,
  collapsedLines = 6,
}: {
  item: NewsItem;
  collapsedLines?: number;
}) {
  const images = useMemo(() => {
    const list: { src: string; alt?: string }[] = [];
    if (item.coverImage)
      list.push({ src: item.coverImage, alt: `${item.title} — cover` });
    if (item.images?.length) list.push(...item.images);
    return list;
  }, [item.coverImage, item.images, item.title]);

  const published = formatDate(item.publishedAt);
  const updated = formatDate(item.updatedAt);

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 backdrop-blur-2xl">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex flex-col gap-1">
          {item.pinned && (
            <span className="w-fit rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              Pinned
            </span>
          )}
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {item.title}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {published && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-4 w-4" /> {published}
              </span>
            )}
            {updated && updated !== published && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" /> Updated {updated}
              </span>
            )}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
              >
                View source <ExternalLink className="h-4 w-4" />
              </a>
            )}
            {item.draft && (
              <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                Draft
              </span>
            )}
          </div>
          <Tags tags={item.tags} />
        </div>
      </div>

      {/* Carousel */}
      {images.length > 0 && (
        <div className="mb-6">
          <ImageCarousel images={images} />
        </div>
      )}

      {/* Content */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-2xl">
        <ExpandableContent
          content={item.content}
          collapsedLines={collapsedLines}
        />
      </div>
    </div>
  );
}

// --------------------------------------
// Data Fetching (Client-side in this standalone page)
// --------------------------------------
async function fetchNewsItemById(id: string): Promise<NewsItem | null> {
  try {
    const ref = doc(db, "news", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const raw = snap.data() as Partial<NewsItem> & {
      publishedAt?: Timestamp;
      updatedAt?: Timestamp;
    };

    // Helper to normalize Firestore Timestamp or string to ISO string
    const toIso = (v: Timestamp | undefined): string | undefined => {
      if (!v) return undefined;
      if (typeof v === "string") return v;
      if (v instanceof Timestamp) return v.toDate().toISOString();
      return undefined;
    };

    const item: NewsItem = {
      id: snap.id,
      title: raw.title ?? "Untitled",
      content: raw.content ?? "",
      publishedAt: toIso(raw.publishedAt) ?? new Date().toISOString(),
      updatedAt: toIso(raw.updatedAt),
      coverImage: raw.coverImage,
      images: Array.isArray(raw.images)
        ? (raw.images as { src: string; alt?: string }[])
        : undefined,
      tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : undefined,
      url: raw.url,
      draft: !!raw.draft,
      pinned: !!raw.pinned,
    };

    return item;
  } catch (err) {
    console.error("fetchNewsItemById Firestore error", err);
    return null;
  }
}

// --------------------------------------
// Page Component (standalone)
// Location: app/news/[id]/page.tsx
// --------------------------------------
export default function Page() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [item, setItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!id) {
        setError("Missing id");
        setLoading(false);
        return;
      }
      setLoading(true);
      const data = await fetchNewsItemById(id);
      if (!active) return;
      if (!data) {
        setError("Not found");
        setLoading(false);
        return;
      }
      setItem(data);
      setLoading(false);
    };
    run();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="mb-4 h-6 w-2/3 animate-pulse rounded bg-gray-200" />
        <div className="mb-6 aspect-[16/9] w-full animate-pulse rounded-2xl bg-gray-200" />
        <div className="space-y-3">
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-4/6 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center">
        <h1 className="mb-2 text-2xl font-semibold">
          {error === "Not found" ? "News not found" : "Something went wrong"}
        </h1>
        <p className="text-gray-600">
          {error === "Not found"
            ? "This story cannot be found"
            : "Please try again later."}
        </p>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="bg-[] min-h-screen">
      <Header currentRoute="home" />
      <NewsItemViewer item={item} collapsedLines={8} />
    </div>
  );
}

// --------------------------------------
// Notes
// - This page is a Client Component so it can stand alone and read the id via useParams().
// - Replace fetchNewsItemById() with your actual API or data fetching logic.
// - If you prefer Server Components, move the UI bits into a separate Client component and fetch the data in a server page.
