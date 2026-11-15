import { defineConfig, type Plugin } from 'vite';
import { wordmarkSvg } from './homepage/src/brand/wordmarkSvg.ts';

// Inlines the custom "trygrowency" wordmark into index.html at build/dev time,
// so the heading is crisp, accessible and layout-stable before any JS runs.
const inlineWordmark = (): Plugin => ({
  name: 'inline-wordmark',
  transformIndexHtml: (html) => html.replace('<!--WORDMARK-->', wordmarkSvg()),
});

export default defineConfig({
  publicDir: 'homepage/public',
  plugins: [inlineWordmark()],
  server: { host: true, port: 5173 },
  // three.js lives in the lazily-loaded hero chunk (skipped for reduced motion).
  build: { chunkSizeWarningLimit: 700 },
});
