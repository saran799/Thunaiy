import fs from 'node:fs';
import * as pdfjsModule from 'pdfjs-dist/build/pdf.js';
const pdfjs = pdfjsModule.default || pdfjsModule;

async function auditPages() {
  const data = new Uint8Array(fs.readFileSync('public/bank/sbi/121120-Account Opening Form for Individuals.pdf'));
  const doc = await pdfjs.getDocument({ data }).promise;

  for (let p = 1; p <= 5; p++) {
    const page = await doc.getPage(p);
    const text = await page.getTextContent();
    console.log(`\n======================================================`);
    console.log(`PAGE ${p} (${page.view[2]} x ${page.view[3]})`);
    console.log(`======================================================`);
    
    // Sort items by vertical position (top to bottom), then left to right
    const items = text.items.filter(i => i.str && i.str.trim().length > 0).map(i => {
      const [, , , , tx, ty] = i.transform;
      const top = Math.round(841.89 - ty);
      const left = Math.round(tx);
      const width = Math.round(i.width);
      return { top, left, width, str: i.str.trim() };
    });

    items.sort((a, b) => a.top - b.top || a.left - b.left);

    // Group items into lines within 5px
    const lines = [];
    let currentLine = [];
    let currentTop = -1;

    for (const item of items) {
      if (currentTop === -1 || Math.abs(item.top - currentTop) < 5) {
        currentLine.push(item);
        currentTop = item.top;
      } else {
        lines.push({ top: currentTop, text: currentLine.map(x => `[${x.left}] ${x.str}`).join('  ') });
        currentLine = [item];
        currentTop = item.top;
      }
    }
    if (currentLine.length > 0) {
      lines.push({ top: currentTop, text: currentLine.map(x => `[${x.left}] ${x.str}`).join('  ') });
    }

    for (const line of lines.slice(0, 40)) {
      console.log(`Y=${line.top}: ${line.text}`);
    }
  }
}

auditPages().catch(console.error);
