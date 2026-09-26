import React from "react";
import { templatesList } from "@/lib/templatesData";
import { cn } from "@/lib/utils";

interface TemplatesSidebarProps {
  activeId?: string;
}

export default function TemplatesSidebar({ activeId }: TemplatesSidebarProps) {
  return (
    <aside className="w-56 shrink-0 border-r hidden md:block">
      <div className="sticky top-14 h-[calc(100vh-3.5rem)] py-8 px-4 overflow-y-auto">
        <div className="space-y-4">
          <div className="px-2 text-xs font-medium text-muted-foreground">
            Architectures
          </div>
          <nav className="space-y-1">
            {templatesList.map((tmpl) => {
              const isActive = activeId === tmpl.id;
              return (
                <a
                  key={tmpl.id}
                  href={`/templates/${tmpl.id}`}
                  className={cn(
                    "flex w-full items-center rounded-md px-2.5 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  {tmpl.name}
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
