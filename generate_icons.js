const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ -1) >>> 0;
}

function writePng(width, height, rgbaBuffer, outPath) {
  // Scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  let srcOffset = 0;
  let dstOffset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[dstOffset++] = 0; // Filter: None
    rgbaBuffer.copy(scanlines, dstOffset, srcOffset, srcOffset + width * 4);
    srcOffset += width * 4;
    dstOffset += width * 4;
  }

  const compressed = zlib.deflateSync(scanlines);

  // Build PNG chunks
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // No interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crcVal = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crcVal, 8 + len);
    return buf;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  const finalPng = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(outPath, finalPng);
  console.log(`Generated: ${outPath} (${width}x${height}, ${finalPng.length} bytes)`);
}

function drawIcon(size) {
  const buf = Buffer.alloc(size * size * 4);

  // Background: dark Genshin blue rounded rect / circle
  const center = size / 2;
  const radius = size * 0.44;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        // Base gradient (deep slate blue)
        const t = y / size;
        const r = Math.round(18 + t * 15);
        const g = Math.round(28 + t * 25);
        const b = Math.round(45 + t * 40);

        // Border gold ring
        if (dist >= radius - (size * 0.08)) {
          buf[idx] = 212; // Gold #d4af37
          buf[idx + 1] = 175;
          buf[idx + 2] = 55;
          buf[idx + 3] = 255;
        } else {
          buf[idx] = r;
          buf[idx + 1] = g;
          buf[idx + 2] = b;
          buf[idx + 3] = 255;
        }
      } else {
        // Transparent
        buf[idx + 3] = 0;
      }
    }
  }

  // Draw magnifying glass / plus
  // Glass lens center: (center - size*0.08, center - size*0.08)
  const lensX = center - size * 0.08;
  const lensY = center - size * 0.08;
  const lensR = size * 0.22;
  const lensThick = Math.max(1.5, size * 0.06);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - lensX;
      const dy = y - lensY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Lens rim (Cyan / gold accent)
      if (dist <= lensR && dist >= lensR - lensThick) {
        buf[idx] = 88;
        buf[idx + 1] = 166;
        buf[idx + 2] = 255;
        buf[idx + 3] = 255;
      } else if (dist < lensR - lensThick) {
        // Lens glass tint
        buf[idx] = Math.min(255, buf[idx] + 30);
        buf[idx + 1] = Math.min(255, buf[idx + 1] + 50);
        buf[idx + 2] = Math.min(255, buf[idx + 2] + 80);
      }

      // Plus symbol (+) in center of lens
      const px = Math.abs(x - lensX);
      const py = Math.abs(y - lensY);
      const armLen = lensR * 0.55;
      const armThick = Math.max(1, size * 0.04);
      if ((px <= armLen && py <= armThick) || (py <= armLen && px <= armThick)) {
        buf[idx] = 240;
        buf[idx + 1] = 246;
        buf[idx + 2] = 252;
        buf[idx + 3] = 255;
      }

      // Handle of magnifying glass
      // Diagonal line from lens edge towards bottom right
      const hx = x - (lensX + lensR * 0.7);
      const hy = y - (lensY + lensR * 0.7);
      const handleLen = size * 0.28;
      const handleThick = Math.max(1.5, size * 0.06);
      if (hx >= 0 && hy >= 0 && hx <= handleLen && hy <= handleLen) {
        if (Math.abs(hx - hy) <= handleThick) {
          buf[idx] = 212;
          buf[idx + 1] = 175;
          buf[idx + 2] = 55;
          buf[idx + 3] = 255;
        }
      }
    }
  }

  return buf;
}

[16, 48, 128].forEach(size => {
  const buf = drawIcon(size);
  const out = path.join(__dirname, 'extension', 'icons', `icon${size}.png`);
  writePng(size, size, buf, out);
});
