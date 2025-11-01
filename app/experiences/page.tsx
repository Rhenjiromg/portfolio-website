"use client";
import { AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

import React, {
  useEffect,
  useMemo,
  useState,
  useLayoutEffect,
  useRef,
} from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, ExternalLink, Loader2 } from "lucide-react";
import { ExperienceItem } from "../types/experience";
import Header from "../main components/stickyheader";
import { getExperiences } from "../utils/info";
import Chips from "../components/chips";

function fmtRange(start: string, end?: string) {
  return end ? `${start} — ${end}` : `${start} — Present`;
}

function getYear(d?: string) {
  if (!d) return undefined;
  const m = /^(\d{4})/.exec(d.trim());
  return m ? m[1] : undefined;
}

export default function Experiences() {
  const [items, setItems] = useState<ExperienceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [hasMoreMobile, setHasMoreMobile] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const check = () => {
      const isMobile = window.innerWidth < 768;
      if (!isMobile) {
        setHasMoreMobile(false);
        setShowHint(false);
        return;
      }

      const doc = document.documentElement;
      const pageHeight = doc.scrollHeight;
      const viewHeight = window.innerHeight;

      const more = pageHeight > viewHeight + 24;
      setHasMoreMobile(more);

      const scrolledY = window.scrollY || doc.scrollTop;
      const nearBottom = scrolledY + viewHeight >= pageHeight - 80;

      setShowHint(more && scrolledY < 200 && !nearBottom);
    };

    check();
    const onScroll = () => {
      requestAnimationFrame(check);
    };
    const onResize = () => requestAnimationFrame(check);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [isLoading]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const res = await getExperiences();
        if (isMounted) setItems(res ?? []);
      } catch (e) {
        console.error("getExperiences failed", e);
        if (isMounted) setItems([]);
      } finally {
        setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const sorted = useMemo(() => {
    const toKey = (s?: string) => (s && /(\d{4})/.test(s) ? s : "0000");
    return [...items].sort((a, b) =>
      toKey(b.startDate).localeCompare(toKey(a.startDate))
    );
  }, [items]);

  return (
    <div className="">
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

      <Header currentRoute="experience" />
      {isLoading && (
        <div className="flex flex-col justify-center min-h-screen">
          <Loader2 className="animate-spin self-center justify-self-center" />
        </div>
      )}
      {!isLoading && (
        <section className="relative w-full px-6 py-12 sm:px-10 bg-background min-h-screen">
          {/* Background */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />
          </div>

          <div className="mx-auto w-full max-w-6xl">
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-10 text-balance text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Experiences
            </motion.h2>

            {/* Timeline container */}
            <div className="relative">
              {/* Center line (md+) */}
              <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full -translate-x-1/2 border-l border-border md:block" />

              <ExperienceList sorted={sorted} />

              {sorted.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border bg-card/60 p-8 text-center text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-card/50"
                  role="status"
                  aria-live="polite"
                >
                  No experience to show just yet.
                </motion.div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function ExperienceList({ sorted }: { sorted: ExperienceItem[] }) {
  return (
    <ul className="grid grid-cols-1 gap-8 md:gap-12">
      {sorted.map((item, idx) => {
        const sideRight = idx % 2 === 0; // md+: alternate
        const year = getYear(item.startDate);
        const prevYear = getYear(sorted[idx - 1]?.startDate);
        const isYearHead = year && year !== prevYear;
        return (
          <Row
            key={item.id}
            sideRight={sideRight}
            isYearHead={Boolean(isYearHead)}
            year={year}
          >
            <CardContent item={item} />
          </Row>
        );
      })}
    </ul>
  );
}

function Row({
  children,
  sideRight,
  isYearHead,
  year,
}: {
  children: React.ReactNode;
  sideRight: boolean;
  isYearHead: boolean;
  year?: string;
}) {
  const liRef = useRef<HTMLLIElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [top, setTop] = useState<number>(0);

  useLayoutEffect(() => {
    const measure = () => {
      const li = liRef.current;
      const card = cardRef.current;
      if (!li || !card) return;
      setTop(card.offsetTop + card.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (cardRef.current) ro.observe(cardRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <li ref={liRef} className="relative">
      <span
        className="pointer-events-none absolute hidden my-0 h-3.5 w-3.5 -translate-x-1/2 translate-y-[-50%] rounded-full border-2 border-primary bg-background shadow-sm md:block"
        style={{ left: "50%", top }}
        aria-hidden
      />

      {/* Row grid */}
      <div className="md:grid md:grid-cols-2 md:gap-8">
        {/* Spacer side */}
        <div
          className={"hidden md:block " + (sideRight ? "" : "md:order-2")}
        ></div>

        {/* Card side */}
        <div className={sideRight ? "" : "md:order-1"}>
          {isYearHead && (
            <div
              className={
                (sideRight ? "md:text-left" : "md:text-right") +
                " hidden md:block mb-2"
              }
              aria-hidden
            >
              <span className="inline-block rounded-full border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-card/50">
                {year}
              </span>
            </div>
          )}

          <motion.article
            ref={cardRef}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.45 }}
            className="relative rounded-2xl border bg-card/60 p-5 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/50"
          >
            {children}
          </motion.article>
        </div>
      </div>
    </li>
  );
}

function CardContent({ item }: { item: ExperienceItem }) {
  return (
    <>
      <header className="flex items-start gap-3">
        {item.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.logo}
            alt=""
            className="h-10 w-10 rounded-lg object-cover"
          />
        )}
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-tight">
            {item.role}
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer noopener"
                className="ml-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                aria-label={`Open ${item.company}`}
              >
                {item.company}
                <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ) : (
              <span className="ml-2 text-sm text-muted-foreground">
                {item.company}
              </span>
            )}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              {fmtRange(item.startDate, item.endDate)}
            </span>
            {item.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {item.location}
              </span>
            )}
          </div>
        </div>
      </header>

      {item.summary &&
        (() => {
          const raw = item.summary.trim();
          let lines = raw.split(/\r?\n/).filter(Boolean);
          if (lines.length <= 1) {
            const parts = raw.split(/\s*-\s+/).filter(Boolean);
            if (parts.length > 1) lines = parts;
          }
          if (lines.length > 1) {
            return (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
                {lines.map((l, i) => (
                  <li key={i}>{l.replace(/^[-*]\s*/, "")}</li>
                ))}
              </ul>
            );
          }
          return (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {item.summary}
            </p>
          );
        })()}

      {item.tags && item.tags.length > 0 && <Chips chips={item.tags} />}
    </>
  );
}
