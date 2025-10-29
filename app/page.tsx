"use client";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LandingInfo from "./main components/landing";
import StickyHeader from "./main components/stickyheader";
import News from "./main components/news";
import Projects from "./main components/projects";
import ContactMe from "./main components/contactme";

export default function Home() {
  return (
    <div className="min-h-screen min-w-screen overflow-y-hidden overflow-x-auto text-black gap-y-3 relative">
      <StickyHeader />
      <LandingInfo />
      <News />
      <Projects />
      <ContactMe />
    </div>
  );
}
