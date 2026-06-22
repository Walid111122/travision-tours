const fs = require('fs');
let code = fs.readFileSync('src/constants.ts', 'utf8');
const start = code.indexOf(`export const SAMPLE_TOURS: Tour[] = [`);
const nextTour = code.indexOf(`id: '6-days-cairo-luxor-aswan'`);

if (start !== -1 && nextTour !== -1) {
    // We need to cut from start + length to nextTour - something
    // or just replace:
    const replacement = `export const SAMPLE_TOURS: Tour[] = [\n  {\n    ` + code.substring(nextTour);
    code = code.substring(0, start) + replacement;
    fs.writeFileSync('src/constants.ts', code);
    console.log("Cleaned mock tours successfully.");
} else {
    console.log("Could not find boundaries.");
}
