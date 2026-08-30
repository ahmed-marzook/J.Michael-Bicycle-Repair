# Design System: J.Michael Bicycle Repair

> Owned by the design agent (AGENTS.md 5.1). This file is the visual contract.
> The implementation agent builds to it and does not redesign. If something here
> is ambiguous or wrong, say so in the handoff rather than improvising.
>
> Every fact (prices, phone, address, ratings) comes from
> [`docs/PROJECT_BRIEF.md`](PROJECT_BRIEF.md) and is read from `src/data/business.ts`.
> Nothing in this document authorises inventing content.

## 0. The brief in one paragraph

Jimmy's shopfront sign is bright and mid greens plus a dark olive green on white,
with small gold five pointed stars as bullet markers and a heavy condensed
slab/stencil display face. The site must read as the same business: same greens,
same gold stars, same condensed voice in the headings, but cleaner, quieter and
modern. The target feeling is "skilled local craftsman with a proper workshop",
not "bike chain megastore" and not "generic SaaS landing page". Most visitors
land on a phone from a Facebook or WhatsApp link, so the phone layout is the
design and the desktop layout is the adaptation.

**The site has one job: get someone to message Jimmy on WhatsApp.** Every rule
below is subordinate to that.

### Hard constraints

- Tailwind CSS v4. All tokens live in an `@theme` block in
  `src/styles/global.css`. No `tailwind.config.js`, no colour extension there.
- Zero client side JavaScript by default. The mobile nav is a `<details>`
  disclosure. Nothing on this site requires JS to work.
- Minimum tap target 44x44 CSS px on every interactive element.
- Every choice must survive being rendered as pure static HTML.
- WCAG 2.2 AA. Contrast numbers below are computed, not estimated.

---

## 1. Colour

### 1.1 How the palette was derived

The sign gives three colour families: a bright/mid green, a dark olive green, and
gold stars, all on white. The palette keeps a single green hue ramp (a slightly
cool, saturated forest green) for brand and text, a separate olive ramp used
sparingly for a second dark tone, and a gold ramp for stars, badges and accents.
Neutrals are green tinted greys so nothing on the page looks like stock slate.

### 1.2 The `@theme` block

Paste this verbatim into `src/styles/global.css` under `@import "tailwindcss";`.

```css
@theme {
  /* ---- Brand green ramp (from the sign's bright and mid greens) ---- */
  --color-brand-50:  #F1F8F2;
  --color-brand-100: #DCEFE1;
  --color-brand-200: #B7DEC2;
  --color-brand-300: #86C598;
  --color-brand-400: #4FA46B;
  --color-brand-500: #2E8B4E;  /* the sign's bright green. Fills and graphics only. */
  --color-brand-600: #1B6B3A;  /* primary action green */
  --color-brand-700: #14532B;  /* links, hover, secondary button ink */
  --color-brand-800: #0F3D21;  /* active / pressed */
  --color-brand-900: #0B2A17;  /* headings, dark bands, footer */

  /* ---- Olive (the sign's dark olive green). Second dark tone, used sparingly ---- */
  --color-olive-700: #3C4A22;
  --color-olive-800: #2C3719;

  /* ---- Gold accent (the sign's five pointed stars) ---- */
  --color-accent-300: #F4C64A;  /* stars and text ON dark green only */
  --color-accent-400: #E0A81F;  /* badge and highlight BACKGROUNDS only */
  --color-accent-500: #B67B06;  /* stars, rules and large text on light surfaces */
  --color-accent-600: #8A5B00;  /* accent body text on light surfaces */

  /* ---- Neutrals (green tinted) ---- */
  --color-ink:            #111A14;  /* maximum contrast text, used rarely */
  --color-body:           #33413A;  /* default body text */
  --color-muted:          #5A6960;  /* captions, meta, secondary text */
  --color-white:          #FFFFFF;
  --color-canvas:         #F7F9F6;  /* page background */
  --color-surface:        #FFFFFF;  /* cards, header */
  --color-surface-subtle: #EEF4EE;  /* alternating section bands */
  --color-border:         #788B80;  /* every visible 1px line on the site */
  --color-border-inverse: #86C598;  /* lines on dark green surfaces */

  /* ---- Semantic aliases (use these in markup, not the ramp numbers) ---- */
  --color-primary:        var(--color-brand-600);
  --color-primary-hover:  var(--color-brand-700);
  --color-primary-active: var(--color-brand-800);
  --color-heading:        var(--color-brand-900);
  --color-link:           var(--color-brand-700);
  --color-star:           var(--color-accent-500); /* on light */
  --color-star-inverse:   var(--color-accent-300); /* on dark green */
  --color-focus:          var(--color-brand-900);
  --color-focus-offset:   var(--color-white);
  --color-danger:         #B3261E;  /* 404 accent only. No error states exist. */
}
```

Tailwind v4 generates `bg-brand-600`, `text-heading`, `border-border` and so on
from these automatically. Use the semantic aliases in markup wherever one exists.

### 1.3 Measured contrast ratios

Computed with the WCAG 2.x relative luminance formula (sRGB, gamma expanded,
`(L1 + 0.05) / (L2 + 0.05)`). Every pair the site actually uses is listed. AA
thresholds: 4.5:1 body text, 3:1 large text (>= 24px, or >= 18.66px bold) and
non text UI parts.

#### Text on light surfaces

| Foreground | Background | Ratio | Required | Verdict |
| --- | --- | --- | --- | --- |
| `body` #33413A | `white` #FFFFFF | **10.73:1** | 4.5 | PASS |
| `body` #33413A | `canvas` #F7F9F6 | **10.13:1** | 4.5 | PASS |
| `body` #33413A | `surface-subtle` #EEF4EE | **9.61:1** | 4.5 | PASS |
| `body` #33413A | `brand-50` #F1F8F2 | **9.93:1** | 4.5 | PASS |
| `body` #33413A | `brand-100` #DCEFE1 | **8.93:1** | 4.5 | PASS |
| `heading` #0B2A17 | `white` | **15.47:1** | 4.5 | PASS |
| `heading` #0B2A17 | `canvas` | **14.61:1** | 4.5 | PASS |
| `heading` #0B2A17 | `surface-subtle` | **13.85:1** | 4.5 | PASS |
| `muted` #5A6960 | `white` | **5.79:1** | 4.5 | PASS |
| `muted` #5A6960 | `canvas` | **5.47:1** | 4.5 | PASS |
| `muted` #5A6960 | `surface-subtle` | **5.19:1** | 4.5 | PASS |
| `muted` #5A6960 | `brand-100` #DCEFE1 | **4.82:1** | 4.5 | PASS |
| `link` #14532B | `white` | **9.12:1** | 4.5 | PASS |
| `link` #14532B | `canvas` | **8.62:1** | 4.5 | PASS |
| `link` #14532B | `surface-subtle` | **8.17:1** | 4.5 | PASS |
| `link` #14532B | `brand-100` | **7.59:1** | 4.5 | PASS |
| `brand-600` #1B6B3A | `white` | **6.54:1** | 4.5 | PASS |
| `brand-600` #1B6B3A | `brand-50` | **6.06:1** | 4.5 | PASS |
| `accent-600` #8A5B00 | `white` | **5.87:1** | 4.5 | PASS |
| `accent-600` #8A5B00 | `brand-50` | **5.44:1** | 4.5 | PASS |
| `olive-800` #2C3719 | `white` | **12.59:1** | 4.5 | PASS |
| `danger` #B3261E | `white` | **6.54:1** | 4.5 | PASS |

#### Text on dark surfaces

| Foreground | Background | Ratio | Required | Verdict |
| --- | --- | --- | --- | --- |
| `white` | `brand-600` #1B6B3A (primary button) | **6.54:1** | 4.5 | PASS |
| `white` | `brand-700` #14532B (button hover) | **9.12:1** | 4.5 | PASS |
| `white` | `brand-800` #0F3D21 (button active) | **12.28:1** | 4.5 | PASS |
| `white` | `brand-900` #0B2A17 (footer, CTA band) | **15.47:1** | 4.5 | PASS |
| `canvas` #F7F9F6 | `brand-900` | **14.61:1** | 4.5 | PASS |
| `brand-100` #DCEFE1 | `brand-900` (footer secondary text) | **12.87:1** | 4.5 | PASS |
| `brand-200` #B7DEC2 | `brand-900` (footer meta text) | **10.49:1** | 4.5 | PASS |
| `accent-300` #F4C64A | `brand-900` (stars on dark) | **9.59:1** | 4.5 | PASS |
| `accent-300` #F4C64A | `brand-800` | **7.62:1** | 4.5 | PASS |
| `brand-900` #0B2A17 | `accent-400` #E0A81F (badge) | **7.21:1** | 4.5 | PASS |
| `brand-900` #0B2A17 | `brand-100` (chip) | **12.87:1** | 4.5 | PASS |
| `brand-900` #0B2A17 | `brand-200` (chip) | **10.49:1** | 4.5 | PASS |
| `white` | `olive-700` #3C4A22 | **9.57:1** | 4.5 | PASS |
| `white` | `accent-600` #8A5B00 | **5.87:1** | 4.5 | PASS |
| `white` | `danger` #B3261E | **6.54:1** | 4.5 | PASS |

#### Non text: borders, icons, stars, focus

| Element | Pair | Ratio | Required | Verdict |
| --- | --- | --- | --- | --- |
| Any 1px line | `border` #788B80 on `white` | **3.62:1** | 3.0 | PASS |
| Any 1px line | `border` #788B80 on `canvas` | **3.42:1** | 3.0 | PASS |
| Any 1px line | `border` #788B80 on `surface-subtle` | **3.24:1** | 3.0 | PASS |
| Any 1px line | `border` #788B80 on `brand-50` | **3.35:1** | 3.0 | PASS |
| Any 1px line | `border` #788B80 on `brand-100` | **3.01:1** | 3.0 | PASS |
| Line on dark | `border-inverse` #86C598 on `brand-900` | **7.70:1** | 3.0 | PASS |
| Star glyph (light) | `accent-500` #B67B06 on `white` | **3.61:1** | 3.0 | PASS |
| Star glyph (light) | `accent-500` on `canvas` | **3.41:1** | 3.0 | PASS |
| Star glyph (light) | `accent-500` on `surface-subtle` | **3.23:1** | 3.0 | PASS |
| Star glyph (dark) | `accent-300` #F4C64A on `brand-900` | **9.59:1** | 3.0 | PASS |
| Icon (light) | `brand-600` #1B6B3A on `white` | **6.54:1** | 3.0 | PASS |
| Emphasised card rule | `brand-600` on `canvas` | **6.18:1** | 3.0 | PASS |
| Focus ring outer | `focus` #0B2A17 against its white offset ring | **15.47:1** | 3.0 | PASS |
| Focus ring inner | white offset ring on a `brand-600` button | **6.54:1** | 3.0 | PASS |
| Focus ring inner | white offset ring on the `brand-900` band | **15.47:1** | 3.0 | PASS |

Every pairing passes.

#### Corrections already applied (do not revert)

- The first border candidate was #D5DFD7, which measures **1.37:1** on white and
  **1.29:1** on canvas. Both fail the 3:1 requirement. It was darkened to
  **#788B80** (3.62:1 on white, 3.01:1 on the darkest surface it is used on).
  There is now exactly one border colour on the site and every visible line
  passes. Do not add a "lighter hairline" token.
- The first star colour for light surfaces was `accent-400` #E0A81F, which
  measures **2.14:1** on white and fails. Stars on light surfaces use
  `accent-500` #B67B06 (3.61:1). #E0A81F is retained as a **background** only
  (badges, with `brand-900` text at 7.21:1). Never use gold as a line or a glyph
  on a white or light background.

#### Colours that are banned outright

- WhatsApp brand green #25D366 as a button background with white text measures
  **1.94:1**. It fails badly. The WhatsApp CTA uses `brand-600` with white text
  (6.54:1) and a WhatsApp glyph. Do not "make it look like WhatsApp".
- `brand-500` #2E8B4E as text on white measures **4.27:1**, below the body
  threshold. Use it for fills, illustration and graphics only, never for text.
- `accent-300` #F4C64A and `accent-400` #E0A81F as foregrounds on any light
  surface. Dark green backgrounds only.

### 1.4 Where each colour goes

- **Page background**: `canvas`. Cards and the header sit on `surface` (white).
- **Section rhythm**: alternate `canvas` and `surface-subtle` bands. Use at most
  two consecutive light bands before a `brand-900` dark band, so the page has a
  visible beat when thumb scrolled.
- **Dark bands**: `brand-900`. Two per page maximum (normally the final CTA band
  and the footer), so dark stays an emphasis and not a theme.
- **Olive** is a texture colour, not a UI colour. Its only jobs are the 404
  illustration field and the placeholder artwork. It brings the second dark green
  from the sign without introducing a second UI ink. Never use olive for text,
  buttons or borders.
- **Gold** is rationed. It appears on the star rating, the emphasised pricing
  card's top rule and badge, the star bullets in the 13 point servicing plan, and
  the footer star divider. Nowhere else. Gold everywhere reads as cheap.

---

## 2. Typography

### 2.1 Families

| Role | Family | How it ships | Why |
| --- | --- | --- | --- |
| Display / headings | **Oswald Variable** (200 to 700) | `@fontsource-variable/oswald`, self hosted woff2, latin subset | The closest well hinted, highly legible condensed face to the sign's heavy condensed display type. Reads as signwriting without being a novelty font. |
| Body / UI | **Source Sans 3 Variable** (200 to 900) | `@fontsource-variable/source-sans-3`, self hosted woff2, latin subset | Humanist, warm, large x-height, excellent at 15 to 17px on a phone. Deliberately not Inter, which reads as SaaS. |

Both are Google Fonts, but they install from npm and serve from our own origin.
That is the "loaded efficiently" requirement: no third party connection, no
render blocking `fonts.googleapis.com` request, no build time network call, and
the site still builds offline as AGENTS.md 2.3 requires.

**Loading rules**

- Import only the latin subset and only the weights used:
  `@fontsource-variable/oswald/wght.css` and
  `@fontsource-variable/source-sans-3/wght.css`, imported once in
  `BaseLayout.astro`. Nothing else imports fonts.
- `font-display: swap` (the Fontsource default) so text paints immediately.
- Preload the two woff2 files in `<head>` with
  `<link rel="preload" as="font" type="font/woff2" crossorigin>`.
- Fallback stacks are chosen so the swap does not reflow much:

```css
--font-display: "Oswald Variable", "Oswald", "Archivo Narrow",
                "Roboto Condensed", "Arial Narrow", system-ui, sans-serif;
--font-body: "Source Sans 3 Variable", "Source Sans 3", "Source Sans Pro",
             system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue",
             Arial, sans-serif;
```

`html { font-family: var(--font-body); }`. Headings, prices, the logotype and
button labels use `var(--font-display)`. Body copy never uses the display face.

### 2.2 Scale

Fluid between a 360px and a 1280px viewport. The clamps below were generated
arithmetically, not hand written. Anything not listed inherits `--text-base`.

```css
@theme {
  --font-display: "Oswald Variable", "Oswald", "Archivo Narrow", "Roboto Condensed", "Arial Narrow", system-ui, sans-serif;
  --font-body: "Source Sans 3 Variable", "Source Sans 3", "Source Sans Pro", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

  --text-eyebrow:  0.8125rem;                                       /* 13px */
  --text-caption:  0.875rem;                                        /* 14px */
  --text-sm:       0.9375rem;                                       /* 15px */
  --text-base:     1.0625rem;                                       /* 17px */
  --text-lead:     clamp(1.125rem, 1.076rem + 0.217vw, 1.25rem);    /* 18 -> 20 */
  --text-h4:       clamp(1.125rem, 1.076rem + 0.217vw, 1.25rem);    /* 18 -> 20 */
  --text-h3:       clamp(1.3125rem, 1.239rem + 0.326vw, 1.5rem);    /* 21 -> 24 */
  --text-h2:       clamp(1.6875rem, 1.467rem + 0.978vw, 2.25rem);   /* 27 -> 36 */
  --text-h1:       clamp(2.125rem, 1.685rem + 1.96vw, 3.25rem);     /* 34 -> 52 */
  --text-display:  clamp(2.375rem, 1.739rem + 2.83vw, 4rem);        /* 38 -> 64 */
  --text-price:    clamp(2.5rem, 2.109rem + 1.74vw, 3.5rem);        /* 40 -> 56 */
}
```

| Token | Mobile (360px) | Desktop (>= 1280px) | Family | Weight | Line height | Tracking | Case |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `display` | 38px | 64px | display | 600 | 1.05 | 0 | Sentence |
| `h1` | 34px | 52px | display | 600 | 1.08 | 0 | Sentence |
| `h2` | 27px | 36px | display | 600 | 1.15 | 0 | Sentence |
| `h3` | 21px | 24px | display | 500 | 1.25 | 0 | Sentence |
| `h4` (card title) | 18px | 20px | body | 700 | 1.35 | 0 | Sentence |
| `lead` (hero sub) | 18px | 20px | body | 400 | 1.55 | 0 | Sentence |
| `base` (body) | 17px | 17px | body | 400 | 1.65 | 0 | Sentence |
| `sm` | 15px | 15px | body | 400 | 1.55 | 0 | Sentence |
| `caption` | 14px | 14px | body | 400 | 1.45 | 0 | Sentence |
| `eyebrow` | 13px | 13px | display | 600 | 1.2 | 0.1em | UPPERCASE |
| `price` | 40px | 56px | display | 600 | 1.0 | 0 | Numerals |
| Button label | 17px | 17px | display | 600 | 1 | 0.02em | Sentence |
| Nav link | 17px | 16px | display | 500 | 1 | 0.02em | Sentence |

**Rules**

- Only the home page `h1` uses the `display` size. Every other page's `h1` uses
  the `h1` token. This keeps the home page the loudest page on the site.
- Prices use `font-variant-numeric: tabular-nums lining-nums` so £40, £45 and £50
  align across the pricing grid.
- Measure: prose caps at `68ch` for `sm` and `base`; headings cap at `34ch` for
  `display`, `h1` and `h2` so headlines break in sensible places.
- Never set body copy in the display face. Oswald is condensed and loses
  legibility fast below 17px in running text.
- Uppercase is only ever the `eyebrow` token, and an eyebrow is always paired
  with a real heading. Never uppercase a heading or a button label.
- `text-wrap: balance` on `h1`, `h2`, `h3`. `text-wrap: pretty` on `lead` and `p`.
- `hyphens: none` and `overflow-wrap: break-word` on body copy, so long strings
  such as `jmichaelbicyclerepair@gmail.com` never cause horizontal scroll at 320px.

---

## 3. Space, radii, shadows, borders, layout

### 3.1 Spacing

Tailwind v4's default 0.25rem step is correct. Use only these steps:

`1 (4px), 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), 8 (32px), 10 (40px),
12 (48px), 16 (64px), 20 (80px), 24 (96px)`.

Do not use 7, 9, 11, 13, 14, 15 or arbitrary bracket values. If a gap needs a
value that is not on this list, the layout is wrong.

| Purpose | Mobile | Desktop |
| --- | --- | --- |
| Section vertical padding | 48px (`py-12`) | 96px (`py-24`) |
| Dark CTA band padding | 56px | 80px |
| Page gutter | 20px (`px-5`) | 32px (`px-8`) |
| Container max width | n/a | 1152px (`max-w-6xl`) |
| Prose container max width | n/a | 720px |
| Gap between cards in a grid | 16px | 24px |
| Card internal padding | 20px | 24px |
| Heading to body gap | 12px | 16px |
| Paragraph to paragraph | 16px | 16px |
| Stacked buttons gap (mobile) | 12px | n/a |
| List item gap | 12px | 12px |

If a fluid section rhythm is preferred over the two step version, add
`--section-pad: clamp(3rem, 1.826rem + 5.22vw, 6rem)` to `@theme`. Pick one
approach and use it everywhere. Do not mix.

### 3.2 Radii

```css
@theme {
  --radius-sm:   0.375rem;  /*  6px  chips, small badges */
  --radius-md:   0.625rem;  /* 10px  buttons, inputs */
  --radius-lg:   0.875rem;  /* 14px  cards */
  --radius-xl:   1.25rem;   /* 20px  hero media, dark CTA band, illustration frames */
  --radius-full: 9999px;    /*       rating pill, star chip */
}
```

Nothing on this site has a perfectly square corner and nothing is a blob. 14px
on cards is the house look.

### 3.3 Shadows

Shadows are tinted with brand green, never neutral black. Three levels only.

```css
@theme {
  --shadow-1: 0 1px 2px rgb(11 42 23 / 0.06), 0 1px 1px rgb(11 42 23 / 0.04);
  --shadow-2: 0 2px 4px -1px rgb(11 42 23 / 0.08), 0 8px 16px -6px rgb(11 42 23 / 0.10);
  --shadow-3: 0 -2px 12px rgb(11 42 23 / 0.12);
}
```

- `shadow-1`: resting cards and the sticky header.
- `shadow-2`: the emphasised pricing card, and card hover on pointer devices.
- `shadow-3`: upward only, for the persistent mobile WhatsApp bar, so it reads as
  floating above the page rather than as part of the footer.

Shadow is never the only thing separating an element from its background. Every
card also carries a 1px `border` line, and that line is what satisfies the 3:1
non text contrast requirement.

### 3.4 Borders

- One line colour: `--color-border` #788B80.
- 1px for resting cards, dividers, the header underline, the footer top rule.
- 2px for the secondary button outline and the emphasised pricing card, both in
  `--color-brand-600`.
- 4px left rule in `--color-brand-500` on blockquotes, review cards and note boxes.
- On dark green surfaces use `--color-border-inverse` #86C598 at 1px, or a 12%
  white overlay for purely decorative rules inside the footer.

### 3.5 Grid and breakpoints

Tailwind defaults. Only three matter on this site.

| Breakpoint | Width | What changes |
| --- | --- | --- |
| base | 0 to 639px | Single column. Sticky WhatsApp bar visible. Nav is a `<details>` disclosure. |
| `sm` | 640px | Two column card grids. Buttons sit side by side instead of stacked. |
| `md` | 768px | Desktop header with inline nav. Mobile WhatsApp bar hidden. Three column card grids. |
| `lg` | 1024px | Hero splits into a two column text plus image layout. Pricing keeps three columns with more air. |

Design and review every page at **360px** first. 320px must not scroll
horizontally. Nothing may depend on hover.

---

## 4. Components

Rules that apply to every interactive element:

- Minimum hit area 44x44 CSS px. If a control is visually smaller (icon buttons,
  footer social links), pad it or set `min-height: 44px; min-width: 44px`.
- Focus is never removed. The global rule is:

```css
:where(a, button, summary, [tabindex]):focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
  box-shadow: 0 0 0 2px var(--color-focus-offset);
  border-radius: var(--radius-md);
}
```

  The white inner ring makes the dark ring visible on green and on white alike:
  the dark ring measures 15.47:1 against the white offset ring, and the white
  offset ring measures 6.54:1 against a `brand-600` button and 15.47:1 against
  the `brand-900` band.
- Every link that opens a new tab uses `target="_blank" rel="noopener noreferrer"`
  plus a visually hidden "(opens in a new tab)" in the accessible name.
- Icons are inline SVG, 20x20 or 24x24, `stroke-width: 1.75`, `currentColor`,
  `aria-hidden="true"`, `focusable="false"`. An icon never carries meaning alone.

### 4.1 Primary button (the WhatsApp CTA)

The single most important object on the site.

**Anatomy**, left to right: WhatsApp glyph (20x20, `currentColor`), label.
Nothing else, no chevron. The label is always an action plus the person:
**"WhatsApp Jimmy"**. On the pricing and services pages it is
**"Get a price on WhatsApp"**.

**Element**: `<a href={business.contact.whatsappUrl}>`. Never a `<button>`.

| Property | Mobile | Desktop |
| --- | --- | --- |
| Height | 52px | 52px |
| Padding | 0 24px | 0 28px |
| Width | 100% of container (`w-full sm:w-auto`) | intrinsic |
| Font | display 600, 17px, 0.02em | same |
| Radius | `--radius-md` (10px) | same |
| Icon gap | 10px | same |

| State | Spec |
| --- | --- |
| Default | bg `brand-600` #1B6B3A, text white (6.54:1), `shadow-1`, no border |
| Hover (pointer only) | bg `brand-700` #14532B (9.12:1), `shadow-2`, `translateY(-1px)` |
| Focus visible | global focus ring, background unchanged |
| Active | bg `brand-800` #0F3D21 (12.28:1), `translateY(0)`, `shadow-1` |
| Disabled | **does not exist.** A link to WhatsApp is never disabled. If a variant seems to need a disabled state, the component is wrong. |
| Visited | identical to default. Do not let `:visited` change it. |

The primary button appears at most **twice per screenful**. If two primaries end
up adjacent, the second becomes a secondary.

### 4.2 Secondary button

For "Call 07399 351272" and "See prices".

- Anatomy: optional 20x20 icon plus label. Same 52px height and 10px radius as
  the primary.
- Default: transparent background, 2px `brand-600` border, `brand-700` label
  (label 9.12:1 on white, border 6.54:1 on white).
- Hover: background `brand-50` #F1F8F2, border `brand-700`, label `brand-700`
  (8.45:1 on brand-50).
- Focus visible: global ring.
- Active: background `brand-100` #DCEFE1 (label 7.59:1).
- **On a dark green band**: border and label become white; hover fills with
  `rgb(255 255 255 / 0.12)`; the white label measures 15.47:1 on `brand-900`.
- Mobile: full width, stacked **below** the primary with a 12px gap. From `sm`
  they sit side by side, primary first.

### 4.3 Tertiary / text link

- In prose: `brand-700` (9.12:1 on white), `text-decoration: underline`,
  `text-underline-offset: 0.18em`, `text-decoration-thickness: 0.08em`. Hover
  `brand-800`, thickness `0.12em`. Never remove the underline in body copy.
- Standalone links: `brand-700`, display face 500, underlined, with a 12x12
  chevron, wrapped in a `min-height: 44px` inline flex so the tap target is legal
  even though the text is 17px.
- Link text is always descriptive. Never "click here". Never a bare "read more".
  The house pattern is "See all 13 servicing steps" and
  "Read all 85 reviews on Google".

### 4.4 Sticky header

```
[ skip link (visually hidden until focused) ]
+-----------------------------------------------------------------+
| J.MICHAEL & CO                              [nav]  [WhatsApp]   |
| Bletchley Bicycle Repairs                                       |
+-----------------------------------------------------------------+
```

- `position: sticky; top: 0; z-index: 40`. Background `surface`, solid white, no
  blur and no transparency: blur costs paint time and hurts legibility.
- Height 60px mobile, 72px from `md`. Bottom border 1px `border` (3.62:1).
- `shadow-1` applied unconditionally, not on scroll, because scroll detection
  would need JS.
- `html { scroll-padding-top: 76px; }` and `88px` from `md`, so in page anchor
  targets are never hidden behind the header.
- Logotype: `J.MICHAEL & CO` in display 600, 18px, tracking 0.04em, `brand-900`,
  with `Bletchley Bicycle Repairs` beneath it in body 400, 12px, `muted`
  (5.79:1). It is an `<a href="/">` on every page except the home page, where it
  is a `<span>`. It is never the page `h1`.
- Desktop nav (`md` and up): an inline `<ul>` of five links (Home, Services,
  Pricing, About, Contact), 24px gap, nav link token, `brand-900` at rest,
  `brand-700` plus a 2px `brand-600` underline offset 6px on hover. The current
  page carries `aria-current="page"` and a permanent 2px `brand-600` underline.
  Each link has `padding-block: 14px` to reach 44px.
- The desktop header also carries a compact primary WhatsApp button on the right
  (44px tall variant, 0 20px padding), because desktop has no sticky bottom bar.

### 4.5 Mobile nav (zero JS)

A native `<details>` disclosure. No script, no focus trap, no `aria-expanded` to
keep in sync, and it works before hydration because there is no hydration.

```html
<details class="nav-disclosure md:hidden">
  <summary aria-label="Menu">   <!-- 44x44 hamburger, becomes a close mark when [open] -->
  <nav aria-label="Primary mobile">  <!-- the five links, stacked -->
</details>
```

- `<summary>` is 44x44, `list-style: none`,
  `::-webkit-details-marker { display: none }`, `cursor: pointer`. It is natively
  focusable and toggles on Enter and Space.
- The open panel sits **below** the header in normal document flow, not as an
  overlay: full width, background `surface`, 1px bottom `border`, each link 52px
  tall and full width with a 20px gutter, separated by 1px `border` lines.
  Because it is in flow it cannot cover content and it cannot trap focus. Tab
  order is header, panel links, page content, in DOM order.
- The hamburger to close mark transition is a CSS transform on
  `details[open] summary svg`, 150ms, suppressed under reduced motion.
- The desktop `<nav>` and the mobile `<details>` are two separate DOM blocks, one
  `hidden md:flex` and the other `md:hidden`, so exactly one is in the
  accessibility tree at any width. Give them distinct `aria-label` values
  ("Primary" and "Primary mobile") so a duplicated landmark name is never
  announced.
- No `<details>` on desktop, and no JS anywhere in this component.

### 4.6 Persistent mobile WhatsApp bar

The one piece of chrome that must be exactly right.

```html
<!-- last child of <body>, AFTER <footer> -->
<div class="mobile-cta md:hidden">
  <a href="…wa.me…" class="btn-primary w-full">WhatsApp Jimmy</a>
</div>
```

**Behaviour, precisely**

1. `position: fixed; inset-inline: 0; bottom: 0; z-index: 50`. Visible below `md`
   only (`md:hidden`), because desktop has the header button instead.
2. Background `surface` (white), top border 1px `border`, `shadow-3` (upward).
   The bar itself is white so the green button inside it stays the loudest thing
   on the screen.
3. Bar padding `12px 20px`, with
   `padding-bottom: calc(12px + env(safe-area-inset-bottom))` so it clears the
   iPhone home indicator.
4. **It never covers content.** Declare the height once and reserve it on the
   page:

```css
:root { --mobile-cta-h: 76px; }              /* 52px button + 12px + 12px */
@media (max-width: 767px) {
  body { padding-bottom: calc(var(--mobile-cta-h) + env(safe-area-inset-bottom)); }
}
```

   The footer therefore ends above the bar, and nothing is ever obscured,
   including the last footer line and the bottom of a long pricing list.
5. **It never traps focus.** It contains exactly one link, it is the last element
   in the DOM, and it has no `inert`, no `aria-modal`, no `tabindex` juggling and
   no listeners. Tabbing forward from the footer reaches it and then leaves the
   page. Screen reader users reach it last in reading order, which is correct,
   because the same CTA already appeared in the hero and in the final CTA band.
6. It does not hide on scroll and does not animate in. Hiding on scroll needs an
   `IntersectionObserver`, which the zero JS rule forbids and which would make
   the primary CTA intermittent.
7. It carries no landmark role. It is a single link, and labelling it as a region
   adds announcement noise for no benefit.
8. It is still shown on `/contact/`. Duplicating the CTA is acceptable; missing
   it is not.

### 4.7 Service card

Used on `/` (overview grid) and `/services/`.

```
+-------------------------------+
| [icon 24, brand-600]          |
| Brake adjustment        h4    |
| One line of plain English.    |
+-------------------------------+
```

- Element: `<li>` inside a `<ul class="grid">`. Not a link, and not clickable
  unless the card genuinely navigates. Most service cards do not navigate, so
  they are static content and must not have hover affordances.
- Surface `surface`, 1px `border`, `--radius-lg`, padding 20px mobile and 24px
  desktop, `shadow-1`.
- Icon 24x24 in `brand-600` (6.54:1) inside a 40x40 `brand-50` rounded square.
- Title uses the `h4` token in `brand-900`. Body uses `sm` in `body`.
- Grid: 1 column base, 2 at `sm`, 3 at `md`. Gap 16px then 24px.
- Equal height rows from the grid, content top aligned.
- Hover: none. They are not interactive. Do not add lift or a shadow change.

### 4.8 Pricing card

Three tiers, exactly as in the brief: **£40** junior up to 20 inch single speed,
**£45** junior up to 24 inch with up to one set of gears, **£50** adult with up
to two sets of gears. Prices are read from `business.ts` and never typed into
markup.

```
+---------------------------------+
| ==== 4px gold top rule ======== |   (emphasised card only)
| [ Adult bikes ]        badge    |   (emphasised card only)
| ADULT                  eyebrow  |
| £50                    price    |
| Adult bike             h3       |
| Up to two sets of gears   sm    |
| ------------------------------- |
| star  Full 13 point service     |
| star  Test ride and final check |
| ------------------------------- |
| [ WhatsApp Jimmy ]   primary    |
+---------------------------------+
```

- **Order is always ascending: £40, £45, £50**, matching the client's own price
  card, in DOM order and in visual order at every breakpoint. Do not use CSS
  `order` to reshuffle. A mismatch between reading order and visual order is a
  1.3.2 failure waiting to happen, and reordering money confuses people.
- **The £50 adult tier is the emphasised card**, because it is the only adult
  tier and adults are the majority of visitors. Emphasis is visual only: a 2px
  `brand-600` border instead of 1px `border`, `shadow-2` instead of `shadow-1`, a
  4px `accent-400` #E0A81F top rule, and a badge reading **"Adult bikes"** in
  `brand-900` on `accent-400` (7.21:1). That badge is a category label, which is
  a fact. It is **not** "Most popular" or "Best value": the brief supports
  neither claim and AGENTS.md 2.1 forbids inventing one. If the client later
  confirms a popularity claim, add it then.
- Because the emphasised card is third, the pricing section opens with a single
  factual line above the grid so a phone visitor sees the key number at once:
  "Adult bikes with up to two sets of gears are £50."
- Desktop: 3 equal columns, 24px gap, equal card heights, buttons bottom aligned
  via `flex-col` plus `mt-auto`. The emphasised card is **not** scaled or lifted
  with a transform, because that makes it overlap its neighbours at narrow widths.
- Mobile: single column stack, 16px gap. The emphasised card keeps its 2px border
  and gold rule, so the treatment reads the same on a phone.
- Price uses the `price` token with tabular numerals. The `£` is the same size as
  the digits, never superscripted.
- **The parts caveat is part of this component**, directly under the grid, never
  in the footer and never in small print: "The cost of any parts and any cleaning
  is charged separately." Set at `sm` in `body` colour on `surface-subtle`,
  inside a bordered note box with a 4px `brand-500` left rule.
- Below that, a quote prompt for anything outside the plan (punctures, wheel
  builds, custom builds) with a secondary button to WhatsApp. No invented prices.

### 4.9 Review / testimonial card

```
+-------------------------------------+
| ***** (5 gold stars, sr-only text)  |
| "Quote text, up to about 30 words." |
| Placeholder review        caption   |
+-------------------------------------+
```

- Surface `surface`, 1px `border`, `--radius-lg`, 20px padding, `shadow-1`, plus
  a 4px `brand-500` left rule so it reads as a quotation.
- Markup is
  `<figure><blockquote><p>…</p></blockquote><figcaption>…</figcaption></figure>`.
- Quote at `base` in `body` colour, roman not italic. Attribution at `caption`
  in `muted` (5.79:1).
- Testimonials are the clearly labelled placeholders from `business.ts`. The
  attribution must read as a placeholder, for example "Placeholder review, to be
  replaced with a real Google review", with the `TODO(client)` in the data file.
  Never attribute invented words to a named person.
- Under the grid, one tertiary link out to the real Google listing worded
  "Read all 85 reviews on Google".
- Mobile: single column, two cards. Desktop: three columns.

### 4.10 Star rating display

Two variants. Both use five filled five pointed stars matching the sign's bullet
stars, each an inline SVG at 20x20 (24x24 in the hero).

- **On dark (hero, CTA band, footer):** stars in `accent-300` #F4C64A on a
  `brand-900` field (9.59:1). This is the signature treatment and matches the
  signage exactly. Presented as a pill: `--radius-full`, `brand-900` background,
  10px vertical and 16px horizontal padding, stars followed by
  "5.0 from 85 Google reviews" in `brand-100` (12.87:1).
- **On light (reviews section, pricing page):** stars in `accent-500` #B67B06
  (3.61:1 on white). `accent-300` and `accent-400` are forbidden here; they
  measure 2.14:1 or worse and would fail.
- There are no half or empty stars anywhere on this site. The rating is 5.0.
- Accessibility: the star group is `aria-hidden="true"` and is preceded by a
  visually hidden `<span>` reading "Rated 5.0 out of 5 from 85 Google reviews".
  Where the pill links out, it is an `<a>` to the Google listing with a 44px
  minimum height.
- Never animate the stars. No twinkle, no count up.

### 4.11 Section heading pattern

Every major section uses the same three part block, left aligned on mobile and on
desktop (centred headings hurt scannability and look like a template):

```
EYEBROW IN UPPERCASE            eyebrow token, brand-700, 0.1em tracking
Real heading here               h2 token, display 600, brand-900
One sentence of context.        lead token, muted, max-width 60ch
                                24px gap to the section content
```

- Optional gold star rule above the eyebrow: three 12px `accent-500` stars with
  8px gaps, `aria-hidden`. Use it on at most two sections per page.
- The eyebrow is decorative context, never the only label and never a link.
- Heading levels are honest: one `h1` per page, sections are `h2`, cards are `h3`
  or `h4`. Never pick a level for its size.

### 4.12 Footer

Background `brand-900`. Four blocks, stacked on mobile, four columns from `md`.

```
[ star divider: repeating 12px accent-300 stars, aria-hidden ]

J.MICHAEL & CO              CONTACT                PAGES      FIND US
Bletchley Bicycle Repairs,  WhatsApp Jimmy         Home       Unit 1, 75 Tavistock St
Servicing & Sales           07399 351272           Services   Fenny Stratford
                            Text 07399 351272      Pricing    Bletchley
***** 5.0 from 85 reviews   jmichael…@gmail.com    About      Milton Keynes MK2 2PG
                            Facebook (main)        Contact    Get directions ->
                            Facebook (Bletchley)
                            Google listing

-------------------- 1px rgb(255 255 255 / 0.12) --------------------
(c) 2026 J.Michael & Co  ·  Call or WhatsApp anytime to arrange an appointment
```

- Column headings: display 600, 15px, `accent-300` (9.59:1), uppercase, 0.08em
  tracking.
- Links: `brand-100` (12.87:1), underlined on hover and focus, each with a 44px
  minimum height and 12px vertical padding.
- Meta line: `brand-200` (10.49:1) at `caption`.
- The hours line is exactly the client's own wording, "Call or WhatsApp anytime
  to arrange an appointment". The `TODO(client)` for real hours lives in
  `business.ts`, not in markup.
- The footer carries no primary WhatsApp button on mobile, because the sticky bar
  is 60px away and two green buttons in one viewport is noise.
- Footer bottom padding on mobile is handled by the `body` padding rule in 4.6,
  so the footer needs no special case.

### 4.13 Skip link

```html
<a href="#main" class="skip-link">Skip to content</a>   <!-- first element in <body> -->
```

- Off screen by default via a `clip-path` or 1px technique, **not**
  `display: none` and not `visibility: hidden`, both of which remove it from the
  tab order.
- On `:focus`: `position: fixed; top: 8px; left: 8px; z-index: 100`, background
  `brand-900`, text white (15.47:1), padding 12px 20px, `--radius-md`, plus the
  global focus ring.
- `<main id="main" tabindex="-1">` so the jump moves focus, not just scroll
  position.

### 4.14 Focus ring

Specified in the common rules above, restated because it is the most commonly
broken thing:

- 3px solid `brand-900` outline, 2px offset, plus a 2px white `box-shadow` ring
  filling the offset gap.
- Applied on `:focus-visible` only, so mouse clicks do not draw it but keyboard
  navigation always does.
- Never `outline: none` anywhere in the stylesheet, including resets. If a
  component needs a different ring shape, change the radius, not the visibility.

---

## 5. Page layouts

Notation: `[P]` primary button, `[S]` secondary button, `->` link. Mobile is
described first in each row and desktop changes are called out.

### 5.1 `/` (home). Section order and why.

| # | Section | Contents | Mobile | Desktop | Why it sits here |
| --- | --- | --- | --- | --- | --- |
| 1 | Sticky header | Logotype, nav, desktop WhatsApp button | 60px bar, `<details>` nav | 72px bar, inline nav plus `[P]` | Persistent identity and an always available route to any page. |
| 2 | Hero | `h1` "Bike repairs and servicing in Bletchley", lead naming Fenny Stratford and MK2, `[P] WhatsApp Jimmy`, `[S] Call 07399 351272`, rating pill, hero illustration | Text first, full width stacked buttons, illustration below at 4:3 | Two columns from `lg`: text 55%, illustration 45%, buttons inline | The site's one job is the first thing on screen, with proof of location in the same glance. |
| 3 | Trust strip | Three items: "5.0 from 85 Google reviews", "One qualified mechanic, every bike", "Unit 1, Tavistock Street, Fenny Stratford" | Three rows, icon plus label, on `surface-subtle` | Three columns with dividers | A stranger arriving from a Facebook link needs proof and locality inside one thumb scroll, before they will read anything else. |
| 4 | Services overview | Section heading, six service cards from `business.ts`, `-> See all services` | 1 column | 3 columns, 2 rows | Answers the immediate question "can he fix my thing" before price comes up. |
| 5 | Pricing teaser | Heading, the line "Adult bikes with up to two sets of gears are £50", three compact pricing cards, parts caveat note, `-> See what is included` | Stacked cards | 3 columns | Price is the second question and the biggest cause of bouncing. Hiding it costs enquiries. |
| 6 | Inside a service | Heading, three highlights lifted verbatim from the 13 point plan (bearings, brake and gear set up, test ride), gold star bullets, `-> See all 13 servicing steps` | Stacked list | 3 columns | Proves depth and craft. This is what separates Jimmy from a chain, and it earns the price shown directly above. |
| 7 | Reviews | Heading with star rule, placeholder testimonial cards, `-> Read all 85 reviews on Google` | 1 column, 2 cards | 3 columns, 3 cards | Social proof lands hardest after the pitch and immediately before the ask. |
| 8 | Location | Address block, illustrated location card, `[S] Get directions`, hours line | Address, then illustration, then button | Two columns: address left, illustration right | Local intent converts here. "Is he near me" is the last objection before messaging. |
| 9 | Final CTA band | `brand-900` band, `h2` "Message Jimmy about your bike", one line, `[P]`, `[S] Call`, gold rating pill | Full width stacked buttons | Centred, max 640px, buttons inline | Anyone who scrolled this far is convinced. Ask plainly, and catch the scrollers who ignored the hero. |
| 10 | Footer | As 4.12 | Stacked | 4 columns | Everything else: both Facebook pages, Google listing, email, address, directions. |
| 11 | Mobile CTA bar | As 4.6 | Fixed bottom | Hidden | The CTA is never more than one thumb away, at any scroll depth. |

Home page rules: exactly one `h1`; sections 3, 5 and 7 sit on `surface-subtle`
and the rest on `canvas`, giving a light / tinted / light / tinted beat; exactly
two dark surfaces (9 and 10); the WhatsApp CTA appears in section 2, section 9,
the mobile bar and the desktop header, which is four placements and no more.

### 5.2 `/services/`

1. Header.
2. Page intro: `h1` "Bicycle repairs and servicing in Bletchley", one lead
   paragraph, `[P]`, `[S] See prices`.
3. "What Jimmy fixes": all 13 services from the brief as service cards. One
   column base, two at `sm`, three at `md`.
4. "The Basic Yet Comprehensive & Thorough Servicing Plan", using the client's
   own title, then the 13 steps as an `<ol>`. Each step is a row on `surface`
   with a 1px `border`, a display face step number in `brand-600` inside a 40x40
   `brand-50` square, and the step text at `base`. Mobile is a single column
   stack. Desktop is `md:grid-cols-2` with the default `grid-auto-flow: row`, so
   the steps read left to right (1 2 / 3 4 …) and visual order matches DOM order.
5. Parts caveat note (the same component as the pricing page).
6. "Outside the plan": punctures, wheel builds and custom builds, quoted
   individually, with `[P] Get a quote on WhatsApp`. No prices invented.
7. Final CTA band, footer, mobile bar.

### 5.3 `/pricing/`

1. Header.
2. `h1` "Servicing prices", lead explaining that all three tiers get the full
   13 point plan.
3. The one line adult price statement, then the three pricing cards (4.8).
4. Parts caveat note, directly under the cards and not below the fold.
5. "What every service includes": the 13 point plan in condensed form (gold star
   bullets, `sm` text, two columns from `md`), with `-> See the full plan`
   pointing at `/services/`.
6. "Anything else is quoted individually" block with `[P] Get a price on WhatsApp`.
7. Final CTA band, footer, mobile bar.

Pricing page rule: the three numbers must be readable with no horizontal scroll
at 320px. Test it.

### 5.4 `/about/`

1. Header.
2. `h1` "About Jimmy and J.Michael & Co", lead sentence.
3. Two columns from `lg`: portrait placeholder (1:1) left, story copy right. On
   mobile the portrait comes first, capped at 320px wide and centred.
4. "Why local matters" prose block, capped at 68ch.
5. Credentials block. **Only facts from the brief.** Anything unknown (years in
   the trade, exact qualifications) stays a `TODO(client)` in `business.ts` and
   is omitted from the page until answered, rather than filled with a guess.
6. Rating pill plus `-> Read all 85 reviews on Google`.
7. Shopfront placeholder (3:2) with the address as its caption.
8. Final CTA band, footer, mobile bar.

### 5.5 `/contact/`

1. Header.
2. `h1` "Contact Jimmy", lead "Phone, text or WhatsApp anytime to arrange an
   appointment", which is the client's own wording.
3. **Channel list, WhatsApp first**: a `<ul>` of full width rows on `surface`,
   each 64px tall with a 1px `border`, an icon in a `brand-50` square, the
   channel name at `h4` and the value at `sm` in `muted`, with the whole row as
   the link. Order: WhatsApp, Phone, Text message, Email, Facebook (main),
   Facebook (Bletchley), Google listing. Desktop: two columns from `md`, with
   WhatsApp spanning both columns and using the primary button treatment.
4. Address block, the illustrated location card, and `[S] Get directions`.
5. Hours block: exactly the "Call or WhatsApp anytime to arrange an appointment"
   line, with the `TODO(client)` in the data file. Do not render an empty table
   of days.
6. Footer, mobile bar. **No final CTA band on this page**: the whole page is the
   CTA, and a band would put a third green button in one viewport.

There is no contact form. A form needs a backend, which is out of scope per brief
section 10, and a form that fails silently is worse than no form.

### 5.6 `/404`

1. Header.
2. Centred block, max 560px: the `404-chain.svg` illustration capped at 200px,
   `h1` "That page has slipped its chain", one line "The page you wanted is not
   here, but Jimmy still is."
3. `[P] WhatsApp Jimmy` and `[S] Back to the home page`, stacked on mobile.
4. A short list of the five real pages as tertiary links, so the page is useful
   rather than merely apologetic.
5. Footer, mobile bar. No dark CTA band.
6. This is the only page that may use `--color-danger`, and only as a 4px rule
   under the illustration. It is optional; plain green is also correct.

---

## 6. Imagery

All images are locally committed SVGs under `src/assets/`. No remote placeholder
service and no `<img>` pointing off origin, so the site builds offline and leaks
no requests. Every one carries a `TODO(client)` comment naming the real
photograph that will replace it.

### 6.1 House style for the placeholders

These are not grey boxes. Each placeholder is a flat, brand tinted line
illustration: a `brand-900` or `olive-800` field, a bicycle or workshop motif
drawn in 2px `brand-300` strokes with `brand-500` fills, and one or two
`accent-300` five pointed stars borrowed from the sign. No gradients, no drop
shadows, and no text inside the artwork (text in artwork cannot be translated,
cannot be selected, and looks unfinished). Rounded corners come from the
container using `--radius-xl`, not baked into the SVG.

Each SVG carries `viewBox`, `width`, `height`,
`preserveAspectRatio="xMidYMid slice"` and `role="img"`. The alt text is set on
the `<Image>` in the page, not inside the file.

### 6.2 The exact set

| File (`src/assets/`) | Aspect | Dimensions | Used on | Real photo that replaces it | Alt text |
| --- | --- | --- | --- | --- | --- |
| `hero-workshop.svg` | 4:3 | 1200x900 | `/` hero | Jimmy at the stand working on a bike in the workshop | "Jimmy servicing a bicycle at the workbench in the Bletchley workshop" |
| `shopfront.svg` | 3:2 | 1200x800 | `/about/`, `/contact/` | The unit frontage on Tavistock Street with the sign visible | "The J.Michael and Co shopfront on Tavistock Street, Fenny Stratford" |
| `portrait-jimmy.svg` | 1:1 | 800x800 | `/about/` | Head and shoulders of Jimmy in the workshop | "Jimmy, the mechanic and owner of J.Michael and Co" |
| `service-wheel.svg` | 3:2 | 900x600 | `/services/` section lead | A wheel being trued in the jig | "A bicycle wheel being trued in a truing stand" |
| `service-drivetrain.svg` | 3:2 | 900x600 | `/services/` section lead | Close up of a cleaned and adjusted drivetrain | "A cleaned and adjusted bicycle drivetrain" |
| `location-card.svg` | 16:9 | 1200x675 | `/` location, `/contact/` | Nothing. This stays an illustration. | "Illustration of a location pin marking the workshop in Fenny Stratford, Bletchley" |
| `404-chain.svg` | 1:1 | 600x600 | `/404` | Nothing. This stays an illustration. | "Illustration of a bicycle chain that has come off its chainring" |
| `og-default.svg` | 1.91:1 | 1200x630 | source for the OG image | A shopfront or workshop photo cropped to 1200x630 | Not applicable. Use `og:image:alt`: "Bletchley Bicycle Repairs, Servicing and Sales by J.Michael and Co" |
| `logo-mark.svg` | 1:1 | 512x512 | favicon, apple touch icon | Nothing. This is the brand mark. | "J.Michael and Co" |
| `star.svg` | 1:1 | 24x24 | rating displays, list bullets | Nothing. | Decorative, `aria-hidden="true"` |

`logo-mark.svg` is a condensed "JM" monogram in Oswald 600 converted to paths,
`accent-300` on `brand-900`, with one small star in the counter of the M. It must
still read at 32x32, so no fine detail. Ship `favicon.svg` plus a 180x180
`apple-touch-icon.png` in `public/`.

**`location-card.svg` must not resemble a real map.** A fake street map would
misrepresent where the workshop is. It is an abstract pin on a tinted field, the
street name is carried by the adjacent text, and it links out to the real Google
Maps URL from `business.ts`.

### 6.3 The one raster exception

Facebook and WhatsApp do **not** render SVG Open Graph images. An `og:image`
pointing at an SVG produces no preview card at all, which directly damages goal 1
in the brief (a link that looks good pasted into Facebook and WhatsApp).

Therefore: author `og-default.svg`, then rasterise it to a 1200x630 PNG at build
time with `astro:assets` (`getImage()`), which uses the bundled sharp and needs
no network. Reference the generated PNG in `og:image` with explicit
`og:image:width` 1200, `og:image:height` 630 and an `og:image:alt`. Do not hand
author a separate PNG that can drift out of sync with the SVG.

### 6.4 Image implementation rules

- Always `astro:assets` `<Image>` or `<Picture>`, never a bare `<img>` with a
  string path, so intrinsic dimensions are emitted and layout shift is zero.
- Always explicit `width` and `height`, or an aspect ratio on the container.
- `loading="eager"` and `fetchpriority="high"` on the hero image only. Everything
  else is `loading="lazy" decoding="async"`.
- Decorative artwork (`star.svg`, dividers, the pattern behind the CTA band) gets
  `alt=""` and `aria-hidden="true"`. Never describe a decoration.
- Alt text describes what the photo will show, never "placeholder image", because
  the alt must still be correct on the day the real photo is swapped in.

---

## 7. Motion

Minimal by design. This is a repair shop, not a product launch.

**The complete list of permitted motion:**

| What | Property | Duration | Easing |
| --- | --- | --- | --- |
| Button and link hover and active | `background-color`, `border-color`, `color`, `box-shadow` | 150ms | `ease-out` |
| Primary button hover lift | `transform: translateY(-1px)` | 150ms | `ease-out` |
| Card hover shadow (pointer devices, interactive cards only) | `box-shadow` | 150ms | `ease-out` |
| Mobile nav icon, hamburger to close | `transform: rotate()` | 150ms | `ease-out` |
| Focus ring appearance | none, it appears instantly | 0ms | n/a |

```css
@theme {
  --duration-fast: 150ms;
  --ease-out: cubic-bezier(0.2, 0, 0, 1);
}
```

**Banned:** scroll triggered reveals, fade in on load, parallax, counters that
count up, marquees, carousels, autoplaying anything, skeleton loaders, any
animation longer than 200ms, and any animation required to understand the page.
There is no JS, so there is no scroll observer to write in the first place.

**Reduced motion.** Put this in `global.css` and exempt nothing from it:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Additionally, under reduced motion the primary button's `translateY` lift is
suppressed (the colour change alone carries the hover) and the nav icon swaps
rather than rotating. Because every state change here is also a colour change, no
information is lost when motion is removed.

`scroll-behavior: smooth` is set on `html` for anchor links and is overridden to
`auto` by the block above.

---

## 8. Do and do not

### Do

- Lead with WhatsApp on every page and in the sticky mobile bar.
- Show the three prices as early as each page allows. Price is the reason people
  message.
- Keep the greens and the gold stars from the sign. They are the recognition cue.
- Left align headings and body copy. Centre only the final CTA band and the 404.
- Use the display face for headings, prices and buttons, and the body face for
  everything else.
- Use specific link text that names the destination.
- Say "Jimmy". The brand voice is one named craftsman.
- Test at 360px first and at 320px before shipping.
- Put every fact in `business.ts` and read it from there.

### Do not

- Do not use WhatsApp green #25D366 as a background with white text. It measures
  1.94:1 and fails.
- Do not put gold text or gold lines on white or any light surface. Gold is for
  dark green fields and for badge backgrounds.
- Do not use `brand-500` for text. It measures 4.27:1 on white and fails body.
- Do not introduce a second border colour, a lighter hairline, or a neutral grey.
  There is one line colour and it passes 3:1 on every surface in use.
- Do not add a carousel, an accordion that hides prices, a modal, a cookie
  banner, a chat widget, or a newsletter sign up.
- Do not add a contact form. No backend exists, and a form that fails silently
  loses enquiries.
- Do not centre long body copy or set it wider than 68ch.
- Do not set body copy in Oswald.
- Do not invent opening hours, years in the trade, qualifications, review quotes,
  or a "most popular" tier. If it is not in `docs/PROJECT_BRIEF.md`, it is a
  `TODO(client)`.
- Do not scale or lift the emphasised pricing card with a transform. Border,
  shadow, gold rule and badge are the emphasis.
- Do not remove a focus outline, anywhere, for any reason.
- Do not make the mobile CTA bar hide, animate, or overlay content. It is fixed,
  reserved for in the body padding, and last in the DOM.
- Do not use stock photography or a remote placeholder service. Local SVGs only.
- Do not add client side JS to solve a layout problem. If it needs JS, redesign it.

---

## 9. Implementation checklist for the next agent

- [ ] `@theme` blocks from 1.2, 2.2, 3.2, 3.3 and 7 pasted into
      `src/styles/global.css`.
- [ ] `@fontsource-variable/oswald` and `@fontsource-variable/source-sans-3`
      installed and imported once in `BaseLayout.astro`, with preload links.
- [ ] Global focus rule from section 4 present, and no `outline: none` anywhere.
- [ ] `--mobile-cta-h` body padding rule present so the bar never covers content.
- [ ] Mobile nav is `<details>` / `<summary>`, zero JS.
- [ ] Every interactive element measures at least 44x44 in the browser.
- [ ] Pricing order is £40, £45, £50 in DOM and on screen, the £50 card is the
      emphasised one, and the parts caveat sits directly under the grid.
- [ ] Reduced motion block present.
- [ ] All ten placeholder SVGs committed with `TODO(client)` comments and the alt
      text from 6.2.
- [ ] OG image rasterised to PNG at build, 1200x630, with `og:image:alt`.
- [ ] No page scrolls horizontally at 320px.

---

## Handoff

**Did**

- Created `docs/DESIGN_SYSTEM.md` (this file). No application code was written,
  no other file was touched, nothing was committed.
- Defined the full colour system derived from the client's signage: a ten step
  brand green ramp, a two step olive ramp, a four step gold accent ramp, green
  tinted neutrals, and semantic aliases, all as CSS custom properties ready for a
  Tailwind v4 `@theme` block.
- Defined typography: Oswald Variable for display and Source Sans 3 Variable for
  body, both self hosted from npm, with a fluid clamp based scale, weights, line
  heights, tracking, and measure rules.
- Defined spacing, radii, three green tinted shadows, a single border colour, and
  breakpoint behaviour.
- Specified every component in the remit: primary, secondary and tertiary
  actions, sticky header, zero JS mobile nav, the persistent mobile WhatsApp bar
  (with explicit non occlusion and non trapping rules), service card, pricing
  card, review card, star rating, section heading, footer, skip link, focus ring.
- Wrote text wireframes for all six routes, with a per section justification
  table for the home page.
- Specified ten placeholder SVGs with names, aspect ratios, pixel dimensions,
  usage, replacement photo and alt text, plus motion and reduced motion rules and
  a do / do not list.

**Verified**

- Every contrast ratio in section 1.3 was computed, not estimated, using the
  WCAG 2.x relative luminance formula (sRGB gamma expansion,
  `(L1 + 0.05) / (L2 + 0.05)`) via a script run in this session against the final
  hex values. Every listed pair meets or exceeds its threshold: body text pairs
  range from 4.82:1 to 15.47:1 against a 4.5 requirement, and non text pairs
  range from 3.01:1 to 15.47:1 against a 3.0 requirement.
- Two candidate colours failed and were corrected before publication. Both the
  failing and the passing numbers are recorded in 1.3 so they are not
  reintroduced: the border #D5DFD7 at 1.37:1 became #788B80 at 3.62:1, and the
  light surface star colour #E0A81F at 2.14:1 became #B67B06 at 3.61:1.
- WhatsApp brand green #25D366 with white text was measured at 1.94:1 and is
  banned as a button background on that evidence.
- The fluid type clamps in 2.2 were generated arithmetically for a 360px to
  1280px viewport range, not hand written.
- No build or check command was run. That is correct for this role: there is no
  application code in the repository yet. `npm run check` and `npm run build` are
  the implementation agent's gate.

**Not done / assumptions**

- Assumption: the sign's colours were described in the task brief rather than
  sampled from a photograph, so these hexes are a faithful interpretation of
  "bright and mid greens, dark olive green, gold stars on white" and not
  eyedropper matches. If a photograph of the sign becomes available,
  `brand-500`, `olive-700` and `accent-300` are the three values to re sample.
  Everything else derives from them, and the contrast table would need rerunning
  if they move.
- Assumption: the £50 adult tier is the right one to emphasise, because it is the
  only adult tier. The brief does not say which tier is most popular, so the
  emphasised card carries the factual badge "Adult bikes" and explicitly not
  "Most popular". Confirm with the client before adding any popularity claim.
  This is a new entry for the open questions list in AGENTS.md section 8.
- Assumption: Oswald and Source Sans 3 are acceptable. They were chosen rather
  than offered as options, per the remit. Both are SIL Open Font License, so
  commercial use is fine.
- Not decided here: hero copy, the About page story text, and the placeholder
  testimonial wording. That is content rather than visual language, and it
  belongs in `src/data/business.ts` with `TODO(client)` markers.
- Not decided here: the composition of `og-default.svg` beyond its dimensions and
  the house illustration style.

**Next**

- The implementation agent (AGENTS.md 5.2) scaffolds Astro 5 plus Tailwind v4,
  pastes the `@theme` blocks verbatim into `src/styles/global.css`, builds
  `src/data/business.ts` from the brief, then builds the layouts, components and
  the six routes to the specs in sections 4 and 5, working the checklist in
  section 9.
- Two things here are easy to get wrong and worth reading twice before coding:
  section 4.6 (the mobile CTA bar's body padding reservation and DOM position)
  and section 6.3 (the OG image must be rasterised to PNG or link previews will
  not render on Facebook and WhatsApp).
- If anything here proves unbuildable or ambiguous, report it in the handoff
  rather than improvising a different design.
