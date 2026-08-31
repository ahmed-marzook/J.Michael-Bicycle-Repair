/**
 * src/lib/hours-sheet.ts — opening hours from the published Google Sheet,
 * read at build time.
 *
 * Same shape as src/lib/pricing-sheet.ts and for the same reason: the sheet is
 * the source of truth, so it has to drive the built HTML rather than only
 * patching it afterwards. The browser refresh in OpeningHours.astro then picks
 * up anything edited between deploys — which is the whole point for a status
 * line like "fully booked today".
 *
 * TIME ZONE
 *
 * The workshop is in Milton Keynes, so every open/closed decision is made in
 * `Europe/London`, never in the visitor's local time. Someone checking from
 * Spain at 18:00 their time is looking at a workshop where it is 17:00, and a
 * naive `new Date().getHours()` would tell them it is shut when it is open.
 *
 * FALLBACK
 *
 * `business.hours` in src/data/business.ts. That is currently the honest
 * "by appointment, ring him" state, so if the sheet is unreachable the site
 * says that rather than inventing a timetable.
 */
import { business, type DayHours, type Weekday, type TimeOfDay } from '../data/business';
import { parseCsvRows, type CsvRow } from './csv';

export const HOURS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRsoVS7zhnyuUS7dc7cr6Edb4CANG0MoJ4gKkcrArNfWNTPzUI5o6HtAwVk6FQ42R5Wiw6oz1cqS29G/pub?gid=1881158641&single=true&output=csv';

/** The workshop's own clock. Every comparison happens in this zone. */
export const BUSINESS_TIME_ZONE = 'Europe/London';

const FETCH_TIMEOUT_MS = 8000;

/** Ordered Monday-first, which is how a UK opening-hours table reads. */
export const WEEK: readonly Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const DAY_LABEL: Readonly<Record<Weekday, string>> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

/**
 * A manual override the client can set in the sheet.
 *
 * `auto` (an empty cell) is the normal case and means "work it out from the
 * timetable". The others are for the days when the timetable is not the truth:
 * `busy` is the fully-booked-today case, `closed` covers a holiday.
 */
export type StatusOverride = 'auto' | 'open' | 'busy' | 'closed';

export interface HoursRow {
  readonly day: Weekday;
  readonly label: string;
  readonly isClosed: boolean;
  /** `HH:MM`, absent when closed. */
  readonly opens?: TimeOfDay;
  readonly closes?: TimeOfDay;
  /** Display string, e.g. "8:30am – 5:30pm" or "Closed". */
  readonly display: string;
  readonly note: string;
}

export interface HoursResult {
  readonly rows: readonly HoursRow[];
  readonly source: 'sheet' | 'fallback';
  readonly statusOverride: StatusOverride;
  /** Free-text notice for the top of the block. Empty means show nothing. */
  readonly announcement: string;
  /** `DayHours[]` for schema.org, or null while hours are unknown. */
  readonly schedule: readonly DayHours[] | null;
}

const log = (message: string): void => {
  console.warn(`[hours] ${message}`);
};

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;

/** Normalise "8:30" or "08:30" to "08:30". Rejects anything else. */
function parseTime(raw: string): TimeOfDay | null {
  const match = TIME_PATTERN.exec(raw.trim());
  if (!match) return null;
  const [, hours, minutes] = match;
  return `${hours!.padStart(2, '0')}:${minutes}` as TimeOfDay;
}

/** "08:30" -> "8:30am", "17:30" -> "5:30pm". UK-style, no leading zero. */
export function formatTime(time: TimeOfDay): string {
  const [h, m] = time.split(':').map(Number) as [number, number];
  const suffix = h < 12 ? 'am' : 'pm';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12}${suffix}` : `${hour12}:${String(m).padStart(2, '0')}${suffix}`;
}

function parseBoolean(raw: string): boolean {
  return /^(true|yes|y|1)$/i.test(raw.trim());
}

function parseOverride(raw: string): StatusOverride {
  const value = raw.trim().toLowerCase();
  if (value === 'open' || value === 'busy' || value === 'closed') return value;
  if (value !== '' && value !== 'auto') {
    log(`unrecognised status_override "${raw}" — treating it as auto.`);
  }
  return 'auto';
}

function fallback(reason: string): HoursResult {
  log(`${reason} — falling back to the hours in src/data/business.ts.`);

  const hours = business.hours;

  if (hours.kind === 'scheduled') {
    return {
      rows: hours.days.map(toRow),
      source: 'fallback',
      statusOverride: 'auto',
      announcement: '',
      schedule: hours.days,
    };
  }

  // Hours genuinely unknown: say so rather than showing an empty table.
  return {
    rows: [],
    source: 'fallback',
    statusOverride: 'auto',
    announcement: hours.message,
    schedule: null,
  };
}

function toRow(day: DayHours): HoursRow {
  const label = DAY_LABEL[day.day];

  if (day.status === 'closed') {
    return { day: day.day, label, isClosed: true, display: 'Closed', note: '' };
  }

  const interval = day.intervals[0];
  return {
    day: day.day,
    label,
    isClosed: false,
    opens: interval?.opens,
    closes: interval?.closes,
    display: interval
      ? `${formatTime(interval.opens)} – ${formatTime(interval.closes)}`
      : 'Closed',
    note: '',
  };
}

function rowFromCsv(row: CsvRow): HoursRow | null {
  const key = (row.day ?? '').trim().toLowerCase();
  const day = WEEK.find((weekday) => weekday === key);
  if (!day) {
    if (key) log(`ignoring row for unknown day "${row.day}".`);
    return null;
  }

  const label = DAY_LABEL[day];
  const note = row.note ?? '';
  const closed = parseBoolean(row.is_closed ?? '');

  if (closed) {
    return { day, label, isClosed: true, display: 'Closed', note };
  }

  const opens = parseTime(row.open_time ?? '');
  const closes = parseTime(row.close_time ?? '');

  /*
   * A row that says it is open but carries no usable times is not something to
   * guess at: showing "Open" with no hours is worse than showing "Closed".
   */
  if (!opens || !closes) {
    log(
      `${label} is not marked closed but has unusable times ("${row.open_time}"–"${row.close_time}") — showing it as closed.`,
    );
    return { day, label, isClosed: true, display: 'Closed', note };
  }

  return {
    day,
    label,
    isClosed: false,
    opens,
    closes,
    display: `${formatTime(opens)} – ${formatTime(closes)}`,
    note,
  };
}

function toSchedule(rows: readonly HoursRow[]): readonly DayHours[] {
  return rows.map((row) =>
    row.isClosed || !row.opens || !row.closes
      ? { day: row.day, status: 'closed' as const }
      : {
          day: row.day,
          status: 'open' as const,
          intervals: [{ opens: row.opens, closes: row.closes }],
        },
  );
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

let cached: Promise<HoursResult> | null = null;

/** Memoised so the whole build makes one request. Never rejects. */
export function loadHours(): Promise<HoursResult> {
  cached ??= load();
  return cached;
}

async function load(): Promise<HoursResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(withCacheBuster(HOURS_CSV_URL), {
      signal: controller.signal,
      redirect: 'follow',
      cache: 'no-store',
    });

    if (!response.ok) {
      return fallback(`the hours sheet returned HTTP ${response.status}`);
    }

    const csvRows = parseCsvRows(await response.text());
    if (csvRows.length === 0) {
      return fallback('the hours sheet returned no data rows');
    }

    const byDay = new Map<Weekday, HoursRow>();
    for (const csvRow of csvRows) {
      const row = rowFromCsv(csvRow);
      if (row) byDay.set(row.day, row);
    }

    if (byDay.size === 0) {
      return fallback('the hours sheet had no rows naming a day of the week');
    }

    const missing = WEEK.filter((day) => !byDay.has(day));
    if (missing.length > 0) {
      log(
        `the sheet has no row for ${missing.map((d) => DAY_LABEL[d]).join(', ')} — showing those days as closed.`,
      );
    }

    const rows = WEEK.map(
      (day) =>
        byDay.get(day) ?? {
          day,
          label: DAY_LABEL[day],
          isClosed: true,
          display: 'Closed',
          note: '',
        },
    );

    /*
     * The override and the announcement are business-wide, not per-day, so
     * they are read from the first row that supplies one. That lets the client
     * type them in the Monday row without having to repeat them down the sheet.
     */
    const overrideCell = csvRows.find((row) => (row.status_override ?? '').trim() !== '');
    const announcementCell = csvRows.find(
      (row) => (row.custom_announcement ?? '').trim() !== '',
    );

    const statusOverride = parseOverride(overrideCell?.status_override ?? '');
    if (statusOverride !== 'auto') {
      log(
        `status_override is "${statusOverride}" — the badge will show that regardless of the timetable until the cell is cleared.`,
      );
    }

    log(
      `hours read from the published sheet: ${rows
        .filter((row) => !row.isClosed)
        .map((row) => `${row.label} ${row.display}`)
        .join(', ')}.`,
    );

    return {
      rows,
      source: 'sheet',
      statusOverride,
      announcement: (announcementCell?.custom_announcement ?? '').trim(),
      schedule: toSchedule(rows),
    };
  } catch (error) {
    const reason =
      error instanceof Error && error.name === 'AbortError'
        ? `the hours sheet did not respond within ${FETCH_TIMEOUT_MS}ms`
        : `could not reach the hours sheet (${error instanceof Error ? error.message : 'unknown error'})`;
    return fallback(reason);
  } finally {
    clearTimeout(timer);
  }
}
