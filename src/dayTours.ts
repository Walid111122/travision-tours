import { Tour } from './types';

/**
 * Original Travision Tours day-tour catalog.
 * Kept separate from multi-day packages for filtering and presentation.
 */

// Image helper — single, themed source for every day-tour card image.
const UNSPLASH_IMAGES: Record<string, string> = {
  'cairo-day-tour': 'https://images.unsplash.com/photo-1572252017412-2df25d259e87?auto=format&fit=crop&q=80&w=800',
  'giza-pyramids-day-tour': 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&q=80&w=800',
  'luxor-day-tour': 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&q=80&w=800',
  'aswan-day-tour': 'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?auto=format&fit=crop&q=80&w=800',
  'abu-simbel-day-tour': 'https://images.unsplash.com/photo-1506466010722-395aa2bef877?auto=format&fit=crop&q=80&w=800',
  'alexandria-day-tour': 'https://images.unsplash.com/photo-1568322422390-0ec4dc2e8571?auto=format&fit=crop&q=80&w=800',
  'old-cairo-day-tour': 'https://images.unsplash.com/photo-1601569420042-3e28405d41df?auto=format&fit=crop&q=80&w=800',
  'hurghada-day-tour': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=800',
  'sharm-el-sheikh-day-tour': 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&q=80&w=800',
  'marsa-alam-day-tour': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
  'el-gouna-day-tour': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
  'makadi-bay-day-tour': 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&q=80&w=800',
  'soma-bay-day-tour': 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&q=80&w=800',
  'port-ghalib-day-tour': 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&q=80&w=800',
  'sakkara-day-tour': 'https://images.unsplash.com/photo-1608976328321-260aa72f416c?auto=format&fit=crop&q=80&w=800',
  'dahshur-day-tour': 'https://images.unsplash.com/photo-1629815049063-74fc3e30f53a?auto=format&fit=crop&q=80&w=800',
  'egyptian-museum-day-tour': 'https://images.unsplash.com/photo-1544850893-02e2c83ac58a?auto=format&fit=crop&q=80&w=800',
  'khan-el-khalili-day-tour': 'https://images.unsplash.com/photo-1582298538104-fe2e74c27f59?auto=format&fit=crop&q=80&w=800',
  'coptic-cairo-day-tour': 'https://images.unsplash.com/photo-1601569420042-3e28405d41df?auto=format&fit=crop&q=80&w=800',
  'islamic-cairo-day-tour': 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&q=80&w=800',
  'cairo-citadel-day-tour': 'https://images.unsplash.com/photo-1560242208-7260a0b22a0a?auto=format&fit=crop&q=80&w=800',
  'nile-dinner-cruise-cairo': 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&q=80&w=800',
  'sound-and-light-show-giza': 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&q=80&w=800',
  'west-bank-luxor-day-tour': 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&q=80&w=800',
  'east-bank-luxor-day-tour': 'https://images.unsplash.com/photo-1623877995180-2a829ba8ecab?auto=format&fit=crop&q=80&w=800',
  'valley-of-the-kings-day-tour': 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&q=80&w=800',
  'karnak-temple-day-tour': 'https://images.unsplash.com/photo-1623877995180-2a829ba8ecab?auto=format&fit=crop&q=80&w=800',
  'hatshepsut-temple-day-tour': 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&q=80&w=800',
  'dendera-temple-day-tour': 'https://images.unsplash.com/photo-1608976328321-260aa72f416c?auto=format&fit=crop&q=80&w=800',
  'abydos-temple-day-tour': 'https://images.unsplash.com/photo-1544850893-02e2c83ac58a?auto=format&fit=crop&q=80&w=800',
  'kom-ombo-edfu-day-tour': 'https://images.unsplash.com/photo-1560242208-7260a0b22a0a?auto=format&fit=crop&q=80&w=800',
  'philae-temple-day-tour': 'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?auto=format&fit=crop&q=80&w=800',
  'nubian-village-day-tour': 'https://images.unsplash.com/photo-1547983699-a2935406d229?auto=format&fit=crop&q=80&w=800',
  'kalabsha-temple-day-tour': 'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?auto=format&fit=crop&q=80&w=800',
  'st-simeon-monastery-day-tour': 'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?auto=format&fit=crop&q=80&w=800',
  'quad-bike-safari-giza': 'https://images.unsplash.com/photo-1565462214341-de046c827c1a?auto=format&fit=crop&q=80&w=800',
  'felucca-ride-nile-cairo': 'https://images.unsplash.com/photo-1547983699-a2935406d229?auto=format&fit=crop&q=80&w=800',
  'cairo-tower-day-trip': 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?auto=format&fit=crop&q=80&w=800',
  'al-azhar-park-cairo': 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&q=80&w=800',
  'cairo-shopping-tour': 'https://images.unsplash.com/photo-1582298538104-fe2e74c27f59?auto=format&fit=crop&q=80&w=800',
  'egyptian-food-tour-cairo': 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&q=80&w=800',
  'mummy-hall-national-museum': 'https://images.unsplash.com/photo-1544850893-02e2c83ac58a?auto=format&fit=crop&q=80&w=800',
  'grand-egyptian-museum-preview': 'https://images.unsplash.com/photo-1572252017412-2df25d259e87?auto=format&fit=crop&q=80&w=800'
};

const img = (id: string) =>
  UNSPLASH_IMAGES[id] || `https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&q=80&w=800`;

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
