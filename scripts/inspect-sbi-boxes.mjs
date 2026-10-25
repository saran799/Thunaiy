import fs from 'node:fs';
import * as pdfjsModule from 'pdfjs-dist/build/pdf.js';

const pdfjs = pdfjsModule.default || pdfjsModule;

async function run() {
  const data = new Uint8Array(fs.readFileSync('public/bank/sbi/121120-Account Opening Form for Individuals.pdf'));
  const doc = await pdfjs.getDocument({ data }).promise;
  
  for (let p = 1; p <= 2; p++) {
    const page = await doc.getPage(p);
    const viewport = page.getViewport({ scale: 1.0 });
    console.log(`\n=== Page ${p} (${viewport.width} x ${viewport.height}) ===`);
    const text = await page.getTextContent();
    const keywords = ['Name', 'Date of Birth', 'Gender', 'Mobile', 'Email', 'Account type', 'Father', 'Mother', 'Spouse', 'PHOTO', 'Photograph', 'Guardian', 'Address', 'Pin', 'City', 'District', 'State', 'Identity'];
    
    for (const item of text.items) {
      if (!item.str || !item.str.trim()) continue;
      for (const kw of keywords) {
        if (item.str.toLowerCase().includes(kw.toLowerCase())) {
          const x = item.transform[4];
          const y = viewport.height - item.transform[5];
          console.log(`[P${p}] "${item.str}" at x=${x.toFixed(1)}, y=${y.toFixed(1)}, w=${item.width.toFixed(1)}`);
          break;
        }
      }
    }
  }
}

run().catch(console.error);
