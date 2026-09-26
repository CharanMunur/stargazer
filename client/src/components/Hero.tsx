import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
    <section className="w-full flex flex-col items-center py-16 md:py-24 px-6 max-w-5xl mx-auto space-y-12">
      {/* Header text */}
      <div className="text-center space-y-4 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Turn your stargazers into living art
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Generate high-definition social cards and 60fps MP4 video loops directly in your browser.
        </p>

        {/* Single primary button & secondary text link */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button asChild>
            <a href="/generate">Open Studio</a>
          </Button>
          <a
            href="/templates"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Browse templates
          </a>
        </div>
      </div>

      {/* Rendered product card proof point */}
      <div className="w-full space-y-4">
        <div className="w-full aspect-[16/9] border rounded-lg overflow-hidden bg-muted/20 flex items-center justify-center">
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
          <ToggleGroup
            type="single"
            value={activeTemplate}
            onValueChange={(val) => {
              if (val) setActiveTemplate(val as any);
            }}
            variant="outline"
          >
            <ToggleGroupItem value="counter">Counter</ToggleGroupItem>
            <ToggleGroupItem value="ticker">Ticker</ToggleGroupItem>
            <ToggleGroupItem value="orbit">3D Orbit</ToggleGroupItem>
            <ToggleGroupItem value="constellation">Constellation</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </section>
  );
}
