const fs = require('fs');

let fileData = fs.readFileSync('src/constants.ts', 'utf8');

// Regex to find itineraries that haven't been enriched (they have simple objects)
// We'll replace them with a slightly more detailed format
const enhancedData = fileData.replace(
  /\{\s*day:\s*(\d+),\s*activity:\s*'([^']+)',\s*description:\s*'([^']+)'\s*\}/g,
  (match, d, a, desc) => {
    const dayWords = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty', 'Twenty-One'];
    const dayStr = Number(d) <= dayWords.length ? dayWords[Number(d) - 1] : d;
    return `{
      day: ${d},
      title: 'Day ${dayStr}: ${a}',
      description: '${desc.replace(/'/g, "\\'")}',
      activities: [
        {
          title: '${a} Highlights',
          description: '${desc.replace(/'/g, "\\'")}',
          icon: 'tour'
        }
      ]
    }`;
  }
);

fs.writeFileSync('src/constants.ts', enhancedData);
console.log('done');
