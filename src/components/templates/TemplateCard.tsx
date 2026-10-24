import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "@/components/ui/reicon";
import { FadeIn } from "../helpers/FadeIn";
import type { TemplateMeta } from "@/data/templates";
import { Badge } from "@/components/ui/badge";

interface TemplateCardProps {
  template: TemplateMeta;
  theme: "dark" | "light";
  index: number;
}

function LocalVideoPreview({ templateId }: { templateId: TemplateMeta["id"] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);
    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);

    const element = containerRef.current;
    if (!element) {
      return () => mediaQuery.removeEventListener("change", updateMotionPreference);
    }

    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      setIsVisible(true);
      return () => mediaQuery.removeEventListener("change", updateMotionPreference);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting) setShouldLoad(true);
      },
      { threshold: 0.15, rootMargin: "100px" }
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0" aria-hidden="true">
      <video
        className="h-full w-full object-cover"
        src={shouldLoad ? `/templates/${templateId}.mp4` : undefined}
        poster={`/templates/${templateId}.png`}
        autoPlay={isVisible && !reducedMotion}
        loop
        muted
        playsInline
        preload="none"
        tabIndex={-1}
      />
    </div>
  );
}

export default function TemplateCard({ template, theme, index }: TemplateCardProps) {
  return (
    <FadeIn delay={0.1 + (index % 6) * 0.03} yOffset={16}>
      <a
        href={`/generate?template=${template.id}`}
        className="group relative rounded-3xl bg-card hover:bg-muted/40 border border-border/80 hover:border-border p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs block h-full text-card-foreground"
      >
        {/* Live 16:9 Canvas Preview */}
        <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden bg-background border border-border/70 relative flex items-center justify-center pointer-events-none">
          {/* Overlaid Floating NEW Badge */}
          {template.isNew && (
            <div className="absolute top-3 right-3 z-20 pointer-events-auto">
              <Badge variant="orange" className="shadow-xs backdrop-blur-xs">
                NEW
              </Badge>
            </div>
          )}

          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />
          <LocalVideoPreview templateId={template.id} />
        </div>

        {/* Bottom bar: Title + Author credit left, Arrow icon right */}
        <div className="pt-3.5 sm:pt-4 pb-1 flex items-center justify-between px-1 gap-2">
          <div className="flex items-baseline gap-2 min-w-0">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground shrink-0">
              {template.name}
            </h2>
            <span className="text-xs text-muted-foreground font-medium truncate">
              by{" "}
              <a
                href={template.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="hover:underline text-foreground/80 hover:text-foreground font-semibold transition-colors"
              >
                {template.by}
              </a>
            </span>
          </div>

          <ArrowUpRight
            className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            style={{ color: "#E6A441" }}
            strokeWidth={2.5}
          />
        </div>
      </a>
    </FadeIn>
  );
}
