/**
 * One-time script: make near-black pixels in the logo transparent.
 * Run: node scripts/remove-logo-background.mjs
 */
import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const logoPath = join(root, "public", "logo-capital-bridge.png");

const THRESHOLD = 40; // pixels with r,g,b all below this become transparent

const image = sharp(logoPath);
const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

for (let i = 0; i < data.length; i += channels) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  if (r <= THRESHOLD && g <= THRESHOLD && b <= THRESHOLD) {
    data[i + 3] = 0; // set alpha to 0
  }
}

await sharp(data, { raw: { width, height, channels } })
  .png()
  .toFile(logoPath);

console.log("Logo background removed:", logoPath);
