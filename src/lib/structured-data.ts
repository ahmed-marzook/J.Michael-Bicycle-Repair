/**
 * src/lib/structured-data.ts
 * ---------------------------------------------------------------------------
 * Builds the schema.org `LocalBusiness` JSON-LD graph from src/data/business.ts.
 *
 * This module invents nothing. Every value it emits is read from the business
 * data module, so the structured data can never drift from what the page says.
 *
 * Usage in a layout:
 *
 *   ---
 *   import { buildLocalBusinessJsonLd, serialiseJsonLd } from '../lib/structured-data';
 *   const jsonLd = serialiseJsonLd(buildLocalBusinessJsonLd({ siteUrl: Astro.site }));
 *   ---
 *   <script type="application/ld+json" is:inline set:html={jsonLd} />
 *
 * `serialiseJsonLd` — not bare `JSON.stringify` — is what makes that safe; see
 * the note on that function.
 * ---------------------------------------------------------------------------
 */

import {
  business as defaultBusiness,
  type Business,
  type DayHours,
  type Weekday,
} from '../data/business';

/* ===========================================================================
 * A minimal, honest set of JSON-LD types.
 *
 * These describe only the shapes this file actually emits, so a typo in a
 * property name is a compile error rather than structured data Google quietly
 * ignores. No `any` anywhere.
 * ======================================================================== */

export interface PostalAddressJsonLd {
  readonly '@type': 'PostalAddress';
  readonly streetAddress: string;
  readonly addressLocality: string;
  readonly addressRegion: string;
  readonly postalCode: string;
  readonly addressCountry: string;
}

export interface AggregateRatingJsonLd {
  readonly '@type': 'AggregateRating';
  readonly ratingValue: number;
  readonly reviewCount: number;
  readonly bestRating: number;
  readonly worstRating: number;
}

export interface ServiceJsonLd {
  readonly '@type': 'Service';
  readonly name: string;
  readonly description: string;
  readonly serviceType: string;
}

export interface OfferJsonLd {
  readonly '@type': 'Offer';
  readonly name: string;
  readonly description: string;
  readonly price: string;
  readonly priceCurrency: string;
  readonly availability: 'https://schema.org/InStock';
  readonly itemOffered: ServiceJsonLd;
}

export interface OfferCatalogJsonLd {
  readonly '@type': 'OfferCatalog';
  readonly name: string;
  readonly itemListElement: readonly OfferJsonLd[];
}

export interface OpeningHoursSpecificationJsonLd {
  readonly '@type': 'OpeningHoursSpecification';
  readonly dayOfWeek: string;
  readonly opens: string;
  readonly closes: string;
}

export interface LocalBusinessJsonLd {
  readonly '@context': 'https://schema.org';
  readonly '@type': 'LocalBusiness';
  readonly '@id'?: string;
  readonly name: string;
  readonly legalName: string;
  readonly description: string;
  readonly url?: string;
  readonly telephone: string;
  readonly email: string;
  readonly address: PostalAddressJsonLd;
  readonly areaServed: readonly string[];
  readonly sameAs: readonly string[];
  readonly aggregateRating: AggregateRatingJsonLd;
  readonly priceRange: string;
  readonly currenciesAccepted: string;
  readonly hasMap: string;
  readonly hasOfferCatalog: OfferCatalogJsonLd;
  readonly openingHoursSpecification?: readonly OpeningHoursSpecificationJsonLd[];
}

export interface BuildLocalBusinessOptions {
  /**
   * The site origin — pass `Astro.site` so the value comes from
   * astro.config.mjs and is never hard-coded in a component. When it is
   * undefined (no `site` configured) the `url` and `@id` keys are simply
   * omitted rather than being guessed at.
   */
  readonly siteUrl?: URL | string | undefined;
  /** Override the data source. Defaults to the single source of truth. */
  readonly data?: Business;
}

/** schema.org day URIs, keyed by our own `Weekday` union. */
const SCHEMA_DAY: Readonly<Record<Weekday, string>> = {
  monday: 'https://schema.org/Monday',
  tuesday: 'https://schema.org/Tuesday',
  wednesday: 'https://schema.org/Wednesday',
  thursday: 'https://schema.org/Thursday',
  friday: 'https://schema.org/Friday',
  saturday: 'https://schema.org/Saturday',
  sunday: 'https://schema.org/Sunday',
};

function toOpeningHoursSpecification(
  days: readonly DayHours[],
): readonly OpeningHoursSpecificationJsonLd[] {
  return days.flatMap((day) =>
    day.status === 'closed'
      ? []
      : day.intervals.map((interval) => ({
          '@type': 'OpeningHoursSpecification' as const,
          dayOfWeek: SCHEMA_DAY[day.day],
          opens: interval.opens,
          closes: interval.closes,
        })),
  );
}

/**
 * Builds the `LocalBusiness` object. Returns a plain, serialisable object —
 * it does no stringifying and touches no DOM.
 */
export function buildLocalBusinessJsonLd(
  options: BuildLocalBusinessOptions = {},
): LocalBusinessJsonLd {
  const data = options.data ?? defaultBusiness;
  const { identity, contact, address, socials, hours, pricing, reviews } = data;

  const siteUrl =
    options.siteUrl === undefined ? undefined : new URL(options.siteUrl).origin;

  const offerCatalog: OfferCatalogJsonLd = {
    '@type': 'OfferCatalog',
    name: data.servicingPlan.title,
    itemListElement: pricing.tiers.map((tier) => ({
      '@type': 'Offer' as const,
      name: tier.name,
      description: tier.eligibility,
      // schema.org wants a bare numeric string, no currency symbol.
      price: tier.amount.toFixed(2),
      priceCurrency: tier.currency,
      availability: 'https://schema.org/InStock' as const,
      itemOffered: {
        '@type': 'Service' as const,
        name: data.servicingPlan.title,
        description: `${tier.eligibility}. ${pricing.includesNote} ${data.servicingPlan.partsCaveat}`,
        serviceType: 'Bicycle servicing',
      },
    })),
  };

  const openingHours =
    hours.kind === 'scheduled'
      ? toOpeningHoursSpecification(hours.days)
      : // Hours are not published yet — emitting a guess would be worse than
        // emitting nothing, so the property is omitted entirely.
        undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    ...(siteUrl === undefined ? {} : { '@id': `${siteUrl}/#localbusiness`, url: `${siteUrl}/` }),
    name: identity.tradingName,
    legalName: identity.legalName,
    description: identity.shortDescription,
    telephone: contact.phoneE164,
    email: contact.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${address.street}, ${address.dependentLocality}`,
      addressLocality: address.locality,
      addressRegion: address.region,
      postalCode: address.postcode,
      addressCountry: address.countryCode,
    },
    areaServed: [...address.areaServed],
    sameAs: socials.map((social) => social.url),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: reviews.aggregate.ratingValue,
      reviewCount: reviews.aggregate.reviewCount,
      bestRating: reviews.aggregate.bestRating,
      worstRating: reviews.aggregate.worstRating,
    },
    priceRange: pricing.priceRange,
    currenciesAccepted: 'GBP',
    hasMap: address.directionsUrl,
    hasOfferCatalog: offerCatalog,
    ...(openingHours === undefined
      ? {}
      : { openingHoursSpecification: openingHours }),
  };
}

/**
 * The characters that must never reach the HTML parser inside a
 * <script type="application/ld+json"> block, as code points:
 *   0x3C \u003c "<"  0x3E \u003e ">"  0x26 \u0026 "&"
 *   0x2028 / 0x2029 — legal in JSON, illegal raw in a JS string literal.
 */
const UNSAFE_CODE_POINTS: ReadonlySet<number> = new Set([
  0x3c, 0x3e, 0x26, 0x2028, 0x2029,
]);

function toUnicodeEscape(codePoint: number): string {
  return '\\u' + codePoint.toString(16).padStart(4, '0');
}

/**
 * Serialises a JSON-LD object for injection into a
 * `<script type="application/ld+json">` block.
 *
 * Plain `JSON.stringify` is NOT safe here: an HTML parser terminates the script
 * element at the first literal `</script`, so any `<` reaching the output could
 * break out of the block and inject markup. Escaping `<`, `>` and `&` as
 * `\uXXXX` sequences keeps the value valid JSON — a JSON parser decodes the
 * escapes back to the original characters — while making it impossible for the
 * HTML parser to see a tag. U+2028/U+2029 are escaped too: they are legal in
 * JSON but illegal raw in JavaScript string literals.
 *
 * Use with `set:html`; never interpolate the raw object into a template.
 */
export function serialiseJsonLd(value: LocalBusinessJsonLd): string {
  let escaped = '';
  for (const character of JSON.stringify(value)) {
    const codePoint = character.codePointAt(0);
    escaped +=
      codePoint !== undefined && UNSAFE_CODE_POINTS.has(codePoint)
        ? toUnicodeEscape(codePoint)
        : character;
  }
  return escaped;
}

/** US spelling alias, for callers that reach for it. */
export const serializeJsonLd = serialiseJsonLd;
