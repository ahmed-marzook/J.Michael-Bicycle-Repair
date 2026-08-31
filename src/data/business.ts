/**
 * src/data/business.ts
 * ---------------------------------------------------------------------------
 * THE SINGLE SOURCE OF TRUTH for every client fact on this site.
 *
 * Rules (see AGENTS.md section 2):
 *   1. Every phone number, price, address and URL on the site reads from here.
 *      Nothing is hard-coded in a component, a page or the JSON-LD.
 *   2. Every value below is transcribed from docs/PROJECT_BRIEF.md. Nothing is
 *      invented. Anything not yet known from the client is marked TODO(client)
 *      and typed so the site can render an honest "not known yet" state.
 *   3. When Jimmy's details change, this file changes and nothing else does.
 *
 * The exported interfaces are the contract for pages, components and
 * src/lib/structured-data.ts.
 * ---------------------------------------------------------------------------
 */

/* ===========================================================================
 * Identity
 * ======================================================================== */

export interface BusinessIdentity {
  /** Registered / legal trading entity. */
  readonly legalName: string;
  /** The full name the client trades under, as written on the signage. */
  readonly tradingName: string;
  /** Short form for nav bars, footers and the browser tab. */
  readonly shortName: string;
  /**
   * The name written out for screen readers and image alt text, where "&"
   * reads badly. Same business, spoken form.
   */
  readonly spokenName: string;
  /** The second line of the logotype in the header. */
  readonly logotypeStrapline: string;
  /** The owner's name as customers know him. */
  readonly ownerFirstName: string;
  /** One line, <= ~155 chars — safe for a meta description or an OG subtitle. */
  readonly shortDescription: string;
  /** Two or three sentences for the hero / About intro. */
  readonly longDescription: string;
  /** A short strapline. Marketing copy, not a client-verified claim. */
  readonly tagline: string;
}

/* ===========================================================================
 * Contact
 * ======================================================================== */

export interface BusinessContact {
  /** How the number is written on the signage — always show this to humans. */
  readonly phoneDisplay: string;
  /** International display form. */
  readonly phoneInternationalDisplay: string;
  /** E.164, no spaces or punctuation. Used by JSON-LD and by the link builders. */
  readonly phoneE164: string;
  /** Ready-to-use `href` for a call link. */
  readonly telHref: string;
  /** Ready-to-use `href` for a text-message link. */
  readonly smsHref: string;
  /** Ready-to-use `href` for the WhatsApp deep link — the primary CTA. */
  readonly whatsAppHref: string;
  readonly email: string;
  /** Ready-to-use `href` for an email link. */
  readonly emailHref: string;
  /** The client's own wording for how to get in touch. */
  readonly contactNote: string;
}

/* ===========================================================================
 * Address
 * ======================================================================== */

export interface BusinessAddress {
  /** Unit and street, as one line. */
  readonly street: string;
  /**
   * Just the street, with no unit or number. Prose and section headings use
   * this so "Tavistock Street" is never typed into a template.
   */
  readonly streetName: string;
  /** The outward code, e.g. the "MK2" people actually search for. */
  readonly outwardCode: string;
  /**
   * The neighbourhood within the post town. Kept separate from `locality` so
   * "Fenny Stratford" can be used as a local-SEO keyword on its own.
   */
  readonly dependentLocality: string;
  readonly locality: string;
  readonly region: string;
  readonly postcode: string;
  readonly country: string;
  /** ISO 3166-1 alpha-2, for schema.org `addressCountry`. */
  readonly countryCode: string;
  /** The whole address on one line, for footers and the contact page. */
  readonly formatted: string;
  /** Opens the Google Maps directions/search card for the workshop. */
  readonly directionsUrl: string;
  /**
   * `src` for the embedded map iframe on /contact/.
   *
   * This is the keyless `output=embed` form. The official Google Maps Embed
   * API would need an API key, and a key in a static site is a public key, so
   * the keyless form is the correct trade here. It is undocumented, so if the
   * map ever goes blank this URL is the first thing to check: the address
   * text is the only part that matters and it is derived from `formatted`.
   *
   * Loading this contacts Google and sets their cookies, so the map is behind
   * an explicit opt-in on the page. `directionsUrl` above always works without
   * it.
   */
  readonly mapEmbedUrl: string;
  /**
   * Towns and areas the business serves. Used for `areaServed` in the JSON-LD
   * and for local-search copy.
   */
  readonly areaServed: readonly string[];
}

/* ===========================================================================
 * Socials
 * ======================================================================== */

export type SocialPlatform = 'facebook' | 'google';

export interface SocialProfile {
  readonly id: string;
  /** Human-readable link text, e.g. for a footer list. */
  readonly label: string;
  readonly platform: SocialPlatform;
  readonly url: string;
  /** True for the account the client treats as primary on that platform. */
  readonly isPrimary: boolean;
}

/* ===========================================================================
 * Opening hours
 *
 * Modelled as a discriminated union so today's honest answer ("we don't know,
 * ring him") and real published hours are the SAME field with no schema change
 * and no downstream refactor. Consumers switch on `kind`.
 * ======================================================================== */

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

/** 24-hour `HH:MM`. */
export type TimeOfDay = `${number}${number}:${number}${number}`;

export interface OpeningInterval {
  readonly opens: TimeOfDay;
  readonly closes: TimeOfDay;
}

export type DayHours =
  | { readonly day: Weekday; readonly status: 'closed' }
  | {
      readonly day: Weekday;
      readonly status: 'open';
      /** One or more intervals, so a lunch-time close is expressible. */
      readonly intervals: readonly OpeningInterval[];
    };

export type BusinessHours =
  | {
      /** Hours are not published; contact is by arrangement. */
      readonly kind: 'byAppointment';
      /** Shown in the hours block in place of a timetable. */
      readonly message: string;
      readonly note: string;
    }
  | {
      /** Real published hours. */
      readonly kind: 'scheduled';
      readonly days: readonly DayHours[];
      /** Optional caveat shown under the timetable. */
      readonly note?: string;
    };

/* ===========================================================================
 * Services
 * ======================================================================== */

export interface Service {
  /** URL-safe id; also the anchor target on /services/. */
  readonly slug: string;
  /** Name exactly as it appears on the Google Business listing. */
  readonly name: string;
  /** One plain-English sentence. Never mentions a price. */
  readonly description: string;
}

/* ===========================================================================
 * The servicing plan
 * ======================================================================== */

export interface ServicingPlan {
  readonly title: string;
  /** Must be displayed next to the prices, not buried. */
  readonly partsCaveat: string;
  /** The 13 checklist points, in order, as written on the client's price card. */
  readonly points: readonly string[];
}

/* ===========================================================================
 * Pricing
 * ======================================================================== */

export interface PricingTier {
  readonly id: string;
  /** Short label for the card heading. */
  readonly name: string;
  /** Numeric amount, for JSON-LD and for any sorting. */
  readonly amount: number;
  readonly currency: 'GBP';
  /** Formatted for display. Never build this by hand in a template. */
  readonly displayPrice: string;
  /** Eligibility wording exactly as transcribed from the client's price card. */
  readonly eligibility: string;
  /** True for the tier most customers fall into (the adult bike). */
  readonly isMostCommon: boolean;
  /** Card eyebrow. A category, not a claim. */
  readonly category: string;
  /** Card heading: the kind of bike this tier covers. */
  readonly heading: string;
  /** Card sub-line: `eligibility` restated as a short phrase. */
  readonly summary: string;
  /**
   * Factual category badge on the emphasised card. Never "Most popular" or
   * "Best value" — the brief supports neither claim (AGENTS.md 2.1).
   */
  readonly badge?: string;
}

export interface Pricing {
  readonly tiers: readonly PricingTier[];
  /** Every tier includes the full servicing plan — say so next to the prices. */
  readonly includesNote: string;
  /** Anything outside the plan is quoted individually. No invented prices. */
  readonly customQuoteNote: string;
  /** Human-readable span of the published prices, e.g. for `priceRange`. */
  readonly priceRange: string;
  /**
   * The one factual line shown directly above the pricing grid, so a phone
   * visitor sees the number that applies to most of them at once. Composed
   * from the adult tier below, never typed twice.
   */
  readonly headlineStatement: string;
  /** The two plan highlights repeated on every pricing card. */
  readonly cardHighlights: readonly string[];
}

/* ===========================================================================
 * Reviews
 *
 * The aggregate is REAL and verified from the client's Google listing.
 * The individual testimonials are NOT — the Places API needs a key and a
 * server, which a static site does not have. They are typed as a discriminated
 * union on `isPlaceholder` so a template physically cannot render a fake quote
 * without being able to see that it is fake.
 * ======================================================================== */

export interface ReviewAggregate {
  /** Real: 5.0 on Google. */
  readonly ratingValue: number;
  /** Real: 85 reviews on Google. */
  readonly reviewCount: number;
  readonly bestRating: number;
  readonly worstRating: number;
  /** Where the aggregate comes from — link this out prominently. */
  readonly sourceUrl: string;
  readonly sourceLabel: string;
}

interface TestimonialBase {
  readonly id: string;
  readonly quote: string;
  /**
   * Attribution. For placeholders this is deliberately an initial plus a place
   * ("A. (Bletchley)") so no invented words are ever put in a real person's
   * mouth.
   */
  readonly attribution: string;
  readonly rating: number;
}

export interface PlaceholderTestimonial extends TestimonialBase {
  readonly isPlaceholder: true;
}

export interface VerifiedTestimonial extends TestimonialBase {
  readonly isPlaceholder: false;
  /** Only set once the client confirms permission to quote this reviewer. */
  readonly permissionGranted: true;
}

export type Testimonial = PlaceholderTestimonial | VerifiedTestimonial;

export interface Reviews {
  readonly aggregate: ReviewAggregate;
  readonly testimonials: readonly Testimonial[];
  /** Shown alongside placeholder testimonials so the page is never dishonest. */
  readonly placeholderDisclaimer: string;
}

/* ===========================================================================
 * About-page copy
 *
 * Prose, not visual language — docs/DESIGN_SYSTEM.md explicitly parks the
 * About story text here rather than in markup. Every sentence below is written
 * from a fact in docs/PROJECT_BRIEF.md. Nothing claims a qualification, a
 * number of years in the trade, or a biography the brief does not contain.
 * ======================================================================== */

export interface AboutContent {
  /** One lead sentence under the h1. */
  readonly lead: string;
  /** The story, as paragraphs. */
  readonly story: readonly string[];
  /** "Why local matters" block. */
  readonly whyLocal: readonly string[];
  /**
   * Credentials. FACTS ONLY. Anything unknown stays out of this array and
   * stays a TODO(client) below, rather than being filled with a guess.
   */
  readonly credentials: readonly string[];
}

/* ===========================================================================
 * The whole business
 * ======================================================================== */

export interface Business {
  readonly identity: BusinessIdentity;
  readonly contact: BusinessContact;
  readonly address: BusinessAddress;
  readonly socials: readonly SocialProfile[];
  readonly hours: BusinessHours;
  readonly services: readonly Service[];
  readonly servicingPlan: ServicingPlan;
  readonly pricing: Pricing;
  readonly reviews: Reviews;
  readonly about: AboutContent;
}

/* ===========================================================================
 * The data
 * ======================================================================== */

/** E.164 form, used to derive every contact link below. Verified: 07399 351272. */
const PHONE_E164 = '+447399351272';

/**
 * The workshop address, written once. Both the human-readable line and the two
 * Google Maps URLs derive from this, so the map can never point somewhere the
 * address does not.
 */
const FORMATTED_ADDRESS =
  'Unit 1, 75 Tavistock Street, Fenny Stratford, Bletchley, Milton Keynes, MK2 2PG';

/**
 * The three published prices, in ascending order — the order they appear on the
 * client's own price card, and the order they must appear in on the site.
 * Declared once here so the numeral is written exactly once in this repository.
 */
const PRICE_JUNIOR_SINGLE_SPEED = 40;
const PRICE_JUNIOR_GEARED = 45;
const PRICE_ADULT = 50;

/** Formats a whole-pound GBP amount for display. */
const gbp = (amount: number): string => `£${amount}`;

export const business: Business = {
  identity: {
    legalName: 'J.Michael & Co',
    tradingName:
      'Bletchley Bicycle Repairs, Servicing & Sales by J.Michael & Co',
    shortName: 'J.Michael & Co',
    spokenName: 'J.Michael and Co',
    logotypeStrapline: 'Bletchley Bicycle Repairs',
    ownerFirstName: 'Jimmy',
    shortDescription:
      'Bicycle repairs, servicing and sales in Bletchley, Milton Keynes. Rated 5.0 from 85 Google reviews.',
    longDescription:
      'J.Michael & Co is a one-man bicycle repair workshop in Fenny Stratford, Bletchley, serving riders across Milton Keynes. Every bike is serviced by Jimmy himself, to the same thorough checklist, whether it is a child’s first bike or an adult commuter. Call, text or WhatsApp anytime to arrange an appointment.',
    tagline: 'Qualified, experienced bicycle servicing in Bletchley.',
  },

  contact: {
    phoneDisplay: '07399 351272',
    phoneInternationalDisplay: '+44 7399 351272',
    phoneE164: PHONE_E164,
    telHref: `tel:${PHONE_E164}`,
    smsHref: `sms:${PHONE_E164}`,
    // wa.me takes the E.164 digits with no leading '+'.
    whatsAppHref: `https://wa.me/${PHONE_E164.replace('+', '')}`,
    email: 'jmichaelbicyclerepair@gmail.com',
    emailHref: 'mailto:jmichaelbicyclerepair@gmail.com',
    contactNote:
      'Phone, text or WhatsApp Jimmy anytime to arrange an appointment.',
  },

  address: {
    street: 'Unit 1, 75 Tavistock Street',
    streetName: 'Tavistock Street',
    outwardCode: 'MK2',
    dependentLocality: 'Fenny Stratford',
    locality: 'Bletchley',
    region: 'Milton Keynes',
    postcode: 'MK2 2PG',
    country: 'United Kingdom',
    countryCode: 'GB',
    formatted: FORMATTED_ADDRESS,
    directionsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      FORMATTED_ADDRESS,
    )}`,
    mapEmbedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(
      FORMATTED_ADDRESS,
    )}&z=15&hl=en&output=embed`,
    areaServed: ['Bletchley', 'Fenny Stratford', 'Milton Keynes'],
  },

  socials: [
    {
      id: 'facebook-primary',
      label: 'Facebook — J.Michael Bicycle Repair',
      platform: 'facebook',
      url: 'https://www.facebook.com/jmichaelbicyclerepair/',
      isPrimary: true,
    },
    {
      id: 'facebook-secondary',
      label: 'Facebook — Bletchley Bicycle Repair',
      platform: 'facebook',
      url: 'https://www.facebook.com/bletchleybicyclerepair',
      isPrimary: false,
    },
    {
      id: 'google-business',
      label: 'Google Business listing',
      platform: 'google',
      url: 'https://share.google/LNl3pH9Xo1517DFQA',
      isPrimary: true,
    },
  ],

  // TODO(client): opening hours and days are NOT known. Do not invent them.
  // When the client confirms them, replace this whole object with:
  //   { kind: 'scheduled', days: [ { day: 'monday', status: 'open',
  //       intervals: [{ opens: '09:00', closes: '17:00' }] }, ... ] }
  // Nothing downstream needs changing: consumers already switch on `kind`,
  // and the JSON-LD helper only emits `openingHoursSpecification` for
  // 'scheduled'.
  hours: {
    kind: 'byAppointment',
    message: 'Call or WhatsApp anytime to arrange an appointment',
    note: 'Opening hours are by arrangement — get in touch and Jimmy will fit you in.',
  },

  // The 13 services listed on the Google Business listing. Names are verbatim;
  // the one-sentence descriptions are plain-English explanations written for
  // this site. No prices are quoted in any of them.
  services: [
    {
      slug: 'bicycle-wash',
      name: 'Bicycle wash',
      description:
        'A proper clean and degrease so the bike looks right and worn parts are easier to spot.',
    },
    {
      slug: 'bike-assembly-and-disassembly',
      name: 'Bike assembly & disassembly',
      description:
        'Boxed or flat-packed bikes built up correctly and safety-checked, or stripped down for transport or storage.',
    },
    {
      slug: 'brake-adjustment',
      name: 'Brake adjustment',
      description:
        'Brakes set up, cables tensioned and pads aligned so they bite predictably and stop the bike properly.',
    },
    {
      slug: 'custom-bicycle-build',
      name: 'Custom bicycle build',
      description:
        'A bike built from the frame up around the parts and riding you want — message Jimmy to talk it through.',
    },
    {
      slug: 'derailleur-adjustment',
      name: 'Derailleur adjustment',
      description:
        'Front and rear derailleurs indexed and limit-screwed so the chain lands cleanly on every sprocket.',
    },
    {
      slug: 'gear-adjustment',
      name: 'Gear adjustment',
      description:
        'The whole gear system tuned end to end for crisp, quiet shifts under load.',
    },
    {
      slug: 'headset-adjustment',
      name: 'Headset adjustment',
      description:
        'Steering bearings adjusted to the correct tolerance to remove play and keep the front end tracking straight.',
    },
    {
      slug: 'lube-service',
      name: 'Lube service',
      description:
        'Chain, cables and moving parts cleaned and correctly lubricated to cut wear and stop the drivetrain running dry.',
    },
    {
      slug: 'safety-inspection',
      name: 'Safety inspection',
      description:
        'A methodical check of brakes, wheels, tyres, bearings and fixings to find anything unsafe before you ride.',
    },
    {
      slug: 'shock-service',
      name: 'Shock service',
      description:
        'Suspension checked and serviced so it moves freely and damps the way it should.',
    },
    {
      slug: 'tyre-tube-repair',
      name: 'Tyre/tube repair',
      description:
        'Punctures repaired, and worn tyres or tubes replaced, seated correctly and inflated to the right pressure.',
    },
    {
      slug: 'tune-up',
      name: 'Tune-up',
      description:
        'Brakes, gears, bearings and fixings brought back to good working order in one visit.',
    },
    {
      slug: 'wheel-alignment',
      name: 'Wheel alignment',
      description:
        'Wheels trued and spoke tension evened out so they run straight and stay strong.',
    },
  ],

  servicingPlan: {
    title: 'The Basic Yet Comprehensive & Thorough Servicing Plan',
    partsCaveat:
      'Please note: the cost of any parts and/or cleaning are charged separately.',
    points: [
      'F&R wheel positions, wheel bearings checked and adjusted to ideal tolerances',
      'Tyres checked for condition, correct seating, adjusted if necessary and inflated to correct pressures',
      'Wheels straightened/trued if necessary, spoke tension checked',
      'All brake and gear cables lubricated where access can be made',
      'All brake and gear systems meticulously set up for optimum performance',
      'Braking, drivetrain components & all nuts, bolts throughout the bike are checked and tightened to specification',
      'Steering (headset) bearings adjusted to correct tolerances',
      'Bottom bracket (BB) bearings adjusted to correct tolerances (un-sealed type)',
      'Handlebars, brake and gear levers checked for suitable riding position, adjusted if necessary',
      'Handlebar grips removed, cleaned and sanitised then re-fitted (N/A for road bikes fitted with handlebar tape)',
      'Bolts securing seat, seat post and accessories such as mudguards, lights, pannier racks etc are checked and secured correctly',
      'Test riding, finishing touches and last minute checks carried out',
      'Assistance loading and unloading bike from vehicle always gladly and carefully provided',
    ],
  },

  pricing: {
    // ASCENDING ORDER IS LOAD-BEARING. This array order is the DOM order and
    // the visual order at every breakpoint (docs/DESIGN_SYSTEM.md 4.8).
    tiers: [
      {
        id: 'junior-single-speed',
        name: 'Junior — single speed',
        amount: PRICE_JUNIOR_SINGLE_SPEED,
        currency: 'GBP',
        displayPrice: gbp(PRICE_JUNIOR_SINGLE_SPEED),
        eligibility:
          'Junior bike up to 20" wheel size, single speed — no gears',
        isMostCommon: false,
        category: 'Junior',
        heading: 'Junior bike, single speed',
        summary: 'up to 20" wheel size, no gears',
      },
      {
        id: 'junior-geared',
        name: 'Junior — geared',
        amount: PRICE_JUNIOR_GEARED,
        currency: 'GBP',
        displayPrice: gbp(PRICE_JUNIOR_GEARED),
        eligibility: 'Junior bike up to 24" with up to one set of gears',
        isMostCommon: false,
        category: 'Junior',
        heading: 'Junior bike with gears',
        summary: 'up to 24" wheel size, up to one set of gears',
      },
      {
        id: 'adult',
        name: 'Adult',
        amount: PRICE_ADULT,
        currency: 'GBP',
        displayPrice: gbp(PRICE_ADULT),
        eligibility: 'Adult bike with up to two sets of gears',
        // The tier most customers fall into, and the only adult tier. This is
        // why it is the emphasised card. It is NOT a popularity claim.
        isMostCommon: true,
        category: 'Adult',
        heading: 'Adult bike',
        summary: 'up to two sets of gears',
        badge: 'Adult bikes',
      },
    ],
    includesNote:
      'Every price includes the full servicing plan — all 13 points, on every bike.',
    customQuoteNote:
      'Repairs outside the servicing plan — punctures, wheel builds, custom builds — are quoted individually. Message Jimmy on WhatsApp for a quote.',
    priceRange: `${gbp(PRICE_JUNIOR_SINGLE_SPEED)}–${gbp(PRICE_ADULT)}`,
    headlineStatement: `Adult bikes with up to two sets of gears are ${gbp(PRICE_ADULT)}.`,
    // Both lines are condensed from the servicing plan above (points 1–11 and
    // point 12). They are summaries of the client's own wording, not new claims.
    cardHighlights: [
      'The full 13-point servicing plan',
      'Test ride, finishing touches and final checks',
    ],
  },

  reviews: {
    // Verified from the client's Google Business listing.
    aggregate: {
      ratingValue: 5.0,
      reviewCount: 85,
      bestRating: 5,
      worstRating: 1,
      sourceUrl: 'https://share.google/LNl3pH9Xo1517DFQA',
      sourceLabel: 'Google',
    },
    placeholderDisclaimer:
      'Read the real reviews on the Google listing — the quotes shown here are examples pending the client’s own selection.',
    // TODO(client): replace with real review text, and confirm permission to
    // quote each named reviewer (AGENTS.md section 8). Until then every entry
    // below is `isPlaceholder: true` and must be rendered as an obvious
    // placeholder — never presented as a genuine customer quote. The
    // attributions are initials plus a place on purpose: no invented words are
    // attributed to a real-sounding named person.
    testimonials: [
      {
        id: 'placeholder-1',
        isPlaceholder: true,
        quote:
          'PLACEHOLDER — replace with a real Google review. Example of the length and tone expected here.',
        attribution: 'A. (Bletchley)',
        rating: 5,
      },
      {
        id: 'placeholder-2',
        isPlaceholder: true,
        quote:
          'PLACEHOLDER — replace with a real Google review. Example of the length and tone expected here.',
        attribution: 'S. (Fenny Stratford)',
        rating: 5,
      },
      {
        id: 'placeholder-3',
        isPlaceholder: true,
        quote:
          'PLACEHOLDER — replace with a real Google review. Example of the length and tone expected here.',
        attribution: 'M. (Milton Keynes)',
        rating: 5,
      },
      {
        id: 'placeholder-4',
        isPlaceholder: true,
        quote:
          'PLACEHOLDER — replace with a real Google review. Example of the length and tone expected here.',
        attribution: 'J. (Bletchley)',
        rating: 5,
      },
    ],
  },

  // TODO(client): the two things this page would most like and does not have
  // are (a) Jimmy's exact qualifications and (b) how long he has been in the
  // trade. Both are on the open-questions list in AGENTS.md section 9. They are
  // deliberately ABSENT from `credentials` below rather than guessed at; when
  // the client answers, add them as new entries and the About page will render
  // them with no template change.
  about: {
    lead: 'J.Michael & Co is Jimmy. One mechanic, one workbench in Fenny Stratford, and the same thorough service on every bike that comes through the door.',
    story: [
      'Bletchley Bicycle Repairs, Servicing & Sales by J.Michael & Co is a one-man workshop on Tavistock Street in Fenny Stratford. There is no service desk and no rota of mechanics: Jimmy takes the booking, does the work, and hands the bike back himself.',
      'That is the whole reason the standard holds. Every bike gets the same servicing plan — the same 13 points, in the same order — whether it is a child’s first bike with 20 inch wheels or a geared adult commuter. Nothing is skipped because the bike was cheap, and nothing is added to the bill because it was not.',
      'It also keeps the arrangements simple. Phone, text or WhatsApp anytime and you are talking to the person who will actually be working on your bike, so you get a straight answer about what it needs and what it will cost before you commit to anything.',
    ],
    whyLocal: [
      'Bletchley, Fenny Stratford and the rest of Milton Keynes are full of bikes that need an hour of proper attention rather than a new part: a brake that has never really bitten, gears that have skipped since the day the bike was bought, bearings that have never once been adjusted. Caught early those are small jobs. Left alone they wear out the expensive components around them.',
      'A workshop you can walk or drive to in a few minutes is also a workshop that has to get it right. Jimmy sees the same customers again, and the rating on the Google listing is what that accountability looks like written down.',
      'If getting the bike into the car is the awkward part, say so when you get in touch. Help loading and unloading is part of the service, not a favour.',
    ],
    credentials: [
      'Every bike is serviced by Jimmy himself — one mechanic, one standard.',
      'The full 13-point servicing plan is carried out on every bike, at every price tier.',
      'Repairs, servicing and sales, including custom builds, wheel work and suspension.',
      'Appointments arranged directly by phone, text or WhatsApp — no booking system in between.',
    ],
  },
};

export default business;
