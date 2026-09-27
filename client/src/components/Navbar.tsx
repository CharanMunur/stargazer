import React, { useState, useEffect } from "react";
import { Sun, Moon, Star } from "lucide-react";
import { ThemeProvider, useTheme } from "./theme-provider";

interface NavbarProps {
  showAction?: boolean;
}

function NavbarContent({ showAction = false }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://api.github.com/repos/CharanMunur/stargazer")
      .then((res) => res.json())
      .then((data) => {
        if (data.stargazers_count !== undefined) {
          setStars(data.stargazers_count);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4 md:px-10 md:py-5 pointer-events-none bg-transparent transition-colors duration-300">
      <div className="relative flex items-center justify-between pointer-events-auto max-w-7xl mx-auto w-full">
        {/* Left: Brand Capsule */}
        <a
          href="/"
          className="flex items-center gap-2 text-text-base font-semibold text-[14px] bg-text-base/[0.04] backdrop-blur-lg rounded-full px-3.5 py-[7px] hover:bg-text-base/10 transition-all duration-150 shadow-2xs shrink-0 border border-text-base/8"
        >
          <img
            src={isDark ? "/stargazer-icon-dark.svg" : "/stargazer-icon-light.svg"}
            alt="Stargazer"
            width={18}
            height={18}
            className="w-4.5 h-4.5 object-contain shrink-0"
          />
          <span>Stargazer</span>
        </a>

        {/* Center: Nav Island */}
        <nav className="hidden md:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2 bg-text-base/[0.04] backdrop-blur-lg rounded-full p-1 shadow-2xs border border-text-base/8">
          <a
            href="/templates"
            className="text-[13px] font-medium text-text-base/80 hover:text-text-base transition-colors px-3.5 py-1.5 rounded-full hover:bg-text-base/10"
          >
            Templates
          </a>
          <a
            href="/generate"
            className="text-[13px] font-medium text-text-base/80 hover:text-text-base transition-colors px-3.5 py-1.5 rounded-full hover:bg-text-base/10"
          >
            Studio
          </a>
        </nav>

        {/* Right: Actions Cluster */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-text-base/[0.04] backdrop-blur-lg hover:bg-text-base/10 text-text-base/80 hover:text-text-base transition-colors cursor-pointer border border-text-base/8"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <a
            href="https://github.com/charanmunur/stargazer"
            target="_blank"
            rel="noreferrer"
            className="text-[13px] text-text-base/80 bg-text-base/[0.04] backdrop-blur-lg rounded-full px-4 py-[7px] hover:bg-text-base/10 transition-colors cursor-pointer flex items-center gap-1.5 border border-text-base/8"
          >
            <span>GitHub</span>
            {stars !== null && (
              <span className="flex items-center gap-0.5 text-text-base/50 text-[11px] font-medium border-l border-text-base/15 pl-1.5">
                <Star className="w-3 h-3 text-[#eab308] fill-[#eab308]" />
                <span>{stars}</span>
              </span>
            )}
          </a>

          {showAction && (
            <a href="/generate" className="clay-btn clay-primary clay-sm">
              Studio
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

export default function Navbar({ showAction = false }: NavbarProps) {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="stargazer-theme">
      <NavbarContent showAction={showAction} />
    </ThemeProvider>
  );
}
