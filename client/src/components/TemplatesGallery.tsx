import React, { useState, useEffect } from "react";
import { Search, ArrowRight } from "lucide-react";
import {
  CounterCard,
  TickerCard,
  OrbitCard,
  ConstellationCard,
} from "./templates";
import type { TemplateData } from "./templates/types";
import sampleStargazers from "./templates/sampleStargazers.json";

const sampleData: TemplateData = {
  owner: "CharanMunur",
  repo: "Portfolio",
  stars: 106,
  forks: 22,
  days: 131,
  ownerAvatarUrl: "https://avatars.githubusercontent.com/u/105436608?v=4",
  stargazers: sampleStargazers,
};

const templates = [
  {
    id: "counter",
    name: "Counter",
    tag: "Milestone",
    description: "Symmetrical laurel milestone card with dynamic metric counters and contributor avatar grid.",
  },
  {
    id: "ticker",
    name: "Ticker",
    tag: "Marquee Loop",
    description: "Continuous horizontal glide marquee with momentum physics and contributor badges.",
  },
  {
    id: "orbit",
    name: "3D Orbit",
    tag: "3D WebGL",
    description: "Multi-ring 3D spherical orbits rotating contributor avatars around your repository core.",
  },
  {
    id: "constellation",
    name: "Constellation",
    tag: "Particle Graph",
    description: "Dynamic gravity nodes and floating avatars celebrating community stargazers.",
  },
];

export default function TemplatesGallery() {
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tag.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-8 space-y-12">
      {/* Hero Header matching user reference */}
      <div className="flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto pt-6">
        <div className="flex items-center justify-center mb-2">
          <img
            src="/stargazer.svg"
            alt="Stargazer"
            className="h-16 sm:h-20 md:h-24 w-auto object-contain mx-auto rounded-xl shadow-sm"
          />
        </div>

        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-text-base leading-tight">
          Turn your github stars into shareable videos and images
        </h1>

        <p className="text-sm md:text-base text-text-base/60 max-w-lg leading-relaxed">
          Select a template below to generate 1600 × 900 social cards and 60fps MP4 loops directly in your browser.
        </p>

        {/* Search Pill Bar */}
        <div className="w-full max-w-md pt-2">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-4 h-4 text-text-base/40 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-11 pr-4 py-2.5 bg-text-base/[0.03] border border-text-base/10 rounded-full text-sm text-text-base placeholder:text-text-base/40 outline-none focus:border-text-base/30 transition-all shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Grid of Templates styled with Figma Modern UI Cards design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {filtered.map((tmpl) => (
          <a
            key={tmpl.id}
            href={`/generate?generate=${tmpl.id}`}
            className="group relative rounded-[28px] bg-text-base/[0.025] hover:bg-text-base/[0.055] border border-text-base/8 p-2 sm:p-2.5 flex flex-col justify-between transition-colors duration-150 cursor-pointer shadow-xs"
          >
            {/* Live 16:9 Canvas Preview with ultra-tight sleek border */}
            <div className="w-full aspect-[16/9] rounded-[20px] overflow-hidden bg-background border border-text-base/8 relative flex items-center justify-center pointer-events-none">
              <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, var(--border-muted) 1px, transparent 1px), linear-gradient(to bottom, var(--border-muted) 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                }}
              />
              <div className="w-full h-full relative z-10">
                {tmpl.id === "counter" && (
                  <CounterCard
                    key={`preview-counter-${theme}`}
                    data={sampleData}
                    theme={theme}
                    animated
                  />
                )}
                {tmpl.id === "ticker" && (
                  <TickerCard
                    key={`preview-ticker-${theme}`}
                    data={sampleData}
                    theme={theme}
                    animated
                  />
                )}
                {tmpl.id === "orbit" && (
                  <OrbitCard
                    key={`preview-orbit-${theme}`}
                    data={sampleData}
                    theme={theme}
                    animated
                  />
                )}
                {tmpl.id === "constellation" && (
                  <ConstellationCard
                    key={`preview-constellation-${theme}`}
                    data={sampleData}
                    theme={theme}
                    animated
                  />
                )}
              </div>
            </div>

            {/* Content: Name, Tag, and Open in Studio button */}
            <div className="p-3 pt-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold tracking-tight text-text-base">
                  {tmpl.name}
                </h2>
                <span className="text-[11px] font-medium text-text-base/50 bg-text-base/5 px-2.5 py-0.5 rounded-full border border-text-base/6">
                  {tmpl.tag}
                </span>
              </div>

              <div className="w-full py-2.5 rounded-xl bg-text-base text-background font-medium text-xs flex items-center justify-center gap-1.5 transition-colors">
                <span>Open in Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </a>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-sm text-text-base/40">
          No templates match "{search}".
        </div>
      )}
    </section>
  );
}
