// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Base domain for sitemaps, canonical tags, and Open Graph URLs (no trailing slash)
  site: 'https://ahmed-marzook.github.io',

  // Repository subpath required for GitHub Pages project sites
  base: '/J.Michael-Bicycle-Repair',

  // Pure static output: no adapter, no SSR, no runtime server.
  // Deployable as plain files to GitHub Pages / Azure Static Web Apps.
  output: 'static',

  integrations: [sitemap()],

  image: {
    // Astro gates SVG rasterisation behind this flag, because a hostile
    // SVG can be made expensive to render. Every SVG in src/assets/ is authored
    // in this repository and no remote image is ever processed, so the risk it
    // guards against does not exist here.
    //
    // It is required: docs/DESIGN_SYSTEM.md 6.3 rasterises og-default.svg to a
    // real 1200x630 PNG at build time via getImage(), because Facebook and
    // WhatsApp will not render an SVG og:image. Without this flag the build
    // fails with UnsupportedImageFormat. sharp is bundled with Astro, so this
    // stays a fully offline build.
    dangerouslyProcessSVG: true,
  },

  vite: {
    // Tailwind CSS v4 is wired in as a Vite plugin. The old
    // @astrojs/tailwind integration is deprecated and is deliberately not used.
    plugins: [tailwindcss()],
  },
});