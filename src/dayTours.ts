import { Tour } from './types';

/**
 * Original Travision Tours day-tour catalog.
 * Kept separate from multi-day packages for filtering and presentation.
 */

/**
 * Day-tour card images.
 *
 * Every published day tour has an explicit destination-matched local asset.
 * Missing mappings still resolve to PLACEHOLDER_TOUR_IMAGE and log a
 * development warning instead of silently showing an unrelated destination.
 */
const PLACEHOLDER_TOUR_IMAGE = '/hero.jpg';

export const DAY_TOUR_IMAGES: Record<string, string> = {
  // Local, destination-matched photos.
  'cairo-day-tour': '/images/day-tours/cairo-day-tour.jpeg',
  'giza-pyramids-day-tour': '/images/day-tours/giza-pyramids-day-tour.jpeg',
  'luxor-day-tour': '/images/day-tours/luxor-day-tour.jpeg',
  'aswan-day-tour': '/images/day-tours/aswan-day-tour.jpeg',
  'abu-simbel-day-tour': '/images/day-tours/abu-simbel-day-tour.jpeg',
  'alexandria-day-tour': '/images/day-tours/alexandria-day-tour.jpeg',
  'old-cairo-day-tour': '/images/day-tours/old-cairo-day-tour.jpeg',
  'hurghada-day-tour': '/images/day-tours/hurghada-day-tour.jpeg',
  'sakkara-day-tour': '/images/day-tours/sakkara-day-tour.jpeg',
  'dahshur-day-tour': '/images/day-tours/dahshur-day-tour.jpeg',
  'egyptian-museum-day-tour': '/images/day-tours/egyptian-museum-day-tour.jpeg',
  'philae-temple-day-tour': '/images/day-tours/philae-temple-day-tour.jpeg',
  'valley-of-kings-day-tour': '/images/day-tours/valley-of-kings-day-tour.jpeg',
  'karnak-temple-day-tour': '/images/day-tours/karnak-temple-day-tour.jpeg',
  'nile-cruise-day-tour': '/images/day-tours/nile-cruise-day-tour.jpeg',

  'sharm-el-sheikh-day-tour': '/images/day-tours/sharm-el-sheikh-day-tour.jpeg',
  'marsa-alam-day-tour': '/images/day-tours/marsa-alam-day-tour.jpeg',
  'el-gouna-day-tour': '/images/day-tours/el-gouna-day-tour.jpeg',
  'makadi-bay-day-tour': '/images/day-tours/makadi-bay-day-tour.jpeg',
  'soma-bay-day-tour': '/images/day-tours/soma-bay-day-tour.jpeg',
  'port-ghalib-day-tour': '/images/day-tours/port-ghalib-day-tour.jpeg',
  'white-desert-day-tour': '/images/day-tours/white-desert-day-tour.jpeg'
};

/**
 * Resolve a day-tour image. A missing mapping is loud in development rather
 * than silently shipping an unrelated photo.
 */
const img = (id: string) => {
  const mapped = DAY_TOUR_IMAGES[id];
  if (mapped) return mapped;
  if (import.meta.env?.DEV) {
    console.warn(`[dayTours] No image mapped for "${id}". Falling back to the placeholder image.`);
  }
  return PLACEHOLDER_TOUR_IMAGE;
};

// ---------------------------------------------------------------------------
// DAY TOURS
// ---------------------------------------------------------------------------
export const DAY_TOURS: Tour[] = [
  {
    id: 'cairo-day-tour',
    title: 'Cairo Day Tour',
    description:
      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',
    price: 85,
    duration: '1 Day',
    location: 'Cairo',
    category: 'cultural',
    image: img('cairo-day-tour'),
    rating: 4.9,
    reviewsCount: 412,
    featured: true,
    highlights: ['Giza Pyramids', 'Great Sphinx', 'Egyptian Museum'],
  },
  {
    id: 'giza-pyramids-day-tour',
    title: 'Giza Pyramids Day Tour',
    description:
      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',
    price: 75,
    duration: '1 Day',
    location: 'Cairo, Giza',
    category: 'historical',
    image: img('giza-pyramids-day-tour'),
    rating: 4.9,
    reviewsCount: 388,
    featured: true,
    highlights: ['Great Pyramid of Khufu', 'Sphinx', 'Valley Temple', 'Optional camel ride'],
  },
  {
    id: 'luxor-day-tour',
    title: 'Luxor Day Tour',
    description:
      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',
    price: 110,
    duration: '1 Day',
    location: 'Luxor',
    category: 'historical',
    image: img('luxor-day-tour'),
    rating: 4.9,
    reviewsCount: 305,
    featured: true,
    highlights: ['Valley of the Kings', 'Hatshepsut Temple', 'Karnak Temple'],
  },
  {
    id: 'aswan-day-tour',
    title: 'Aswan Day Tour',
    description:
      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',
    price: 95,
    duration: '1 Day',
    location: 'Aswan',
    category: 'historical',
    image: img('aswan-day-tour'),
    rating: 4.8,
    reviewsCount: 214,
    highlights: ['High Dam', 'Unfinished Obelisk', 'Philae Temple'],
  },
  {
    id: 'abu-simbel-day-tour',
    title: 'Abu Simbel Day Tour',
    description:
      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',
    price: 165,
    duration: '1 Day',
    location: 'Aswan, Abu Simbel',
    category: 'historical',
    image: img('abu-simbel-day-tour'),
    rating: 4.9,
    reviewsCount: 268,
    featured: true,
    highlights: ['Great Temple of Ramses II', 'Temple of Nefertari', 'UNESCO rescue site'],
  },
  {
    id: 'alexandria-day-tour',
    title: 'Alexandria Day Tour',
    description:
      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',
    price: 120,
    duration: '1 Day',
    location: 'Alexandria',
    category: 'historical',
    image: img('alexandria-day-tour'),
    rating: 4.7,
    reviewsCount: 176,
    highlights: ['Bibliotheca Alexandrina', 'Qaitbay Citadel', 'Catacombs of Kom El Shoqafa'],
  },
  {
    id: 'old-cairo-day-tour',
    title: 'Old Cairo Day Tour',
    description:
      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',
    price: 70,
    duration: '1 Day',
    location: 'Cairo',
    category: 'cultural',
    image: img('old-cairo-day-tour'),
    rating: 4.7,
    reviewsCount: 142,
    highlights: ['Hanging Church', 'Coptic Museum', 'Ben Ezra Synagogue', 'Khan El Khalili'],
  },
  {
    id: 'hurghada-day-tour',
    title: 'Hurghada Day Tour',
    description:
      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',
    price: 90,
    duration: '1 Day',
    location: 'Hurghada',
    category: 'adventure',
    image: img('hurghada-day-tour'),
    rating: 4.6,
    reviewsCount: 198,
    highlights: ['Giftun Island snorkeling', 'Red Sea coral reefs'],
  },
  {
    id: 'sharm-el-sheikh-day-tour',
    title: 'Sharm El Sheikh Day Tour',
    description:
      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',
    price: 95,
    duration: '1 Day',
    location: 'Sharm El Sheikh',
    category: 'adventure',
    image: img('sharm-el-sheikh-day-tour'),
    rating: 4.6,
    reviewsCount: 154,
    highlights: ['Ras Mohammed National Park', 'Desert safari', 'Red Sea beaches'],
  },
  {
    id: 'marsa-alam-day-tour',
    title: 'Marsa Alam Day Tour',
    description:
      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',
    price: 100,
    duration: '1 Day',
    location: 'Marsa Alam',
    category: 'adventure',
    image: img('marsa-alam-day-tour'),
    rating: 4.7,
    reviewsCount: 121,
    highlights: ['Sataya Dolphin Reef', 'Samadai coral walls'],
  },
  {
    id: 'el-gouna-day-tour',
    title: 'El Gouna Day Tour',
    description:
      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',
    price: 85,
    duration: '1 Day',
    location: 'El Gouna',
    category: 'adventure',
    image: img('el-gouna-day-tour'),
    rating: 4.5,
    reviewsCount: 88,
    highlights: ['Lagoon boat trip', 'Island snorkeling'],
  },
  {
    id: 'makadi-bay-day-tour',
    title: 'Makadi Bay Day Tour',
    description:
      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',
    price: 80,
    duration: '1 Day',
    location: 'Makadi Bay',
    category: 'adventure',
    image: img('makadi-bay-day-tour'),
    rating: 4.5,
    reviewsCount: 76,
    highlights: ['House-reef snorkeling', 'Semi-submarine coral tour'],
  },
  {
    id: 'soma-bay-day-tour',
    title: 'Soma Bay Day Tour',
    description:
      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',
    price: 90,
    duration: '1 Day',
    location: 'Soma Bay',
    category: 'adventure',
    image: img('soma-bay-day-tour'),
    rating: 4.6,
    reviewsCount: 64,
    highlights: ['Tobia Islands snorkeling', 'Kitesurfing'],
  },
  {
    id: 'port-ghalib-day-tour',
    title: 'Port Ghalib Day Tour',
    description:
      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',
    price: 95,
    duration: '1 Day',
    location: 'Port Ghalib',
    category: 'adventure',
    image: img('port-ghalib-day-tour'),
    rating: 4.6,
    reviewsCount: 57,
    highlights: ['Marina coral safari', 'Snorkeling lagoons'],
  },
  {
    id: 'sakkara-day-tour',
    title: 'Sakkara & Memphis Day Tour',
    description:
      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',
    price: 70,
    duration: '1 Day',
    location: 'Cairo, Sakkara',
    category: 'historical',
    image: img('sakkara-day-tour'),
    rating: 4.8,
    reviewsCount: 133,
    highlights: ['Step Pyramid of Djoser', 'Memphis', 'Dahshur Pyramids'],
  },
  {
    id: 'dahshur-day-tour',
    title: 'Dahshur Pyramids Day Tour',
    description:
      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',
    price: 65,
    duration: '1 Day',
    location: 'Cairo, Dahshur',
    category: 'historical',
    image: img('dahshur-day-tour'),
    rating: 4.7,
    reviewsCount: 98,
    highlights: ['Bent Pyramid', 'Red Pyramid'],
  },
  {
    id: 'egyptian-museum-day-tour',
    title: 'Egyptian Museum Day Tour',
    description:
      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',
    price: 55,
    duration: '1 Day',
    location: 'Cairo',
    category: 'historical',
    image: img('egyptian-museum-day-tour'),
    rating: 4.8,
    reviewsCount: 187,
    highlights: ['Tutankhamun treasures', 'Royal Mummies Hall'],
  },
  {
    id: 'white-desert-day-tour',
    title: 'White Desert Day Tour',
    description:
      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',
    price: 130,
    duration: '1 Day',
    location: 'Bahariya, Western Desert',
    category: 'adventure',
    image: img('white-desert-day-tour'),
    rating: 4.9,
    reviewsCount: 144,
    highlights: ['White Desert chalk formations', 'Crystal Mountain', 'Black Desert'],
  },
  {
    id: 'philae-temple-day-tour',
    title: 'Philae Temple Day Tour',
    description:
      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',
    price: 60,
    duration: '1 Day',
    location: 'Aswan',
    category: 'historical',
    image: img('philae-temple-day-tour'),
    rating: 4.8,
    reviewsCount: 112,
    highlights: ['Philae Temple', 'Kiosk of Trajan'],
  },
  {
    id: 'valley-of-kings-day-tour',
    title: 'Valley of the Kings Day Tour',
    description:
      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',
    price: 75,
    duration: '1 Day',
    location: 'Luxor',
    category: 'historical',
    image: img('valley-of-kings-day-tour'),
    rating: 4.9,
    reviewsCount: 231,
    highlights: ['Royal tombs', 'Tomb of Tutankhamun'],
  },
  {
    id: 'karnak-temple-day-tour',
    title: 'Karnak Temple Day Tour',
    description:
      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',
    price: 65,
    duration: '1 Day',
    location: 'Luxor',
    category: 'historical',
    image: img('karnak-temple-day-tour'),
    rating: 4.8,
    reviewsCount: 178,
    highlights: ['Great Hypostyle Hall', 'Avenue of Sphinxes', 'Sacred Lake'],
  },
  {
    id: 'nile-cruise-day-tour',
    title: 'Nile Felucca Day Tour',
    description:
      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',
    price: 50,
    duration: '1 Day',
    location: 'Luxor, Aswan',
    category: 'cultural',
    image: img('nile-cruise-day-tour'),
    rating: 4.7,
    reviewsCount: 156,
    highlights: ['Traditional felucca sail', 'Nile sunset'],
  },
];

// ---------------------------------------------------------------------------
// MOST POPULAR BOOKING (the source page's "top 6" quick-reference table)
// ---------------------------------------------------------------------------
export const POPULAR_DAY_TOURS = [
  'cairo-day-tour',
  'giza-pyramids-day-tour',
  'luxor-day-tour',
  'aswan-day-tour',
  'abu-simbel-day-tour',
  'alexandria-day-tour',
];

// ---------------------------------------------------------------------------
// DESTINATIONS (the source page's "Check Your Day Tour by Destination" grid)
// Each destination filters the DAY_TOURS list by `location`.
// ---------------------------------------------------------------------------
export interface DayTourDestination {
  id: string;
  title: string;
  /** Substring(s) used to match a tour's `location` field. */
  match: string[];
  image: string;
}

export const DAY_TOUR_DESTINATIONS: DayTourDestination[] = [
  {
    id: 'cairo',
    title: 'Cairo',
    match: ['cairo', 'giza', 'sakkara', 'dahshur'],
    image: img('cairo-day-tour'),
  },
  {
    id: 'luxor',
    title: 'Luxor',
    match: ['luxor'],
    image: img('luxor-day-tour'),
  },
  {
    id: 'aswan',
    title: 'Aswan',
    match: ['aswan'],
    image: img('aswan-day-tour'),
  },
  {
    id: 'hurghada',
    title: 'Hurghada',
    match: ['hurghada'],
    image: img('hurghada-day-tour'),
  },
  {
    id: 'sharm-el-sheikh',
    title: 'Sharm El Sheikh',
    match: ['sharm'],
    image: img('sharm-el-sheikh-day-tour'),
  },
  {
    id: 'alexandria',
    title: 'Alexandria',
    match: ['alexandria'],
    image: img('alexandria-day-tour'),
  },
  {
    id: 'marsa-alam',
    title: 'Marsa Alam',
    match: ['marsa alam'],
    image: img('marsa-alam-day-tour'),
  },
  {
    id: 'el-gouna',
    title: 'El Gouna',
    match: ['el gouna'],
    image: img('el-gouna-day-tour'),
  },
  {
    id: 'makadi-bay',
    title: 'Makadi Bay',
    match: ['makadi'],
    image: img('makadi-bay-day-tour'),
  },
  {
    id: 'soma-bay',
    title: 'Soma Bay',
    match: ['soma bay'],
    image: img('soma-bay-day-tour'),
  },
];
