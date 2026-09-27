import React from "react";
import { templatesList } from "@/lib/templatesData";
import { Layers } from "lucide-react";

interface TemplatesSidebarProps {
  activeId?: string;
}

export default function TemplatesSidebar({ activeId }: TemplatesSidebarProps) {
  return (
    <aside className="w-56 shrink-0 pt-20 pb-8 px-4 hidden md:block border-r border-text-base/8">
      <div className="sticky top-24">
        <div className="stargazer-sidebar-group">
          <div className="sidebar-section-header">
            <div className="sidebar-icon-box">
              <Layers className="w-3 h-3 text-text-base/60" />
            </div>
            <span>Templates</span>
          </div>

          <div className="sidebar-items-container">
            <div className="sidebar-section-line" />
            {templatesList.map((tmpl) => {
              const isActive = activeId === tmpl.id;
              return (
                <a
                  key={tmpl.id}
                  href={`/templates/${tmpl.id}`}
                  className={`sidebar-item ${isActive ? "active" : ""}`}
                >
                  <span className="truncate">{tmpl.name}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
