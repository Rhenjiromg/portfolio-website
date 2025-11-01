import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Calendar, ArrowRight, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsItem } from "../types/news";
import { getNews } from "../utils/info";

// Utility: format a nice short date
function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// Sort with pinned first (newest pinned first), then newest others
function sortNews(items: NewsItem[]): NewsItem[] {
  const pinned = items
    .filter((i) => i.pinned)
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
  const rest = items
    .filter((i) => !i.pinned)
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
  return [...pinned, ...rest];
}

// Clamp content preview
function excerpt(text: string, n = 160) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}

export default function News() {
  const [items, setItems] = useState<NewsItem[]>([]);
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const res = await getNews();
        if (isMounted) setItems(res);
      } catch (e) {
        console.error("getProjects failed", e);
        if (isMounted) setItems([]);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);
  const ordered = sortNews(items);
  const topForDesktop = ordered.slice(0, 3);
  const topForMobile = ordered.slice(0, 1);

  return (
    <section className="overflow-hidden relative w-full px-6 py-12 sm:px-10 ">
      {/* Background (mirrors LandingInfo look) */}
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
          className="absolute -bottom-20 left-10 h-72 w-72 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 50%, hsl(var(--muted-foreground)/0.22) 0%, transparent 70%)",
          }}
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="mx-auto w-full max-w-6xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex justify-between gap-4 flex-col items-start text-center flex-col"
        >
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl self-center">
            See What Im Up To
          </h2>
          {ordered.length > 3 && (
            <Button
              asChild
              variant="outline"
              size="sm"
              aria-label="View all news"
              className="bg-[]"
            >
              <Link href={"/news"}>
                View all
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          )}
        </motion.div>

        {/* Mobile: only 1 card (pinned or most recent) */}
        <div className="grid sm:hidden">
          {topForMobile.length ? (
            <NewsCard item={topForMobile[0]} priority />
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Desktop/tablet: top 3 (pinned first) */}
        <div className="hidden grid-cols-1 gap-6 sm:grid md:grid-cols-2 lg:grid-cols-3">
          {topForDesktop.length ? (
            topForDesktop.map((item) => <NewsCard key={item.id} item={item} />)
          ) : (
            <div className="col-span-full">
              <EmptyState />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function NewsCard({
  item,
  priority = false,
}: {
  item: NewsItem;
  priority?: boolean;
}) {
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
            src={item.coverImage}
            alt=""
            className="h-full w-full object-cover"
            loading={priority ? "eager" : "lazy"}
            decoding="async"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-background/10 to-transparent" />
        </div>
      )}

      <div className="p-5">
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          <time dateTime={item.publishedAt}>{fmtDate(item.publishedAt)}</time>
          {item.pinned && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
              <Pin className="h-3 w-3" aria-hidden="true" /> Pinned
            </span>
          )}
        </div>

        <h3 className="line-clamp-2 text-lg font-semibold">
          <Link
            href={`/news/${item.id}`}
            className="after:absolute after:inset-0"
          >
            {item.title}
          </Link>
        </h3>

        {item.content && (
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
            {excerpt(item.content)}
          </p>
        )}

        <div className="mt-4">
          <Link
            href={`/news/${item.id}`}
            aria-label={`Read more about ${item.title}`}
            className="flex flex-row align-center"
          >
            Read more
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card/60 p-8 text-center text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-card/50"
      role="status"
      aria-live="polite"
    >
      Nothing to share just yet. Check back soon!
    </motion.div>
  );
}
