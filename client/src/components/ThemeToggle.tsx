import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');

    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains('dark');
      setTheme(dark ? 'dark' : 'light');
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
      className="fixed top-5 right-5 md:top-6 md:right-6 z-50 flex items-center justify-center w-9 h-9 rounded-full bg-text-base/[0.04] hover:bg-text-base/[0.09] border border-text-base/10 text-text-base/70 hover:text-text-base transition-colors duration-150 backdrop-blur-md cursor-pointer"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-text-base/80" />
      ) : (
        <Moon className="w-4 h-4 text-text-base/80" />
      )}
    </button>
  );
}
