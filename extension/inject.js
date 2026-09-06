/**
 * Genshin Map Zoom Extender - Core Injection Script
 * Injected into the page execution context (Main World)
 * Author: Hylex & Antigravity
 */
(function() {
  'use strict';

  if (window.__genshinMapZoomInjected) return;
  window.__genshinMapZoomInjected = true;

  console.log('[GenshinMapZoom] Extension engine initializing...');

  // ==========================================
  // Internationalization (i18n)
  // ==========================================
  const TRANSLATIONS = {
    en: {
      zoom: 'Zoom',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      resetZoom: 'Reset zoom (11)',
      settings: 'Zoom settings',
      maxZoom: 'Maximum zoom:',
      imageFilter: 'Image filter:',
      smooth: 'Smooth (Bilinear - Recommended)',
      sharp: 'Sharp (Pixelated)',
      extendedZoom: 'Extended zoom enabled',
      language: 'Language:',
      langAuto: 'Auto (Browser)',
      langEn: 'English',
      langPt: 'Português',
      showHud: 'Show HUD on screen',
      resetDefaults: 'Reset defaults',
      recLabel: 'Recommended'
    },
    'pt-BR': {
      zoom: 'Zoom',
      zoomIn: 'Aumentar zoom',
      zoomOut: 'Diminuir zoom',
      resetZoom: 'Resetar zoom (11)',
      settings: 'Configurações de zoom',
      maxZoom: 'Zoom máximo:',
      imageFilter: 'Filtro de imagem:',
      smooth: 'Suave (Bilinear - Recomendado)',
      sharp: 'Nítido (Pixelado)',
      extendedZoom: 'Zoom estendido ativado',
      language: 'Idioma:',
      langAuto: 'Automático (Navegador)',
      langEn: 'English',
      langPt: 'Português',
      showHud: 'Exibir indicador (HUD) na tela',
      resetDefaults: 'Resetar padrões',
      recLabel: 'Recomendado'
    }
  };

  function getEffectiveLang(pref) {
    if (pref && pref !== 'auto' && TRANSLATIONS[pref]) {
      return pref;
    }
    const bl = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    if (bl.startsWith('pt')) return 'pt-BR';
    return 'en';
  }

  function t(key) {
    const lang = getEffectiveLang(config.language);
    const table = TRANSLATIONS[lang] || TRANSLATIONS.en;
    return table[key] || TRANSLATIONS.en[key] || key;
  }

  // Configuration with localStorage persistence
  const STORAGE_KEY = 'genshin_map_zoom_config';
  const DEFAULT_CONFIG = {
    enabled: true,
    maxZoom: 20,
    renderingMode: 'auto', // 'auto' (bilinear smooth) or 'pixelated' (crisp)
    showHud: true,
    language: 'auto' // 'auto', 'en', 'pt-BR'
  };

  function loadConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return Object.assign({}, DEFAULT_CONFIG, JSON.parse(saved));
      }
    } catch (e) {
      console.warn('[GenshinMapZoom] Could not load stored config:', e);
    }
    return Object.assign({}, DEFAULT_CONFIG);
  }

  function saveConfig(cfg) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch (e) {
      console.warn('[GenshinMapZoom] Could not save config:', e);
    }
  }

  let config = loadConfig();

  // Reference to active map instance
  window.__genshinMap = null;

  /**
   * Apply maxZoom setting to current map
   */
  function applyMaxZoomToMap() {
    if (!window.__genshinMap) return;
    const currentMax = config.enabled ? config.maxZoom : 15;
    window.__genshinMap.setOptions({ maxZoom: currentMax });
    console.log('[GenshinMapZoom] Applied maxZoom:', currentMax);
  }

  /**
   * Update rendering mode for all active custom tiles
   */
  function applyRenderingMode() {
    const mode = config.renderingMode === 'pixelated' ? 'pixelated' : 'auto';
    const customImgs = document.querySelectorAll('img[data-gmz-custom-tile="true"]');
    customImgs.forEach(img => {
      img.style.imageRendering = mode;
    });
  }

  // ==========================================
  // Safe Google Maps Interception
  // ==========================================

  function wrapMapConstructor(maps) {
    if (!maps || typeof maps.Map !== 'function' || maps.Map.__gmzWrapped) return;

    const OrigMap = maps.Map;
    const WrappedMap = function(container, options) {
      options = options || {};
      const targetMax = config.enabled ? config.maxZoom : (options.maxZoom || 15);
      options.maxZoom = targetMax;

      console.log('[GenshinMapZoom] Map created with maxZoom:', targetMax);
      const mapInstance = new OrigMap(container, options);
      window.__genshinMap = mapInstance;

      const origSetOptions = mapInstance.setOptions;
      mapInstance.setOptions = function(newOpts) {
        if (newOpts && config.enabled) {
          newOpts.maxZoom = config.maxZoom;
        }
        return origSetOptions.call(this, newOpts);
      };

      mapInstance.addListener('zoom_changed', updateHud);
      mapInstance.addListener('idle', updateHud);
      setTimeout(updateHud, 200);

      return mapInstance;
    };

    WrappedMap.prototype = OrigMap.prototype;
    try {
      for (const key of Object.getOwnPropertyNames(OrigMap)) {
        if (!(key in WrappedMap)) {
          WrappedMap[key] = OrigMap[key];
        }
      }
    } catch (e) {}

    WrappedMap.__gmzWrapped = true;
    maps.Map = WrappedMap;
    console.log('[GenshinMapZoom] Hooked google.maps.Map successfully.');
  }

  function wrapImageMapTypeConstructor(maps) {
    if (!maps || typeof maps.ImageMapType !== 'function' || maps.ImageMapType.__gmzWrapped) return;

    const OrigImageMapType = maps.ImageMapType;
    const WrappedImageMapType = function(options) {
      options = options || {};
      const nativeMax = options.maxZoom || 15;
      const origGetUrl = options.getTileUrl;
      const tileSize = options.tileSize ? (options.tileSize.width || 256) : 256;

      options.maxZoom = config.enabled ? Math.max(config.maxZoom, nativeMax + 6) : nativeMax;

      const layerInstance = new OrigImageMapType(options);
      layerInstance._gmzNativeMaxZoom = nativeMax;
      layerInstance._gmzOrigGetTileUrl = origGetUrl;
      layerInstance._gmzTileSize = tileSize;
      layerInstance._gmzCustomTiles = new Set();

      console.log(`[GenshinMapZoom] ImageMapType created: nativeMaxZoom=${nativeMax}, layerMaxZoom=${options.maxZoom}`);
      return layerInstance;
    };

    WrappedImageMapType.prototype = OrigImageMapType.prototype;
    try {
      for (const key of Object.getOwnPropertyNames(OrigImageMapType)) {
        if (!(key in WrappedImageMapType)) {
          WrappedImageMapType[key] = OrigImageMapType[key];
        }
      }
    } catch (e) {}

    WrappedImageMapType.__gmzWrapped = true;
    maps.ImageMapType = WrappedImageMapType;

    if (!OrigImageMapType.prototype.__gmzTilePatched) {
      OrigImageMapType.prototype.__gmzTilePatched = true;

      const origGetTile = OrigImageMapType.prototype.getTile;
      const origReleaseTile = OrigImageMapType.prototype.releaseTile;
      const origOpacityChanged = OrigImageMapType.prototype.opacity_changed;

      OrigImageMapType.prototype.getTile = function(coord, zoom, ownerDocument) {
        const nativeMax = this._gmzNativeMaxZoom || 15;

        if (!config.enabled || zoom <= nativeMax) {
          return origGetTile.call(this, coord, zoom, ownerDocument);
        }

        const doc = ownerDocument || document;
        const ts = this._gmzTileSize || 256;

        const div = doc.createElement('div');
        div.style.width = ts + 'px';
        div.style.height = ts + 'px';
        div.style.overflow = 'hidden';
        div.style.position = 'relative';

        const k = zoom - nativeMax;
        const scale = 1 << k;
        const parentX = Math.floor(coord.x / scale);
        const parentY = Math.floor(coord.y / scale);
        const dx = coord.x - parentX * scale;
        const dy = coord.y - parentY * scale;

        let parentUrl = null;
        if (typeof this._gmzOrigGetTileUrl === 'function') {
          parentUrl = this._gmzOrigGetTileUrl({ x: parentX, y: parentY }, nativeMax);
        }

        if (!parentUrl) {
          return div;
        }

        const img = doc.createElement('img');
        img.src = parentUrl;
        img.setAttribute('data-gmz-custom-tile', 'true');
        img.style.position = 'absolute';
        img.style.width = (ts * scale) + 'px';
        img.style.height = (ts * scale) + 'px';
        img.style.left = ((-dx * ts) || 0) + 'px';
        img.style.top = ((-dy * ts) || 0) + 'px';
        img.style.maxWidth = 'none';
        img.style.maxHeight = 'none';
        img.style.pointerEvents = 'none';
        img.style.userSelect = 'none';
        img.style.imageRendering = config.renderingMode === 'pixelated' ? 'pixelated' : 'auto';
        img.decoding = 'async';

        const curOpacity = typeof this.get === 'function' ? this.get('opacity') : 1;
        div.style.opacity = typeof curOpacity === 'number' ? curOpacity : 1;

        div.appendChild(img);
        div.__gmzIsCustomTile = true;
        div.__gmzImg = img;

        if (!this._gmzCustomTiles) this._gmzCustomTiles = new Set();
        this._gmzCustomTiles.add(div);

        img.onload = () => {
          if (maps.event && maps.event.trigger) {
            maps.event.trigger(div, 'load');
          }
        };

        return div;
      };

      OrigImageMapType.prototype.releaseTile = function(tile) {
        if (tile && tile.__gmzIsCustomTile) {
          if (this._gmzCustomTiles) {
            this._gmzCustomTiles.delete(tile);
          }
          if (tile.__gmzImg) {
            tile.__gmzImg.src = '';
          }
          if (tile.parentNode) {
            tile.parentNode.removeChild(tile);
          }
          return;
        }
        return origReleaseTile.call(this, tile);
      };

      OrigImageMapType.prototype.opacity_changed = function() {
        if (origOpacityChanged) origOpacityChanged.call(this);
        if (this._gmzCustomTiles) {
          const op = typeof this.get === 'function' ? this.get('opacity') : 1;
          const opVal = typeof op === 'number' ? op : 1;
          for (const tile of this._gmzCustomTiles) {
            tile.style.opacity = opVal;
          }
        }
      };
    }

    console.log('[GenshinMapZoom] Hooked google.maps.ImageMapType successfully.');
  }

  function tryHook(maps) {
    if (!maps) return;
    if (typeof maps.Map === 'function' && !maps.Map.__gmzWrapped) {
      wrapMapConstructor(maps);
    }
    if (typeof maps.ImageMapType === 'function' && !maps.ImageMapType.__gmzWrapped) {
      wrapImageMapTypeConstructor(maps);
    }
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
    hookProperty(maps, 'ImageMapType', () => wrapImageMapTypeConstructor(maps));
  }

  function observeGoogle(googleObj) {
    if (!googleObj) return;
    if (googleObj.maps) {
      observeMaps(googleObj.maps);
    }
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

  function startMonitoring() {
    let _google = window.google;
    if (_google) {
      observeGoogle(_google);
    }
    try {
      Object.defineProperty(window, 'google', {
        configurable: true,
        enumerable: true,
        get: () => _google,
        set: (newGoogle) => {
          _google = newGoogle;
          observeGoogle(newGoogle);
        }
      });
    } catch (e) {}

    const poll = setInterval(() => {
      if (window.google && window.google.maps) {
        tryHook(window.google.maps);
        if (window.google.maps.Map?.__gmzWrapped && window.google.maps.ImageMapType?.__gmzWrapped) {
          clearInterval(poll);
        }
      }
    }, 30);
    setTimeout(() => clearInterval(poll), 15000);
  }

  // ==========================================
  // On-Screen HUD (Visual Zoom Indicator)
  // ==========================================
  let hudContainer = null;
  let hudZoomLabel = null;

  function createHud() {
    if (document.getElementById('gmz-hud')) return;

    hudContainer = document.createElement('div');
    hudContainer.id = 'gmz-hud';
    hudContainer.innerHTML = `
      <div class="gmz-hud-bar">
        <span class="gmz-hud-icon">🔍</span>
        <span class="gmz-hud-zoom" id="gmz-hud-zoom-text">Zoom: --</span>
        <div class="gmz-hud-actions">
          <button type="button" class="gmz-btn" id="gmz-btn-out">−</button>
          <button type="button" class="gmz-btn" id="gmz-btn-in">+</button>
          <button type="button" class="gmz-btn" id="gmz-btn-reset">⟲</button>
          <button type="button" class="gmz-btn gmz-btn-gear" id="gmz-btn-menu">⚙</button>
        </div>
      </div>
      <div class="gmz-hud-menu" id="gmz-hud-menu" style="display: none;">
        <div class="gmz-menu-row">
          <label id="gmz-lbl-max">Maximum zoom:</label>
          <select id="gmz-select-max">
            <option value="16">16 (2x)</option>
            <option value="17">17 (4x)</option>
            <option value="18">18 (8x)</option>
            <option value="19">19 (16x)</option>
            <option value="20" selected>20 (32x)</option>
            <option value="21">21 (64x)</option>
            <option value="22">22 (128x)</option>
          </select>
        </div>
        <div class="gmz-menu-row">
          <label id="gmz-lbl-render">Image filter:</label>
          <select id="gmz-select-render">
            <option value="auto" id="gmz-opt-smooth">Smooth (Bilinear)</option>
            <option value="pixelated" id="gmz-opt-sharp">Sharp (Pixelated)</option>
          </select>
        </div>
        <div class="gmz-menu-row">
          <label id="gmz-lbl-lang">Language:</label>
          <select id="gmz-select-lang">
            <option value="auto">Auto</option>
            <option value="en">English</option>
            <option value="pt-BR">Português</option>
          </select>
        </div>
        <div class="gmz-menu-row gmz-menu-check">
          <label>
            <input type="checkbox" id="gmz-check-enabled" checked />
            <span id="gmz-lbl-enabled">Extended zoom enabled</span>
          </label>
        </div>
      </div>
    `;

    // Inject HUD CSS
    const style = document.createElement('style');
    style.id = 'gmz-hud-style';
    style.textContent = `
      #gmz-hud {
        position: fixed;
        bottom: 24px;
        right: 80px;
        z-index: 99999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        user-select: none;
      }
      .gmz-hud-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(22, 27, 34, 0.92);
        color: #e6edf3;
        padding: 6px 12px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
        border: 1px solid rgba(240, 246, 252, 0.15);
        backdrop-filter: blur(6px);
      }
      .gmz-hud-icon {
        font-size: 14px;
      }
      .gmz-hud-zoom {
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        min-width: 85px;
        color: #58a6ff;
      }
      .gmz-hud-actions {
        display: flex;
        gap: 4px;
      }
      .gmz-btn {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #f0f6fc;
        padding: 2px 8px;
        font-size: 13px;
        font-weight: bold;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.15s ease;
        line-height: 1.4;
      }
      .gmz-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: #58a6ff;
        color: #58a6ff;
      }
      .gmz-btn:active {
        transform: scale(0.95);
      }
      .gmz-hud-menu {
        margin-top: 6px;
        background: rgba(22, 27, 34, 0.96);
        border: 1px solid rgba(240, 246, 252, 0.2);
        border-radius: 8px;
        padding: 10px 12px;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
        color: #c9d1d9;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .gmz-menu-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        font-size: 12px;
      }
      .gmz-menu-row select {
        background: #0d1117;
        color: #f0f6fc;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 3px 6px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
      }
      .gmz-menu-check label {
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(hudContainer);

    hudZoomLabel = document.getElementById('gmz-hud-zoom-text');

    // Button event listeners
    document.getElementById('gmz-btn-in').addEventListener('click', () => {
      if (window.__genshinMap) {
        const cur = window.__genshinMap.getZoom() || 11;
        const max = config.enabled ? config.maxZoom : 15;
        if (cur < max) {
          window.__genshinMap.setZoom(cur + 1);
        }
      } else if (typeof window._mapSetZoom === 'function') {
        window._mapSetZoom('in');
      }
    });

    document.getElementById('gmz-btn-out').addEventListener('click', () => {
      if (window.__genshinMap) {
        const cur = window.__genshinMap.getZoom() || 11;
        if (cur > 10) {
          window.__genshinMap.setZoom(cur - 1);
        }
      } else if (typeof window._mapSetZoom === 'function') {
        window._mapSetZoom('out');
      }
    });

    document.getElementById('gmz-btn-reset').addEventListener('click', () => {
      if (window.__genshinMap) {
        window.__genshinMap.setZoom(11);
      }
    });

    const menuEl = document.getElementById('gmz-hud-menu');
    document.getElementById('gmz-btn-menu').addEventListener('click', () => {
      menuEl.style.display = menuEl.style.display === 'none' ? 'flex' : 'none';
    });

    // Menu options sync
    const selectMax = document.getElementById('gmz-select-max');
    const selectRender = document.getElementById('gmz-select-render');
    const selectLang = document.getElementById('gmz-select-lang');
    const checkEnabled = document.getElementById('gmz-check-enabled');

    selectMax.value = String(config.maxZoom);
    selectRender.value = config.renderingMode;
    selectLang.value = config.language || 'auto';
    checkEnabled.checked = config.enabled;

    selectMax.addEventListener('change', (e) => {
      config.maxZoom = parseInt(e.target.value, 10);
      saveConfig(config);
      applyMaxZoomToMap();
      updateHud();
      broadcastConfig();
    });

    selectRender.addEventListener('change', (e) => {
      config.renderingMode = e.target.value;
      saveConfig(config);
      applyRenderingMode();
      broadcastConfig();
    });

    selectLang.addEventListener('change', (e) => {
      config.language = e.target.value;
      saveConfig(config);
      updateHudI18n();
      updateHud();
      broadcastConfig();
    });

    checkEnabled.addEventListener('change', (e) => {
      config.enabled = e.target.checked;
      saveConfig(config);
      applyMaxZoomToMap();
      updateHud();
      broadcastConfig();
    });

    updateHudI18n();
    updateHud();
  }

  function updateHudI18n() {
    const btnOut = document.getElementById('gmz-btn-out');
    const btnIn = document.getElementById('gmz-btn-in');
    const btnReset = document.getElementById('gmz-btn-reset');
    const btnMenu = document.getElementById('gmz-btn-menu');
    const lblMax = document.getElementById('gmz-lbl-max');
    const lblRender = document.getElementById('gmz-lbl-render');
    const lblLang = document.getElementById('gmz-lbl-lang');
    const lblEnabled = document.getElementById('gmz-lbl-enabled');
    const optSmooth = document.getElementById('gmz-opt-smooth');
    const optSharp = document.getElementById('gmz-opt-sharp');

    if (btnOut) btnOut.title = t('zoomOut');
    if (btnIn) btnIn.title = t('zoomIn');
    if (btnReset) btnReset.title = t('resetZoom');
    if (btnMenu) btnMenu.title = t('settings');
    if (lblMax) lblMax.textContent = t('maxZoom');
    if (lblRender) lblRender.textContent = t('imageFilter');
    if (lblLang) lblLang.textContent = t('language');
    if (lblEnabled) lblEnabled.textContent = t('extendedZoom');
    if (optSmooth) optSmooth.textContent = t('smooth');
    if (optSharp) optSharp.textContent = t('sharp');
  }

  function updateHud() {
    if (!hudZoomLabel) {
      hudZoomLabel = document.getElementById('gmz-hud-zoom-text');
    }
    if (!hudZoomLabel) return;

    if (!config.showHud) {
      if (hudContainer) hudContainer.style.display = 'none';
      return;
    } else if (hudContainer) {
      hudContainer.style.display = 'block';
    }

    let curZoom = '--';
    if (window.__genshinMap && typeof window.__genshinMap.getZoom === 'function') {
      curZoom = window.__genshinMap.getZoom();
    }
    const maxZoom = config.enabled ? config.maxZoom : 15;
    hudZoomLabel.textContent = `${t('zoom')}: ${curZoom} / ${maxZoom}`;
  }

  function broadcastConfig() {
    window.postMessage({
      type: 'GMZ_CONFIG_UPDATED',
      config: config
    }, '*');
  }

  // Handle messages from content script / extension popup
  window.addEventListener('message', (event) => {
    if (!event.data || !event.data.type) return;

    if (event.data.type === 'GMZ_SET_CONFIG') {
      config = Object.assign({}, config, event.data.config);
      saveConfig(config);
      applyMaxZoomToMap();
      applyRenderingMode();
      updateHudI18n();
      updateHud();

      // Sync menu elements if open
      const selectMax = document.getElementById('gmz-select-max');
      const selectRender = document.getElementById('gmz-select-render');
      const selectLang = document.getElementById('gmz-select-lang');
      const checkEnabled = document.getElementById('gmz-check-enabled');
      if (selectMax) selectMax.value = String(config.maxZoom);
      if (selectRender) selectRender.value = config.renderingMode;
      if (selectLang) selectLang.value = config.language || 'auto';
      if (checkEnabled) checkEnabled.checked = config.enabled;
    } else if (event.data.type === 'GMZ_GET_STATUS') {
      broadcastConfig();
    }
  });

  // Start observing Google Maps lifecycle
  startMonitoring();

  // Create HUD when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createHud);
  } else {
    createHud();
  }

  console.log('[GenshinMapZoom] Safe injection completed.');
})();
