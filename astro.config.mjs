import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  vite: {
    optimizeDeps: {
      include: ['mp4-muxer', '@radix-ui/react-separator'],
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
