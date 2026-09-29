import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');

    let lastDark = isDark;
    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains('dark');
      if (dark !== lastDark) {
        lastDark = dark;
        setTheme(dark ? 'dark' : 'light');
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('stargazer-theme', nextTheme);
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={
        className ||
        "flex items-center justify-center w-11 h-11 rounded-full border border-border/70 bg-muted/30 hover:bg-muted/50 text-foreground transition-all hover:border-border cursor-pointer backdrop-blur-md shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
      }
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-foreground shrink-0" />
      ) : (
        <Moon className="w-5 h-5 text-foreground shrink-0" />
      )}
    </button>
  );
}
