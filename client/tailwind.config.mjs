/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        background: '#0F0E10',
        'background-secondary': '#18181B',
        surface: '#2A1B17',

        primary: {
          DEFAULT: '#E87443',
          hover: '#F08A55',
        },
        secondary: '#C94F35',

        rose: '#923321',
        warm: '#E8B083',
        star: '#F2C879',

        'text-primary': '#F5EDE7',
        'text-secondary': '#B8AAA3',
        'text-muted': '#756B67',

        border: '#342A27',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
