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
}

export interface Pricing {
  readonly tiers: readonly PricingTier[];
  /** Every tier includes the full servicing plan — say so next to the prices. */
  readonly includesNote: string;
  /** Anything outside the plan is quoted individually. No invented prices. */
  readonly customQuoteNote: string;
  /** Human-readable span of the published prices, e.g. for `priceRange`. */
  readonly priceRange: string;
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
}

/* ===========================================================================
 * The data
 * ======================================================================== */

/** E.164 form, used to derive every contact link below. Verified: 07399 351272. */
const PHONE_E164 = '+447399351272';

export const business: Business = {
  identity: {
    legalName: 'J.Michael & Co',
    tradingName:
      'Bletchley Bicycle Repairs, Servicing & Sales by J.Michael & Co',
    shortName: 'J.Michael & Co',
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
    dependentLocality: 'Fenny Stratford',
    locality: 'Bletchley',
    region: 'Milton Keynes',
    postcode: 'MK2 2PG',
    country: 'United Kingdom',
    countryCode: 'GB',
    formatted:
      'Unit 1, 75 Tavistock Street, Fenny Stratford, Bletchley, Milton Keynes, MK2 2PG',
    directionsUrl:
      'https://www.google.com/maps/search/?api=1&query=Unit+1,+75+Tavistock+Street,+Fenny+Stratford,+Milton+Keynes,+MK2+2PG',
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
    tiers: [
      {
        id: 'junior-single-speed',
        name: 'Junior — single speed',
        amount: 40,
        currency: 'GBP',
        displayPrice: '£40',
        eligibility:
          'Junior bike up to 20" wheel size, single speed — no gears',
        isMostCommon: false,
      },
      {
        id: 'junior-geared',
        name: 'Junior — geared',
        amount: 45,
        currency: 'GBP',
        displayPrice: '£45',
        eligibility: 'Junior bike up to 24" with up to one set of gears',
        isMostCommon: false,
      },
      {
        id: 'adult',
        name: 'Adult',
        amount: 50,
        currency: 'GBP',
        displayPrice: '£50',
        eligibility: 'Adult bike with up to two sets of gears',
        // The tier most customers fall into.
        isMostCommon: true,
      },
    ],
    includesNote:
      'Every price includes the full servicing plan — all 13 points, on every bike.',
    customQuoteNote:
      'Repairs outside the servicing plan — punctures, wheel builds, custom builds — are quoted individually. Message Jimmy on WhatsApp for a quote.',
    priceRange: '£40–£50',
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
};

export default business;
