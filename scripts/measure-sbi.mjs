import fs from 'node:fs';
import * as pdfjsModule from 'pdfjs-dist/build/pdf.js';

const pdfjs = pdfjsModule.default || pdfjsModule;

async function checkSbiTopRight() {
  const data = new Uint8Array(fs.readFileSync('public/bank/sbi/121120-Account Opening Form for Individuals.pdf'));
  const doc = await pdfjs.getDocument({ data }).promise;
  for (let p = 1; p <= 3; p++) {
    const page = await doc.getPage(p);
    const vp = page.getViewport({ scale: 1.0 });
    const text = await page.getTextContent();
    for (const item of text.items) {
      if (!item.str) continue;
      const s = item.str.trim();
      const x = item.transform[4];
      const y = vp.height - item.transform[5];
      if (s.toLowerCase().includes('photo') || s.toLowerCase().includes('stamp') || s.toLowerCase().includes('sign')) {
        console.log(`[P${p}] "${s}" at x=${x.toFixed(1)}, y=${y.toFixed(1)}, w=${item.width.toFixed(1)}`);
      }
    }
  }
}

checkSbiTopRight().catch(console.error);
