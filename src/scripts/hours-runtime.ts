/**
 * src/scripts/hours-runtime.ts — the browser half of opening hours.
 *
 * Bundled rather than inlined so the announcement banner (every page), the
 * full timetable (/contact/) and the home-page summary all share one copy of
 * the time and CSV logic. Three inline copies of "what day is it in London"
 * is three chances for them to disagree on the same page.
 *
 * It also lets this import the same CSV parser the build uses
 * (src/lib/csv.ts), so the spreadsheet is read identically in Node and in the
 * browser.
 *
 * Everything here is progressive enhancement. The timetable, the prices and
 * the banner are already correct in the HTML before any of this runs; these
 * functions only refresh them and work out the things a static page cannot
 * know — what day it is now, and whether a notice has expired since the build.
 *
 * Configuration comes from data attributes rather than `define:vars`, because
 * a bundled script cannot take injected variables.
 */
import { parseCsvRows, type CsvRow } from '../lib/csv';

/** The workshop's clock. Every decision is made here, not in the visitor's. */
const TIME_ZONE = 'Europe/London';

const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export type StatusKey = 'open' | 'busy' | 'closed';

const STATUS_TEXT: Readonly<Record<StatusKey, string>> = {
  open: 'Open now — in the workshop',
  busy: 'Fully booked today',
  closed: 'Closed',
};

interface Now {
  readonly weekday: string;
  readonly minutes: number;
  /** `YYYY-MM-DD` in the workshop's zone. */
  readonly date: string;
}

/** Current weekday, minute-of-day and date, all in Europe/London. */
export function now(at: Date = new Date()): Now {
  const clock = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(at);

  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(at);

  const pick = (parts: Intl.DateTimeFormatPart[], type: string): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  /*
   * en-GB with hour12:false renders midnight as "24" rather than "00", so it
   * has to be folded back or every comparison after midnight breaks.
   */
  const hour = Number(pick(clock, 'hour')) % 24;

  return {
    weekday: pick(clock, 'weekday').toLowerCase(),
    minutes: hour * 60 + Number(pick(clock, 'minute')),
    date: `${pick(day, 'year')}-${pick(day, 'month')}-${pick(day, 'day')}`,
  };
}

/** `HH:MM` to minutes past midnight. null when unparseable. */
export function toMinutes(value: string | null | undefined): number | null {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec((value ?? '').trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** "08:30" to "8:30am". */
export function formatTime(value: string): string {
  const minutes = toMinutes(value);
  if (minutes === null) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`;
}

export function isTruthy(value: string | null | undefined): boolean {
  return /^(true|yes|y|1)$/i.test((value ?? '').trim());
}

/**
 * `YYYY-MM-DD`, accepting the ISO and UK day-first forms Sheets may produce.
 * Day-first for the slash form: this is a UK business, and reading 04/09/2026
 * as 9 April would move a closure by months.
 */
export function normaliseDate(raw: string | null | undefined): string {
  const value = (raw ?? '').trim();
  if (!value) return '';

  const pad = (n: string): string => n.padStart(2, '0');

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  if (iso) return `${iso[1]}-${pad(iso[2]!)}-${pad(iso[3]!)}`;

  const uk = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(value);
  if (uk) return `${uk[3]}-${pad(uk[2]!)}-${pad(uk[1]!)}`;

  return '';
}

/** `expires_on` is inclusive: a notice for the 4th is still shown on the 4th. */
export function notExpired(expires: string, today: string): boolean {
  return !expires || today <= expires;
}

interface DaySchedule {
  closed: boolean;
  open: string | null;
  close: string | null;
  note: string;
  override: string;
}

type Schedule = Record<string, DaySchedule>;

/** Fetch with a timeout, defeating Google's five-minute CSV cache. */
async function fetchCsv(url: string, signal: AbortSignal): Promise<CsvRow[]> {
  const bust = `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`;
  const response = await fetch(bust, { signal, credentials: 'omit', cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return parseCsvRows(await response.text());
}

function withTimeout<T>(run: (signal: AbortSignal) => Promise<T>, ms = 6000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return run(controller.signal).finally(() => clearTimeout(timer));
}

/* ==========================================================================
 * Announcement banner — rendered by BaseLayout on every page
 * ======================================================================== */

export interface BannerState {
  message: string;
  override: string;
  expires: string;
}

function readBanner(el: HTMLElement): BannerState {
  return {
    message: (el.dataset.message ?? '').trim(),
    override: (el.dataset.override ?? 'auto').toLowerCase(),
    expires: el.dataset.expires ?? '',
  };
}

function paintBanner(el: HTMLElement, state: BannerState, today: string): void {
  const live = Boolean(state.message) && notExpired(state.expires, today);
  const text = el.querySelector<HTMLElement>('[data-banner-text]');
  if (text) text.textContent = state.message;
  el.hidden = !live;
}

/**
 * The banner is re-checked in the browser because a page built before the
 * expiry date can still be served after it — a cached page or a site that has
 * not been rebuilt would otherwise show a notice about a closure long past.
 */
export function initAnnouncementBanner(el: HTMLElement): void {
  const today = now().date;
  paintBanner(el, readBanner(el), today);

  const url = el.dataset.url;
  if (!url) return;

  void withTimeout((signal) => fetchCsv(url, signal))
    .then((rows) => {
      const row = rows.find((r) => (r.message ?? '') !== '' || (r.status_override ?? '') !== '');
      const state: BannerState = row
        ? {
            message: (row.message ?? '').trim(),
            override: (row.status_override ?? 'auto').toLowerCase(),
            expires: normaliseDate(row.expires_on),
          }
        : { message: '', override: 'auto', expires: '' };

      el.dataset.message = state.message;
      el.dataset.override = state.override;
      el.dataset.expires = state.expires;

      paintBanner(el, state, now().date);

      /*
       * The banner owns the site-wide override, so any hours widget on the
       * page has to be told when it changes.
       */
      document.dispatchEvent(
        new CustomEvent('hours:override', {
          detail: { override: notExpired(state.expires, now().date) ? state.override : 'auto' },
        }),
      );
    })
    .catch(() => {
      /* Keep whatever the build baked in. */
    });
}

/* ==========================================================================
 * Shared schedule reading
 * ======================================================================== */

/** Read the schedule back out of the rendered table or the summary's data. */
function readSchedule(root: HTMLElement): Schedule {
  const schedule: Schedule = {};

  root.querySelectorAll<HTMLElement>('[data-day]').forEach((el) => {
    const day = el.dataset.day;
    if (!day) return;
    schedule[day] = {
      closed: isTruthy(el.dataset.closed),
      open: el.dataset.open || null,
      close: el.dataset.close || null,
      note: el.dataset.note ?? '',
      override: (el.dataset.override ?? 'auto').toLowerCase(),
    };
  });

  return schedule;
}

function statusFor(schedule: Schedule, at: Now, siteOverride: string): StatusKey {
  const today = schedule[at.weekday];
  const override = siteOverride !== 'auto' ? siteOverride : (today?.override ?? 'auto');

  if (override === 'open' || override === 'busy' || override === 'closed') return override;
  if (!today || today.closed) return 'closed';

  const opens = toMinutes(today.open);
  const closes = toMinutes(today.close);
  if (opens === null || closes === null) return 'closed';

  return at.minutes >= opens && at.minutes < closes ? 'open' : 'closed';
}

function paintStatus(el: HTMLElement | null, key: StatusKey): void {
  if (!el) return;
  el.classList.remove('is-open', 'is-busy', 'is-closed');
  el.classList.add(`is-${key}`);
  const text = el.querySelector<HTMLElement>('[data-status-text]');
  if (text) text.textContent = STATUS_TEXT[key];
}

/** The next day the workshop opens, for "closed now, opens Monday 8:30am". */
function nextOpening(schedule: Schedule, at: Now): string {
  const index = WEEKDAYS.indexOf(at.weekday as (typeof WEEKDAYS)[number]);
  if (index === -1) return '';

  for (let step = 0; step <= 7; step++) {
    const day = WEEKDAYS[(index + step) % 7]!;
    const entry = schedule[day];
    if (!entry || entry.closed) continue;

    const opens = toMinutes(entry.open);
    if (opens === null) continue;

    // Later today only counts if it has not already opened.
    if (step === 0 && at.minutes >= opens) continue;

    const label =
      step === 0 ? 'today' : step === 1 ? 'tomorrow' : day.charAt(0).toUpperCase() + day.slice(1);
    return `Opens ${label} at ${formatTime(entry.open!)}`;
  }

  return '';
}

/* ==========================================================================
 * Home-page summary — today's hours in one line
 * ======================================================================== */

export function initHoursSummary(root: HTMLElement): void {
  let siteOverride = 'auto';

  const paint = (): void => {
    const at = now();
    const schedule = readSchedule(root);
    const today = schedule[at.weekday];
    const key = statusFor(schedule, at, siteOverride);

    paintStatus(root.querySelector<HTMLElement>('[data-status]'), key);

    const dayLabel = at.weekday.charAt(0).toUpperCase() + at.weekday.slice(1);
    const line = root.querySelector<HTMLElement>('[data-today-line]');
    const detail = root.querySelector<HTMLElement>('[data-today-detail]');

    if (line) {
      line.textContent =
        today && !today.closed && today.open && today.close
          ? `${dayLabel}: ${formatTime(today.open)} – ${formatTime(today.close)}`
          : `${dayLabel}: closed`;
    }

    if (detail) {
      const next = key === 'open' ? '' : nextOpening(schedule, at);
      detail.textContent = next || today?.note || '';
      detail.hidden = !detail.textContent;
    }
  };

  paint();

  document.addEventListener('hours:override', (event) => {
    siteOverride = (event as CustomEvent<{ override: string }>).detail?.override ?? 'auto';
    paint();
  });

  const url = root.dataset.url;
  if (!url) return;

  void withTimeout((signal) => fetchCsv(url, signal))
    .then((rows) => {
      rows.forEach((row) => {
        const day = (row.day ?? '').toLowerCase();
        const el = root.querySelector<HTMLElement>(`[data-day="${day}"]`);
        if (!el) return;

        const closed = isTruthy(row.is_closed);
        const opens = toMinutes(row.open_time);
        const closes = toMinutes(row.close_time);

        el.dataset.closed = String(closed || opens === null || closes === null);
        el.dataset.open = row.open_time ?? '';
        el.dataset.close = row.close_time ?? '';
        el.dataset.note = row.note ?? '';
        el.dataset.override = (row.status_override ?? 'auto').toLowerCase();
      });
      paint();
    })
    .catch(() => {
      /* Keep the build-time schedule. */
    });
}

/* ==========================================================================
 * Full timetable — /contact/
 * ======================================================================== */

export function initOpeningHours(root: HTMLElement): void {
  let siteOverride = 'auto';

  const markToday = (weekday: string): void => {
    root.querySelectorAll<HTMLElement>('tbody tr[data-day]').forEach((tr) => {
      const isToday = tr.dataset.day === weekday;
      tr.classList.toggle('is-today', isToday);

      const cell = tr.querySelector<HTMLElement>('th[scope="row"]');
      if (!cell) return;

      const pill = cell.querySelector('.today-pill');
      if (isToday && !pill) {
        const el = document.createElement('span');
        el.className = 'today-pill';
        el.textContent = 'Today';
        cell.appendChild(el);
      } else if (!isToday && pill) {
        pill.remove();
      }
    });
  };

  const paint = (): void => {
    const at = now();
    markToday(at.weekday);
    paintStatus(
      root.querySelector<HTMLElement>('[data-status]'),
      statusFor(readSchedule(root), at, siteOverride),
    );
  };

  paint();

  document.addEventListener('hours:override', (event) => {
    siteOverride = (event as CustomEvent<{ override: string }>).detail?.override ?? 'auto';
    paint();
  });

  const url = root.dataset.url;
  if (!url) return;

  void withTimeout((signal) => fetchCsv(url, signal))
    .then((rows) => {
      rows.forEach((row) => {
        const day = (row.day ?? '').toLowerCase();
        const tr = root.querySelector<HTMLElement>(`tbody tr[data-day="${day}"]`);
        if (!tr) return;

        const closed = isTruthy(row.is_closed);
        const opens = toMinutes(row.open_time);
        const closes = toMinutes(row.close_time);
        const shut = closed || opens === null || closes === null;

        tr.dataset.closed = String(shut);
        tr.dataset.open = row.open_time ?? '';
        tr.dataset.close = row.close_time ?? '';
        tr.dataset.override = (row.status_override ?? 'auto').toLowerCase();
        tr.classList.toggle('is-closed', shut);

        const hoursCell = tr.querySelector<HTMLElement>('[data-hours-cell]');
        if (hoursCell) {
          hoursCell.textContent = shut
            ? 'Closed'
            : `${formatTime(row.open_time!)} – ${formatTime(row.close_time!)}`;
        }

        const noteCell = tr.querySelector<HTMLElement>('[data-note-cell]');
        if (noteCell) noteCell.textContent = row.note ?? '';
      });
      paint();
    })
    .catch(() => {
      /* Keep the build-time timetable. */
    });
}
