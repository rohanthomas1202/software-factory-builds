/**
 * favicon-generate.mjs
 *
 * Development utility — generates favicon.ico from favicon.svg using
 * the `sharp` package (optional dev dependency).
 *
 * Usage:
 *   npm install --save-dev sharp
 *   node public/favicon-generate.mjs
 *
 * Output: public/favicon.ico (multi-size: 16, 32, 48 px)
 *
 * Note: This is a convenience script. The app works perfectly fine with
 * just favicon.svg in all modern browsers. favicon.ico is only needed
 * for legacy IE / older WebView support.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ─── Attempt to load sharp ───────────────────────────────────────────────────
let sharp;
try {
  const mod = await import("sharp");
  sharp = mod.default;
} catch {
  console.error(
    "❌  sharp is not installed.\n" +
    "    Run: npm install --save-dev sharp\n" +
    "    Then re-run: node public/favicon-generate.mjs"
  );
  process.exit(1);
}

// ─── Paths ───────────────────────────────────────────────────────────────────
const SVG_PATH = resolve(ROOT, "public", "favicon.svg");
const ICO_PATH = resolve(ROOT, "public", "favicon.ico");

if (!existsSync(SVG_PATH)) {
  console.error(`❌  Source SVG not found: ${SVG_PATH}`);
  process.exit(1);
}

console.log("🎨  Reading favicon.svg …");
const svgBuffer = readFileSync(SVG_PATH);

// ─── Generate PNG buffers at each required size ───────────────────────────────
const SIZES = [16, 32, 48];
const pngBuffers = [];

for (const size of SIZES) {
  console.log(`   ↳  Rendering ${size}×${size} PNG …`);
  const png = await sharp(svgBuffer)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  pngBuffers.push({ size, buffer: png });
}

// ─── Assemble minimal ICO file ────────────────────────────────────────────────
// ICO format:
//   6-byte ICONDIR header
//   N × 16-byte ICONDIRENTRY
//   N × image data (PNG blobs)
//
// We use PNG-inside-ICO (supported since Windows Vista / all modern OSes).

const count = pngBuffers.length;

// Calculate offsets
// Header: 6 bytes
// Directory: count × 16 bytes
// Image data: sequential
const HEADER_SIZE = 6;
const ENTRY_SIZE = 16;
const DATA_OFFSET_BASE = HEADER_SIZE + ENTRY_SIZE * count;

let dataOffset = DATA_OFFSET_BASE;
const entries = pngBuffers.map(({ size, buffer }) => {
  const entry = {
    width:  size === 256 ? 0 : size,   // 0 means 256 in ICO spec
    height: size === 256 ? 0 : size,
    colorCount: 0,
    reserved: 0,
    planes: 1,
    bitCount: 32,
    bytesInRes: buffer.length,
    imageOffset: dataOffset,
  };
  dataOffset += buffer.length;
  return entry;
});

const totalSize = dataOffset;
const icoBuffer = Buffer.alloc(totalSize);
let pos = 0;

// ICONDIR header
icoBuffer.writeUInt16LE(0,     pos);     pos += 2; // Reserved
icoBuffer.writeUInt16LE(1,     pos);     pos += 2; // Type: 1 = ICO
icoBuffer.writeUInt16LE(count, pos);     pos += 2; // Count

// ICONDIRENTRY × N
for (const e of entries) {
  icoBuffer.writeUInt8(e.width,       pos); pos += 1;
  icoBuffer.writeUInt8(e.height,      pos); pos += 1;
  icoBuffer.writeUInt8(e.colorCount,  pos); pos += 1;
  icoBuffer.writeUInt8(e.reserved,    pos); pos += 1;
  icoBuffer.writeUInt16LE(e.planes,   pos); pos += 2;
  icoBuffer.writeUInt16LE(e.bitCount, pos); pos += 2;
  icoBuffer.writeUInt32LE(e.bytesInRes,  pos); pos += 4;
  icoBuffer.writeUInt32LE(e.imageOffset, pos); pos += 4;
}

// Image data
for (const { buffer } of pngBuffers) {
  buffer.copy(icoBuffer, pos);
  pos += buffer.length;
}

writeFileSync(ICO_PATH, icoBuffer);

const sizeKB = (totalSize / 1024).toFixed(1);
console.log(`\n✅  favicon.ico generated: ${ICO_PATH}`);
console.log(`   Sizes: ${SIZES.join(", ")} px  |  Total: ${sizeKB} KB`);
console.log("\n   Done! Commit public/favicon.ico to your repository.\n");