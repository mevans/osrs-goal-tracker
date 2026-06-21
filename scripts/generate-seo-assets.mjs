import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const assetsDir = join(root, 'src/assets');

mkdirSync(publicDir, { recursive: true });

const logo = readFileSync(join(assetsDir, 'logo.png'));
const logoB64 = logo.toString('base64');

const ogSvg = `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0c0a09"/>
  <defs>
    <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="1" fill="#292524"/>
    </pattern>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#92400e" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#92400e" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#dots)" opacity="0.8"/>
  <ellipse cx="600" cy="260" rx="300" ry="220" fill="url(#glow)"/>
  <image href="data:image/png;base64,${logoB64}" x="250" y="150" width="700" height="210" preserveAspectRatio="xMidYMid meet"/>
  <text x="600" y="430" font-family="system-ui, sans-serif" font-size="28" fill="#a8a29e" text-anchor="middle" letter-spacing="1">OSRS goal planner — quests, skills, unlocks</text>
  <rect x="326" y="490" width="156" height="40" rx="20" fill="#1c1917" stroke="#44403c" stroke-width="1"/>
  <text x="404" y="516" font-family="system-ui, sans-serif" font-size="18" fill="#fbbf24" text-anchor="middle">Quest chains</text>
  <rect x="502" y="490" width="196" height="40" rx="20" fill="#1c1917" stroke="#44403c" stroke-width="1"/>
  <text x="600" y="516" font-family="system-ui, sans-serif" font-size="18" fill="#86efac" text-anchor="middle">Skill targets</text>
  <rect x="718" y="490" width="156" height="40" rx="20" fill="#1c1917" stroke="#44403c" stroke-width="1"/>
  <text x="796" y="516" font-family="system-ui, sans-serif" font-size="18" fill="#c4b5fd" text-anchor="middle">Bottlenecks</text>
</svg>`;

await sharp(Buffer.from(ogSvg)).png().toFile(join(publicDir, 'og-image.png'));

const faviconSrc = join(assetsDir, 'favicon.png');
await sharp(faviconSrc).resize(32, 32).png().toFile(join(publicDir, 'favicon.png'));
await sharp(faviconSrc).resize(180, 180).png().toFile(join(publicDir, 'apple-touch-icon.png'));

writeFileSync(join(publicDir, 'CNAME'), 'planscape.studio\n');

console.log('Generated public/og-image.png, favicon.png, apple-touch-icon.png, CNAME');
