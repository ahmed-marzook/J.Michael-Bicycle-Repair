# AGENTS.md — J.Michael Bicycle Repair

Operating manual for any agent (or human) working in this repository. Read this
file and [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md) before touching code.
The brief owns *what* we are building; this file owns *how* we work.

---

## 1. Project at a glance

A static marketing site for a local bicycle repair shop in Bletchley, Milton
Keynes. Astro 5 + Tailwind CSS 4, TypeScript strict, static output, deployable to
GitHub Pages or Azure Static Web Apps with no server.

The client is a sole trader. **The site's job is to get someone to message Jimmy
on WhatsApp.** Every design and code decision is judged against that.

---

## 2. Ground rules

1. **Facts come from `docs/PROJECT_BRIEF.md`.** Never invent a price, an opening
   time, a qualification, a review quote, or a years-in-business number. If a
   fact is missing, use a placeholder and mark it `TODO(client): ...`.
2. **One source of truth for data.** All business facts live in
   `src/data/business.ts`. Never hard-code a phone number, price, or URL in a
   component or a page. If you need a new fact, add it to the typed model.
3. **Static only.** No SSR adapter, no server routes, no runtime env vars, no
   build-time network calls. `npm run build` must succeed offline.
4. **Placeholder images only.** Local SVGs under `src/assets/`. No remote
   placeholder services. Real `alt` text, and a `TODO(client)` comment naming the
   photo that should replace it.
5. **Prefer maintained packages** over bespoke code for solved problems
   (sitemap, SEO head tags, image handling). Do not add a package for something a
   dozen lines of CSS solves. No React/Vue/Svelte — this is a content site.
6. **Accessibility is not optional.** WCAG 2.2 AA is a build requirement, not a
   nice-to-have. See the brief for the specifics.
7. **Commit at checkpoints** (see section 9). Never push, never force, never
   amend someone else's commit, and never commit a broken build.
8. **Report honestly.** If a check fails, say so with the output. Never claim a
   Lighthouse score you did not measure. "Not verified" is an acceptable answer;
   a fabricated number is not.

---

## 3. Repository layout

```
docs/
  PROJECT_BRIEF.md     Single source of truth for client facts and requirements
  DESIGN_SYSTEM.md     Design language: colour, type, spacing, components
src/
  assets/              Local SVG placeholder images
  components/          Reusable .astro components
  data/business.ts     ALL client facts, strongly typed
  layouts/             Page shells (BaseLayout, PageLayout)
  pages/               Routes: index, services, pricing, about, contact, 404
  styles/global.css    Tailwind v4 entry + design tokens via @theme
public/                robots.txt, favicon, static files copied verbatim
AGENTS.md              This file
```

---

## 4. Commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Production build to `dist/` — must pass clean |
| `npm run preview` | Serve the built output |
| `npm run check` | `astro check` — TypeScript + template diagnostics, 0 errors required |

Before declaring any task done: `npm run check && npm run build` must both pass.

---

## 5. The agent roles

Work on this repo is compartmentalised. Each role has a narrow remit and writes
its output to a known location so the next role can pick it up.

### 5.1 Design agent
Owns the visual language. Produces `docs/DESIGN_SYSTEM.md`: colour palette with
contrast ratios, type scale, spacing, component specs (buttons, cards, nav,
footer), page-by-page layout wireframes in text. **Writes no application code.**
Palette must derive from the client's existing signage (greens on white) so the
site matches the shopfront.

### 5.2 Implementation agent
Owns the code. Scaffolds Astro, builds `src/data/business.ts`, the layouts,
components and pages exactly per the brief and the design system. Runs
`npm run check` and `npm run build` before handing off. **Does not redesign** —
if the design system is wrong or ambiguous, it says so in its handoff notes
rather than silently improvising.

### 5.3 Review agent
Reads the diff and the built output against the brief, `AGENTS.md`, and the
design system. Checks correctness, accessibility, SEO, data-layer discipline,
dead code, and build health. **Reports; does not fix**, unless explicitly asked
to. Findings ranked most severe first,
each with file, line, and a concrete failure scenario. Verifies claims by
actually reading files and running the build — no assertions from memory.

### 5.4 Project manager agent
Owns the definition of done. Reads the review report and independently checks the
build against the five goals in section 4 of the brief. Produces a verdict per
goal: **MET / PARTIALLY MET / NOT MET**, with evidence. If anything is short, it
drafts a precise remediation prompt (scoped, file-level, testable) for the next
implementation agent. It does not write application code.

### 5.5 The remediation loop

```
Design -> Implement -> Review -> PM verdict
                          ^            |
                          |     not all goals MET
                          |            v
                    Re-review <- Remediation agent (works the PM's prompt)
```

Loop until the PM returns MET on every goal, or escalates a blocker to the human.

**Reviews and PM verdicts are reported back in conversation, not written to
disk.** Do not create report files, changelogs, summary documents, migration
notes or per-change markdown. The only documentation this repo keeps is
`AGENTS.md`, `docs/PROJECT_BRIEF.md`, `docs/DESIGN_SYSTEM.md` and `README.md`.
Update those in place when the facts change; add nothing else.

---

## 6. Handoff protocol

Every agent finishes with a short structured handoff:

- **Did** — what changed, by file.
- **Verified** — the commands run and their real results.
- **Not done / assumptions** — anything skipped, guessed, or blocked.
- **Next** — what the following role should pick up.

Never report "complete" for work that was only partially done. If part of the
scope was blocked, finish everything else and say precisely what was left and
why.

---

## 7. Definition of done

- [ ] All six routes exist and are reachable from the nav.
- [ ] Prices exactly match the brief (£40 / £45 / £50) with the parts caveat.
- [ ] WhatsApp is the primary CTA and is present on every page.
- [ ] Phone, SMS, email, both Facebook pages, Google listing, and a Google Maps
      directions link all work and open correctly.
- [ ] 5.0 stars / 85 reviews shown, linked to the real Google listing.
- [ ] An About page with real substance about Jimmy.
- [ ] `LocalBusiness` JSON-LD validates; sitemap and robots.txt present.
- [ ] Per-page title/description/canonical/OG tags.
- [ ] Keyboard navigable, visible focus, AA contrast, sensible mobile layout.
- [ ] `npm run check` — 0 errors. `npm run build` — clean.
- [ ] No hard-coded business facts outside `src/data/business.ts`.
- [ ] Every placeholder marked `TODO(client)`.

---

## 8. Checkpoint commits

Progress is captured as a series of small, safe, revertable commits so any bad
pass can be rolled back to the last good state.

**Commit a checkpoint when:** a role finishes its handoff (scaffold, design,
implementation, each remediation pass), or a self-contained slice lands (the data
layer, a page, the SEO wiring).

**Before every commit, both must pass:**

```bash
npm run check && npm run build
```

A checkpoint is a *safe point*. If the build is red, fix it or leave the work
uncommitted; never checkpoint a broken tree.

**Rules**

- Work on a feature branch, not `main`. Current branch: `feat/website-build`.
- **The orchestrator owns the commits.** When agents run concurrently they must
  not run `git` at all — two agents staging at once races the index. Subagents
  finish their work, leave the tree in a buildable state, and report; the
  orchestrating agent stages and commits the checkpoint.
- Stage deliberately (`git add <paths>`), never `git add -A` on a tree another
  agent is concurrently writing to.
- One logical change per commit. Do not bundle a redesign with a bug fix.
- Subject line: imperative, under 72 chars, prefixed by scope, e.g.
  `scaffold: add Astro 5 + Tailwind 4 toolchain`, `data: add business.ts`,
  `pages: build pricing page`, `fix: correct contrast on the CTA`.
- Body: what changed and why, plus the verification actually run.
- Never commit `node_modules/`, `dist/`, `.astro/` or anything secret.
- **Never push.** Pushing and opening PRs is the human's call.

## 9. Open questions for the client

Track these here; do not guess answers.

- Opening hours / days.
- Real photos: shopfront, Jimmy at work, before-and-after repairs.
- Exact qualifications and years in the trade, for the About page.
- Whether to publish the workshop address or keep it appointment-only.
- Preferred domain name.
- Permission to quote named Google reviewers verbatim.
