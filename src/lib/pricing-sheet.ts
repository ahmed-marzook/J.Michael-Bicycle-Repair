/**
 * src/lib/pricing-sheet.ts — the published Google Sheet is the source of truth
 * for prices, read at build time.
 *
 * WHY BUILD TIME AND NOT JUST IN THE BROWSER
 *
 * A browser-only fetch cannot be the source of truth on a static site. It can
 * only rewrite text after the page has already been built, indexed and served,
 * which leaves the HTML, the `LocalBusiness` JSON-LD offers and the meta
 * descriptions all repeating whatever was hard-coded at build time. Google
 * would read one price and the visitor would see another.
 *
 * So the sheet is fetched here, during `npm run build`, and everything
 * downstream — the cards, the structured data, the page descriptions — is
 * generated from it. The browser refresh in PricingGrid.astro is then a small
 * bonus on top: it catches a price edited between deploys.
 *
 * FALLBACK
 *
 * The tiers in src/data/business.ts are no longer the authority; they are the
 * last known good copy, transcribed from the client's printed price card. If
 * the sheet is unreachable, empty, malformed or missing a tier, the build uses
 * them, warns once, and succeeds. A spreadsheet outage must never fail a
 * deploy or, worse, publish a page with no prices on it.
 *
 * The sheet may CHANGE a tier's price and wording. It may not invent tiers the
 * repo does not know about, because a tier also needs a stable anchor id and
 * an accessible label. Unknown row ids are ignored and reported.
 */
import { business, type PricingTier } from '../data/business';
import { parseCsvRows, type CsvRow } from './csv';

/** Published CSV for the client's pricing sheet. */
export const PRICING_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRsoVS7zhnyuUS7dc7cr6Edb4CANG0MoJ4gKkcrArNfWNTPzUI5o6HtAwVk6FQ42R5Wiw6oz1cqS29G/pub?output=csv';

/** Give up rather than hang a build on a slow spreadsheet. */
const FETCH_TIMEOUT_MS = 8000;

export interface PricingResult {
  readonly tiers: readonly PricingTier[];
  /** Where the prices actually came from. Used for honest logging. */
  readonly source: 'sheet' | 'fallback';
  /** Human-readable span of the published prices, e.g. "£40–£50". */
  readonly priceRange: string;
  /** The one factual line shown above the grid, rebuilt from live prices. */
  readonly headlineStatement: string;
}

const log = (message: string): void => {
  console.warn(`[pricing] ${message}`);
};

/**
 * Parse a price cell into a number.
 *
 * Accepts "£40", "40", "40.00" and stray spaces. Rejects anything that is not
 * a positive finite number, so a typo in the spreadsheet cannot render "£NaN"
 * on a live pricing page.
 */
function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[£\s,]/g, '');
  if (cleaned === '') return null;
  const amount = Number(cleaned);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

/** Format for display. Whole pounds lose the ".00", as on the client's card. */
function formatPrice(amount: number): string {
  return Number.isInteger(amount) ? `£${amount}` : `£${amount.toFixed(2)}`;
}

/**
 * Merge one sheet row onto the tier it belongs to.
 *
 * Only fields the sheet legitimately owns are taken. `id`, `sheetId` and
 * `isMostCommon` stay under the repo's control: `id` is a URL anchor, and
 * `isMostCommon` drives which card is emphasised, which is a design decision
 * rather than a spreadsheet one.
 */
function mergeTier(tier: PricingTier, row: CsvRow): PricingTier {
  const amount = parseAmount(row.price ?? '');

  if (amount === null) {
    log(
      `row "${row.id}" has an unusable price ${JSON.stringify(row.price ?? '')} — keeping ${tier.displayPrice} for "${tier.heading}".`,
    );
  }

  const nextAmount = amount ?? tier.amount;

  return {
    ...tier,
    amount: nextAmount,
    displayPrice: formatPrice(nextAmount),
    category: row.category || tier.category,
    heading: row.title || tier.heading,
    summary: row.subtitle || tier.summary,
    badge: row.badge || tier.badge,
    whatsAppText: row.whatsapp_text || tier.whatsAppText,
  };
}

function derive(tiers: readonly PricingTier[]): {
  priceRange: string;
  headlineStatement: string;
} {
  const amounts = tiers.map((tier) => tier.amount);
  const low = Math.min(...amounts);
  const high = Math.max(...amounts);
  const adult = tiers.find((tier) => tier.isMostCommon) ?? tiers[tiers.length - 1];

  return {
    priceRange: low === high ? formatPrice(low) : `${formatPrice(low)}–${formatPrice(high)}`,
    headlineStatement: adult
      ? `Most adult bikes are ${adult.displayPrice}, including the full servicing plan.`
      : business.pricing.headlineStatement,
  };
}

function fallback(reason: string): PricingResult {
  log(`${reason} — using the prices in src/data/business.ts.`);
  const tiers = business.pricing.tiers;
  return { tiers, source: 'fallback', ...derive(tiers) };
}

/**
 * Google serves the published CSV with `Cache-Control: private, max-age=300`,
 * so a plain fetch can hand back a copy up to five minutes old. After the
 * client re-publishes the sheet that reads as "the site did not update". A
 * unique query parameter makes every request a cache miss; Google ignores
 * unknown parameters and still returns the CSV.
 */
function withCacheBuster(url: string): string {
  return `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`;
}

let cached: Promise<PricingResult> | null = null;

/**
 * Load the pricing tiers for this build.
 *
 * Memoised, so a build with several pages that need prices makes exactly one
 * network request. Never rejects: every failure path resolves to the fallback.
 */
export function loadPricing(): Promise<PricingResult> {
  cached ??= load();
  return cached;
}

async function load(): Promise<PricingResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(withCacheBuster(PRICING_CSV_URL), {
      signal: controller.signal,
      redirect: 'follow',
      cache: 'no-store',
    });

    if (!response.ok) {
      return fallback(`the pricing sheet returned HTTP ${response.status}`);
    }

    const rows = parseCsvRows(await response.text());
    if (rows.length === 0) {
      return fallback('the pricing sheet returned no data rows');
    }

    const bySheetId = new Map(rows.filter((row) => row.id).map((row) => [row.id, row]));

    const tiers = business.pricing.tiers.map((tier) => {
      const row = bySheetId.get(tier.sheetId);
      if (!row) {
        log(
          `the sheet has no row "${tier.sheetId}" — keeping ${tier.displayPrice} for "${tier.heading}".`,
        );
        return tier;
      }
      bySheetId.delete(tier.sheetId);
      return mergeTier(tier, row);
    });

    for (const unknown of bySheetId.keys()) {
      log(
        `the sheet has a row "${unknown}" that no tier matches — ignored. Add it to src/data/business.ts to publish it.`,
      );
    }

    /*
     * Report drift loudly. The sheet wins, but a fallback that disagrees with
     * the live prices is a trap: it is what gets published the first time the
     * spreadsheet is unreachable.
     */
    const drift = tiers
      .map((tier) => {
        const before = business.pricing.tiers.find((t) => t.id === tier.id);
        return before && before.displayPrice !== tier.displayPrice
          ? `${tier.heading} ${before.displayPrice} -> ${tier.displayPrice}`
          : null;
      })
      .filter((entry): entry is string => entry !== null);

    if (drift.length > 0) {
      log(
        `sheet prices differ from src/data/business.ts: ${drift.join('; ')}. The sheet wins. Update business.ts so the fallback stays current.`,
      );
    }

    const result: PricingResult = { tiers, source: 'sheet', ...derive(tiers) };

    /*
     * Always say where the prices came from. A build that silently falls back
     * looks identical to one that fetched, and the difference is whether the
     * published page shows the client's current prices.
     */
    log(
      `prices read from the published sheet: ${tiers
        .map((tier) => `${tier.sheetId} ${tier.displayPrice}`)
        .join(', ')}.`,
    );

    return result;
  } catch (error) {
    const reason =
      error instanceof Error && error.name === 'AbortError'
        ? `the pricing sheet did not respond within ${FETCH_TIMEOUT_MS}ms`
        : `could not reach the pricing sheet (${error instanceof Error ? error.message : 'unknown error'})`;
    return fallback(reason);
  } finally {
    clearTimeout(timer);
  }
}
