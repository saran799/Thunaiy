import fs from 'node:fs';
import * as pdfjsModule from 'pdfjs-dist/build/pdf.js';

const pdfjs = pdfjsModule.default || pdfjsModule;

async function inspectDoc(name, filePath, maxPages = 2) {
  console.log(`\n==================================================`);
  console.log(`DOCUMENT: ${name} (${filePath})`);
  console.log(`==================================================`);
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjs.getDocument({ data }).promise;
  console.log(`Total Pages: ${doc.numPages}`);

  for (let p = 1; p <= Math.min(maxPages, doc.numPages); p++) {
    const page = await doc.getPage(p);
    const vp = page.getViewport({ scale: 1.0 });
    console.log(`\n--- Page ${p}: ${vp.width.toFixed(2)} x ${vp.height.toFixed(2)} ---`);
    const text = await page.getTextContent();
    const items = text.items
      .filter((i) => i.str && i.str.trim())
      .map((i) => ({
        text: i.str.trim(),
        x: Math.round(i.transform[4] * 10) / 10,
        y: Math.round((vp.height - i.transform[5]) * 10) / 10,
        w: Math.round(i.width * 10) / 10,
        h: Math.round(i.height * 10) / 10,
      }));
    
    console.log(`Found ${items.length} text items on page ${p}`);
    // Print lines sorted by vertical position
    items.sort((a, b) => a.y - b.y || a.x - b.x);
    for (const it of items) {
      if (
        it.text.length > 2 &&
        (it.text.includes('*') ||
         it.text.toLowerCase().includes('name') ||
         it.text.toLowerCase().includes('account') ||
         it.text.toLowerCase().includes('birth') ||
         it.text.toLowerCase().includes('mobile') ||
         it.text.toLowerCase().includes('address') ||
         it.text.toLowerCase().includes('photo') ||
         it.text.toLowerCase().includes('cif') ||
         it.text.toLowerCase().includes('deposit') ||
         it.text.toLowerCase().includes('amount') ||
         it.text.toLowerCase().includes('signature') ||
         it.text.toLowerCase().includes('pan') ||
         it.text.toLowerCase().includes('date') ||
         it.text.toLowerCase().includes('branch'))
      ) {
        console.log(`  y=${it.y.toFixed(1)}, x=${it.x.toFixed(1)}, w=${it.w.toFixed(1)}: "${it.text}"`);
      }
    }
  }
}

async function main() {
  await inspectDoc('SBI AOF', 'public/bank/sbi/121120-Account Opening Form for Individuals.pdf', 2);
  await inspectDoc('HDFC AOF', 'public/bank/hdfc/Account Opening Form - For Individuals ( for opening Regular Savings Account, Basic Savings Bank Deposit Account, Individual Current Account).pdf', 2);
  await inspectDoc('HDFC Deposit', 'public/bank/hdfc/deposit-form.pdf', 1);
  await inspectDoc('BOB AOF', 'public/bank/bob/Account-Opening-Form-for-Individuals-05-11.pdf', 2);
  await inspectDoc('BOB FDR', 'public/bank/bob/Bank-of-Baroda-FDR-term-fixed-deposit-english.pdf', 1);
}

main().catch(console.error);
