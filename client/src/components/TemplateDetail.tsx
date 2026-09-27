import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Check, List } from "lucide-react";
import TemplatesSidebar from "./TemplatesSidebar";
import type { TemplateInfo } from "@/lib/templatesData";
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

interface TemplateDetailProps {
  template: TemplateInfo;
}

export default function TemplateDetail({ template }: TemplateDetailProps) {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [activeTab, setActiveTab] = useState<"preview" | "specs">("preview");
  const [activeSection, setActiveSection] = useState<string>("overview");

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
    <div className="flex min-h-screen w-full pt-16">
      {/* Left Sidebar: Tree-Branch Nav */}
      <TemplatesSidebar activeId={template.id} />

      {/* Center Column: Documentation & Specifications */}
      <main className="flex-1 px-6 md:px-12 py-10 max-w-4xl min-w-0 space-y-8">
        {/* Header */}
        <div id="overview" className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-text-base">{template.name}</h1>
          <p className="text-sm text-text-base/60 leading-relaxed">
            {template.description}
          </p>
        </div>

        <Separator className="bg-text-base/8" />

        {/* Tabs: Inset Card with Purple Glowing Underline */}
        <div id="preview" className="space-y-4">
          <figure className="relative rounded-2xl bg-text-base/3 border border-text-base/8 overflow-hidden text-sm">
            <div className="flex items-center w-full h-11 pl-3 border-b border-text-base/8">
              <div className="flex items-center h-full gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`relative flex items-center gap-1.5 h-full px-3 text-[13px] font-medium transition-colors cursor-pointer ${
                    activeTab === "preview" ? "text-text-base" : "text-text-base/40 hover:text-text-base/70"
                  }`}
                >
                  <span>Preview</span>
                  {activeTab === "preview" && (
                    <motion.span
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-full bg-[#6C5CE7]"
                      style={{ boxShadow: "0 0 8px rgba(108,92,231,0.45)" }}
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("specs")}
                  className={`relative flex items-center gap-1.5 h-full px-3 text-[13px] font-medium transition-colors cursor-pointer ${
                    activeTab === "specs" ? "text-text-base" : "text-text-base/40 hover:text-text-base/70"
                  }`}
                >
                  <span>Specs</span>
                  {activeTab === "specs" && (
                    <motion.span
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-full bg-[#6C5CE7]"
                      style={{ boxShadow: "0 0 8px rgba(108,92,231,0.45)" }}
                    />
                  )}
                </button>
              </div>
            </div>

            <div className="p-2 sm:p-3">
              {activeTab === "preview" ? (
                <div className="relative border border-text-base/8 rounded-xl overflow-hidden aspect-[16/9] w-full flex items-center justify-center bg-text-base/[0.02]">
                  {/* 20px grid background pattern */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, var(--border-muted) 1px, transparent 1px), linear-gradient(to bottom, var(--border-muted) 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }}
                  />

                  {template.id === "counter" && (
                    <CounterCard
                      key={`preview-counter-${theme}`}
                      data={sampleData}
                      theme={theme}
                      animated
                    />
                  )}
                  {template.id === "ticker" && (
                    <TickerCard
                      key={`preview-ticker-${theme}`}
                      data={sampleData}
                      theme={theme}
                      animated
                    />
                  )}
                  {template.id === "orbit" && (
                    <OrbitCard
                      key={`preview-orbit-${theme}`}
                      data={sampleData}
                      theme={theme}
                      animated
                    />
                  )}
                  {template.id === "constellation" && (
                    <ConstellationCard
                      key={`preview-constellation-${theme}`}
                      data={sampleData}
                      theme={theme}
                      animated
                    />
                  )}
                </div>
              ) : (
                <div className="bg-bg-base border border-text-base/8 rounded-xl p-4 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-text-base/8 hover:bg-transparent">
                        <TableHead className="w-1/3 text-text-base/60 text-xs">Property</TableHead>
                        <TableHead className="text-text-base/60 text-xs">Specification</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-text-base/6 hover:bg-text-base/[0.02]">
                        <TableCell className="font-medium text-xs text-text-base">Resolution</TableCell>
                        <TableCell className="text-xs text-text-base/70">{template.specs.resolution}</TableCell>
                      </TableRow>
                      <TableRow className="border-text-base/6 hover:bg-text-base/[0.02]">
                        <TableCell className="font-medium text-xs text-text-base">Aspect ratio</TableCell>
                        <TableCell className="text-xs text-text-base/70">{template.specs.aspectRatio}</TableCell>
                      </TableRow>
                      <TableRow className="border-text-base/6 hover:bg-text-base/[0.02]">
                        <TableCell className="font-medium text-xs text-text-base">Target framerate</TableCell>
                        <TableCell className="text-xs text-text-base/70">{template.specs.framerate}</TableCell>
                      </TableRow>
                      <TableRow className="border-text-base/6 hover:bg-text-base/[0.02]">
                        <TableCell className="font-medium text-xs text-text-base">Contributor capacity</TableCell>
                        <TableCell className="text-xs text-text-base/70">{template.specs.capacity}</TableCell>
                      </TableRow>
                      <TableRow className="border-text-base/6 hover:bg-text-base/[0.02]">
                        <TableCell className="font-medium text-xs text-text-base">Physics model</TableCell>
                        <TableCell className="text-xs text-text-base/70">{template.specs.physics}</TableCell>
                      </TableRow>
                      <TableRow className="border-text-base/6 hover:bg-text-base/[0.02]">
                        <TableCell className="font-medium text-xs text-text-base">Export formats</TableCell>
                        <TableCell className="text-xs text-text-base/70">{template.specs.exportFormats}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </figure>
        </div>

        <Separator className="bg-text-base/8" />

        {/* Section: Technical specifications */}
        <section id="specifications" className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-text-base">
            Technical specifications
          </h2>
          <div className="rounded-xl border border-text-base/8 overflow-hidden bg-text-base/[0.02]">
            <Table>
              <TableHeader>
                <TableRow className="border-text-base/8 hover:bg-transparent">
                  <TableHead className="w-1/3 text-text-base/60 text-xs">Property</TableHead>
                  <TableHead className="text-text-base/60 text-xs">Specification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-text-base/6 hover:bg-text-base/[0.02]">
                  <TableCell className="font-medium text-xs text-text-base">Resolution</TableCell>
                  <TableCell className="text-xs text-text-base/70">{template.specs.resolution}</TableCell>
                </TableRow>
                <TableRow className="border-text-base/6 hover:bg-text-base/[0.02]">
                  <TableCell className="font-medium text-xs text-text-base">Aspect ratio</TableCell>
                  <TableCell className="text-xs text-text-base/70">{template.specs.aspectRatio}</TableCell>
                </TableRow>
                <TableRow className="border-text-base/6 hover:bg-text-base/[0.02]">
                  <TableCell className="font-medium text-xs text-text-base">Target framerate</TableCell>
                  <TableCell className="text-xs text-text-base/70">{template.specs.framerate}</TableCell>
                </TableRow>
                <TableRow className="border-text-base/6 hover:bg-text-base/[0.02]">
                  <TableCell className="font-medium text-xs text-text-base">Contributor capacity</TableCell>
                  <TableCell className="text-xs text-text-base/70">{template.specs.capacity}</TableCell>
                </TableRow>
                <TableRow className="border-text-base/6 hover:bg-text-base/[0.02]">
                  <TableCell className="font-medium text-xs text-text-base">Physics model</TableCell>
                  <TableCell className="text-xs text-text-base/70">{template.specs.physics}</TableCell>
                </TableRow>
                <TableRow className="border-text-base/6 hover:bg-text-base/[0.02]">
                  <TableCell className="font-medium text-xs text-text-base">Export formats</TableCell>
                  <TableCell className="text-xs text-text-base/70">{template.specs.exportFormats}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        <Separator className="bg-text-base/8" />

        {/* Section: Recommended use cases */}
        <section id="use-cases" className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-text-base">
            Recommended use cases
          </h2>
          <ul className="space-y-3">
            {template.useCases.map((useCase, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-text-base/70">
                <Check className="h-4 w-4 shrink-0 text-[#6C5CE7] mt-0.5" />
                <span>{useCase}</span>
              </li>
            ))}
          </ul>
        </section>

        <Separator className="bg-text-base/8" />

        {/* Section: Single primary call to action with Clay Button */}
        <section id="studio" className="pt-2">
          <a href={`/generate?generate=${template.id}`} className="clay-btn clay-primary">
            Configure {template.name} in Studio
          </a>
        </section>
      </main>

      {/* Right Column: Tree-Branch "On this page" TOC */}
      <aside className="hidden xl:block w-56 shrink-0 pt-20 px-6 border-l border-text-base/8">
        <div className="sticky top-24">
          <div className="stargazer-sidebar-group">
            <div className="sidebar-section-header">
              <div className="sidebar-icon-box">
                <List className="w-3 h-3 text-text-base/60" />
              </div>
              <span>On this page</span>
            </div>

            <div className="sidebar-items-container">
              <div className="sidebar-section-line" />
              {[
                { id: "overview", label: "Overview" },
                { id: "preview", label: "Preview" },
                { id: "specifications", label: "Specifications" },
                { id: "use-cases", label: "Use cases" },
                { id: "studio", label: "Studio" },
              ].map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => setActiveSection(item.id)}
                    className={`sidebar-item ${isActive ? "active" : ""}`}
                  >
                    <span className="truncate">{item.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
