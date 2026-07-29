import { readFile, writeFile } from 'node:fs/promises';

const fileUrl = new URL('../src/constants.ts', import.meta.url);
const source = await readFile(fileUrl, 'utf8');
const marker = 'export const SAMPLE_TOURS: Tour[] = ';
const arrayStart = source.indexOf(marker) + marker.length;
const arrayEnd = source.indexOf('\n];', arrayStart) + 2;

if (arrayStart < marker.length || arrayEnd < 2) {
  throw new Error('Could not locate SAMPLE_TOURS in src/constants.ts');
}

const tours = JSON.parse(source.slice(arrayStart, arrayEnd));

for (const tour of tours) {
  tour.description = `Explore ${tour.location} on this ${tour.duration.toLowerCase()} ${tour.category.toLowerCase()} itinerary. Review the planned route, inclusions, exclusions, and starting price before requesting a personalized quotation.`;

  for (const day of tour.itinerary ?? []) {
    const dayTitle = day.title || `Day ${day.day}`;
    day.description = `Planned itinerary for ${dayTitle}. The final order and timing may change with opening hours, transport, and local conditions.`;

    for (const activity of day.activities ?? []) {
      activity.description = `Visit ${activity.title} as part of the planned itinerary. Timing, access, and included admission will be confirmed in the written quotation.`;
    }

    if (day.meals) day.meals = 'As stated in the final quotation';
    if (day.overnight) day.overnight = 'Accommodation to be confirmed';
  }

  tour.inclusions = [
    'Services itemized as included in your written quotation.',
    'Transport, accommodation, meals, guides, and admission tickets only when specifically listed.',
    'Applicable taxes or service charges only when stated in the accepted quotation.'
  ];
  tour.exclusions = [
    'International flights, visas, travel insurance, and personal expenses unless specifically listed.',
    'Optional activities, gratuities, and services not identified as included.',
    'Bank fees or currency-conversion charges associated with the wire transfer.'
  ];
  tour.gallery = (tour.gallery ?? []).filter(
    imageUrl => !imageUrl.includes('egypttoursportal.com')
  );
  delete tour.reviewsList;
}

const replacement = `${marker}${JSON.stringify(tours, null, 2)}`;
const updated = source.slice(0, source.indexOf(marker)) + replacement + source.slice(arrayEnd);
await writeFile(fileUrl, updated);

console.log(`Sanitized ${tours.length} package tours.`);

const dayToursUrl = new URL('../src/dayTours.ts', import.meta.url);
const dayToursSource = await readFile(dayToursUrl, 'utf8');
const dayTourDescriptionPattern = /    description:\r?\n      '(?:\\.|[^'])*',/g;
const dayTourDescriptions = dayToursSource.match(dayTourDescriptionPattern) ?? [];
const cleanDayTours = dayToursSource
  .replace(
    /\/\*\*[\s\S]*?\*\/\r?\n\r?\n/,
    `/**\n * Original Travision Tours day-tour catalog.\n * Kept separate from multi-day packages for filtering and presentation.\n */\n\n`
  )
  .replace(
    dayTourDescriptionPattern,
    `    description:\n      'Review the planned stops, duration, starting price, and available options before requesting a personalized quotation.',`
  );

await writeFile(dayToursUrl, cleanDayTours);
console.log(`Sanitized ${dayTourDescriptions.length} day-tour descriptions.`);
