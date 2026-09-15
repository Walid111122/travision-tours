import type { BlogPost } from './types';

/**
 * Published blog articles, rendered by /blog and /blog/:id.
 *
 * Content uses a deliberately small markdown subset that `BlogPost.tsx`
 * renders — paragraphs, `##`/`###` headings, `- ` lists, and `[text](/path)`
 * links. Internal links point at real routes so articles support both readers
 * and crawlable internal linking.
 */
export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'visiting-pyramids-of-giza-first-time-guide',
    title: "Visiting the Pyramids of Giza: A First-Timer's Guide",
    excerpt:
      'When to arrive, how long to spend, what to wear, and the mistakes first-time visitors make at the Giza Plateau.',
    author: 'Travision Tours',
    date: '2026-09-15',
    image: '/images/tours/pyramids-tour-from-cairo-airport/gallery-2.jpeg',
    tags: ['Pyramids of Giza', 'Cairo', 'Travel Guide'],
    content: `The Pyramids of Giza sit on the edge of greater Cairo — close enough that many visitors are surprised the complex is in the city, not out in the desert. A little planning turns a crowded morning into one of the best days of your trip.

## When to go

Arrive as close to opening time as you can. Early morning means cooler air, softer light on the stone, and far fewer tour buses. By late morning the plateau is busy and the sun is high; by mid-afternoon the heat on the exposed plateau is the main complaint we hear. Winter months are milder; in summer, treat the early start as non-negotiable.

## How long to spend

Most visitors need three to four hours to see the three pyramids, the panoramic viewpoint, and the Sphinx without rushing. If you plan to enter a pyramid or add a camel ride, budget half a day.

## What to wear and bring

The plateau is open ground with no shade structure between monuments. Wear a hat, sunglasses, and sturdy closed shoes — the ground is uneven sand and stone, not pavement. Bring water; vendors exist but prices are higher inside. Modest, breathable clothing keeps you comfortable and respectful (see our [Egypt dress guide](/blog/what-to-wear-in-egypt) for detail).

## Should you go inside a pyramid?

Entry to the plateau and entry inside a pyramid are separate tickets. The interior is a narrow, sloped, unventilated passage — historically interesting but physically tight, and the chambers themselves are plain stone. If you are claustrophobic or have mobility concerns, skip it; the exterior is the real spectacle. Photography rules inside change periodically, so follow staff guidance on the day.

## Camels, horses and the panorama

The classic photo with all three pyramids in line is taken from the panoramic viewpoint on the western edge. Camel and horse rides to the viewpoint are offered on site; agree the price and duration clearly before you mount. A guided tour handles this negotiation for you and keeps the visit on schedule.

## The Sphinx

The Sphinx sits lower, at the edge of the complex near the Valley Temple of Khafre, and most visits end there. It is smaller in person than most photographs suggest — and more weathered — but its scale against the causeway still lands.

## Putting it into your itinerary

Giza pairs naturally with a Cairo day: the Egyptian Museum, the Grand Egyptian Museum, or the old city. Our [Pyramids tour from Cairo Airport](/tours/pyramids-tour-from-cairo-airport) and [Giza Pyramids day tour](/tours/giza-pyramids-day-tour) both handle timing and tickets with an Egyptologist guide, or browse the full [tour collection](/tours) to build it into a longer trip.`
  },
  {
    id: 'two-days-in-luxor-itinerary',
    title: 'Two Days in Luxor: The East Bank and West Bank Itinerary',
    excerpt:
      'How to split Luxor across two days — Karnak and Luxor Temple on the East Bank, the Valley of the Kings and Hatshepsut on the West.',
    author: 'Travision Tours',
    date: '2026-09-15',
    image: '/images/tours/6-days-cairo-luxor-aswan/gallery-2.jpeg',
    tags: ['Luxor', 'Itinerary', 'Valley of the Kings'],
    content: `Luxor is ancient Thebes — the city that Egypt's New Kingdom pharaohs made their capital — and it holds the densest concentration of monuments in the country. The Nile splits the sites in two: the living city's temples on the East Bank, the necropolis and mortuary temples on the West Bank. Two days is the minimum that does it justice.

## Day one — the East Bank

Start at Karnak in the morning. The complex was built and rebuilt over roughly two thousand years, and its Great Hypostyle Hall — 134 columns, most still standing — is the single most impressive interior space in Egypt. Allow at least two hours; the site is huge and most visitors underestimate it.

In the afternoon, visit Luxor Temple in the centre of town. Unlike Karnak it was used almost continuously through the pharaonic, Roman, and Islamic eras, and the layers are visible. If your schedule allows, return after dark: the temple is floodlit, and [Luxor Temple by night](/tours/luxor-day-tour) is a different experience to the daytime visit.

End the day on the corniche — the Nile promenade — or at Luxor Museum, a small, well-curated collection that includes pieces found in the Theban necropolis.

## Day two — the West Bank

Cross early. The West Bank is a working landscape of villages and farmland between monuments, and temperatures climb quickly in the open wadis.

The Valley of the Kings holds more than sixty known royal tombs, cut deep into the Theban hills. The standard ticket admits a rotating selection of tombs; a few famous ones — including Tutankhamun's and Seti I's — carry separate entry. Howard Carter found Tutankhamun's tomb here in 1922, and the painted corridors of the tombs open today still carry their colour.

From the valley, continue to the mortuary temple of Hatshepsut at Deir el-Bahari — three clean terraces built against the cliff face — and finish at the Colossi of Memnon, the two seated statues that once fronted a now-vanished temple.

## Practical notes

- The West Bank involves real walking on uneven ground; proper shoes matter more than anywhere else in Egypt.
- Sites open early; an early crossing beats both heat and crowds.
- Water and sun protection are essential — the valley has almost no shade.
- A guide earns their fee here: tomb selection, timing, and the history are what separate a memorable day from a confusing one.

## Doing it without the logistics

Our [Luxor day tour](/tours/luxor-day-tour) and [Valley of the Kings day tour](/tours/valley-of-kings-day-tour) cover the highlights with transport and a guide, and the multi-day packages — for example the [Cairo, Luxor and Aswan itinerary](/tours/6-days-cairo-luxor-aswan) — build Luxor into a longer route down the Nile.`
  },
  {
    id: 'nile-cruise-vs-land-tour',
    title: 'Nile Cruise or Land Tour? How to Choose the Right Egypt Trip',
    excerpt:
      'A Nile cruise or a land-based itinerary — comparing pace, what each covers, who each suits, and how to combine the two.',
    author: 'Travision Tours',
    date: '2026-09-15',
    image: '/images/day-tours/nile-cruise-day-tour.jpeg',
    tags: ['Nile Cruise', 'Planning', 'Egypt Travel'],
    content: `The stretch of the Nile between Luxor and Aswan holds Edfu, Kom Ombo, and most of Upper Egypt's great temples. There are two ways to travel it: sleeping on the river itself, or moving by road and rail between hotels. Neither is wrong — they suit different travellers.

## What a Nile cruise actually is

A cruise is a floating hotel running Luxor to Aswan (or the reverse), typically over three or four nights. The ship sails between temple stops; guided excursions leave from the dock. You unpack once, and the river — feluccas, farmland, desert hills — is the view from your cabin the whole way.

## The case for the cruise

- Zero logistics: transport, accommodation and temple visits are bundled into one schedule.
- The river itself is part of the experience — sailing past the same banks the pharaohs built beside.
- Edfu and Kom Ombo sit naturally on the river route; on land they are deliberate detours.
- Evenings on deck are their own kind of sightseeing.

## The case for land

- Flexibility: choose your pace, add or skip stops, linger where you like.
- More hotel choice and easier evening access to towns, markets and restaurants.
- Easier to combine with beach time in Hurghada or a longer Cairo stay.
- Some travellers simply prefer solid ground — cabins are compact, and ships run to fixed dock times.

## Who each suits

Cruises suit first-time visitors who want the classic Egypt arc — Cairo, then the temples south — with minimal planning, and anyone who values the journey as much as the sites. Land suits independent travellers, photographers who want unhurried site time, and repeat visitors targeting specific places.

A felucca — the small traditional sailboat — is a third option for a short Aswan afternoon, not a substitute for the multi-day route.

## The honest answer: combine them

Most longer itineraries do both — a few cruise nights between Luxor and Aswan inside a wider land-based trip that also covers Cairo and the Red Sea. Our [Cairo, Nile Cruise and Hurghada holiday](/tours/12-days-family-egypt-red-sea-holiday) is built exactly that way, and the [itinerary planner](/planner) lets you sketch your own route before you enquire.`
  },
  {
    id: 'abu-simbel-worth-the-trip',
    title: "Is Abu Simbel Worth the Journey? Inside Egypt's Relocated Wonder",
    excerpt:
      'The story of the temples moved stone by stone, what the long trip south involves, and how to decide if Abu Simbel belongs on your route.',
    author: 'Travision Tours',
    date: '2026-09-15',
    image: '/images/day-tours/abu-simbel-day-tour.jpeg',
    tags: ['Abu Simbel', 'Aswan', 'History'],
    content: `Abu Simbel is the site everyone debates: two extraordinary temples, roughly 280 kilometres south of Aswan, near the Sudanese border. The honest answer to "is it worth it?" depends on how you weigh a long day against one of the most remarkable sights in Egypt.

## Why it was built out there

Ramesses II raised the temples around 1264 BCE on Egypt's southern frontier — a deliberate display of power facing Nubia. The Great Temple's four seated colossi of the king, each about twenty metres tall, are the images on every Egypt poster for a reason.

The smaller temple honours Queen Nefertari and the goddess Hathor — unusual in itself, since royal wives rarely received temple-scale monuments.

## The relocation

When the Aswan High Dam created Lake Nasser in the 1960s, the temples stood in the flood zone. Between 1964 and 1968 an international UNESCO campaign cut both temples into blocks, raised them more than sixty metres, and reassembled them against an artificial mountain — including the inner sanctuary, aligned so the sun reaches the innermost statues on two days each year, traditionally 22 February and 22 October.

Understanding that the entire monument was moved — and still works — is most of the awe.

## What the visit involves

By road, it is roughly three to four hours each way from Aswan, conventionally in an early-morning convoy so you visit in the cooler hours and return by afternoon. There is also a short flight for those who prefer to skip the drive. Either way, you spend around two hours at the temples themselves.

## Is it worth it?

Go if temples are your reason for coming — Abu Simbel is the single most theatrical temple site in Egypt, and the relocation story adds a modern chapter no other monument has. Skip it if your itinerary is tight or the long drive would cost you a day you would rather spend in Luxor or Aswan itself.

## Putting it in your trip

Our [Abu Simbel day tour](/tours/abu-simbel-day-tour) handles the early start and the drive from Aswan. If you want it inside a longer route, the [Cairo, Abu Simbel and Luxor package](/tours/pkg-7-5-days-cairo--luxor---abu-simbel-tour) and the [wider Upper Egypt itinerary](/tours/7-days-cairo-luxor-aswan-abu-simbel-edfu-kom-ombo) both include it with the logistics already arranged.`
  },
  {
    id: 'what-to-wear-in-egypt',
    title: 'What to Wear in Egypt: A Practical Guide for Temples, Deserts and the Red Sea',
    excerpt:
      'What to pack and wear in Egypt — respectful dress for religious sites, sun protection for desert days, and what changes by season.',
    author: 'Travision Tours',
    date: '2026-09-15',
    image: '/images/day-tours/cairo-day-tour.jpeg',
    tags: ['Packing', 'Travel Tips', 'Egypt'],
    content: `Egypt's dress code question worries travellers more than it needs to. The real constraints are practical — sun, heat, dust and uneven ground — with a layer of modesty at religious sites. Pack for those and you are covered everywhere.

## The three principles

- **Sun first.** Most sites are open ground with no shade. Covering skin is cooler than exposing it once the sun is high.
- **Modesty where it matters.** Cities and religious sites are conservative; resorts and cruises are relaxed. Dress for the place you are in, not one rule for the whole country.
- **Comfort beats fashion.** You will walk on sand, stone and steps every day.

## Temples and ancient sites

There is no formal dress code at pharaonic sites — the issue is sun and footing. Lightweight long trousers or a long skirt, a breathable shirt, a hat and closed shoes handle everything from the Giza Plateau to the Valley of the Kings. Bring a scarf or light layer for wind and for air-conditioned vehicles.

## Mosques and religious sites

Active mosques — like those in Cairo's old city and the Mohamed Ali Mosque inside the Citadel — ask visitors to cover shoulders and knees, and women to cover their hair. Carry a light scarf; some mosques lend coverings at the door. Shoes come off inside prayer halls, so slip-on footwear helps.

## Desert and early-morning starts

Desert excursions and sunrise departures can be genuinely cool — winter mornings on the West Bank or in the White Desert call for a real jacket or fleece. By midday it is hot again, so layer rather than commit.

## The Red Sea coast

Resort areas — Hurghada, Sharm El Sheikh, Marsa Alam and the bay towns — are relaxed: beachwear is normal at pools and beaches. Outside the resort, in town centres and on excursions, revert to the modest end of the spectrum.

## Seasons

- **Summer (May–September):** peak heat, especially in Luxor and Aswan. Lightest fabrics, hat, high-SPF sunscreen, more water than you think.
- **Winter (October–April):** warm days, cool evenings. A jacket or jumper earns its place after sunset.

## A short packing list

- Closed, broken-in walking shoes
- Hat and sunglasses
- Light scarf or wrap (sun, mosques, wind)
- Long breathable trousers/skirt and shirts
- Fleece or jacket for winter mornings
- Swimwear for the coast or the cruise pool
- Reef-safe sunscreen and a refillable bottle

If you are unsure about a specific excursion — desert overnight, mosque visit, boat trip — check our [travel guidelines](/guidelines) or [ask us directly](/contact) when you plan your itinerary.`
  }
];
