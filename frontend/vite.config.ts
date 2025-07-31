import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename); // ✅ FIX: add `path.`

/**
 * Vite configuration for Designer frontend
 * - Listens on all interfaces (host: true)
 * - Whitelists all necessary preview hosts
 */
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    host: true,
    port: 3200,
  },
  preview: {
    host: true,
    port: 3000,
    allowedHosts: [
      '127.0.0.1',
      'localhost',
      '0.0.0.0',
      '::1',
      'designer.127.0.0.1.nip.io',
      'designer.localtest.me',
      'designer.momentumresearch.eu',
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    include: ['**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
  build: {
    rollupOptions: {
      plugins: [
        {
          name: 'no-treeshake',
          transform(_, id) {
            if (id.includes('@mui/icons-material') || id.includes('@mui/material')) {
              return { moduleSideEffects: 'no-treeshake' };
            }
          },
        },
      ],
    },
    commonjsOptions: {
      target: 'es2018',
      ignoreTryCatch: false,
    },
  },
});
