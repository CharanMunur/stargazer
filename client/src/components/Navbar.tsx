import React from "react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Github, Sun, Moon } from "lucide-react";
import { ThemeProvider, useTheme } from "./theme-provider";

interface NavbarProps {
  showAction?: boolean;
}

function NavbarContent({ showAction = false }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <header className="border-b bg-background">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Left: Logo & Wordmark */}
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2 font-medium text-sm">
            <img
              src={isDark ? "/stargazer-nobg-dark.svg" : "/stargazer-nobg-light.svg"}
              alt="Stargazer"
              className="h-6 w-auto"
            />
            <span>Stargazer</span>
          </a>

          {/* Left-of-center: NavigationMenu */}
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="/templates"
                  className={navigationMenuTriggerStyle()}
                >
                  Templates
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="/generate"
                  className={navigationMenuTriggerStyle()}
                >
                  Studio
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button asChild variant="ghost" size="icon" aria-label="GitHub repository">
            <a
              href="https://github.com/charanmunur/stargazer"
              target="_blank"
              rel="noreferrer"
            >
              <Github className="h-4 w-4" />
            </a>
          </Button>

          {showAction && (
            <Button asChild>
              <a href="/generate">Studio</a>
            </Button>
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
