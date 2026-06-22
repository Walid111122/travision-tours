import https from 'https';

const urls = [
  'https://images.unsplash.com/photo-1539768942893-dad533f06b51',
  'https://images.unsplash.com/photo-1596710104443-44f23555ae3b',
  'https://images.unsplash.com/photo-1548043685-2e63ef2f3473',
  'https://images.unsplash.com/photo-1549482199-a4613ab1e48f',
  'https://images.unsplash.com/photo-1568503504139-bf37d29598a4',
  'https://images.unsplash.com/photo-1506466010722-395aa2bef877',
  'https://images.unsplash.com/photo-1554188248-986adbb56be4',
  'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368',
  'https://images.unsplash.com/photo-1583002674488-84ea5e8cb5ea',
  'https://images.unsplash.com/photo-1627885406087-0b1deddc6a85',
  'https://images.unsplash.com/photo-1579207085774-7221cc1b2382',
  'https://images.unsplash.com/photo-1565551944807-6f10adcfdbea',
  'https://images.unsplash.com/photo-1572252009286-268acec5ca0a',
  'https://images.unsplash.com/photo-1600521605663-718de50aebc8',
  'https://images.unsplash.com/photo-1582012628464-ed2cd78ed2d9',
  'https://images.unsplash.com/photo-1578028212681-331bd6688583',
  'https://images.unsplash.com/photo-1616853820251-87ab748ad728',
  'https://images.unsplash.com/photo-1629851722744-8d4fdbaa1d2d',
  'https://images.unsplash.com/photo-1541410965313-d53b3c16ef17'
];

async function check() {
  for (const url of urls) {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
      console.log(`${res.statusCode} ${url}`);
    });
    req.on('error', (e) => console.error(e));
    req.end();
  }
}
check();
