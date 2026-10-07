import React, { useEffect, useState } from 'react';
import { FadeIn } from '@/components/helpers/FadeIn';
import { cn } from '@/lib/utils';

export interface TocItem {
  id: string;
  title: string;
}

export interface OnThisPageProps {
  items: TocItem[];
  className?: string;
  title?: string;
}

export function OnThisPage({
  items,
  className,
  title = 'On This Page',
}: OnThisPageProps) {
  const [activeId, setActiveId] = useState<string>(() => items[0]?.id || '');

  useEffect(() => {
    const ids = items.map((item) => item.id);

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;

      for (let i = ids.length - 1; i >= 0; i--) {
        const id = ids[i];
        const el = document.getElementById(id);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY;
          if (top <= scrollPosition) {
            setActiveId(id);
            return;
          }
        }
      }

      if (ids[0]) {
        setActiveId(ids[0]);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [items]);

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveId(id);
      history.pushState(null, '', `#${id}`);
    }
  };

  return (
    <aside
      className={cn(
        'hidden lg:block w-64 shrink-0 sticky top-24 self-start space-y-6',
        className
      )}
    >
      <FadeIn delay={0.15} yOffset={10} duration={0.4}>
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">{title}</p>

          <nav className="text-sm" aria-label={title}>
            <ul className="pl-3.5 border-l border-border/40 space-y-2.5">
              {items.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => scrollTo(e, item.id)}
                      className={`block transition-colors cursor-pointer ${
                        isActive
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {item.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </FadeIn>
    </aside>
  );
}

export default OnThisPage;
