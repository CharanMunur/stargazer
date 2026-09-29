import React from 'react';
import { ArrowUpRight } from 'lucide-react';

/**
 * Single-cell Coming Soon Card
 * Replicates the TemplateCard structure to fill empty cells in an odd-numbered grid.
 */
export const ComingSoonCard: React.FC = () => {
  return (
    <div className="group relative rounded-3xl bg-card border border-dashed border-border/80 p-2.5 sm:p-3 flex flex-col justify-between block h-full text-card-foreground">
      {/* 16:9 Live Canvas Preview Replica */}
      <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden bg-background/50 border border-dashed border-border/70 relative flex flex-col items-center justify-center p-6 text-center select-none">
        {/* Subtle grid pattern matching other template cards */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center gap-3 max-w-[380px]">
          {/* Theme-aware Stargazer Logo */}
          <div className="flex items-center justify-center mb-1">
            <img
              src="/stargazer-dark.svg"
              alt="Stargazer"
              className="hidden dark:block h-16 sm:h-20 w-auto object-contain select-none"
            />
            <img
              src="/stargazer-light.svg"
              alt="Stargazer"
              className="block dark:hidden h-16 sm:h-20 w-auto object-contain select-none"
            />
          </div>

          <span className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
            New Template in Works
          </span>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            Exploring kinetic particle systems, real-time shaders, and custom metric animations.
          </p>

          <div className="flex items-center gap-1.5 mt-2">
            {['Motion', 'Canvas', 'In Dev'].map((label) => (
              <span
                key={label}
                className="text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full border border-border/60"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer matching template card */}
      <div className="pt-4 sm:pt-4.5 pb-1.5 flex items-center justify-between px-1">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
          Coming Soon
        </h2>

        <a
          href="https://github.com/CharanMunur/stargazer"
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 sm:h-10 px-4 rounded-full bg-primary text-primary-foreground font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-2xs hover:bg-primary/90 transition-colors shrink-0"
        >
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>Star on GitHub</span>
          <ArrowUpRight className="w-4 h-4 stroke-[2.2] shrink-0" />
        </a>
      </div>
    </div>
  );
};

/**
 * Wide Coming Soon Card
 * Spans full width (2 columns) displaying "new component coming soon" on top left
 * and "Drop a star on GitHub" on bottom right.
 */
export const ComingSoonCardWide: React.FC = () => {
  return (
    <div className="col-span-1 md:col-span-2 rounded-3xl bg-card border border-dashed border-border/80 p-5 sm:p-6 flex flex-col justify-between gap-5 overflow-hidden relative text-card-foreground">
      {/* Subtle background grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Top Left: New component coming soon */}
        <div className="flex flex-col gap-1.5 max-w-xl">
          <span className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            New component coming soon
          </span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Something awesome is currently being built. Exploring new motion physics, real-time particle graphs, and creative display typography. Stay tuned for updates.
          </p>

          <div className="flex items-center gap-2 mt-2">
            {['Tech', 'Stack', 'Hidden'].map((label) => (
              <span
                key={label}
                className="text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full border border-border/60"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Top Right: Theme-aware Stargazer Logo */}
        <div className="hidden sm:flex items-center justify-center shrink-0">
          <img
            src="/stargazer-dark.svg"
            alt="Stargazer"
            className="hidden dark:block h-16 sm:h-20 w-auto object-contain select-none"
          />
          <img
            src="/stargazer-light.svg"
            alt="Stargazer"
            className="block dark:hidden h-16 sm:h-20 w-auto object-contain select-none"
          />
        </div>
      </div>

      {/* Bottom Bar: info on left, Star on GitHub on bottom right */}
      <div className="relative z-10 flex items-center justify-between pt-3 border-t border-border/50">
        <span className="text-xs sm:text-sm text-muted-foreground font-medium">
          Enjoying Stargazer? Support the open source project.
        </span>

        {/* Bottom Right: Star on GitHub */}
        <a
          href="https://github.com/CharanMunur/stargazer"
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 sm:h-10 px-4 rounded-full bg-primary text-primary-foreground font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-2xs hover:bg-primary/90 transition-colors shrink-0"
        >
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>Star on GitHub</span>
          <ArrowUpRight className="w-4 h-4 stroke-[2.2] shrink-0" />
        </a>
      </div>
    </div>
  );
};
