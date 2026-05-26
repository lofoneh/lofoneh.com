/**
 * One-shot script to generate the default OG image as a 1200x628 PNG
 * from an inline SVG template. Re-run by hand whenever the OG design changes:
 *   bun scripts/build-og.mjs
 *
 * Output: src/assets/images/og-default.png
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="628" viewBox="0 0 1200 628">
  <rect width="1200" height="628" fill="#0a0a0a"/>
  <text x="80" y="120" fill="#a1a1aa" font-family="Courier New, monospace" font-size="22" letter-spacing="2">~ jeffery@lofoneh.com</text>
  <text x="80" y="340" fill="#fafafa" font-family="Arial Black, Arial, sans-serif" font-size="124" font-weight="900" letter-spacing="-2">LOFONEH</text>
  <text x="80" y="420" fill="#fafafa" font-family="Arial, sans-serif" font-size="34" font-weight="400">software engineer · infrastructure, devops, ai.</text>
  <line x1="80" y1="540" x2="1120" y2="540" stroke="#27272a" stroke-width="1"/>
  <text x="80" y="585" fill="#52525b" font-family="Courier New, monospace" font-size="22">lofoneh.com</text>
  <text x="1120" y="585" fill="#52525b" font-family="Courier New, monospace" font-size="22" text-anchor="end">building reliable systems</text>
</svg>`;

const buf = Buffer.from(svg);
await sharp(buf).png({ compressionLevel: 9 }).toFile('src/assets/images/og-default.png');

// Also keep the SVG source committed so the design is editable
writeFileSync('src/assets/images/og-source.svg', svg);

console.log('Generated src/assets/images/og-default.png (1200×628)');
