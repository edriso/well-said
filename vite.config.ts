import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/well-said/',
  plugins: [react(), tailwindcss()],
  build: {
    // The curriculum chunk is typed lesson data (~180 kB gzipped), not code; UI chunks stay far below this.
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        // Curriculum and vendor code change on different schedules than the UI,
        // so separate chunks stay cached across deploys and load in parallel.
        manualChunks(id) {
          if (id.includes('/src/content/catalog/')) return 'curriculum';
          if (id.includes('/node_modules/react') || id.includes('/node_modules/scheduler/')) return 'react';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
