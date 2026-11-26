import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Sentry source map upload (only in CI/production)
    ...(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
      ? [sentryVitePlugin({
          authToken: process.env.SENTRY_AUTH_TOKEN,
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          telemetry: false,
        })]
      : []),
  ],
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: (id) => {
          // Vendor chunk for heavy dependencies
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          // Screen chunks for lazy-loading
          if (id.includes('src/screens/')) {
            const screen = id.match(/src\/screens\/(.+?)\.jsx$/);
            if (screen) return `screen-${screen[1].toLowerCase()}`;
          }
          // Component chunks for progression components
          if (id.includes('src/components/')) {
            const component = id.match(/src\/components\/(.+?)\.jsx$/);
            if (component) return `component-${component[1].toLowerCase()}`;
          }
        },
      },
    },
  },
});
