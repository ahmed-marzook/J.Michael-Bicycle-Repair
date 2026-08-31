/**
 * src/lib/announcement-sheet.ts — the one-off notice banner.
 *
 * A separate one-row tab from the weekly timetable, because the two answer
 * different questions:
 *
 *   - The `note` column on the hours tab is RECURRING: "late drop-off by
 *     appointment", true every Thursday.
 *   - This is a ONE-OFF: "closed Thursday 4th, back Friday", true once.
 *
 * Putting the one-off on a weekday row made a Sunday notice appear on a
 * Monday, and tied a temporary message to a day of the week it had nothing to
 * do with.
 *
 * EXPIRY
 *
 * `expires_on` is INCLUSIVE: a notice that says "closed Thu 4 Sept" with
 * `expires_on` of 2026-09-04 is still shown all through the 4th and is gone on
 * the 5th. Expiring at the start of the named day would hide the notice on the
 * one day it matters.
 *
 * It exists because the realistic failure here is not a wrong notice, it is a
 * stale one: a sole trader types "drop-ins welcome today!" and is far too busy
 * to remember to delete it three weeks later. An empty cell means "show until
 * I delete it", which is fine when that is a deliberate choice.
 *
 * Dates are compared in Europe/London, like everything else about opening
 * times, so the banner turns over at UK midnight rather than the visitor's.
 */
import { parseCsvRows } from './csv';
import { BUSINESS_TIME_ZONE, type StatusOverride } from './hours-sheet';

export const ANNOUNCEMENT_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRsoVS7zhnyuUS7dc7cr6Edb4CANG0MoJ4gKkcrArNfWNTPzUI5o6HtAwVk6FQ42R5Wiw6oz1cqS29G/pub?gid=1202187161&single=true&output=csv';

const FETCH_TIMEOUT_MS = 8000;

export interface Announcement {
  readonly message: string;
  readonly statusOverride: StatusOverride;
  /** `YYYY-MM-DD`, inclusive. Empty string means it never expires. */
  readonly expiresOn: string;
}

export interface AnnouncementResult {
  /** null when there is nothing to show, or nothing that has not expired. */
  readonly announcement: Announcement | null;
  readonly source: 'sheet' | 'fallback';
}

const log = (message: string): void => {
  console.warn(`[announcement] ${message}`);
};

/** Today in the workshop's own time zone, as `YYYY-MM-DD`. */
export function businessToday(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const get = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${get('year')}-${get('month')}-${get('day')}`;
}

/**
 * Normalise a date cell to `YYYY-MM-DD`.
 *
 * Accepts ISO (2026-09-04) and UK day-first (04/09/2026 or 4-9-2026), because
 * Google Sheets rewrites dates to the spreadsheet's locale and the client
 * should not have to fight the formatting to get this right.
 *
 * Day-first is assumed for the slash form: this is a UK business, and reading
 * 04/09/2026 as 9 April would silently shift a closure by months.
 */
export function normaliseDate(raw: string): string | null {
  const value = raw.trim();
  if (value === '') return null;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  if (iso) {
    const [, y, m, d] = iso;
    return `${y}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`;
  }

  const dayFirst = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(value);
  if (dayFirst) {
    const [, d, m, y] = dayFirst;
    return `${y}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`;
  }

  return null;
}

function parseOverride(raw: string): StatusOverride {
  const value = raw.trim().toLowerCase();
  if (value === 'open' || value === 'busy' || value === 'closed') return value;
  if (value !== '' && value !== 'auto') {
    log(`unrecognised status_override "${raw}" — ignoring it.`);
  }
  return 'auto';
}

/**
 * Decide whether an announcement should be shown today.
 *
 * Exported so the same rule is used at build time and in the browser: a page
 * built before the expiry date may well still be being served after it.
 */
export function isLive(announcement: Announcement, today: string): boolean {
  if (!announcement.message && announcement.statusOverride === 'auto') return false;
  if (!announcement.expiresOn) return true;
  return today <= announcement.expiresOn;
}

const CACHE_TTL_MS = import.meta.env.DEV ? 5000 : Infinity;

let cached: Promise<AnnouncementResult> | null = null;
let cachedAt = 0;

export function loadAnnouncement(): Promise<AnnouncementResult> {
  if (!cached || Date.now() - cachedAt > CACHE_TTL_MS) {
    cached = load();
    cachedAt = Date.now();
  }
  return cached;
}

function withCacheBuster(url: string): string {
  return `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`;
}

const NONE: AnnouncementResult = { announcement: null, source: 'fallback' };

async function load(): Promise<AnnouncementResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(withCacheBuster(ANNOUNCEMENT_CSV_URL), {
      signal: controller.signal,
      redirect: 'follow',
      cache: 'no-store',
    });

    if (!response.ok) {
      log(`the announcement sheet returned HTTP ${response.status} — showing no banner.`);
      return NONE;
    }

    const rows = parseCsvRows(await response.text());

    /* An empty tab is the normal resting state, not a problem. */
    const row = rows.find(
      (candidate) =>
        (candidate.message ?? '').trim() !== '' ||
        (candidate.status_override ?? '').trim() !== '',
    );

    if (!row) return { announcement: null, source: 'sheet' };

    const rawExpiry = (row.expires_on ?? '').trim();
    const expiresOn = normaliseDate(rawExpiry);

    if (rawExpiry !== '' && expiresOn === null) {
      log(
        `could not read expires_on "${rawExpiry}" — treating the notice as never expiring. Use YYYY-MM-DD or DD/MM/YYYY.`,
      );
    }

    const announcement: Announcement = {
      message: (row.message ?? '').trim(),
      statusOverride: parseOverride(row.status_override ?? ''),
      expiresOn: expiresOn ?? '',
    };

    const today = businessToday();

    if (!isLive(announcement, today)) {
      log(`the notice expired on ${announcement.expiresOn} — not showing it.`);
      return { announcement: null, source: 'sheet' };
    }

    log(
      `showing the notice${announcement.expiresOn ? ` until ${announcement.expiresOn} inclusive` : ' (no expiry set)'}${
        announcement.statusOverride !== 'auto'
          ? `, forcing the badge to "${announcement.statusOverride}"`
          : ''
      }.`,
    );

    return { announcement, source: 'sheet' };
  } catch (error) {
    log(
      `could not reach the announcement sheet (${error instanceof Error ? error.message : 'unknown error'}) — showing no banner.`,
    );
    return NONE;
  } finally {
    clearTimeout(timer);
  }
}
