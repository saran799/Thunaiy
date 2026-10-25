import fs from 'node:fs';
import * as pdfjsModule from 'pdfjs-dist/build/pdf.js';

const pdfjs = pdfjsModule.default || pdfjsModule;

async function inspect(filePath) {
  console.log('=== Inspecting:', filePath);
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjs.getDocument({ data }).promise;
  console.log('Total pages:', doc.numPages);
  
  for (let p = 1; p <= Math.min(2, doc.numPages); p++) {
    const page = await doc.getPage(p);
    const viewport = page.getViewport({ scale: 1.0 });
    console.log(`Page ${p} size: width=${viewport.width}, height=${viewport.height}`);
    const text = await page.getTextContent();
    console.log(`Page ${p} text items: ${text.items.length}`);
    const lines = [];
    for (const item of text.items) {
      if (item.str && item.str.trim()) {
        const x = item.transform[4];
        const y = viewport.height - item.transform[5];
        lines.push({ str: item.str.trim(), x: Math.round(x), y: Math.round(y), w: Math.round(item.width), h: Math.round(item.height) });
      }
    }
    console.log(`--- First 50 elements of page ${p} ---`);
    for (let i = 0; i < Math.min(50, lines.length); i++) {
      console.log(`(${lines[i].x}, ${lines[i].y}, w=${lines[i].w}, h=${lines[i].h}): "${lines[i].str}"`);
    }
  }
}

async function main() {
  await inspect('public/bank/sbi/121120-Account Opening Form for Individuals.pdf');
}

main().catch(console.error);
