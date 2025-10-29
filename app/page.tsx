"use client";
import { useEffect, useRef, useState } from "react";
import LandingInfo from "./main components/landing";
import StickyHeader from "./main components/stickyheader";
import News from "./main components/news";
import Projects from "./main components/projects";
import ContactMe from "./main components/contactme";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const topRef = useRef<HTMLDivElement | null>(null);

  const scrollToTarget = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    scrollToTarget();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(false);
  }, []);

  return (
    <div
      ref={topRef}
      className="min-h-screen min-w-screen overflow-y-hidden overflow-x-auto text-black gap-y-3 relative"
    >
      <StickyHeader />
      <LandingInfo />
      <News />
      <Projects />
      <ContactMe />

      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loading-overlay"
            initial={{ y: 0 }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[9999] bg-[#fdf0d5] flex items-center justify-center"
            aria-label="Loading"
            role="status"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
