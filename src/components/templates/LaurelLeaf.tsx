import React from 'react';
import { LAUREL_LEAF_PATHS } from '@/lib/laurelPaths';

interface LaurelLeafProps {
  flip?: boolean;
  className?: string;
  theme?: 'dark' | 'light';
}

export const LaurelLeaf: React.FC<LaurelLeafProps> = ({ flip = false, className = '', theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const fill = isDark ? '#FFFFFF' : '#000000';

  return (
    <div
      className={`inline-block select-none pointer-events-none ${className}`}
      style={{
        transform: flip ? 'scaleX(-1)' : undefined,
        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 100%)',
        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 100%)',
        opacity: isDark ? 0.32 : 0.32,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 640 1280"
        fill={fill}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <g transform="translate(0, 1280) scale(0.1, -0.1)" stroke="none">
          {LAUREL_LEAF_PATHS.map((path, index) => <path key={index} d={path} />)}
        </g>
      </svg>
    </div>
  );
};
