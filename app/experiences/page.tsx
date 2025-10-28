"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, ExternalLink } from "lucide-react";
import { ExperienceItem } from "../types/experience";
import Header from "../main components/stickyheader";
import { getExperiences } from "../utils/info";

function fmtRange(start: string, end?: string) {
  return end ? `${start} — ${end}` : `${start} — Present`;
}
export default function Experiences() {
  const title = "Experiences";
  const [items, setItems] = useState<ExperienceItem[]>([]);
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const res = await getExperiences();
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
  return (
    <div>
      <Header />
      <section className="relative w-full px-6 py-12 sm:px-10 bg-[#fdf0d5] min-h-screen">
        {/* Background (soft blobs like the other sections) */}
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
            {title}
          </motion.h2>

          {/* Timeline container */}
          <div className="relative">
            {/* Center line (md+) */}
            <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full -translate-x-1/2 border-l border-border md:block" />

            <ul className="grid grid-cols-1 gap-8 md:gap-12">
              {items.map((item, idx) => (
                <li key={item.id} className="relative">
                  {/* Dot on the center line for md+ */}
                  <div className="absolute left-1/2 top-3 hidden -translate-x-1/2 md:block">
                    <span className="block h-3.5 w-3.5 rounded-full border-2 border-primary bg-background shadow-sm" />
                  </div>

                  {/* Row wrapper determines side on md+ */}
                  <div
                    className={[
                      "md:grid md:grid-cols-2 md:gap-8",
                      idx % 2 === 0
                        ? "md:[&>div:first-child]:col-start-1 md:[&>div:last-child]:col-start-2"
                        : "md:[&>div:first-child]:col-start-2 md:[&>div:last-child]:col-start-1",
                    ].join(" ")}
                  >
                    {/* spacer on the opposite side (keeps offset from the center) */}
                    <div className="hidden md:block" />

                    {/* Card */}
                    <motion.article
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 0.45 }}
                      className="relative rounded-2xl border bg-card/60 p-5 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/50"
                    >
                      {/* pointer to the center line (md+) */}
                      <span
                        className={[
                          "absolute top-4 hidden h-3 w-3 rotate-45 border-l border-t bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/50 md:block",
                          idx % 2 === 0 ? "-left-1.5" : "-right-1.5",
                        ].join(" ")}
                        aria-hidden
                      />

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
                                <ExternalLink
                                  className="ml-1 h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              </a>
                            ) : (
                              <span className="ml-2 text-sm text-muted-foreground">
                                {item.company}
                              </span>
                            )}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Calendar
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              {fmtRange(item.startDate, item.endDate)}
                            </span>
                            {item.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                                {item.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </header>

                      {item.summary && (
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {item.summary}
                        </p>
                      )}

                      {item.tags && item.tags.length > 0 && (
                        <ul className="mt-3 flex flex-wrap items-center gap-2">
                          {item.tags.map((t) => (
                            <li
                              key={t}
                              className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              {t}
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.article>
                  </div>
                </li>
              ))}
            </ul>

            {items.length === 0 && (
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
    </div>
  );
}
