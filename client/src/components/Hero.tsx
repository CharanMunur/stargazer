import React, { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { CounterCard, TickerCard, OrbitCard, ConstellationCard } from "./templates";
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

export default function Hero() {
  const [activeTemplate, setActiveTemplate] = useState<
    "counter" | "ticker" | "orbit" | "constellation"
  >("counter");
  const [theme, setTheme] = useState<"dark" | "light">("light");

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

  return (
    <section className="w-full flex flex-col items-center pt-28 md:pt-36 pb-16 px-6 max-w-5xl mx-auto space-y-10">
      {/* Top Pill Badge */}
      <div className="inline-flex items-center gap-2 bg-text-base/[0.04] hover:bg-text-base/10 backdrop-blur-lg rounded-full px-4 py-1.5 text-xs text-text-base/90 transition-colors border border-text-base/8 select-none">
        <Sparkles className="w-3.5 h-3.5 text-[#6C5CE7]" />
        <span>Open Source Card & Video Engine</span>
      </div>

      {/* Header text */}
      <div className="text-center space-y-4 max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-text-base leading-[1.08]">
          Turn your stargazers into living art
        </h1>
        <p className="text-base text-text-base/60 leading-relaxed max-w-lg mx-auto">
          Generate high-definition social cards and 60fps MP4 video loops directly in your browser.
        </p>

        {/* Single primary button & secondary text link */}
        <div className="flex items-center justify-center gap-4 pt-3">
          <a href="/generate" className="clay-btn clay-primary">
            Launch Studio
          </a>
          <a
            href="/templates"
            className="text-xs sm:text-sm font-medium text-text-base/60 hover:text-text-base transition-colors flex items-center gap-1"
          >
            <span>Browse templates</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Rendered product card proof point with 20px grid */}
      <div className="w-full space-y-4">
        <div className="w-full aspect-[16/9] border border-text-base/8 rounded-2xl overflow-hidden bg-text-base/[0.02] flex items-center justify-center relative shadow-xl">
          {/* Subtle 20px grid background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--border-muted) 1px, transparent 1px), linear-gradient(to bottom, var(--border-muted) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          {activeTemplate === "counter" && (
            <CounterCard
              key={`hero-counter-${theme}`}
              data={sampleData}
              theme={theme}
              animated
            />
          )}
          {activeTemplate === "ticker" && (
            <TickerCard
              key={`hero-ticker-${theme}`}
              data={sampleData}
              theme={theme}
              animated
            />
          )}
          {activeTemplate === "orbit" && (
            <OrbitCard
              key={`hero-orbit-${theme}`}
              data={sampleData}
              theme={theme}
              animated
            />
          )}
          {activeTemplate === "constellation" && (
            <ConstellationCard
              key={`hero-constellation-${theme}`}
              data={sampleData}
              theme={theme}
              animated
            />
          )}
        </div>

        {/* Template switcher below card */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center p-1 rounded-full bg-text-base/[0.04] border border-text-base/8 gap-1 backdrop-blur-lg">
            {[
              { id: "counter", label: "Counter" },
              { id: "ticker", label: "Ticker" },
              { id: "orbit", label: "3D Orbit" },
              { id: "constellation", label: "Constellation" },
            ].map((tmpl) => {
              const isActive = activeTemplate === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setActiveTemplate(tmpl.id as any)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#6C5CE7]/20 text-[#6C5CE7] border border-[#6C5CE7]/35 font-semibold"
                      : "text-text-base/60 hover:text-text-base border border-transparent"
                  }`}
                >
                  {tmpl.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
