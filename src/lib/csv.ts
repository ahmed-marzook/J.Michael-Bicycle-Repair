/**
 * src/lib/csv.ts — a minimal RFC 4180 CSV reader.
 *
 * Shared deliberately between the build-time fetch (src/lib/pricing-sheet.ts)
 * and the in-browser refresh (src/components/PricingGrid.astro). Two copies of
 * a parser is two chances to disagree about the same spreadsheet, and the one
 * that disagrees would be showing the wrong price.
 *
 * Why a character scanner rather than `split(',')`: the real data contains
 * commas inside quoted fields ("up to 24" wheel size, up to one set of gears")
 * and doubled quotes for the inch mark (20"" -> 20"). Splitting corrupts both.
 */

/** One parsed row, keyed by the lower-cased header names. */
export type CsvRow = Readonly<Record<string, string>>;

/**
 * Split CSV text into rows of raw fields.
 *
 * Handles quoted fields, commas and newlines inside quotes, doubled quotes as
 * an escaped quote, CRLF or LF line endings, and skips blank lines. Never
 * throws: malformed input yields whatever fields could be read, and the caller
 * validates.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const endRow = (): void => {
    row.push(field);
    field = '';
    // Skip blank lines rather than emitting a one-empty-field row.
    if (row.length > 1 || row[0] !== '') rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      endRow();
    } else {
      field += ch;
    }
  }

  endRow();
  return rows;
}

/**
 * Turn parsed rows into objects keyed by the header row.
 *
 * Header names are lower-cased and trimmed, and every value is trimmed, so a
 * stray capital or trailing space in the spreadsheet cannot break a lookup.
 * Returns an empty array when there is no data beyond the header.
 */
export function toObjects(rows: readonly string[][]): CsvRow[] {
  const [header, ...body] = rows;
  if (!header || body.length === 0) return [];

  const keys = header.map((name) => name.trim().toLowerCase());

  return body.map((cells) => {
    const row: Record<string, string> = {};
    keys.forEach((key, i) => {
      row[key] = (cells[i] ?? '').trim();
    });
    return row;
  });
}

/** Parse CSV text straight to keyed rows. */
export function parseCsvRows(text: string): CsvRow[] {
  return toObjects(parseCsv(text));
}
