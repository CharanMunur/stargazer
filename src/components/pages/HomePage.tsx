import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, SlidersHorizontal, ChevronDown, Check } from "lucide-react";
import { FadeIn } from "../helpers/FadeIn";
import {
  ComingSoonCard,
  ComingSoonCardWide,
} from "../templates";
import TemplateCard from "../templates/TemplateCard";
import { templatesData } from "@/data/templates";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [filterMode, setFilterMode] = useState<"all" | "new">("all");

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

  const newTemplates = useMemo(() => {
    return filtered.filter((t) => t.isNew);
  }, [filtered]);

  const otherTemplates = useMemo(() => {
    return filtered.filter((t) => !t.isNew);
  }, [filtered]);

  // Reusable template card renderer
  const renderTemplateCard = (tmpl: (typeof templatesData)[number], idx: number) => (
    <TemplateCard key={tmpl.id} template={tmpl} theme={theme} index={idx} />
  );

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-4 space-y-10">
      {/* Hero Header */}
      <FadeIn delay={0.05} yOffset={10} duration={0.4} className="flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto pt-4 sm:pt-6">
        <div className="flex items-center justify-center mb-1">
          <img
            src={theme === "dark" ? "/stargazer-dark.svg" : "/stargazer-light.svg"}
            alt="Stargazer"
            className="h-14 sm:h-16 md:h-20 w-auto object-contain mx-auto"
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

      {/* Top Filter Bar above template area */}
      <FadeIn delay={0.08} yOffset={8} duration={0.4}>
        <div className="flex items-center justify-between px-1 -mb-4">
          <div className="text-sm font-semibold text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "template" : "templates"}
          </div>

          {/* Filter dropdown using shadcn DropdownMenu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="glass" size="default" className="gap-2 font-normal text-foreground">
                <SlidersHorizontal className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span>{filterMode === "all" ? "All Templates" : "New Releases"}</span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => setFilterMode("all")}>
                <span>All Templates</span>
                {filterMode === "all" && <Check className="w-4 h-4 text-foreground shrink-0" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterMode("new")}>
                <span>New Releases</span>
                {filterMode === "new" && <Check className="w-4 h-4 text-foreground shrink-0" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </FadeIn>

      {/* Templates Display Area */}
      {filtered.length > 0 && (
        filterMode === "all" ? (
          /* All Templates (Default Order) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-5">
            {filtered.map((tmpl, idx) => renderTemplateCard(tmpl, idx))}

            {/* When templates count is odd, fill the empty cell in the 2-column grid */}
            {filtered.length % 2 !== 0 && (
              <FadeIn delay={0.12 + filtered.length * 0.03} yOffset={16}>
                <ComingSoonCard />
              </FadeIn>
            )}

            {/* When templates count is even and > 0, display the wide coming soon card across both columns */}
            {filtered.length % 2 === 0 && (
              <FadeIn delay={0.12 + filtered.length * 0.03} yOffset={16} className="col-span-1 md:col-span-2">
                <ComingSoonCardWide />
              </FadeIn>
            )}
          </div>
        ) : (
          /* New Releases Mode: New templates first, and other templates under that */
          <div className="space-y-10">
            {/* 1. New Templates First */}
            {newTemplates.length > 0 && (
              <div className="space-y-4">
                <FadeIn delay={0.08} yOffset={8} duration={0.4}>
                  <div className="flex items-center gap-2 px-1 pb-1">
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                      New Releases
                    </h2>
                    <span className="text-base sm:text-lg font-medium select-none">
                      <span className="text-foreground">(</span>
                      <span className="text-muted-foreground font-semibold">{newTemplates.length}</span>
                      <span className="text-foreground">)</span>
                    </span>
                  </div>
                </FadeIn>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-5">
                  {newTemplates.map((tmpl, idx) => renderTemplateCard(tmpl, idx))}
                </div>
              </div>
            )}

            {/* 2. Other Templates Except New Underneath */}
            {otherTemplates.length > 0 && (
              <div className="space-y-4">
                <FadeIn delay={0.12} yOffset={8} duration={0.4}>
                  <div className="flex items-center gap-2 px-1 pb-1 pt-4">
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                      Other Templates
                    </h2>
                    <span className="text-base sm:text-lg font-medium select-none">
                      <span className="text-foreground">(</span>
                      <span className="text-muted-foreground font-semibold">{otherTemplates.length}</span>
                      <span className="text-foreground">)</span>
                    </span>
                  </div>
                </FadeIn>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-5">
                  {otherTemplates.map((tmpl, idx) => renderTemplateCard(tmpl, idx))}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {filtered.length === 0 && (
        <FadeIn delay={0.05} yOffset={8} duration={0.35}>
          <div className="text-center py-20 text-sm text-muted-foreground space-y-3">
            <p className="text-base font-semibold text-foreground">No templates found</p>
            <p>No results matched "{search}".</p>
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              Clear search
            </button>
          </div>
        </FadeIn>
      )}
    </section>
  );
}
