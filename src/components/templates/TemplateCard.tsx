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
} from "../templates";

interface TemplateCardProps {
  template: TemplateMeta;
  theme: "dark" | "light";
  index: number;
}

export default function TemplateCard({ template, theme, index }: TemplateCardProps) {
  return (
    <FadeIn delay={0.06 + (index % 6) * 0.03} yOffset={16}>
      <a
        href={`/generate?template=${template.id}`}
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
          </div>
        </div>

        {/* Bottom bar: name + NEW badge left, orange arrow right */}
        <div className="pt-4 sm:pt-4.5 pb-1.5 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              {template.name}
            </h2>
            {template.isNew && (
              <span
                className="inline-flex items-center text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full tracking-wider"
                style={{
                  color: "#E6A441",
                  background: "rgba(230,164,65,0.12)",
                  border: "1px solid rgba(230,164,65,0.30)",
                }}
              >
                NEW
              </span>
            )}
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
