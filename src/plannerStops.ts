/**
 * Planner landmark catalog.
 *
 * Shared by the itinerary planner UI and the booking Worker. The Worker
 * resolves stop titles and locations from this list rather than trusting
 * client-supplied text, and rejects unknown stop IDs.
 */

export type PlannerRegionId = 'cairo-giza' | 'luxor' | 'aswan' | 'alexandria' | 'redsea';

export interface PlannerStop {
  id: string;
  title: string;
  location: string;
  type: 'historical' | 'leisure' | 'hidden';
  region: PlannerRegionId;
}

export const PLANNER_REGIONS: { id: 'all' | PlannerRegionId; name: string }[] = [
  { id: 'all', name: 'All' },
  { id: 'cairo-giza', name: 'Cairo/Giza' },
  { id: 'luxor', name: 'Luxor' },
  { id: 'aswan', name: 'Aswan/Abu Simbel' },
  { id: 'alexandria', name: 'Alexandria' },
  { id: 'redsea', name: 'Red Sea' }
];

export const PLANNER_STOPS: PlannerStop[] = [
  // Cairo & Giza
  { id: '1', title: 'Pyramids of Giza', location: 'Giza', type: 'historical', region: 'cairo-giza' },
  { id: '2', title: 'Great Sphinx', location: 'Giza', type: 'historical', region: 'cairo-giza' },
  { id: '3', title: 'Grand Egyptian Museum', location: 'Giza', type: 'historical', region: 'cairo-giza' },
  { id: '4', title: 'Egyptian Museum in Tahrir', location: 'Cairo', type: 'historical', region: 'cairo-giza' },
  { id: '5', title: 'National Museum of Civilization', location: 'Cairo', type: 'historical', region: 'cairo-giza' },
  { id: '6', title: 'Salah El-Din Citadel', location: 'Cairo', type: 'historical', region: 'cairo-giza' },
  { id: '7', title: 'Khan el-Khalili Bazaar', location: 'Old Cairo', type: 'leisure', region: 'cairo-giza' },
  { id: '8', title: 'Al-Muizz Street', location: 'Old Cairo', type: 'historical', region: 'cairo-giza' },
  { id: '9', title: 'Hanging Church', location: 'Old Cairo', type: 'historical', region: 'cairo-giza' },
  { id: '10', title: 'Ben Ezra Synagogue', location: 'Old Cairo', type: 'historical', region: 'cairo-giza' },
  { id: '11', title: 'Cave Church of St. Simon', location: 'Mokattam', type: 'hidden', region: 'cairo-giza' },
  { id: '12', title: 'Al-Azhar Park', location: 'Cairo', type: 'leisure', region: 'cairo-giza' },
  { id: '13', title: 'Baron Empain Palace', location: 'Heliopolis', type: 'historical', region: 'cairo-giza' },

  // Luxor
  { id: '14', title: 'Valley of the Kings', location: 'Luxor', type: 'historical', region: 'luxor' },
  { id: '15', title: 'Karnak Temple Complex', location: 'Luxor', type: 'historical', region: 'luxor' },
  { id: '16', title: 'Luxor Temple', location: 'Luxor', type: 'historical', region: 'luxor' },
  { id: '17', title: 'Temple of Hatshepsut', location: 'Luxor', type: 'historical', region: 'luxor' },
  { id: '18', title: 'Colossi of Memnon', location: 'Luxor', type: 'historical', region: 'luxor' },
  { id: '19', title: 'Tomb of Nefertari', location: 'Luxor', type: 'historical', region: 'luxor' },
  { id: '20', title: 'Medinet Habu Temple', location: 'Luxor', type: 'historical', region: 'luxor' },
  { id: '21', title: 'Luxor Museum', location: 'Luxor', type: 'historical', region: 'luxor' },

  // Aswan & Nile
  { id: '22', title: 'Abu Simbel Temples', location: 'Abu Simbel', type: 'historical', region: 'aswan' },
  { id: '23', title: 'Philae Temple Complex', location: 'Aswan', type: 'historical', region: 'aswan' },
  { id: '24', title: 'Unfinished Obelisk', location: 'Aswan', type: 'historical', region: 'aswan' },
  { id: '25', title: 'Aswan High Dam', location: 'Aswan', type: 'historical', region: 'aswan' },
  { id: '26', title: 'Nubian Village Voyage', location: 'Aswan', type: 'leisure', region: 'aswan' },
  { id: '27', title: 'Temple of Kom Ombo', location: 'Kom Ombo', type: 'historical', region: 'aswan' },
  { id: '28', title: 'Temple of Edfu', location: 'Edfu', type: 'historical', region: 'aswan' },

  // Alexandria
  { id: '29', title: 'Bibliotheca Alexandrina', location: 'Alexandria', type: 'historical', region: 'alexandria' },
  { id: '30', title: 'Citadel of Qaitbay', location: 'Alexandria', type: 'historical', region: 'alexandria' },
  { id: '31', title: 'Catacombs of Kom El Shoqafa', location: 'Alexandria', type: 'historical', region: 'alexandria' },
  { id: '32', title: "Pompey's Pillar", location: 'Alexandria', type: 'historical', region: 'alexandria' },
  { id: '33', title: 'Montaza Palace Gardens', location: 'Alexandria', type: 'leisure', region: 'alexandria' },

  // Red Sea & Sinai
  { id: '34', title: 'Giftun Island Snorkeling', location: 'Hurghada', type: 'leisure', region: 'redsea' },
  { id: '35', title: 'Ras Mohammed Park', location: 'Sharm El Sheikh', type: 'leisure', region: 'redsea' },
  { id: '36', title: "St. Catherine's Monastery", location: 'Sinai', type: 'historical', region: 'redsea' },
  { id: '37', title: 'Sataya Dolphin Reef', location: 'Marsa Alam', type: 'leisure', region: 'redsea' },
  { id: '38', title: 'Dahab Blue Hole', location: 'Dahab', type: 'leisure', region: 'redsea' }
];

const STOP_BY_ID = new Map(PLANNER_STOPS.map(stop => [stop.id, stop]));

/** Maximum stops accepted in one itinerary request. */
export const MAX_ITINERARY_STOPS = 20;

export function findPlannerStop(id: string): PlannerStop | undefined {
  return STOP_BY_ID.get(id);
}

/** Local storage key for the saved itinerary. */
export const ITINERARY_STORAGE_KEY = 'travision-itinerary';
