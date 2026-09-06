/**
 * Genshin Map Zoom Extender - Popup Logic
 */
(function() {
  'use strict';

  const browserApi = (typeof browser !== 'undefined') ? browser : chrome;

  const DEFAULT_CONFIG = {
    enabled: true,
    maxZoom: 20,
    renderingMode: 'auto',
    showHud: true
  };

  const STORAGE_KEY = 'genshin_map_zoom_config';

  // DOM Elements
  const enableToggle = document.getElementById('enable-toggle');
  const maxZoomSlider = document.getElementById('max-zoom-slider');
  const maxZoomVal = document.getElementById('max-zoom-val');
  const renderModeSelect = document.getElementById('render-mode-select');
  const hudToggle = document.getElementById('hud-toggle');
  const btnReset = document.getElementById('btn-reset');
  const settingsCard = document.getElementById('settings-card');

  let currentConfig = Object.assign({}, DEFAULT_CONFIG);

  function updateUi(cfg) {
    enableToggle.checked = cfg.enabled;
    maxZoomSlider.value = cfg.maxZoom;
    maxZoomVal.textContent = cfg.maxZoom;
    renderModeSelect.value = cfg.renderingMode;
    hudToggle.checked = cfg.showHud;

    settingsCard.style.opacity = cfg.enabled ? '1' : '0.5';
    settingsCard.style.pointerEvents = cfg.enabled ? 'auto' : 'none';
  }

  function saveAndNotify() {
    // Save to storage
    if (browserApi.storage && browserApi.storage.local) {
      browserApi.storage.local.set({
        [STORAGE_KEY]: currentConfig
      });
    }

    // Send message to active tab
    browserApi.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        browserApi.tabs.sendMessage(tabs[0].id, {
          type: 'GMZ_POPUP_SET_CONFIG',
          config: currentConfig
        }, () => {
          // Ignore runtime errors if tab is not genshin map
          if (browserApi.runtime.lastError) {}
        });
      }
    });
  }

  // Load stored settings
  if (browserApi.storage && browserApi.storage.local) {
    browserApi.storage.local.get([STORAGE_KEY], (res) => {
      if (res && res[STORAGE_KEY]) {
        currentConfig = Object.assign({}, DEFAULT_CONFIG, res[STORAGE_KEY]);
      }
      updateUi(currentConfig);
    });
  } else {
    updateUi(currentConfig);
  }

  // Event Listeners
  enableToggle.addEventListener('change', (e) => {
    currentConfig.enabled = e.target.checked;
    updateUi(currentConfig);
    saveAndNotify();
  });

  maxZoomSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    maxZoomVal.textContent = val;
    currentConfig.maxZoom = val;
  });

  maxZoomSlider.addEventListener('change', (e) => {
    const val = parseInt(e.target.value, 10);
    currentConfig.maxZoom = val;
    saveAndNotify();
  });

  renderModeSelect.addEventListener('change', (e) => {
    currentConfig.renderingMode = e.target.value;
    saveAndNotify();
  });

  hudToggle.addEventListener('change', (e) => {
    currentConfig.showHud = e.target.checked;
    saveAndNotify();
  });

  btnReset.addEventListener('click', () => {
    currentConfig = Object.assign({}, DEFAULT_CONFIG);
    updateUi(currentConfig);
    saveAndNotify();
  });

})();
