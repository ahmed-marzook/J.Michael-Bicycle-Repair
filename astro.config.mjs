// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // TODO(client): the production domain is not decided yet. Replace this
  // placeholder with the real origin (no trailing slash) before going live.
  // `site` is what @astrojs/sitemap writes into sitemap-index.xml and what
  // canonical / Open Graph URLs are resolved against, so a wrong value here
  // silently ships wrong URLs to Google and to Facebook/WhatsApp previews.
  // Remember to update `public/robots.txt` at the same time.
  site: 'https://example.com',

  // Pure static output: no adapter, no SSR, no runtime server.
  // Deployable as plain files to GitHub Pages / Azure Static Web Apps.
  output: 'static',

  integrations: [sitemap()],

  vite: {
    // Tailwind CSS v4 is wired in as a Vite plugin. The old
    // @astrojs/tailwind integration is deprecated and is deliberately not used.
    plugins: [tailwindcss()],
  },
});
