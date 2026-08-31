# Project Brief — J.Michael Bicycle Repair Website

> This is the single source of truth for the build. Every agent reads this file
> before doing anything. If a fact is not in here, it is not a fact — ask, or use
> a clearly-marked placeholder.

## 1. The client

**J.Michael & Co** — trading as *Bletchley Bicycle Repairs, Servicing & Sales by
J.Michael & Co*. A one-man, highly-rated local bicycle repair shop in Bletchley,
Milton Keynes. Rated **5.0 from 85 Google reviews**. The brand voice is
qualified, experienced, friendly, helpful — a proper local craftsman, not a chain.

### Verified contact details (transcribed from the client's own signage)

| Field | Value |
| --- | --- |
| Phone / WhatsApp / SMS | `07399 351272` (international: `+44 7399 351272`) |
| WhatsApp deep link | `https://wa.me/447399351272` |
| Email | `jmichaelbicyclerepair@gmail.com` |
| Address | Unit 1, 75 Tavistock Street, Fenny Stratford, Bletchley, Milton Keynes, MK2 2PG |
| Facebook (primary) | `https://www.facebook.com/jmichaelbicyclerepair/` |
| Facebook (secondary) | `https://www.facebook.com/bletchleybicyclerepair` |
| Google Business listing | `https://share.google/LNl3pH9Xo1517DFQA` |
| Google Maps directions | `https://www.google.com/maps/search/?api=1&query=Unit+1,+75+Tavistock+Street,+Fenny+Stratford,+Milton+Keynes,+MK2+2PG` |

> Contact enquiries and appointments are made by **phoning, texting or
> WhatsApping Jimmy anytime** — that is the client's own wording on the sign.
> WhatsApp is the primary channel and must be the most prominent CTA on the site.

**Opening hours are NOT known.** Do not invent them. Render an hours block that
says "Call or WhatsApp anytime to arrange an appointment" and leave a clearly
commented `TODO(client)` in the data file so it can be filled in later.

## 2. Services offered (from the Google Business listing)

Bicycle wash · Bike assembly & disassembly · Brake adjustment · Custom bicycle
build · Derailleur adjustment · Gear adjustment · Headset adjustment · Lube
service · Safety inspection · Shock service · Tyre/tube repair · Tune-up ·
Wheel alignment

## 3. The servicing plan — "The Basic Yet Comprehensive & Thorough Servicing Plan"

Transcribed from the client's price card. Reproduce the wording faithfully
(light punctuation/typo fixes are allowed, e.g. "upto" → "up to", and the
unclosed bracket on the grips line).

*Please note: the cost of any parts and/or cleaning are charged separately.*

1. F&R wheel positions, wheel bearings checked and adjusted to ideal tolerances
2. Tyres checked for condition, correct seating, adjusted if necessary and inflated to correct pressures
3. Wheels straightened/trued if necessary, spoke tension checked
4. All brake and gear cables lubricated where access can be made
5. All brake and gear systems meticulously set up for optimum performance
6. Braking, drivetrain components & all nuts, bolts throughout the bike are checked and tightened to specification
7. Steering (headset) bearings adjusted to correct tolerances
8. Bottom bracket (BB) bearings adjusted to correct tolerances (un-sealed type)
9. Handlebars, brake and gear levers checked for suitable riding position, adjusted if necessary
10. Handlebar grips removed, cleaned and sanitised then re-fitted (N/A for road bikes fitted with handlebar tape)
11. Bolts securing seat, seat post and accessories such as mudguards, lights, pannier racks etc are checked and secured correctly
12. Test riding, finishing touches and last minute checks carried out
13. Assistance loading and unloading bike from vehicle always gladly and carefully provided

### Pricing (must be exact — this is money)

| Price | What it covers |
| --- | --- |
| **£40** | Junior bike up to 20" wheel size, single speed — no gears |
| **£45** | Junior bike up to 24" with up to one set of gears |
| **£50** | Adult bike with up to two sets of gears |

All three tiers include the full servicing plan above. Parts and cleaning are
charged separately — this caveat must appear next to the prices, not buried.

Repairs outside the servicing plan (punctures, wheel builds, custom builds) are
quoted individually — direct the user to WhatsApp for a quote rather than
inventing prices.

## 4. Goals (the definition of done)

1. A website the client can **share** (a link that looks good when pasted into
   Facebook/WhatsApp) and that people can **discover** (ranks for local search).
2. A **polished UI** that makes it obvious what is offered and what it costs.
3. **Effortless contact** — WhatsApp first, then phone, SMS, email, Facebook.
4. A genuine **About** page for Jimmy.
5. Prices, socials, Google reviews, contact, and a Google Maps link all present.

## 5. Required pages

| Route | Purpose |
| --- | --- |
| `/` | Hero, trust signals (5.0 stars / 85 reviews), services overview, pricing teaser, review highlights, location + map link, contact CTA |
| `/services/` | Full service list plus the complete 13-point servicing plan |
| `/pricing/` | The three tiers, what is included, the parts caveat, quote CTA |
| `/about/` | About Jimmy / J.Michael & Co — story, credentials, why local |
| `/contact/` | WhatsApp-first contact, all other channels, address, map link |
| `/404` | Friendly not-found page |

## 6. Technical requirements

- **Astro** — latest stable (**7.x**), **static output**, no SSR, no server
  adapter. An earlier draft of this brief said "v5.x"; that was wrong. The 5.x
  line is unpatched and carries known `sharp`/libvips and esbuild advisories,
  and `astro:assets` uses sharp, so we stay current.
- **Tailwind CSS v4** via the official `@tailwindcss/vite` plugin (this is the
  current supported path; the old `@astrojs/tailwind` integration is deprecated).
- **TypeScript** in `strict` mode.
- Deployable to **GitHub Pages / Azure Static Web Apps** — pure static assets in
  `dist/`, no runtime server, no environment secrets required to build.
- Use **maintained npm packages** rather than hand-rolling: `@astrojs/sitemap`,
  `astro-seo` (or Astro's own head management), `astro:assets` for images,
  `@astrojs/check`. Do not add a heavy UI framework (no React/Vue) — this is a
  content site; plain Astro components plus a few lines of vanilla JS is correct.
- **Zero client-side JS by default.** Any interactivity (mobile nav, FAQ
  accordion) must be progressive and tiny.
- **Images: placeholders only.** Use locally-generated SVG placeholders committed
  under `src/assets/` (not a remote placeholder service — it must build offline
  and not leak requests). Every placeholder needs a `TODO(client): replace with
  real photo` comment and a realistic `alt`.

## 7. SEO requirements

- Per-page `<title>` and `<meta name="description">`, canonical URLs.
- Open Graph and Twitter card tags, plus an OG image (placeholder is fine) so the
  link previews well when shared on Facebook/WhatsApp.
- **`LocalBusiness` JSON-LD** structured data: name, address (PostalAddress),
  telephone, email, areaServed (Bletchley, Fenny Stratford, Milton Keynes),
  `sameAs` for the Facebook and Google links, `aggregateRating` of 5.0 / 85, and
  `priceRange`. Add `Service` / `OfferCatalog` entries for the three tiers.
- `sitemap.xml` (via `@astrojs/sitemap`) and a `robots.txt`.
- Semantic HTML: one `<h1>` per page, real heading hierarchy, descriptive link
  text, `lang="en-GB"`.
- Local-search keywords used naturally in copy: *bike repair Bletchley*,
  *bicycle servicing Milton Keynes*, *Fenny Stratford*, *MK2*.

## 8. Accessibility and quality bar

- WCAG 2.2 AA: contrast at least 4.5:1 for body text, visible focus rings,
  44x44px minimum tap targets, `prefers-reduced-motion` respected.
- Keyboard navigable end to end; skip-to-content link.
- Mobile-first — most visitors will arrive from a phone via Facebook/WhatsApp.
- Lighthouse targets: Performance >= 95, Accessibility 100, Best Practices >= 95,
  SEO 100 on a production build.
- `npm run build` must pass clean, and `astro check` must report 0 errors.

## 9. Content and data architecture

Put all client facts in **one** typed module — `src/data/business.ts` — exporting
a strongly-typed object (name, contact, address, socials, hours, services,
servicing plan, pricing tiers, reviews). Every page and the JSON-LD reads from
it. Nothing hard-codes a phone number or a price in markup. When Jimmy's details
change, one file changes.

### Google reviews — must be real, not hardcoded

The site must show **real Google reviews**, pulled from Google rather than typed
into the repo. The placeholder testimonials currently in `business.ts` are a
stopgap and must be replaced by a live source.

Approach: **fetch at build time from Featurable, bake into static HTML.** The
build calls the Featurable API, maps the result onto the existing
`VerifiedTestimonial` type and renders it as plain HTML. This keeps the site
zero-JS, adds no third-party request or cookie for visitors, and cannot slow
the page down.

Why Featurable over the two obvious alternatives (client decision):

- **Google Places API** caps at 5 reviews, chosen by Google, and needs a
  billable Google Cloud key. Featurable is free for unlimited page views and
  returns more than 5.
- **Elfsight** (a widget the client already configured) shows the full review
  wall but injects third-party JavaScript and cookies, keeps the review text
  out of the HTML so search engines never see it, and its free tier stops at
  200 widget views per month, which would make reviews vanish mid-month on a
  site whose whole purpose is being found.

Rules for the implementation:

- **The build must never break because of it.** No key, no network, an API
  error or a rate limit must all fall back to the existing placeholders and
  emit a warning. A failed fetch is not a failed build.
- Credentials come from environment variables and are used **only at build
  time**. They must never reach `dist/`. Committing one is a security incident.
- Reviews are refreshed by re-running the build, so the site needs a periodic
  rebuild, not a one-off fetch, to stay current.
- Respect Google's display requirements: show the reviewer's name as given, do
  not edit review text, and attribute the reviews to Google.
- **Do not fetch or hotlink reviewer profile photos.** Those URLs expire, and a
  dead one must never be able to fail the build; hotlinking them would also put
  a third-party request back on the page. Render initials in a circle instead.
- Cap what renders at a sensible number and word it honestly as a selection,
  never implying the page shows all 85.
- Keep the real aggregate (5.0 stars, 85 reviews) and the prominent link out to
  the live Google listing regardless of whether the fetch succeeded.
- Never fabricate a quote or attribute one to a named real person.

Needed from the client: a free Featurable account with the Google Business
listing connected, and the resulting widget ID. `TODO(client)` until supplied.

If the Featurable route ever proves impractical, the fallback order is: Google
Places API at build time (5 reviews, needs a billable key), then a client-side
widget as a last resort. A widget is last because it injects JavaScript, makes
third-party requests and sets cookies on the visitor's browser, which this site
otherwise avoids entirely.

## 10. Out of scope for now

Hosting setup, CI/CD, custom domain, analytics, contact-form backend. Keep the
build static and host-agnostic so any of these can be added later.
