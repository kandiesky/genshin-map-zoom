/**
 * Test Google Maps asynchronous loading and hook lifecycle simulation
 */
const assert = require('assert');

// Simulate a mock window
const mockWindow = {};

// Our robust observer implementation
function setupObserver(win) {
  let targetMap = null;
  let targetImageMapType = null;

  function wrapMapConstructor(maps) {
    if (typeof maps.Map !== 'function' || maps.Map.__gmzWrapped) return;
    const OrigMap = maps.Map;
    const WrappedMap = function(container, options) {
      const inst = new OrigMap(container, options);
      return inst;
    };
    WrappedMap.prototype = OrigMap.prototype;
    WrappedMap.__gmzWrapped = true;
    maps.Map = WrappedMap;
  }

  function wrapImageMapType(maps) {
    if (typeof maps.ImageMapType !== 'function' || maps.ImageMapType.__gmzWrapped) return;
    const OrigImageMapType = maps.ImageMapType;
    const WrappedImageMapType = function(options) {
      const inst = new OrigImageMapType(options);
      return inst;
    };
    WrappedImageMapType.prototype = OrigImageMapType.prototype;
    WrappedImageMapType.__gmzWrapped = true;
    maps.ImageMapType = WrappedImageMapType;
  }

  function tryHook(maps) {
    if (!maps) return;
    if (typeof maps.Map === 'function') wrapMapConstructor(maps);
    if (typeof maps.ImageMapType === 'function') wrapImageMapType(maps);
  }

  function hookProperty(obj, prop, onSet) {
    let val = obj[prop];
    if (typeof val === 'function') {
      onSet(val);
      return;
    }
    try {
      Object.defineProperty(obj, prop, {
        configurable: true,
        enumerable: true,
        get: () => val,
        set: (newVal) => {
          val = newVal;
          if (typeof newVal === 'function') {
            onSet(newVal);
          }
        }
      });
    } catch (e) {}
  }

  function observeMaps(maps) {
    if (!maps) return;
    tryHook(maps);
    hookProperty(maps, 'Map', () => wrapMapConstructor(maps));
    hookProperty(maps, 'ImageMapType', () => wrapImageMapType(maps));
  }

  function observeGoogle(googleObj) {
    if (!googleObj) return;
    if (googleObj.maps) observeMaps(googleObj.maps);
    let _maps = googleObj.maps;
    try {
      Object.defineProperty(googleObj, 'maps', {
        configurable: true,
        enumerable: true,
        get: () => _maps,
        set: (newMaps) => {
          _maps = newMaps;
          observeMaps(newMaps);
        }
      });
    } catch (e) {}
  }

  let _google = win.google;
  if (_google) observeGoogle(_google);
  try {
    Object.defineProperty(win, 'google', {
      configurable: true,
      enumerable: true,
      get: () => _google,
      set: (newGoogle) => {
        _google = newGoogle;
        observeGoogle(newGoogle);
      }
    });
  } catch (e) {}

  return { tryHook };
}

// TEST 1: Google Maps loader sets empty google.maps, then loads Map and ImageMapType later
console.log('--- TEST 1: Step-by-step asynchronous loader simulation ---');
const win1 = {};
const observer1 = setupObserver(win1);

// Step A: Loader creates window.google = {}
win1.google = {};
assert(win1.google !== undefined);

// Step B: Loader creates window.google.maps = {} (empty object)
win1.google.maps = {};
assert(win1.google.maps !== undefined);
assert(!win1.google.maps.Map); // Undefined, no crash!

// Step C: Maps API script arrives and assigns Map and ImageMapType
function FakeMap(elem, opts) { this.elem = elem; this.opts = opts; }
FakeMap.prototype.getZoom = function() { return 11; };

function FakeImageMapType(opts) { this.opts = opts; }
FakeImageMapType.prototype.getTile = function() { return 'tile'; };

win1.google.maps.Map = FakeMap;
win1.google.maps.ImageMapType = FakeImageMapType;

// Verify they were wrapped!
assert.strictEqual(win1.google.maps.Map.__gmzWrapped, true, 'Map should be wrapped');
assert.strictEqual(win1.google.maps.ImageMapType.__gmzWrapped, true, 'ImageMapType should be wrapped');

// Test instantiation
const mapInst = new win1.google.maps.Map('div', { zoom: 11 });
assert.strictEqual(mapInst.opts.zoom, 11);
assert.strictEqual(mapInst.getZoom(), 11);

const layerInst = new win1.google.maps.ImageMapType({ maxZoom: 15 });
assert.strictEqual(layerInst.getTile(), 'tile');
console.log('PASSED: Step-by-step loading works without errors!');

// TEST 2: Google Maps script creates entire object at once
console.log('--- TEST 2: All-at-once assignment ---');
const win2 = {};
setupObserver(win2);

win2.google = {
  maps: {
    Map: FakeMap,
    ImageMapType: FakeImageMapType
  }
};

assert.strictEqual(win2.google.maps.Map.__gmzWrapped, true);
assert.strictEqual(win2.google.maps.ImageMapType.__gmzWrapped, true);
console.log('PASSED: All-at-once assignment works!');

console.log('\nAll lifecycle tests passed! ✨');
