import React from "react";
import { ArrowUpRight } from "lucide-react";
import { FadeIn } from "../helpers/FadeIn";
import type { TemplateMeta } from "@/data/templates";
import { initialSampleData } from "@/data/templates";
import {
  MilestoneCard,
  InfinityCard,
  OrbitCard,
  ConstellationCard,
  SpotlightCard,
  RevolveCard,
  HyperdriveCard,
  BlackholeCard,
} from "../templates";
import { Badge } from "@/components/ui/badge";

interface TemplateCardProps {
  template: TemplateMeta;
  theme: "dark" | "light";
  index: number;
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
          <div className="w-full h-full relative z-10">
            {template.id === "spotlight" && (
              <SpotlightCard
                key={`preview-spotlight-${theme}`}
                data={initialSampleData}
                theme={theme}
                animated
              />
            )}
            {template.id === "revolve" && (
              <RevolveCard
                key={`preview-revolve-${theme}`}
                data={initialSampleData}
                theme={theme}
                animated
              />
            )}
            {template.id === "milestone" && (
              <MilestoneCard
                key={`preview-milestone-${theme}`}
                data={initialSampleData}
                theme={theme}
                animated
              />
            )}
            {template.id === "infinity" && (
              <InfinityCard
                key={`preview-infinity-${theme}`}
                data={initialSampleData}
                theme={theme}
                animated
              />
            )}
            {template.id === "orbit" && (
              <OrbitCard
                key={`preview-orbit-${theme}`}
                data={initialSampleData}
                theme={theme}
                animated
              />
            )}
            {template.id === "constellation" && (
              <ConstellationCard
                key={`preview-constellation-${theme}`}
                data={initialSampleData}
                theme={theme}
                animated
              />
            )}
            {template.id === "hyperdrive" && (
              <HyperdriveCard
                key={`preview-hyperdrive-${theme}`}
                data={initialSampleData}
                theme={theme}
                animated
              />
            )}
            {template.id === "blackhole" && (
              <BlackholeCard
                key={`preview-blackhole-${theme}`}
                data={initialSampleData}
                theme={theme}
                animated
              />
            )}
          </div>
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
