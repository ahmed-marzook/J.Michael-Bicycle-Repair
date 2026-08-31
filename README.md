# J.Michael Bicycle Repair

Static marketing website for **Bletchley Bicycle Repairs, Servicing & Sales by
J.Michael & Co** — a bicycle repair workshop in Fenny Stratford, Bletchley,
Milton Keynes. Built with Astro 7, Tailwind CSS 4 and TypeScript in strict mode.

All client facts (contact details, address, services, the servicing plan,
prices, reviews) live in one typed module, `src/data/business.ts`. Nothing else
hard-codes them.

## Prerequisites

Node.js 20.3+ (developed on Node 25) and npm. Then `npm install`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the built output locally |
| `npm run check` | `astro check` — TypeScript and template diagnostics |

## Google reviews

Real Google reviews are fetched once at build time (via the Featurable API) and
baked into static HTML, so the visitor's browser makes no third-party request
and runs no JavaScript for them. They refresh only when the site is rebuilt, so
schedule a periodic rebuild.

Set `FEATURABLE_WIDGET_ID` in a local `.env` (see `.env.example`, which explains
how to obtain it) or in the CI environment. No API key is needed. Without it —
or if the API is unreachable or errors — the build still succeeds, prints one
warning line and renders the clearly-marked placeholder testimonials from
`src/data/business.ts`. The 5.0 / 85 aggregate and the link to the Google
listing come from `business.ts` and are shown either way.

## Deployment

This is a static build: `npm run build` emits plain HTML, CSS and assets to
`dist/` with no server, no adapter and no runtime environment variables. The
only build-time network call is the optional review fetch above, and the build
succeeds offline without it. Publishing `dist/` to GitHub Pages or Azure Static
Web Apps is the whole deployment. Before going live, set the real production
domain in `site:` in `astro.config.mjs` and in the `Sitemap:` line of
`public/robots.txt` — both are placeholders, and canonical URLs, Open Graph
tags and `sitemap-index.xml` are all generated from them.

See `AGENTS.md` for how work on this repository is organised, and
`docs/PROJECT_BRIEF.md` for the client facts.
