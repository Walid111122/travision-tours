const fs = require('fs');

const scraped = JSON.parse(fs.readFileSync('scraped_itineraries.json', 'utf8'));

let constants = fs.readFileSync('src/constants.ts', 'utf8');

for (const [id, itinerary] of Object.entries(scraped)) {
   const jsonStr = JSON.stringify(itinerary, null, 6)
      .replace(/"([^"]+)":/g, '$1:') // Remove quotes from keys
      .replace(/"/g, "'"); // Use single quotes slightly (though risky if string contains single quotes)
      
   // Better stringify:
   let replacement = JSON.stringify(itinerary, null, 6);
   
   // We find the block for the specific tour ID
   const idIndex = constants.indexOf(`id: '${id}'`);
   if (idIndex === -1) {
      console.log(`Failed to find ID ${id}`);
      continue;
   }
   
   // Find the itinerary start
   const itineraryStart = constants.indexOf('itinerary: [', idIndex);
   if (itineraryStart === -1) continue;
   
   // Find where this itinerary array ends.
   // We will count brackets.
   let brackets = 0;
   let itineraryEnd = -1;
   for (let i = itineraryStart + 11; i < constants.length; i++) {
        if (constants[i] === '[') brackets++;
        if (constants[i] === ']') {
            brackets--;
            if (brackets === 0) {
                itineraryEnd = i + 1;
                break;
            }
        }
   }
   
   if (itineraryEnd !== -1) {
       constants = constants.substring(0, itineraryStart) + `itinerary: ${replacement}` + constants.substring(itineraryEnd);
       console.log(`Updated ${id}`);
   }
}

fs.writeFileSync('src/constants.ts', constants);
console.log('Done');
