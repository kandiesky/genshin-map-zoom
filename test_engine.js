/**
 * Automated test suite for Genshin Map Zoom Extender logic
 */
const assert = require('assert');

console.log('--- Running Tests for Tile Coordinate Upscaler ---');

function computeUpscaledTile(coord, zoom, nativeMax) {
  const k = zoom - nativeMax;
  assert(k > 0, 'Zoom must be greater than nativeMax');
  const scale = 1 << k;
  const parentX = Math.floor(coord.x / scale);
  const parentY = Math.floor(coord.y / scale);
  const dx = coord.x - parentX * scale;
  const dy = coord.y - parentY * scale;

  return {
    k,
    scale,
    parentX,
    parentY,
    dx,
    dy,
    imgWidth: 256 * scale,
    imgHeight: 256 * scale,
    imgLeft: (-dx * 256) || 0,
    imgTop: (-dy * 256) || 0
  };
}

// Test 1: 1 level above native max (zoom 16 from 15) -> 2x2 grid
console.log('Test 1: Zoom 16 from native 15 (2x scale)');
{
  const res0 = computeUpscaledTile({ x: 200, y: 100 }, 16, 15);
  assert.strictEqual(res0.scale, 2);
  assert.strictEqual(res0.parentX, 100);
  assert.strictEqual(res0.parentY, 50);
  assert.strictEqual(res0.dx, 0);
  assert.strictEqual(res0.dy, 0);
  assert.strictEqual(res0.imgLeft, 0);
  assert.strictEqual(res0.imgTop, 0);

  const res1 = computeUpscaledTile({ x: 201, y: 101 }, 16, 15);
  assert.strictEqual(res1.parentX, 100);
  assert.strictEqual(res1.parentY, 50);
  assert.strictEqual(res1.dx, 1);
  assert.strictEqual(res1.dy, 1);
  assert.strictEqual(res1.imgLeft, -256);
  assert.strictEqual(res1.imgTop, -256);
  console.log('  PASSED: Quadrants correctly map to parent tile');
}

// Test 2: 5 levels above native max (zoom 20 from 15) -> 32x scale
console.log('Test 2: Zoom 20 from native 15 (32x scale)');
{
  const res = computeUpscaledTile({ x: 3200 + 15, y: 1600 + 7 }, 20, 15);
  assert.strictEqual(res.scale, 32);
  assert.strictEqual(res.parentX, 100);
  assert.strictEqual(res.parentY, 50);
  assert.strictEqual(res.dx, 15);
  assert.strictEqual(res.dy, 7);
  assert.strictEqual(res.imgWidth, 256 * 32);
  assert.strictEqual(res.imgLeft, -15 * 256);
  assert.strictEqual(res.imgTop, -7 * 256);
  console.log('  PASSED: 32x scaling calculates correct sub-pixel offsets');
}

// Test 3: Submap Enkanomiya (native max 13, target zoom 18) -> 32x scale
console.log('Test 3: Enkanomiya native 13 -> zoom 18');
{
  const res = computeUpscaledTile({ x: 64, y: 64 }, 18, 13);
  assert.strictEqual(res.scale, 32);
  assert.strictEqual(res.parentX, 2);
  assert.strictEqual(res.parentY, 2);
  assert.strictEqual(res.dx, 0);
  assert.strictEqual(res.dy, 0);
  console.log('  PASSED: Correct parent calculation on submaps');
}

console.log('\nAll test cases passed successfully! ✨');
