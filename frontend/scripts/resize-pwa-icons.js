import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monmRoot = path.resolve(__dirname, '../..');
const logoPath = path.join(monmRoot, 'monm-logo.png');
const publicDir = path.join(__dirname, '../public');

async function run() {
  for (const size of [32, 192, 512]) {
    const name = size === 32 ? 'favicon' : `icon-${size}`;
    await sharp(logoPath)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `${name}.png`));
    console.log(`Created ${name}.png`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
