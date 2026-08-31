/**
 * src/lib/featurable-reviews.ts
 * ---------------------------------------------------------------------------
 * BUILD-TIME loader for the workshop's real Google reviews
 * (docs/PROJECT_BRIEF.md section 9, "Google reviews — must be real, not
 * hardcoded").
 *
 * What this is
 * ------------
 * `npm run build` calls the Featurable API, which syncs the reviews from the
 * client's Google Business Profile, maps the result onto `VerifiedTestimonial[]`
 * and Astro bakes it into static HTML. The visitor's browser never talks to
 * Featurable or to Google: no widget, no script, no cookie, no third-party
 * request, no client-side JavaScript. Reviews refresh by re-running the build.
 *
 * Why Featurable rather than the Google Places API
 * ------------------------------------------------
 * Places caps at five Google-chosen reviews and needs a billable Google Cloud
 * key. Featurable's free tier is keyed by a widget ID alone, has no view cap
 * for this usage because we never call it from the browser, and can return
 * more than five reviews.
 *
 * The verified API contract
 * -------------------------
 * Confirmed against Featurable's own client library, not from documentation
 * prose — `Featurable/react-google-reviews`,
 * `src/components/ReactGoogleReviews/ReactGoogleReviews.tsx` and
 * `src/types/review.ts`:
 *
 *   GET https://api.featurable.com/v1/widgets/{featurableId}
 *   No headers. NO API KEY — the widget ID is the only credential.
 *
 *   200 => { success: true,
 *            profileUrl: string | null,
 *            totalReviewCount: number,
 *            averageRating: number,
 *            reviews: [{ reviewId: string | null,
 *                        reviewer: { profilePhotoUrl: string,
 *                                    displayName: string,
 *                                    isAnonymous: boolean },
 *                        starRating: number,
 *                        comment: string,
 *                        createTime: string | null,
 *                        updateTime: string | null }] }
 *       => { success: false }        // note: a FAILURE can arrive as HTTP 200
 *
 * A `v2` endpoint exists at the same base (`/v2/widgets/{id}`, a different,
 * richer shape) and there is a separate key-authenticated *management* API at
 * `featurable.com/api/v2/widgets/{uuid}` with an `X-API-Key` header. Neither is
 * needed to read reviews. `v1` is what the library still defaults to.
 *
 * The three rules this file exists to enforce
 * -------------------------------------------
 * 1. THE BUILD MUST NEVER FAIL BECAUSE OF THIS. No widget ID, offline, DNS
 *    failure, HTTP 4xx/5xx, rate limit, hung socket, malformed JSON,
 *    `success: false`, a response missing every field we want — all of them
 *    return the placeholder testimonials from src/data/business.ts and log ONE
 *    warning line saying which reason it was. There is no code path in this
 *    module that throws, and it makes exactly one network call.
 *
 * 2. THE WIDGET ID MUST NEVER REACH `dist/`. It is read from `process.env`
 *    (and, for a local `.env` file, from the server-side `import.meta.env` by
 *    dynamic key lookup, which Vite cannot statically inline). This module is
 *    imported only from `.astro` frontmatter, which runs on the build machine
 *    and is never shipped to the browser. Nothing derived from it is rendered.
 *
 * 3. GOOGLE'S DISPLAY REQUIREMENTS ARE NOT OPTIONAL. The reviewer's display
 *    name is passed through exactly as returned, the review text is never
 *    edited or truncated, and the UI attributes the reviews to Google and
 *    links out to the listing.
 *
 * Reviewer photos are deliberately NOT rendered. They are hosted by Google, so
 * using them means either a third-party request from the visitor's browser —
 * which this site otherwise never makes — or a build-time download. The
 * download route was measured and rejected: handing a remote URL to
 * `astro:assets` fails the whole build when the image 404s, outside any
 * try/catch of ours ("Error generating image ... at loadRemoteImage", exit 1),
 * and Google's avatar URLs rotate and expire. The cards render an
 * initials-in-a-circle avatar instead, which cannot fail and costs no request.
 * ---------------------------------------------------------------------------
 */

import { business } from '../data/business';
import type { Testimonial, VerifiedTestimonial } from '../data/business';

/* ===========================================================================
 * Configuration
 * ======================================================================== */

/**
 * The public, unauthenticated read endpoint. `{id}` is the Featurable widget
 * ID. Verified against the library source quoted in the header above.
 *
 * Overridable by `FEATURABLE_API_BASE_URL` so the endpoint can be repointed
 * without a code change if Featurable moves it, and so the offline / network
 * failure path can be exercised on demand by pointing it at a dead host.
 */
const DEFAULT_ENDPOINT = 'https://api.featurable.com/v1/widgets';

/** A hung Featurable request must not hang the build. */
const REQUEST_TIMEOUT_MS = 8_000;

/**
 * Upper bound on how many reviews we carry into the page data, so an unusually
 * large widget cannot bloat the HTML. This is a ceiling, not a page size: the
 * home page renders far fewer (docs/DESIGN_SYSTEM.md 4.9).
 */
const MAX_REVIEWS = 12;

/** Site locale, matching `lang="en-GB"` on the document. */
const LOCALE = 'en-GB';

/** Prefix on every line this module logs, so build output is greppable. */
const LOG_PREFIX = '[reviews]';

/** The one environment variable this feature needs. */
const WIDGET_ID_VAR = 'FEATURABLE_WIDGET_ID';

/** Optional override for `DEFAULT_ENDPOINT`. Not a secret; usually unset. */
const BASE_URL_VAR = 'FEATURABLE_API_BASE_URL';

/**
 * How long to let a used socket finish closing before the build tears down.
 *
 * WHY THIS EXISTS. On Node 25.2.0 / Windows, a process that has completed a
 * successful `fetch()` and then calls `process.exit()` — which is what
 * `astro build` does when it finishes — dies on a libuv assertion:
 *
 *   Assertion failed: !(handle->flags & UV_HANDLE_CLOSING),
 *   file src\win\async.c, line 76
 *
 * The site is already fully written to `dist/` at that point, but the process
 * exits 127 and CI calls that a failed build. That is exactly the outcome this
 * module exists to prevent, so it is worked around rather than tolerated.
 *
 * It is not our bug and it is not Featurable-specific: a five-line script that
 * fetches `https://example.com/` and calls `process.exit(0)` reproduces it.
 * Measured, 10 runs each: no mitigation 0/10 clean; `setImmediate` (even ten
 * of them) 0/10; destroying undici's global dispatcher 0/10; a real 25ms timer
 * 10/10; 100ms 10/10. Event-loop turns do not help — the handle needs actual
 * wall-clock time to finish closing — so this is a timer and not a `yield`.
 *
 * 150ms buys a wide margin over the 25ms that was already reliable, is paid at
 * most once per build, and only on builds that actually reach the network.
 * If this ever proves insufficient, the deterministic fix is to swap `fetch`
 * for `node:https` with `agent: false`, which does not go through undici and
 * measured 10/10 clean with no delay at all.
 */
const CONNECTION_SETTLE_MS = 150;

/* ===========================================================================
 * Public types
 * ======================================================================== */

export type TestimonialSource = 'google' | 'placeholder';

export interface TestimonialSet {
  /**
   * `'google'` only when real reviews were fetched AND at least one survived
   * validation. Templates switch on this to choose their wording, so it can
   * never claim a Google source for placeholder content.
   */
  readonly source: TestimonialSource;
  readonly testimonials: readonly Testimonial[];
  /** Present only when `source` is `'placeholder'`. One short phrase. */
  readonly fallbackReason?: string;
}

/* ===========================================================================
 * The validated projection of the API response
 *
 * These describe the shape AFTER validation, not the shape Featurable
 * promises. Nothing in this file casts an unknown payload to them — every
 * field is checked by the parsers below, so a missing, null or wrongly-typed
 * field is a skipped review rather than a crash.
 * ======================================================================== */

interface FeaturableReview {
  /** Featurable's own review id. Optional — used only to build a stable key. */
  readonly reviewId?: string;
  /** The reviewer's display name, exactly as returned. */
  readonly displayName: string;
  /** 1–5. */
  readonly starRating: number;
  /** The review body, unedited. */
  readonly comment: string;
  /** RFC 3339 timestamp, when present and parseable. */
  readonly createTime?: string;
}

interface FeaturableWidget {
  readonly totalReviewCount?: number;
  readonly averageRating?: number;
  readonly reviews: readonly FeaturableReview[];
}

/** Either a success or a one-phrase reason, never a thrown error. */
type Outcome<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reason: string };

/* ===========================================================================
 * Small validators — the only place `unknown` is narrowed
 * ======================================================================== */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** A non-empty string, or undefined. Whitespace-only counts as absent. */
const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value : undefined;

const asFiniteNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

/* ===========================================================================
 * Environment
 * ======================================================================== */

/**
 * Read a build-time variable.
 *
 * `process.env` is the primary source: it is what CI and a shell export use,
 * and Vite performs no static replacement on it, so the value is physically
 * incapable of being inlined into a client bundle.
 *
 * The `import.meta.env` fallback picks up a variable set in a local `.env`
 * file, which Astro loads into the server-side env object. The lookup is a
 * DYNAMIC index (`env[name]`), never `import.meta.env.FEATURABLE_WIDGET_ID`,
 * precisely so Vite cannot statically substitute the literal anywhere.
 */
const readEnv = (name: string): string | undefined => {
  const fromProcess =
    typeof process !== 'undefined' && process.env ? process.env[name] : undefined;
  const trimmedProcess = asString(fromProcess);
  if (trimmedProcess) return trimmedProcess.trim();

  const meta: Record<string, unknown> = import.meta.env;
  const fromMeta = asString(meta[name]);
  return fromMeta ? fromMeta.trim() : undefined;
};

/* ===========================================================================
 * Logging — one line, always saying what the page will show instead
 * ======================================================================== */

const warnFallback = (reason: string): void => {
  console.warn(
    `${LOG_PREFIX} ${reason} — using the placeholder testimonials from src/data/business.ts.`,
  );
};

const note = (message: string): void => {
  console.warn(`${LOG_PREFIX} ${message}`);
};

/* ===========================================================================
 * Fetching
 * ======================================================================== */

/** Turn a thrown fetch error into a short, human phrase. Never rethrows. */
const describeFetchError = (error: unknown): string => {
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return `Featurable did not respond within ${REQUEST_TIMEOUT_MS}ms`;
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return `the request to Featurable was aborted after ${REQUEST_TIMEOUT_MS}ms`;
  }
  if (error instanceof Error) {
    return `could not reach Featurable (${error.message})`;
  }
  return 'could not reach Featurable (unknown network error)';
};

/**
 * Pull a human message out of a Featurable error body so the build warning is
 * actionable. Observed live shape, for a widget ID that does not exist:
 *
 *   HTTP 200  {"success":false,
 *              "error":{"key":"widget_not_found","message":"Widget not found"}}
 *
 * `error` is an object there, but a bare string is tolerated in case that
 * changes, and `message` at the top level is checked too.
 */
const describeApiMessage = (payload: unknown): string | undefined => {
  if (!isRecord(payload)) return undefined;
  if (isRecord(payload.error)) {
    return asString(payload.error.message) ?? asString(payload.error.key);
  }
  return asString(payload.error) ?? asString(payload.message);
};

const fetchWidget = async (widgetId: string): Promise<Outcome<FeaturableWidget>> => {
  // Trailing slashes stripped so both forms of the override work.
  const base = (readEnv(BASE_URL_VAR) ?? DEFAULT_ENDPOINT).replace(/\/+$/, '');
  const url = `${base}/${encodeURIComponent(widgetId)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error: unknown) {
    return { ok: false, reason: describeFetchError(error) };
  }

  // Parse the body whether or not the status was OK: Featurable reports some
  // failures as `{ success: false }` with a 200, and an error body may carry a
  // useful message. A truncated or non-JSON body must not throw either.
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      reason: response.ok
        ? 'Featurable returned a response that was not valid JSON'
        : `Featurable returned HTTP ${response.status} with an unreadable body`,
    };
  }

  const message = describeApiMessage(payload);

  if (!response.ok) {
    return {
      ok: false,
      reason: message
        ? `Featurable returned HTTP ${response.status} (${message})`
        : `Featurable returned HTTP ${response.status} — check ${WIDGET_ID_VAR}`,
    };
  }

  if (!isRecord(payload)) {
    return { ok: false, reason: 'Featurable returned JSON in an unexpected shape' };
  }

  // Featurable reports failure IN THE BODY, with HTTP 200 — verified live
  // against an unknown widget ID. So `success` is checked before anything else
  // in the payload is trusted, and a 200 is never assumed to mean reviews.
  if (payload.success !== true) {
    return {
      ok: false,
      reason: message
        ? `Featurable rejected the request (${message}) — check ${WIDGET_ID_VAR}`
        : `Featurable reported the request was unsuccessful — check ${WIDGET_ID_VAR}`,
    };
  }

  return { ok: true, value: parseWidget(payload) };
};

/**
 * Give a used socket time to finish closing before `astro build` calls
 * `process.exit()`. See `CONNECTION_SETTLE_MS` for the measurements and the
 * reason this is a real timer rather than an event-loop yield.
 *
 * Deliberately does NOT destroy undici's global dispatcher: that is a
 * process-wide side effect on a connection pool the rest of the build may
 * still want, and it measured 0/10 anyway.
 */
const settleNetworkHandles = (): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, CONNECTION_SETTLE_MS);
  });

/* ===========================================================================
 * Parsing
 * ======================================================================== */

const parseReview = (value: unknown): FeaturableReview | undefined => {
  if (!isRecord(value)) return undefined;

  // A star-only rating with no words is a valid Google review but there is
  // nothing to quote, so it is skipped rather than rendered as an empty card.
  const comment = asString(value.comment);
  if (!comment) return undefined;

  const reviewer = isRecord(value.reviewer) ? value.reviewer : undefined;
  const displayName = reviewer ? asString(reviewer.displayName) : undefined;
  // Google's display terms require the reviewer's name; without one there is
  // nothing to attribute the quote to.
  if (!displayName) return undefined;

  const starRating = asFiniteNumber(value.starRating);
  if (starRating === undefined || starRating < 1 || starRating > 5) return undefined;

  return {
    reviewId: asString(value.reviewId),
    displayName,
    starRating,
    comment,
    createTime: asString(value.createTime),
  };
};

const parseWidget = (payload: Record<string, unknown>): FeaturableWidget => {
  const rawReviews = Array.isArray(payload.reviews) ? payload.reviews : [];
  const reviews = rawReviews
    .map(parseReview)
    .filter((review): review is FeaturableReview => review !== undefined)
    .slice(0, MAX_REVIEWS);

  return {
    totalReviewCount: asFiniteNumber(payload.totalReviewCount),
    averageRating: asFiniteNumber(payload.averageRating),
    reviews,
  };
};

/* ===========================================================================
 * Mapping onto the site's own model
 * ======================================================================== */

/**
 * Format the review date absolutely, e.g. "12 March 2026".
 *
 * Deliberately NOT a relative label ("3 months ago"). This HTML is baked at
 * build time and then served unchanged until the next build, so a relative
 * phrase would silently become a lie. An absolute date stays true forever.
 */
const formatPublished = (createTime: string | undefined): string | undefined => {
  if (!createTime) return undefined;
  const parsed = new Date(createTime);
  if (Number.isNaN(parsed.getTime())) return undefined;
  try {
    return new Intl.DateTimeFormat(LOCALE, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(parsed);
  } catch {
    return undefined;
  }
};

/** Stable, collision-free id derived from Featurable's own review id. */
const testimonialId = (review: FeaturableReview, index: number): string =>
  review.reviewId ? `google-${review.reviewId}` : `google-${index + 1}`;

const toVerifiedTestimonial = (
  review: FeaturableReview,
  index: number,
): VerifiedTestimonial => {
  const publishedIso = review.createTime;
  const publishedLabel = formatPublished(publishedIso);

  return {
    id: testimonialId(review, index),
    isPlaceholder: false,
    source: 'google',
    // Unedited and untruncated, exactly as the reviewer wrote it.
    quote: review.comment,
    attribution: review.displayName,
    authorName: review.displayName,
    rating: review.starRating,
    ...(publishedLabel ? { publishedLabel } : {}),
    // Only keep the timestamp if it also formatted, so `<time datetime>` can
    // never carry a value the visible text does not correspond to.
    ...(publishedLabel && publishedIso ? { publishedIso } : {}),
    // Featurable v1 has no per-review permalink, so the link goes to the Google
    // listing. Deliberately business.ts's `sourceUrl` and not the response's
    // own `profileUrl`: that one is a "write a review" URL, and every outbound
    // URL on this site comes from the data layer (AGENTS.md 2.2).
    reviewUrl: business.reviews.aggregate.sourceUrl,
  };
};

/**
 * Warn when the live aggregate has drifted from the numbers hard-coded in
 * src/data/business.ts. Purely informational: the site keeps showing the
 * business.ts values, because those are the reviewed source of truth.
 */
const checkAggregateDrift = (widget: FeaturableWidget): void => {
  const { aggregate } = business.reviews;

  if (
    widget.averageRating !== undefined &&
    Math.abs(widget.averageRating - aggregate.ratingValue) >= 0.05
  ) {
    note(
      `Google now reports a rating of ${widget.averageRating.toFixed(1)} but src/data/business.ts says ${aggregate.ratingValue.toFixed(1)} — update business.ts.`,
    );
  }

  if (
    widget.totalReviewCount !== undefined &&
    widget.totalReviewCount !== aggregate.reviewCount
  ) {
    note(
      `Google now reports ${widget.totalReviewCount} reviews but src/data/business.ts says ${aggregate.reviewCount} — update business.ts.`,
    );
  }
};

/* ===========================================================================
 * The entry point
 * ======================================================================== */

const placeholderSet = (reason: string): TestimonialSet => {
  warnFallback(reason);
  return {
    source: 'placeholder',
    testimonials: business.reviews.testimonials,
    fallbackReason: reason,
  };
};

/** The real work, run at most once per build. See `loadTestimonials`. */
const load = async (): Promise<TestimonialSet> => {
  const widgetId = readEnv(WIDGET_ID_VAR);

  // The default developer experience: no credentials, no network call, one
  // clear line of output, placeholders rendered. This is not an error.
  if (!widgetId) {
    return placeholderSet(`${WIDGET_ID_VAR} is not set`);
  }

  const outcome = await fetchWidget(widgetId);

  // Must happen whether the request succeeded or failed: the assertion fires
  // whenever a socket was actually opened, and a `{ success: false }` body
  // arrives over a perfectly healthy connection. See CONNECTION_SETTLE_MS.
  await settleNetworkHandles();

  if (!outcome.ok) {
    return placeholderSet(outcome.reason);
  }

  checkAggregateDrift(outcome.value);

  if (outcome.value.reviews.length === 0) {
    return placeholderSet('Featurable returned no usable reviews for this widget ID');
  }

  const testimonials = outcome.value.reviews.map((review, index) =>
    toVerifiedTestimonial(review, index),
  );

  console.info(
    `${LOG_PREFIX} baked in ${testimonials.length} real Google review(s), fetched at build time via Featurable.`,
  );

  return { source: 'google', testimonials };
};

/**
 * Memoised across the whole build so several pages can render reviews while
 * the API is called exactly once.
 */
let pending: Promise<TestimonialSet> | undefined;

/**
 * Get the testimonials to render.
 *
 * Always resolves. Never rejects. Never throws. On any problem it resolves to
 * the placeholder testimonials from src/data/business.ts with
 * `source: 'placeholder'`, having logged one warning line explaining why.
 */
export const loadTestimonials = async (): Promise<TestimonialSet> => {
  pending ??= load().catch((error: unknown) => {
    // Belt and braces. Nothing above is expected to reject, but a failed build
    // is never an acceptable outcome for a review fetch.
    const message = error instanceof Error ? error.message : String(error);
    return placeholderSet(`unexpected error while loading reviews (${message})`);
  });
  return pending;
};

export default loadTestimonials;
