// Lists Figma assets from assets-manifest.json that are not yet present in public/assets/figma/.
import { existsSync, readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../assets-manifest.json', import.meta.url), 'utf8'));
const missing = manifest.assets.filter((a) => !existsSync(new URL(`../${a.file}`, import.meta.url)));

if (missing.length === 0) {
  console.log(`All ${manifest.count} Figma assets are present.`);
} else {
  console.log(`${missing.length} of ${manifest.count} Figma assets are missing:\n`);
  for (const a of missing) console.log(`  ${a.file}  (${a.slot})  ${a.usage}`);
  process.exitCode = 1;
}
