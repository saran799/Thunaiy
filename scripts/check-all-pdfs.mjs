import fs from 'node:fs';
import * as pdfjsModule from 'pdfjs-dist/build/pdf.js';

const pdfjs = pdfjsModule.default || pdfjsModule;

async function checkPdfs() {
  const list = [
    { name: 'SBI AOF', file: 'public/bank/sbi/121120-Account Opening Form for Individuals.pdf' },
    { name: 'HDFC AOF', file: 'public/bank/hdfc/Account Opening Form - For Individuals ( for opening Regular Savings Account, Basic Savings Bank Deposit Account, Individual Current Account).pdf' },
    { name: 'HDFC Deposit', file: 'public/bank/hdfc/deposit-form.pdf' },
    { name: 'BOB AOF', file: 'public/bank/bob/Account-Opening-Form-for-Individuals-05-11.pdf' },
    { name: 'BOB FDR', file: 'public/bank/bob/Bank-of-Baroda-FDR-term-fixed-deposit-english.pdf' },
  ];

  for (const item of list) {
    const data = new Uint8Array(fs.readFileSync(item.file));
    const doc = await pdfjs.getDocument({ data }).promise;
    const page1 = await doc.getPage(1);
    const vp = page1.getViewport({ scale: 1.0 });
    console.log(`${item.name}: pages=${doc.numPages}, page1=${vp.width}x${vp.height}`);
  }
}

checkPdfs().catch(console.error);
