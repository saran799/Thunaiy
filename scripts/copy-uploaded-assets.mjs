import fs from 'node:fs';
import path from 'node:path';

const uploadedDir = 'C:/Users/Saranraj/.gemini/antigravity-ide/brain/ceb30f03-c3a6-4f85-b6d7-e4b2c0c12b48/.user_uploaded';
const publicDir = 'public';

fs.mkdirSync('public/assets/figma', { recursive: true });
fs.mkdirSync('public/assets/banks', { recursive: true });

// Copy Thunaiy logo
const thunaiySrc = path.join(uploadedDir, 'media_1792572558018.jpg');
fs.copyFileSync(thunaiySrc, 'public/assets/thunaiy-logo.jpg');
fs.copyFileSync(thunaiySrc, 'public/assets/figma/thunai-app-logo.jpeg');
fs.copyFileSync(thunaiySrc, 'public/assets/figma/50a7e.png');
console.log('Copied Thunaiy logo');

// Copy Bank logos
const banks = [
  { file: 'media_1792572596827.png', name: 'sbi.png', figmaId: '8fbcd.png' },
  { file: 'media_1792572614992.png', name: 'hdfc.png', figmaId: '1c19e.png' },
  { file: 'media_1792572640790.png', name: 'canara.png', figmaId: '44085.png' },
  { file: 'media_1792572667176.png', name: 'icici.png', figmaId: '6f05a.png' },
];

for (const b of banks) {
  const src = path.join(uploadedDir, b.file);
  fs.copyFileSync(src, `public/assets/banks/${b.name}`);
  fs.copyFileSync(src, `public/assets/figma/${b.figmaId}`);
  console.log(`Copied bank logo: ${b.name}`);
}
