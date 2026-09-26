import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check } from "lucide-react";
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
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full">
      {/* Left Sidebar */}
      <TemplatesSidebar activeId={template.id} />

      {/* Center Column: Documentation & Specifications */}
      <main className="flex-1 px-8 py-10 max-w-4xl min-w-0 space-y-8">
        {/* Header */}
        <div id="overview" className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{template.name}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {template.description}
          </p>
        </div>

        <Separator />

        {/* Tabs: Preview and Specs */}
        <div id="preview" className="space-y-4">
          <Tabs defaultValue="preview">
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="specs">Specs</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-4">
              <div className="border rounded-md overflow-hidden aspect-[16/9] w-full flex items-center justify-center bg-muted/20">
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
            </TabsContent>

            <TabsContent value="specs" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Property</TableHead>
                    <TableHead>Specification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Resolution</TableCell>
                    <TableCell>{template.specs.resolution}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Aspect ratio</TableCell>
                    <TableCell>{template.specs.aspectRatio}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Target framerate</TableCell>
                    <TableCell>{template.specs.framerate}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Contributor capacity</TableCell>
                    <TableCell>{template.specs.capacity}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Physics model</TableCell>
                    <TableCell>{template.specs.physics}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Export formats</TableCell>
                    <TableCell>{template.specs.exportFormats}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </div>

        <Separator />

        {/* Section: Technical specifications */}
        <section id="specifications" className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Technical specifications
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Property</TableHead>
                <TableHead>Specification</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Resolution</TableCell>
                <TableCell>{template.specs.resolution}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Aspect ratio</TableCell>
                <TableCell>{template.specs.aspectRatio}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Target framerate</TableCell>
                <TableCell>{template.specs.framerate}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Contributor capacity</TableCell>
                <TableCell>{template.specs.capacity}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Physics model</TableCell>
                <TableCell>{template.specs.physics}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Export formats</TableCell>
                <TableCell>{template.specs.exportFormats}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        <Separator />

        {/* Section: Recommended use cases */}
        <section id="use-cases" className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Recommended use cases
          </h2>
          <ul className="space-y-3">
            {template.useCases.map((useCase, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Check className="h-4 w-4 shrink-0 text-foreground mt-0.5" />
                <span>{useCase}</span>
              </li>
            ))}
          </ul>
        </section>

        <Separator />

        {/* Section: Single primary call to action */}
        <section id="studio" className="pt-2">
          <Button asChild>
            <a href={`/generate?generate=${template.id}`}>
              Configure {template.name} in Studio
            </a>
          </Button>
        </section>
      </main>

      {/* Right Column: "On this page" TOC */}
      <aside className="hidden xl:block w-56 shrink-0 px-6 py-10 border-l">
        <div className="sticky top-20 space-y-3">
          <p className="text-sm font-medium">On this page</p>
          <ScrollArea className="h-auto">
            <nav className="space-y-2 text-sm">
              <a
                href="#overview"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Overview
              </a>
              <a
                href="#preview"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Preview
              </a>
              <a
                href="#specifications"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Specifications
              </a>
              <a
                href="#use-cases"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Use cases
              </a>
              <a
                href="#studio"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Studio
              </a>
            </nav>
          </ScrollArea>
        </div>
      </aside>
    </div>
  );
}
