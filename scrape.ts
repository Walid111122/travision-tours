import * as cheerio from 'cheerio';
import * as fs from 'fs';

function getIconType(title: string, src: string): string {
  title = title.toLowerCase();
  src = src.toLowerCase();
  if (title.includes('dinner') || src.includes('eat') || src.includes('meal')) return 'dinner';
  if (title.includes('flight') || src.includes('flight')) return 'flight';
  if (title.includes('transfer') || src.includes('guide') || src.includes('car')) return 'transfer';
  if (title.includes('overnight') || src.includes('bed') || src.includes('hotel') || title.includes('sleep')) return 'overnight';
  return 'tour';
}

async function scrapeTours() {
  const tourMap: Record<string, string> = JSON.parse(fs.readFileSync('tour_urls.json', 'utf-8'));
  
  const entries = Object.entries(tourMap);
  const results: Record<string, any[]> = {};
  
  for (const [id, url] of entries) {
    try {
      console.log(`Fetching: ${id}`);
      const t = await fetch(url).then(r=>r.text());
      const $ = cheerio.load(t);
      
      const itinerary: any[] = [];
      
      $('.accordion-item.itinerary-item').each((i, el) => {
         const dayMatch = $(el).find('h2.mb-0 span, h3.mb-0 span, .link').text().replace(/\s+/g, ' ').trim();
         if(!dayMatch || !dayMatch.includes('Day')) return;
         
         const body = $(el).find('.card-body');
         let description = body.children('p').first().text().replace(/\s+/g, ' ').trim() || '';
         
         let image = body.find('.itinerary-image img').attr('data-src');
         if (!image) image = body.find('img').attr('src');
         
         const activities: any[] = [];
         body.find('.touristattraction').each((j, ta) => {
            const actTitle = $(ta).find('h3.title').text().replace(/\s+/g, ' ').trim();
            const actDesc = $(ta).children('p').last().text().replace(/\s+/g, ' ').trim();
            const iconUrl = $(ta).find('img').attr('data-src') || $(ta).find('img').attr('src') || '';
            activities.push({
               title: actTitle,
               description: actDesc,
               icon: getIconType(actTitle, iconUrl)
            });
         });
         
         let meals = '';
         let overnight = '';
         
         body.find('.d-xl-flex p, .d-flex p').each((k, p) => {
            const text = $(p).text().replace(/\s+/g, ' ').trim();
            if(text.includes('Meals:')) meals = text.replace('Meals:', '').trim();
            if(text.includes('Overnight:')) overnight = text.replace('Overnight:', '').trim();
         });
         
         itinerary.push({
            day: i + 1,
            title: dayMatch,
            description,
            image,
            activities,
            meals,
            overnight
         });
      });
      
      if(itinerary.length > 0) {
        results[id] = itinerary;
        console.log(` + Scraped ${itinerary.length} days for ${id}`);
      } else {
        console.log(` - No itinerary found for ${id}`);
      }
    } catch(e) {
      console.error(`Failed ${id}`, e.message);
    }
  }
  
  fs.writeFileSync('scraped_itineraries.json', JSON.stringify(results, null, 2));
  console.log(`Written ${Object.keys(results).length} itineraries to JSON`);
}

scrapeTours();
