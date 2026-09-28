import React, { useState, useEffect } from "react";
import { Search, ArrowRight } from "lucide-react";
import { FadeIn } from "../helpers/FadeIn";
import {
  CounterCard,
  TickerCard,
  OrbitCard,
  ConstellationCard,
} from "../templates";
import { templatesData, initialSampleData } from "@/data/templates";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    let lastDark = document.documentElement.classList.contains("dark");
    setTheme(lastDark ? "dark" : "light");

    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      if (isDark !== lastDark) {
        lastDark = isDark;
        setTheme(isDark ? "dark" : "light");
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const filtered = templatesData.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tag.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-6 space-y-8">
      {/* Hero Header */}
      <FadeIn delay={0.05} yOffset={10} duration={0.4} className="flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto pt-6">
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
        <div className="w-full max-w-lg pt-3 pb-1">
          <div className="relative flex items-center">
            <Search className="absolute left-4.5 w-5 h-5 text-text-base/40 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-12 pr-5 py-3.5 bg-text-base/[0.03] hover:bg-text-base/[0.05] border border-text-base/10 rounded-full text-base text-text-base placeholder:text-text-base/40 outline-none focus:border-text-base/30 focus:bg-background transition-all shadow-2xs"
            />
          </div>
        </div>
      </FadeIn>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-5">
        {filtered.map((tmpl, idx) => (
          <FadeIn key={tmpl.id} delay={0.15 + idx * 0.05} yOffset={20}>
            <a
              href={`/generate?template=${tmpl.id}`}
              className="group relative rounded-3xl bg-text-base/[0.025] hover:bg-text-base/[0.055] border border-text-base/8 p-2 sm:p-2.5 flex flex-col justify-between transition-colors duration-150 cursor-pointer shadow-xs block h-full"
            >
              {/* Live 16:9 Canvas Preview */}
              <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden bg-background border border-text-base/8 relative flex items-center justify-center pointer-events-none">
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
                      data={initialSampleData}
                      theme={theme}
                      animated
                    />
                  )}
                  {tmpl.id === "ticker" && (
                    <TickerCard
                      key={`preview-ticker-${theme}`}
                      data={initialSampleData}
                      theme={theme}
                      animated
                    />
                  )}
                  {tmpl.id === "orbit" && (
                    <OrbitCard
                      key={`preview-orbit-${theme}`}
                      data={initialSampleData}
                      theme={theme}
                      animated
                    />
                  )}
                  {tmpl.id === "constellation" && (
                    <ConstellationCard
                      key={`preview-constellation-${theme}`}
                      data={initialSampleData}
                      theme={theme}
                      animated
                    />
                  )}
                </div>
              </div>

              {/* Content: Name, Tag, and Open in Studio button */}
              <div className="pt-3.5 pb-0.5 space-y-3">
                <div className="flex items-center justify-between px-1.5">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-text-base">
                    {tmpl.name}
                  </h2>
                  <span className="text-xs font-semibold text-text-base/60 bg-text-base/5 px-3 py-1 rounded-full border border-text-base/8">
                    {tmpl.tag}
                  </span>
                </div>

                <div className="w-full py-2.5 px-4 rounded-full bg-text-base text-background font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                  <span>Open in Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </a>
          </FadeIn>
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
