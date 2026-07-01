import { Tour } from './types';

/**
 * Egypt day-tour catalog, sourced & curated from the egypttoursportal.com
 * "Egypt Day Tours & Excursions" lineup. Kept as a separate dataset from the
 * SAMPLE_TOURS packages so the Day Tours page has its own dedicated inventory.
 *
 * Each entry conforms to the existing `Tour` type so it can be rendered by the
 * same components (cards, TourDetails, ItineraryAccordion, etc.).
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
      'The essential one-day immersion into the Egyptian capital. Stand before the Pyramids of Giza and the Sphinx, then trace 5,000 years of civilization through the treasures of the Egyptian Museum — all in a single expertly-guided day.',
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
      'A focused half-or-full day at the last surviving wonder of the ancient world. Visit the Great Pyramid of Khufu, the Pyramid of Khafre, the Pyramid of Menkaure, the Valley Temple, and the Sphinx with an optional camel ride on the plateau.',
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
      'A complete day across both banks of the Nile in Luxor. Descend into the tombs of the Valley of the Kings, visit the terraced Temple of Hatshepsut, the Colossi of Memnon, and the colossal Karnak Temple complex.',
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
      'A relaxed day in Nubia\'s southern jewel. Visit the High Dam, the Unfinished Obelisk, and sail to the enchanting Philae Temple on its island — where the myth of Isis and Osiris comes to life.',
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
      'A once-in-a-lifetime day trip to the colossal temples of Ramses II at Abu Simbel — saved from the rising Nile by a legendary UNESCO rescue mission and guarded by four towering seated pharaohs.',
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
      'A full day in the great Mediterranean city of Alexander. Explore the modern Bibliotheca Alexandrina, the seaside Qaitbay Citadel, the Roman Catacombs of Kom El Shoqafa, and Pompey\'s Pillar.',
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
      'A journey through Egypt\'s layered faiths. Visit the Hanging Church and the Coptic Museum in Coptic Cairo, the Ben Ezra Synagogue, and the medieval mosques and bazaars of historic Islamic Cairo.',
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
      'A Red Sea day of sun and color. Snorkel the coral gardens of Giftun Island, swim in crystal-clear waters, or unwind on the beaches of one of Egypt\'s most beloved resort towns.',
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
      'A Sinai coast adventure. Snorkel or dive the world-famous Ras Mohammed National Park, ride a quad into the desert, and relax on the beaches of the Red Sea\'s premier resort city.',
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
      'A pristine Red Sea escape in the deep south. Snorkel with wild spinner dolphins at Sataya Reef, dive the coral walls of the Samadai Protectorate, and discover untouched marine life.',
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
      'A stylish Red Sea day in Egypt\'s lagoon city. Enjoy a boat trip to the islands, snorkel the outer reefs, and unwind in the canals and beaches of this purpose-built resort town.',
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
      'A relaxed Red Sea bay day. Snorkel the house reefs, sail on a semi-submarine to view the coral without getting wet, or take a family-friendly beach day on the sheltered Makadi coast.',
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
      'An upscale Red Sea day on a private peninsula. Snorkel or dive the pristine Tobia reefs, kitesurf the steady winds, or simply enjoy the unspoiled beaches of this premium resort enclave.',
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
      'A Mediterranean-style marina day on the southern Red Sea. Sail to the protected reefs, snorkel in turquoise lagoons, and enjoy the waterfront promenade of this modern resort marina.',
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
      'Step back to the dawn of pyramid-building. Visit the Step Pyramid of Djoser at Sakkara — the world\'s oldest stone monument — the ruined ancient capital of Memphis, and the Red and Bent Pyramids of Dahshur.',
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
      'A quieter, crowd-free pyramid experience. Visit the Bent Pyramid and the Red Pyramid of Sneferu — the first true smooth-sided pyramids — and explore a royal necropolis away from the Giza crowds.',
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
      'A deep dive into the world\'s greatest collection of ancient artifacts. Spend the day with the golden treasures of Tutankhamun, the Royal Mummies, and millennia of masterpieces in Tahrir Square.',
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
      'A surreal day trip into one of Egypt\'s most otherworldly landscapes. Cross the Black Desert, the Crystal Mountain, and the chalk formations of the White Desert — nature\'s own sculpture garden.',
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
      'A serene half-day sail to the island temple of Isis. Explore the beautifully relocated Philae Temple, the Kiosk of Trajan, and the sound-and-light story of the goddess Isis on Agilkia Island.',
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
      'A focused half-day at the most famous royal burial ground on Earth. Descend into decorated tombs of the New Kingdom pharaohs, including the option to visit the tomb of Tutankhamun.',
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
      'A full morning at the largest religious complex ever built. Walk the Avenue of Sphinxes, stand beneath the towering columns of the Hypostyle Hall, and explore the sacred lake of the Amun-Ra temple.',
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
      'A timeless day on the river. Sail the Nile aboard a traditional felucca, watch the sunset over the palm-fringed banks, and experience Egypt the way travelers have for thousands of years.',
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
