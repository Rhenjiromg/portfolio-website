import React from "react";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, Github, Linkedin, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTypewriter } from "../components/typedWriting";
export default function LandingInfo() {
  const name = "Rhenjiro M. Gunawan";
  const summary =
    "I craft performant, delightful apps with modern web technologies. Open to impactful opportunities and collaborations.";
  const location = "Hayward, CA";
  const socialItems = [
    {
      icon: Github,
      label: "GitHub",
      href: "https://www.github.com/rhenjiromg",
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/rhenjirog",
    },
  ];
  const { text, cursorVisible } = useTypewriter({
    words: ["Tech Enthusiast", "Hobbyist", "Software Developer"],
    typingSpeed: 70,
    deletingSpeed: 40,
    betweenWordsDelay: 100,
    startDelay: 400,
    loop: false,
  });
  return (
    <section className="overflow-x-hidden relative flex py-12 md:min-h-screen w-full items-center justify-center overflow-hidden px-6 md:py-3 sm:px-10 flex-col mt-10 md:mt-0">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <motion.div
          className="absolute -top-32 left-1/2 h-96 w-2xl -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 50%, hsl(var(--primary)/0.25) 0%, transparent 70%)",
          }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-24 left-12 h-80 w-80 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 50%, hsl(var(--muted-foreground)/0.25) 0%, transparent 70%)",
          }}
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      {/* Content Card */}
      <div className="flex flex-col sm:flex-col lg:flex-row-reverse lg:items-start lg:gap-8 justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden sm:flex items-center justify-center w-full sm:py-2 lg:w-80 xl:w-96 lg:flex-shrink-0"
          aria-label="Intro / hero section"
          aria-hidden={true}
        >
          <div className="rounded-2xl overflow-hidden flex flex-col">
            <img
              src="/me.jpeg"
              alt="Portrait of me"
              className="rounded-2xl w-30 h-30 md:w-90 md:h-90 object-cover mt-3"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl rounded-2xl border bg-card/60 p-6 backdrop-blur-2xl supports-[backdrop-filter]:bg-card/50 sm:p-10 shadow-lg"
          aria-label="Intro / hero section"
        >
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground"
          >
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">Location:</span>
              <span>{location}</span>
            </span>
          </motion.div>

          {/* Name & Title */}
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="flex flex-row justify-center md:flex-col"
          >
            <span className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl self-center md:self-start">
              {name}
            </span>
            <div className="rounded-2xl overflow-hidden md:hidden">
              <img
                src="/me.jpeg"
                alt="Portrait of me"
                className="rounded-2xl w-40 h-40 md:w-30 md:h-30 object-cover"
              />
            </div>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-2 text-xl text-muted-foreground sm:text-2xl"
            aria-live="polite"
            aria-atomic="true"
            aria-hidden="true"
          >
            <span className="inline-flex items-center text-balance w-[100%]">
              {text}
              <span
                className={[
                  "ml-0.5 inline-block h-[1.2em] w-[1px] align-middle",
                  cursorVisible ? "bg-current" : "bg-transparent",
                ].join(" ")}
                aria-hidden="true"
              />
            </span>
          </motion.p>

          {/* Summary */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground"
          >
            {summary}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-7 flex flex-wrap items-center justify-start gap-3"
          >
            <Button
              asChild
              size="lg"
              className="w-min"
              onClick={() =>
                window.open(
                  "/Rhenjiro_October25.pdf",
                  "_blank",
                  "noopener,noreferrer"
                )
              }
            >
              <a
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Open resume"
                className="hover:underline"
              >
                View My Resume
                <ArrowRight className=" h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          </motion.div>

          {/* Socials */}
          {socialItems && socialItems.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-6 flex flex-wrap items-center gap-3"
              aria-label="Social links"
            >
              {socialItems &&
                socialItems.map(({ icon: Icon, href, label }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors hover:-translate-y-1"
                      aria-label={`Open ${label}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden md:block">{label}</span>
                    </a>
                  </li>
                ))}
            </motion.ul>
          )}
        </motion.div>
      </div>
    </section>
  );
}
