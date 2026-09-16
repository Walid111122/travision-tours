/**
 * Sourced policy, logistics, child, and accommodation data.
 *
 * Every entry in this file traces to a page on the head/referral company's
 * website, Egypt Online Tour (https://egyptonlinetour.com), as documented in
 * HEAD_COMPANY_SOURCE_MATRIX.md. Facts are applied only where the source page
 * covers the same tour, destination, or booking category — never inferred from
 * a similar-sounding product.
 *
 * `match` records how closely the source product maps to the Travision tour:
 *  - 'exact'    — same route, duration, and product type
 *  - 'partial'  — overlapping scope; only the shared facts are listed
 *  - 'category' — no single source page; only the booking-category pattern that
 *                 Egypt Online Tour repeats across comparable products applies
 *
 * Tours with no reliable source have no entry, and the UI keeps the
 * "confirmed in your written quotation" fallback for them.
 */

import { PAYMENT_PARTNER_NAME } from './config/business';

// ---------------------------------------------------------------------------
// Reservation-specific policy model (owner decision — supersedes any universal
// child/hotel/cancellation assumption)
// ---------------------------------------------------------------------------

/**
 * The sentence the owner requires wherever general/default terms are shown.
 * There is no universal child, accommodation, or cancellation policy — the
 * personalized written quotation and policy PDF controls each booking.
 */
export const QUOTATION_CONTROLS_NOTE =
  'Final prices, payment deadlines, accommodation details, child policies, cancellation terms, refund conditions, and supplier rules are provided in the personalized written quotation and policy PDF before payment. The customer can review these conditions before choosing whether to proceed.';

/**
 * The reservation flow the website describes: every submission is an inquiry,
 * never a confirmed reservation. Confirmation happens only after the customer
 * has reviewed the written quotation/policy PDF and completed payment with the
 * operating partner.
 */
export const RESERVATION_FLOW = [
  'You send an inquiry with your dates, party, ages, and preferences.',
  `${PAYMENT_PARTNER_NAME} checks availability and current supplier conditions.`,
  'A personalized quotation and policy PDF is prepared and emailed to you before any payment.',
  'You review and accept the total price, hotels, child rules, cancellation terms, and other conditions.',
  `Payment is made directly to ${PAYMENT_PARTNER_NAME} by the method stated in your quotation.`,
  'Your reservation is confirmed in writing only after the quotation is accepted, payment requirements are completed, and the partner verifies payment.'
] as const;

/** Visible placeholders used in templates — never filled with assumptions. */
export const QUOTATION_PLACEHOLDER = 'To be confirmed for this quotation.';

// ---------------------------------------------------------------------------
// Partner standard terms (Egypt Online Tour /terms, accessed 2026-09-16)
// ---------------------------------------------------------------------------

export const PARTNER_TERMS = {
  /** Deposit required at booking, as a fraction of total tour cost. */
  depositPercent: 40,
  /** Final payment due this many days before departure. */
  balanceDueDaysBeforeDeparture: 30,
  /** Requests to change a confirmed booking after the deposit, per request. */
  alterationFeeUsd: 25,
  /** Written complaints must arrive within this many days after the tour ends. */
  complaintWindowDays: 15,
  /** Partner's stated response window for booking/modify/cancel requests. */
  responseHours: 48,
  /**
   * The partner's published standard cancellation schedule. A travel advisor
   * may state different terms per product — the written quotation governs.
   */
  cancellationTiers: [
    { daysBeforeDeparture: '22 days or more', refund: '100% refund of payments made' },
    { daysBeforeDeparture: '15–21 days', refund: '70% refund of payments made' },
    { daysBeforeDeparture: '8–14 days', refund: '50% refund of payments made' },
    { daysBeforeDeparture: '0–7 days', refund: 'No refund' }
  ]
} as const;

// ---------------------------------------------------------------------------
// Child policy (booking-form age bands used across egyptonlinetour.com)
// ---------------------------------------------------------------------------

export const CHILD_POLICY = {
  /** Age bands exactly as published on the partner's inquiry forms. */
  adultBand: { label: 'Adults', minAge: 12 },
  childBand: { label: 'Children', minAge: 1, maxAge: 11 },
  /**
   * The partner publishes no child discount percentage, infant rule, or
   * room-sharing rule on its current website, so pricing is confirmed per
   * reservation — child prices depend on ages, hotel child policy, room type,
   * and occupancy, and are stated in the written quotation and policy PDF.
   */
  pricingNote:
    'Child pricing, discounts, room sharing, and occupancy rules are set per reservation and stated in the personalized written quotation and policy PDF before payment.',
  /** Requests the partner's pages explicitly invite travellers to make. */
  requestable: [
    'Child meals and dietary requirements',
    'Mobility or accessibility considerations',
    'Child-friendly pacing on private tours'
  ],
  note: `Tours marked family-friendly by ${PAYMENT_PARTNER_NAME} welcome children; age-specific suitability and any restrictions are confirmed in the written quotation.`
} as const;

// ---------------------------------------------------------------------------
// Accommodation
// ---------------------------------------------------------------------------

/**
 * Accommodation preference options on the inquiry form — the vocabulary used
 * on the partner's customize page (Budget 3-star, Standard 4-star, Luxury
 * 5-star, Mixed, Flexible). Keep `value` in sync with the worker whitelist in
 * worker/booking.ts.
 */
export const ACCOMMODATION_PREFERENCES = [
  { value: 'budget-3-star', label: 'Budget — 3-star hotels' },
  { value: 'standard-4-star', label: 'Standard — 4-star hotels' },
  { value: 'luxury-5-star', label: 'Luxury — 5-star hotels' },
  { value: 'mixed', label: 'Mixed — a combination of levels' },
  { value: 'flexible', label: 'Flexible — recommend the best fit' }
] as const;

/**
 * The four package tiers the partner offers on package pages: the same
 * experiences at different accommodation levels. Category wording only — the
 * partner does not guarantee named hotels, and neither do we.
 */
export const ACCOMMODATION_TIERS = [
  'Standard',
  'Premium',
  'Luxury',
  'High End'
] as const;

export interface PackageAccommodation {
  /** Category-level description; no named properties are promised. */
  summary: string;
  /** Night-by-night breakdown where the source page states one. */
  nights: { place: string; nights: number; style: string }[];
  /** Extra sourced notes (check-in windows, cruise basis, etc.). */
  notes?: string[];
  sourceUrl: string;
}

export const PACKAGE_ACCOMMODATION: Record<string, PackageAccommodation> = {
  '6-days-cairo-luxor-aswan': {
    summary:
      'Five-star hotel accommodation throughout: two nights in Cairo, two nights in Luxor, and one night in Aswan, with daily hotel breakfast.',
    nights: [
      { place: 'Cairo', nights: 2, style: 'Five-star hotel, breakfast daily' },
      { place: 'Luxor', nights: 2, style: 'Five-star hotel, breakfast daily' },
      { place: 'Aswan', nights: 1, style: 'Five-star hotel, breakfast daily' }
    ],
    notes: [
      'Early hotel check-in and late check-out are not included and may carry an extra charge.',
      'Specific properties are confirmed in your written quotation; a comparable property may be substituted.'
    ],
    sourceUrl: 'https://egyptonlinetour.com/tours/6-days-cairo-luxor-aswan-abu-simbel-package'
  },
  '8-days-budget-egypt-complete-tour': {
    summary:
      'Three nights in a Cairo hotel with daily breakfast, plus four nights full-board on a five-star Superior Nile cruise.',
    nights: [
      { place: 'Cairo', nights: 3, style: 'Hotel, breakfast daily' },
      { place: 'Nile cruise', nights: 4, style: 'Five-star Superior cruise, full board' }
    ],
    notes: [
      'Hotel check-in is typically after 2:00 PM and check-out before 12:00 noon; early or late use of the room can incur a half-day or full-day charge.',
      'Specific properties and vessels are confirmed in your written quotation; a comparable option may be substituted.'
    ],
    sourceUrl: 'https://egyptonlinetour.com/tours/8-days-pyramids-the-nile-by-air'
  }
};

// ---------------------------------------------------------------------------
// Per-tour logistics
// ---------------------------------------------------------------------------

export type LogisticsMatch = 'exact' | 'partial' | 'category';

export interface TourLogistics {
  match: LogisticsMatch;
  /** Egypt Online Tour page the facts came from (traceability, not rendered). */
  sourceUrl: string;
  availability?: string;
  pickup?: string;
  durationNote?: string;
  basis?: 'private' | 'shared';
  guide?: string;
  transport?: string;
  /**
   * Inclusions stated on the source page. When present, the tour page prefers
   * these over the generic "itemized in your quotation" placeholder list.
   */
  inclusions?: string[];
  exclusions?: string[];
  /** Extra sourced operational notes worth showing the visitor. */
  notes?: string[];
  /** Sourced child/family note where the source states one. */
  childNote?: string;
}

export const TOUR_LOGISTICS: Record<string, TourLogistics> = {
  // -- Exact matches ------------------------------------------------------

  'pyramids-tour-from-cairo-airport': {
    match: 'exact',
    sourceUrl: 'https://egyptonlinetour.com/tours/cairo-layover-tour',
    availability: 'Daily — arranged around your flight schedule',
    pickup: 'Pickup and drop-off at Cairo International Airport',
    durationNote: 'About 6–12 hours, matched to your layover window',
    basis: 'private',
    guide: 'English-speaking Egyptologist guide',
    transport: 'Private air-conditioned vehicle',
    inclusions: [
      'Airport pickup and return transfers in a private air-conditioned vehicle',
      'English-speaking Egyptologist guide',
      'Admission tickets to the listed attractions',
      'Applicable taxes and service charges'
    ],
    exclusions: [
      'Egypt entry visa',
      'Personal expenses and gratuities',
      'Anything not listed as included'
    ]
  },

  'day-trip-to-giza-pyramids-from-cairo': {
    match: 'exact',
    sourceUrl: 'https://egyptonlinetour.com/tours/pyramids-and-saqqara-day-tour-in-cairo',
    availability: 'Daily',
    pickup: 'Hotel pickup and drop-off in Cairo',
    basis: 'private',
    guide: 'Professional Egyptology guide',
    transport: 'Modern private air-conditioned car or van',
    inclusions: [
      'Hotel pickup and drop-off',
      'Private air-conditioned transport',
      'Professional Egyptology guide',
      'Admission fees for the itinerary attractions',
      'Applicable taxes and service charges'
    ],
    exclusions: [
      'Egypt entry visa',
      'Personal expenses and optional purchases',
      'Tips and gratuities'
    ]
  },

  'giza-pyramids-day-tour': {
    match: 'exact',
    sourceUrl: 'https://egyptonlinetour.com/tours/exciting-private-day-trip-of-giza',
    availability: 'Daily',
    pickup: 'Pickup and drop-off at your hotel in Cairo or Giza',
    durationNote: 'Typical day runs about 8:00 AM to 4:00 PM',
    basis: 'private',
    guide: 'English-speaking Egyptologist guide',
    transport: 'Private air-conditioned vehicle',
    inclusions: [
      'Hotel pickup and drop-off',
      'Private air-conditioned vehicle',
      'Professional English-speaking Egyptologist guide',
      'Entrance fees to the mentioned sites',
      'Bottled water during the tour'
    ],
    exclusions: [
      'Personal expenses',
      'Tipping (optional)',
      'Entry inside the pyramids — an optional extra ticket',
      'Travel insurance'
    ],
    notes: [
      'Entry inside the Great Pyramid uses a separate ticket when available; passages are narrow, steep, warm, and enclosed — mention mobility, breathing, or claustrophobia concerns before requesting it.',
      'Guides do not accompany visitors inside the pyramids.',
      'A camel ride across the Giza Plateau can be arranged as an optional extra.'
    ]
  },

  'aswan-day-tour': {
    match: 'exact',
    sourceUrl: 'https://egyptonlinetour.com/tours/philae-temple-high-dam-and-obelisk-private-tour',
    availability: 'Daily',
    pickup: 'Pickup and drop-off at your Aswan hotel',
    basis: 'private',
    guide: 'Private guide',
    transport: 'Private air-conditioned car',
    inclusions: [
      'Hotel pickup and drop-off in Aswan',
      'Private air-conditioned transport',
      'Private guided visit',
      'Entry fees for the listed sites',
      'Applicable taxes and service charges'
    ],
    exclusions: [
      'Tips and personal expenses',
      'Lunch — available as an optional addition'
    ]
  },

  'abu-simbel-day-tour': {
    match: 'exact',
    sourceUrl: 'https://egyptonlinetour.com/tours/private-tour-to-abu-simbel-from-aswan-by-car',
    availability: 'Daily',
    pickup: 'Pickup from your Aswan hotel; drop-off at your hotel or Nile cruise',
    basis: 'private',
    guide: 'Private guide',
    transport: 'Private air-conditioned vehicle',
    inclusions: [
      'Hotel pickup and drop-off in Aswan',
      'Private air-conditioned transport',
      'Private guide',
      'Entry tickets',
      'Applicable taxes and service fees'
    ],
    exclusions: [
      'Personal expenses',
      'Additional services not listed as included'
    ],
    childNote: 'Listed as family-friendly on the partner page.'
  },

  'alexandria-day-tour': {
    match: 'exact',
    sourceUrl: 'https://egyptonlinetour.com/tours/alexandria-archeological-day-tour-top-sites',
    availability: 'Daily',
    pickup: 'Hotel pickup and drop-off',
    basis: 'private',
    guide: 'Expert guide',
    transport: 'Air-conditioned transport',
    inclusions: [
      'Hotel pickup and drop-off',
      'Private air-conditioned transport',
      'Expert guide'
    ],
    notes: [
      'The partner itinerary covers the Catacombs, Roman Amphitheatre, Pompey’s Pillar, Bibliotheca Alexandrina, Qaitbay Citadel, Montazah Gardens, and Stanley Bridge.'
    ]
  },

  'old-cairo-day-tour': {
    match: 'exact',
    sourceUrl: 'https://egyptonlinetour.com/tours/old-cairo-tour',
    availability: 'Daily',
    pickup: 'Pickup and drop-off at your Cairo hotel',
    basis: 'private',
    guide: 'English-speaking tour guide',
    transport: 'Modern air-conditioned vehicle',
    inclusions: [
      'Hotel pickup and drop-off',
      'Modern air-conditioned vehicle for the entire trip',
      'Expert English-speaking tour guide',
      'Entrance fees to the listed attractions',
      'Mineral water during the excursion',
      'All applicable taxes and service charges'
    ],
    exclusions: [
      'Personal expenses such as souvenirs',
      'Optional gratuities for guide and driver',
      'Travel insurance',
      'Any extras not specified in the itinerary'
    ]
  },

  'white-desert-day-tour': {
    match: 'exact',
    sourceUrl: 'https://egyptonlinetour.com/tours/day-trip-to-white-desert',
    pickup: 'Pickup from and drop-off at your hotel',
    basis: 'private',
    transport: 'Private air-conditioned vehicle plus a 4×4 jeep with a desert captain for the desert section',
    inclusions: [
      'Hotel pickup and drop-off',
      'Private air-conditioned vehicle and 4×4 desert jeep',
      'National park entrance fees',
      'Lunch during the tour',
      'Cold water during the day and dinner on the return drive'
    ],
    exclusions: [
      'Personal expenses',
      'Travel insurance'
    ],
    notes: [
      'The route takes in the Black Desert, Cold Spring, Crystal Mountain, Agabat Valley, and the New White Desert, ending with the desert sunset.',
      'Desert terrain means long off-road driving — tell us about back, mobility, or motion-sickness concerns before booking.'
    ]
  },

  // -- Partial matches ----------------------------------------------------

  'cairo-day-tour': {
    match: 'category',
    sourceUrl: 'https://egyptonlinetour.com/tours/exciting-private-day-trip-of-giza',
    availability: 'Daily',
    pickup: 'Hotel pickup and drop-off in Cairo or Giza',
    basis: 'private',
    guide: 'English-speaking Egyptologist guide',
    transport: 'Private air-conditioned vehicle'
  },

  'tour-to-giza-pyramids-old-cairo': {
    match: 'category',
    sourceUrl: 'https://egyptonlinetour.com/tours/exciting-private-day-trip-of-giza',
    availability: 'Daily',
    pickup: 'Hotel pickup and drop-off in Cairo or Giza',
    basis: 'private',
    guide: 'English-speaking Egyptologist guide',
    transport: 'Private air-conditioned vehicle'
  },

  'luxor-day-tour': {
    match: 'category',
    sourceUrl: 'https://egyptonlinetour.com/tours/luxor-west-bank-tour-private-day-trip',
    availability: 'Daily',
    pickup: 'Pickup and drop-off at your Luxor hotel or Nile cruise',
    basis: 'private',
    guide: 'Licensed Egyptologist guide',
    transport: 'Private air-conditioned vehicle',
    notes: [
      'West Bank sightseeing typically starts early — around 5:00 AM in the source itinerary — to beat the heat.'
    ]
  },

  'valley-of-kings-day-tour': {
    match: 'partial',
    sourceUrl: 'https://egyptonlinetour.com/tours/luxor-west-bank-tour-private-day-trip',
    availability: 'Daily',
    pickup: 'Pickup and drop-off at your Luxor hotel or Nile cruise',
    basis: 'private',
    guide: 'Licensed Egyptologist guide',
    transport: 'Private air-conditioned vehicle',
    notes: [
      'The standard Valley of the Kings ticket covers selected open tombs; famous tombs such as Tutankhamun, Seti I, and Ramesses V/VI require separate tickets.',
      'Early-morning departures (around 5:00 AM) are typical for the West Bank.',
      'Some tombs have steep stairs, narrow passages, and warm interiors — mention mobility, breathing, or claustrophobia concerns when inquiring.'
    ]
  },

  'karnak-temple-day-tour': {
    match: 'partial',
    sourceUrl: 'https://egyptonlinetour.com/tours/tour-of-the-east-bank-in-luxor-private-trip',
    availability: 'Daily',
    pickup: 'Pickup and drop-off at your Luxor hotel or Nile cruise',
    basis: 'private',
    guide: 'Private Egyptologist guide',
    transport: 'Private air-conditioned vehicle',
    notes: [
      'Meals and drinks are not included on the partner’s East Bank trip; optional upgrades can be arranged.'
    ]
  },

  'philae-temple-day-tour': {
    match: 'partial',
    sourceUrl: 'https://egyptonlinetour.com/tours/philae-temple-high-dam-and-obelisk-private-tour',
    availability: 'Daily',
    pickup: 'Pickup and drop-off at your Aswan hotel',
    basis: 'private',
    guide: 'Private guide',
    transport: 'Private air-conditioned car',
    notes: [
      'Philae Temple sits on an island and is reached by motorboat — the crossing is part of the visit.'
    ]
  },

  'egyptian-museum-day-tour': {
    match: 'partial',
    sourceUrl: 'https://egyptonlinetour.com/tours/egyptian-museum-citadel',
    pickup: 'Hotel pickup and return',
    basis: 'private',
    guide: 'Expert tour guide',
    transport: 'Modern air-conditioned van',
    inclusions: [
      'Modern air-conditioned vehicle',
      'Entrance fees to the sites in the program',
      'Expert tour guide',
      'All service charges and taxes'
    ],
    exclusions: ['Tipping']
  },

  'sakkara-day-tour': {
    match: 'category',
    sourceUrl: 'https://egyptonlinetour.com/tours/giza-pyramids-and-sakkara-tour',
    availability: 'Daily',
    pickup: 'Hotel pickup and return in Cairo',
    basis: 'private',
    guide: 'Licensed professional Egyptologist guide',
    transport: 'Modern air-conditioned vehicle',
    notes: [
      'Optional experiences such as camel rides or pyramid-interior entry carry separate fees.'
    ]
  },

  'sharm-el-sheikh-day-tour': {
    match: 'partial',
    sourceUrl: 'https://egyptonlinetour.com/tours/ras-mohamed-boat-trip-white-island',
    availability: 'Daily',
    pickup: 'Pickup and drop-off at your Sharm El Sheikh hotel',
    basis: 'private',
    guide: 'Professional English-speaking tour guide',
    transport: 'Air-conditioned transfer to the marina, then boat',
    inclusions: [
      'Hotel pickup and drop-off in Sharm El Sheikh',
      'Air-conditioned transfers to and from the marina',
      'Professional English-speaking tour guide',
      'Ras Mohamed National Park entrance tickets',
      'Snorkelling essentials — mask, fins, and life jacket',
      'Lunch served on board',
      'Water and soft drinks during the trip',
      'All taxes and service charges'
    ],
    exclusions: [
      'Optional activities or services not mentioned in the program',
      'Personal expenses and tipping',
      'Visa fees',
      'International or domestic flight tickets'
    ],
    notes: [
      'These logistics describe the partner’s Ras Mohamed boat trip; a desert-safari component is not covered by that source.'
    ]
  },

  // -- Package-level logistics --------------------------------------------

  'pkg-7-5-days-cairo--luxor---abu-simbel-tour': {
    match: 'exact',
    sourceUrl: 'https://egyptonlinetour.com/tours/5-days-cairo-luxor-abu-simbel-tour',
    pickup: 'Airport meet-and-assist on arrival, with private transfers throughout',
    basis: 'private',
    guide: 'Private Egyptologist guides',
    transport: 'Private air-conditioned vehicles, domestic flights, and a first-class train between Aswan and Luxor',
    inclusions: [
      'Airport meet-and-assist and private transfers',
      'Domestic flights (Cairo–Aswan and Luxor–Cairo)',
      'First-class train between Aswan and Luxor',
      'Private Egyptologist-guided sightseeing',
      'Entry fees for the listed sites',
      'Breakfast box for the early Abu Simbel departure when needed'
    ],
    exclusions: [
      'International flights',
      'Egypt entry visa',
      'Travel insurance',
      'Tips and personal expenses',
      'Entry inside the Great Pyramid and special tomb tickets',
      'Early hotel check-in or late check-out'
    ],
    notes: [
      'The Abu Simbel day starts before sunrise — the temples are several hours by road each way from Aswan.',
      'Pyramid interiors have narrow, steep, warm passages — flag mobility, breathing, or claustrophobia concerns before requesting interior tickets.'
    ]
  },

  '6-days-cairo-luxor-aswan': {
    match: 'exact',
    sourceUrl: 'https://egyptonlinetour.com/tours/6-days-cairo-luxor-aswan-abu-simbel-package',
    pickup: 'Meet-and-assist at Cairo International Airport; private airport transfers throughout',
    basis: 'private',
    guide: 'Licensed Egyptologist guides',
    transport: 'Private air-conditioned transport, domestic flights (Cairo–Luxor and Aswan–Cairo), and a first-class train between Luxor and Aswan',
    inclusions: [
      'Meet-and-assist service at Cairo International Airport',
      'Private airport arrival and departure transfers',
      'Domestic flights (Cairo–Luxor and Aswan–Cairo)',
      'First-class train ticket between Luxor and Aswan',
      'Private tours with licensed Egyptologists',
      'Standard entrance fees for the listed sites',
      'Private round-trip transportation between Aswan and Abu Simbel',
      'Motorboat crossing in Luxor and motorboat transfer to Philae Temple',
      'Nile dinner cruise in Cairo',
      'Daily hotel breakfast and lunch on the listed sightseeing days',
      'Breakfast box for early departures when needed',
      'Service charges, applicable taxes, and local support during the tour'
    ],
    exclusions: [
      'International flights',
      'Egypt entry visa',
      'Travel insurance',
      'Drinks during meals',
      'Optional tours',
      'Personal expenses',
      'Entry inside the Great Pyramid and special tomb tickets in the Valley of the Kings',
      'Early hotel check-in and late check-out',
      'Tips and gratuities'
    ],
    notes: [
      'Share any food allergy, vegetarian request, or child meal need before booking.',
      'The Valley of the Kings standard ticket covers selected open tombs; special tombs require separate tickets.'
    ]
  },

  '8-days-budget-egypt-complete-tour': {
    match: 'exact',
    sourceUrl: 'https://egyptonlinetour.com/tours/8-days-pyramids-the-nile-by-air',
    pickup: 'Airport meet-and-greet on arrival; private transfers between airports, hotels, and the cruise',
    basis: 'private',
    guide: 'English-speaking tour guide throughout',
    transport: 'Private air-conditioned vehicles plus EgyptAir domestic flights between Cairo, Luxor, and Aswan',
    inclusions: [
      'Airport meet-and-greet and all transfers in private air-conditioned vehicles',
      'EgyptAir domestic flight tickets between Cairo, Luxor, and Aswan',
      'Admission costs for the sites in the itinerary',
      'Private sightseeing in Cairo and the scheduled cruise excursions',
      'An English-speaking guide while travelling',
      'Meals as specified in the schedule',
      'One bottle of water per person each day',
      'Portage when necessary, plus all taxes and service fees'
    ],
    exclusions: [
      'International airfare',
      'Optional tours',
      'Entrance fees for personal extras not listed',
      'Tipping'
    ],
    notes: [
      'The Egypt entry visa is listed as included on this particular partner product — your written quotation confirms whether it applies to yours.',
      'The cruise section typically covers Luxor, Edfu, Kom Ombo, and Aswan sightseeing between sailing days.'
    ]
  },

  '12-days-family-egypt-red-sea-holiday': {
    match: 'partial',
    sourceUrl: 'https://egyptonlinetour.com/tours/12-days-luxury-cairo-the-nile-red-sea',
    basis: 'private',
    guide: 'Tour leader during excursions',
    transport: 'Air-conditioned cars for all transfers plus domestic flights between Cairo, Aswan, and Hurghada',
    notes: [
      'The comparable partner package combines Cairo hotel nights, a full-board five-star Nile cruise, and Hurghada resort nights with domestic flights.',
      'Its Hurghada segment includes guided diving/snorkelling days with equipment, lunch, and soft drinks; your package’s Red Sea arrangements are confirmed in the written quotation.'
    ]
  },

  '15-days-marvelous-egypt-tour-package': {
    match: 'partial',
    sourceUrl: 'https://egyptonlinetour.com/tours/15-days-marvelous-tour-package-in-egypt',
    basis: 'private',
    notes: [
      'The partner sells packages in four accommodation tiers — Standard, Premium, Luxury, and High End — with the same experiences at different hotel levels. Your quotation states the tier and properties.',
      'The partner version of this itinerary is a group trip using a Dahabiya cruise and a Fayoum desert day; Travision’s version is private and includes Hurghada — the two are not interchangeable.'
    ]
  }
};

/** Sourced logistics for a tour, if a reliable source page exists. */
export function getTourLogistics(tourId: string): TourLogistics | undefined {
  return TOUR_LOGISTICS[tourId];
}

/** Sourced accommodation detail for a package, if one exists. */
export function getPackageAccommodation(tourId: string): PackageAccommodation | undefined {
  return PACKAGE_ACCOMMODATION[tourId];
}
