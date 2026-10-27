/**
 * Minimal uncompressed 24-bit BMP image generator for testing OCR
 */
const fs = require('fs');

function createSimpleBmp(filePath, text) {
  // Simple 5x7 font for ASCII characters
  const font = {
    'A': [0x1C, 0x22, 0x22, 0x3E, 0x22, 0x22, 0x22],
    'B': [0x3C, 0x22, 0x22, 0x3C, 0x22, 0x22, 0x3C],
    'C': [0x1E, 0x20, 0x20, 0x20, 0x20, 0x20, 0x1E],
    'E': [0x3E, 0x20, 0x20, 0x3C, 0x20, 0x20, 0x3E],
    'G': [0x1E, 0x20, 0x20, 0x2E, 0x22, 0x22, 0x1E],
    'M': [0x22, 0x36, 0x2A, 0x22, 0x22, 0x22, 0x22],
    'N': [0x22, 0x32, 0x2A, 0x26, 0x22, 0x22, 0x22],
    'R': [0x3C, 0x22, 0x22, 0x3C, 0x28, 0x24, 0x22],
    'S': [0x1E, 0x20, 0x20, 0x1C, 0x02, 0x02, 0x3C],
    'T': [0x3E, 0x08, 0x08, 0x08, 0x08, 0x08, 0x08],
    'U': [0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x1C],
    ' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
  };

  const scale = 5; // 5x scale for clear OCR recognition
  const charWidth = 6 * scale;
  const charHeight = 8 * scale;
  const paddingX = 20;
  const paddingY = 20;

  const width = paddingX * 2 + text.length * charWidth;
  const height = paddingY * 2 + charHeight;

  // BMP rows must be padded to a multiple of 4 bytes
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buffer = Buffer.alloc(fileSize, 0xFF); // Initialize with white (0xFF)

  // BMP Header (14 bytes)
  buffer.write('BM', 0); // Signature
  buffer.writeUInt32LE(fileSize, 2);
  buffer.writeUInt32LE(0, 6); // Reserved
  buffer.writeUInt32LE(54, 10); // Offset to pixel data

  // DIB Header (BITMAPINFOHEADER - 40 bytes)
  buffer.writeUInt32LE(40, 14); // Header size
  buffer.writeInt32LE(width, 18); // Width
  buffer.writeInt32LE(height, 22); // Height (positive: bottom-to-top)
  buffer.writeUInt16LE(1, 26); // Color planes
  buffer.writeUInt16LE(24, 28); // Bits per pixel (24-bit RGB)
  buffer.writeUInt32LE(0, 30); // Compression (BI_RGB, no compression)
  buffer.writeUInt32LE(pixelArraySize, 34); // Image size
  buffer.writeInt32LE(2835, 38); // Horizontal resolution (72 DPI)
  buffer.writeInt32LE(2835, 42); // Vertical resolution (72 DPI)
  buffer.writeUInt32LE(0, 46); // Colors in palette
  buffer.writeUInt32LE(0, 50); // Important colors

  // Helper to set pixel (black: 0, 0, 0)
  function setPixel(x, y, r, g, b) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    // BMP is bottom-to-top
    const row = height - 1 - y;
    const offset = 54 + row * rowSize + x * 3;
    buffer[offset] = b;
    buffer[offset + 1] = g;
    buffer[offset + 2] = r;
  }

  // Draw characters
  for (let c = 0; c < text.length; c++) {
    const char = text[c].toUpperCase();
    const glyph = font[char] || font[' '];
    const startX = paddingX + c * charWidth;
    const startY = paddingY;

    for (let row = 0; row < 7; row++) {
      const bitRow = glyph[row];
      for (let col = 0; col < 6; col++) {
        if ((bitRow >> (5 - col)) & 1) {
          // Fill scaled block
          for (let sx = 0; sx < scale; sx++) {
            for (let sy = 0; sy < scale; sy++) {
              setPixel(startX + col * scale + sx, startY + row * scale + sy, 0, 0, 0);
            }
          }
        }
      }
    }
  }

  fs.writeFileSync(filePath, buffer);
  return { width, height, filePath };
}

module.exports = { createSimpleBmp };

if (require.main === module) {
  const out = createSimpleBmp('test/test-sample.bmp', 'URGENT SCAM');
  console.log(`Generated test BMP: ${out.filePath} (${out.width}x${out.height})`);
}
