"use client";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerH, setHeaderH] = useState<number>(0);

  // Measure header height so the fixed menu sits *under* it
  useEffect(() => {
    const el = headerRef.current;
    const measure = () => setHeaderH(el ? el.offsetHeight : 0);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Optional: lock scroll behind the menu (doesn't change look)
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 backdrop-blur-md shadow-md select-none bg-[#bcb29e]"
    >
      <div className="mx-auto flex items-center justify-between px-8 py-3 text-black font-semibold text-xl">
        {/* Desktop Nav (left placeholder kept as in your code) */}
        <div></div>

        <nav className="hidden md:flex space-x-6">
          <a href="/" className="hover:text-white hover:cursor-pointer">
            Home
          </a>
          <a
            href="/experiences"
            className="hover:text-white hover:cursor-pointer"
          >
            Experiences
          </a>
          <a
            href="/projects"
            className=" hover:text-white hover:cursor-pointer"
          >
            Projects
          </a>
          <a
            href="/education"
            className=" hover:text-white hover:cursor-pointer"
          >
            Education
          </a>
          <a
            href="/personal"
            className=" hover:text-white hover:cursor-pointer"
          >
            Personal
          </a>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-600"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu (fixed overlay, same styling as your original) */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            key="mobile-menu"
            className="md:hidden backdrop-blur bg-[#bcb29e] border-gray-200 shadow-2xl h-screen items-center flex flex-col"
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              top: headerH, // sits directly under the header
              zIndex: 50,
            }}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <a
              href="/"
              className="block px-4 py-2 text-gray-600 text-3xl hover:bg-gray-100 mt-[60%]"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </a>
            <a
              href="/experiences"
              className="block px-4 py-2 text-gray-600 text-3xl hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              Projects
            </a>
            <a
              href="/projects"
              className="block px-4 py-2 text-gray-600 text-3xl hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              Projects
            </a>
            <a
              href="/education"
              className="block px-4 py-2 text-gray-600 text-3xl hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              Education
            </a>
            <a
              href="/personal"
              className="block px-4 py-2 text-gray-600 text-3xl hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              Personal
            </a>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
