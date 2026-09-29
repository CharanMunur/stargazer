import React, { useState, useEffect, useMemo } from "react";
import { Search, ArrowUpRight } from "lucide-react";
import { FadeIn } from "../helpers/FadeIn";
import {
  MilestoneCard,
  InfinityCard,
  OrbitCard,
  ConstellationCard,
  SpotlightCard,
  RevolveCard,
  HyperdriveCard,
  ComingSoonCard,
  ComingSoonCardWide,
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

  // Filter templates by search keyword
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templatesData;
    return templatesData.filter((t) =>
      t.name.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-4 space-y-10">
      {/* Hero Header */}
      <FadeIn delay={0.05} yOffset={10} duration={0.4} className="flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto pt-4 sm:pt-6">
        <div className="flex items-center justify-center mb-1">
          <img
            src={theme === "dark" ? "/stargazer-dark.svg" : "/stargazer-light.svg"}
            alt="Stargazer"
            className="h-20 sm:h-24 md:h-28 w-auto object-contain mx-auto"
          />
        </div>

        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
          Turn your GitHub stars into shareable videos and images
        </h1>

        <p className="text-sm md:text-base text-muted-foreground max-w-lg leading-relaxed">
          Select a template below to generate 1600 × 900 social cards and 60fps MP4 loops directly in your browser.
        </p>

        {/* Search Bar */}
        <div className="w-full max-w-lg pt-2 pb-1">
          <div className="relative flex items-center">
            <Search className="absolute left-4.5 w-4.5 h-4.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates by name, style, or effect..."
              className="w-full pl-12 pr-5 py-3 bg-muted/40 hover:bg-muted/60 border border-border/80 hover:border-border focus:border-ring rounded-full text-sm sm:text-base text-foreground placeholder:text-muted-foreground outline-none focus:bg-background transition-all shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-4 text-xs font-semibold text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-full bg-muted/60 hover:bg-muted"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-5">
        {filtered.map((tmpl, idx) => (
          <FadeIn key={tmpl.id} delay={0.1 + idx * 0.04} yOffset={16}>
            <a
              href={`/generate?template=${tmpl.id}`}
              className="group relative rounded-3xl bg-card hover:bg-muted/40 border border-border/80 hover:border-border p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs block h-full text-card-foreground"
            >
              {/* Live 16:9 Canvas Preview */}
              <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden bg-background border border-border/70 relative flex items-center justify-center pointer-events-none">
                <div
                  className="absolute inset-0 pointer-events-none opacity-40"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                  }}
                />
                <div className="w-full h-full relative z-10">
                  {tmpl.id === "spotlight" && (
                    <SpotlightCard
                      key={`preview-spotlight-${theme}`}
                      data={initialSampleData}
                      theme={theme}
                      animated
                    />
                  )}
                  {tmpl.id === "revolve" && (
                    <RevolveCard
                      key={`preview-revolve-${theme}`}
                      data={initialSampleData}
                      theme={theme}
                      animated
                    />
                  )}
                  {tmpl.id === "milestone" && (
                    <MilestoneCard
                      key={`preview-milestone-${theme}`}
                      data={initialSampleData}
                      theme={theme}
                      animated
                    />
                  )}
                  {tmpl.id === "infinity" && (
                    <InfinityCard
                      key={`preview-infinity-${theme}`}
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
                  {tmpl.id === "hyperdrive" && (
                    <HyperdriveCard
                      key={`preview-hyperdrive-${theme}`}
                      data={initialSampleData}
                      theme={theme}
                      animated
                    />
                  )}
                </div>
              </div>

              {/* Content: Name (left) and Open in Studio button in place of tag (right) */}
              <div className="pt-3 pb-1 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                    {tmpl.name}
                  </h2>
                  {tmpl.isNew && (
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 tracking-wider">
                      NEW
                    </span>
                  )}
                </div>

                <div className="py-1.5 px-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs">
                  <span>Open in Studio</span>
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
              </div>
            </a>
          </FadeIn>
        ))}

        {/* When templates count is odd, fill the empty cell in the 2-column grid */}
        {filtered.length % 2 !== 0 && (
          <FadeIn delay={0.1 + filtered.length * 0.04} yOffset={16}>
            <ComingSoonCard />
          </FadeIn>
        )}

        {/* When templates count is even and > 0, display the wide coming soon card across both columns */}
        {filtered.length > 0 && filtered.length % 2 === 0 && (
          <FadeIn delay={0.1 + filtered.length * 0.04} yOffset={16} className="col-span-1 md:col-span-2">
            <ComingSoonCardWide />
          </FadeIn>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-sm text-muted-foreground space-y-3">
          <p className="text-base font-semibold text-foreground">No templates found</p>
          <p>No results matched "{search}".</p>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Clear search
          </button>
        </div>
      )}
    </section>
  );
}
