"use client";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LandingInfo from "./main components/landing";
import StickyHeader from "./main components/stickyheader";
import News from "./main components/news";
import Projects from "./main components/projects";

export default function Home() {
  return (
    <div className="min-h-screen min-w-screen overflow-y-hidden overflow-x-auto text-black bg-[#fdf0d5]">
      <StickyHeader />
      <LandingInfo />
      <News />
      <Projects />
    </div>
  );
}
