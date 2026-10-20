// Generate PNG ikon PWA dari SVG menggunakan sharp
// Jalankan: bun run scripts/generate-icons.ts
import sharp from "sharp";
import { readFileSync } from "fs";
import { join } from "path";

const ICONS_DIR = join(process.cwd(), "public/icons");

const iconSource = readFileSync(join(ICONS_DIR, "icon-source.svg"));
const maskableSource = readFileSync(join(ICONS_DIR, "maskable-source.svg"));

// Ukuran ikon yang dibutuhkan untuk PWA
const sizes = [192, 512];
// Apple touch icon biasanya 180x180
const appleSize = 180;
// Favicon
const faviconSize = 32;

async function main() {
  console.log("🎨 Generating PWA icons...");

  // Ikon standar (any purpose)
  for (const size of sizes) {
    await sharp(iconSource)
      .resize(size, size)
      .png()
      .toFile(join(ICONS_DIR, `icon-${size}.png`));
    console.log(`✓ icon-${size}.png (any)`);
  }

  // Ikon maskable (untuk adaptive icon di Android)
  for (const size of sizes) {
    await sharp(maskableSource)
      .resize(size, size)
      .png()
      .toFile(join(ICONS_DIR, `maskable-${size}.png`));
    console.log(`✓ maskable-${size}.png (maskable)`);
  }

  // Apple touch icon (iOS home screen)
  await sharp(iconSource)
    .resize(appleSize, appleSize)
    .png()
    .toFile(join(ICONS_DIR, `apple-touch-icon.png`));
  console.log(`✓ apple-touch-icon.png (iOS, ${appleSize}px)`);

  // Favicon
  await sharp(iconSource)
    .resize(faviconSize, faviconSize)
    .png()
    .toFile(join(ICONS_DIR, `favicon-${faviconSize}.png`));
  console.log(`✓ favicon-${faviconSize}.png`);

  // Ikon besar untuk splash screen (512x512 sudah ada di atas)
  // Tambahkan ikon 1024 untuk store
  await sharp(iconSource)
    .resize(1024, 1024)
    .png()
    .toFile(join(ICONS_DIR, `icon-1024.png`));
  console.log(`✓ icon-1024.png (store/splash)`);

  console.log("\n🎉 Semua ikon PWA berhasil dibuat di public/icons/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
