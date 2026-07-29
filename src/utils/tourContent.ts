import type { Tour } from '../types';

export const getTourSummary = (tour: Tour): string => {
  const highlights = tour.highlights?.slice(0, 3).filter(Boolean) ?? [];
  const highlightText =
    highlights.length > 0
      ? ` Planned highlights include ${highlights.join(', ')}.`
      : '';

  return `Explore ${tour.location} on this ${tour.duration.toLowerCase()} ${tour.category.toLowerCase()} itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services.${highlightText}`;
};

const attractionSummaries: Record<string, string> = {
  'giza pyramids complex':
    'Visit the Giza Plateau to see the pyramids of Khufu, Khafre, and Menkaure together with the surrounding archaeological landscape.',
  'the great pyramid':
    'See the Great Pyramid of Khufu, the largest pyramid at Giza and the only surviving wonder of the ancient world.',
  'the great sphinx':
    'View the Great Sphinx, the monumental limestone figure with a lion’s body and a human head on the Giza Plateau.',
  'the valley temple':
    'Explore the Valley Temple associated with Khafre’s pyramid complex and learn how it formed part of the site’s ceremonial route.',
  'the grand egyptian museum':
    'Visit the Grand Egyptian Museum and explore displays presenting objects from ancient Egyptian history. Access to particular galleries depends on the operating schedule.',
  'the egyptian museum':
    'Explore the Egyptian Museum in Cairo and view a broad collection of objects from ancient Egypt.',
  'saqqara step pyramid':
    'Visit Saqqara to see the Step Pyramid complex of Djoser, an important early development in monumental stone architecture.',
  'salah el din citadel':
    'Visit Cairo’s historic citadel and explore monuments within the fortified complex.',
  'mohamed ali mosque':
    'See the Mosque of Muhammad Ali inside the Cairo Citadel and take in views across the city when conditions allow.',
  'the national museum of egyptian civilization':
    'Explore the National Museum of Egyptian Civilization and its chronological presentation of Egyptian history and culture.',
  'al muizz street':
    'Walk along Al-Muizz Street, a historic Cairo thoroughfare known for its concentration of Islamic-era architecture.',
  'khan el khalili bazaar':
    'Spend time in the Khan el-Khalili district, where historic lanes contain shops, workshops, cafés, and local markets.',
  'valley of the kings':
    'Visit the Valley of the Kings on Luxor’s west bank. Entry to individual tombs depends on the ticket and current site access.',
  'hatshepsut temple':
    'Explore the terraced memorial temple of Hatshepsut at Deir el-Bahari on Luxor’s west bank.',
  'queen hatshepsut temple':
    'Explore the terraced memorial temple of Hatshepsut at Deir el-Bahari on Luxor’s west bank.',
  'colossi of memnon':
    'Stop at the two monumental seated statues known as the Colossi of Memnon on Luxor’s west bank.',
  'karnak temple':
    'Explore the Karnak temple complex in Luxor, including its monumental courts, gateways, and columned spaces.',
  'luxor temple':
    'Visit Luxor Temple, an ancient temple complex situated near the east bank of the Nile in central Luxor.',
  'abu simbel temples':
    'Visit the rock-cut temples of Abu Simbel, relocated during the international campaign connected with construction of the Aswan High Dam.',
  'the impressive two temples of abu simbel':
    'Visit the two rock-cut temples of Abu Simbel and learn about their relocation to higher ground during the twentieth century.',
  'the high dam':
    'See the Aswan High Dam and learn about its role in managing the Nile and producing hydroelectric power.',
  'the unfinished obelisk':
    'Visit the ancient granite quarry in Aswan where an unfinished obelisk reveals evidence of historic stone-working methods.',
  'philae temple':
    'Reach the Philae temple complex by boat and explore monuments relocated to Agilkia Island.',
  'edfu temple':
    'Visit the Temple of Horus at Edfu, one of Egypt’s best-preserved ancient temple complexes.',
  'kom ombo temple':
    'Explore the riverside temple at Kom Ombo, distinguished by its paired layout.',
  'lunch time':
    'Pause for lunch at a local restaurant. The exact venue and menu will be confirmed with the final itinerary.',
  'dinner time':
    'Dinner arrangements will follow the inclusions stated in your final quotation.',
  overnight:
    'Transfer to the accommodation or cruise specified in the confirmed itinerary.',
};

export const getActivitySummary = (title: string): string => {
  const normalizedTitle = title.trim().toLowerCase();
  return (
    attractionSummaries[normalizedTitle] ??
    `Visit ${title.trim()} as part of the planned itinerary. Timing, access, and included admission will be confirmed in your written quotation.`
  );
};

export const getDaySummary = (dayTitle: string, tourTitle: string): string =>
  `This part of ${tourTitle} is planned around ${dayTitle.replace(/^day\s+\w+\s*:\s*/i, '').toLowerCase()}. The final order and timing may change with opening hours, transport, and local conditions.`;
