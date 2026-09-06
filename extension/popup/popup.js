/**
 * Genshin Map Zoom Extender - Popup Logic with i18n
 */
(function() {
  'use strict';

  const browserApi = (typeof browser !== 'undefined') ? browser : chrome;

  const TRANSLATIONS = {
    en: {
      enable: 'Extended zoom enabled',
      maxZoom: 'Maximum zoom:',
      imageFilter: 'Image filter (upscaling):',
      smooth: 'Smooth (Bilinear - Recommended)',
      sharp: 'Sharp (Pixelated)',
      language: 'Language:',
      langAuto: 'Auto (Browser)',
      showHud: 'Show HUD on screen',
      resetDefaults: 'Reset defaults',
      footer: 'For genshin-impact-map.appsample.com'
    },
    'pt-BR': {
      enable: 'Zoom estendido ativado',
      maxZoom: 'Zoom máximo:',
      imageFilter: 'Filtro de imagem (upscaling):',
      smooth: 'Suave (Bilinear - Recomendado)',
      sharp: 'Nítido (Pixelado)',
      language: 'Idioma:',
      langAuto: 'Automático (Navegador)',
      showHud: 'Exibir indicador (HUD) na tela',
      resetDefaults: 'Resetar padrões',
      footer: 'Para genshin-impact-map.appsample.com'
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

  const DEFAULT_CONFIG = {
    enabled: true,
    maxZoom: 20,
    renderingMode: 'auto',
    showHud: true,
    language: 'auto'
  };

  const STORAGE_KEY = 'genshin_map_zoom_config';

  // DOM Elements
  const enableToggle = document.getElementById('enable-toggle');
  const maxZoomSlider = document.getElementById('max-zoom-slider');
  const maxZoomVal = document.getElementById('max-zoom-val');
  const renderModeSelect = document.getElementById('render-mode-select');
  const langSelect = document.getElementById('lang-select');
  const hudToggle = document.getElementById('hud-toggle');
  const btnReset = document.getElementById('btn-reset');
  const settingsCard = document.getElementById('settings-card');

  const lblEnable = document.getElementById('lbl-enable');
  const lblMaxZoom = document.getElementById('lbl-max-zoom');
  const lblRenderMode = document.getElementById('lbl-render-mode');
  const optSmooth = document.getElementById('opt-smooth');
  const optSharp = document.getElementById('opt-sharp');
  const lblLanguage = document.getElementById('lbl-language');
  const optLangAuto = document.getElementById('opt-lang-auto');
  const lblHud = document.getElementById('lbl-hud');

  let currentConfig = Object.assign({}, DEFAULT_CONFIG);

  function applyTranslations() {
    const lang = getEffectiveLang(currentConfig.language);
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;

    if (lblEnable) lblEnable.textContent = dict.enable;
    if (lblMaxZoom) lblMaxZoom.textContent = dict.maxZoom;
    if (lblRenderMode) lblRenderMode.textContent = dict.imageFilter;
    if (optSmooth) optSmooth.textContent = dict.smooth;
    if (optSharp) optSharp.textContent = dict.sharp;
    if (lblLanguage) lblLanguage.textContent = dict.language;
    if (optLangAuto) optLangAuto.textContent = dict.langAuto;
    if (lblHud) lblHud.textContent = dict.showHud;
    if (btnReset) btnReset.textContent = dict.resetDefaults;
  }

  function updateUi(cfg) {
    enableToggle.checked = cfg.enabled;
    maxZoomSlider.value = cfg.maxZoom;
    maxZoomVal.textContent = cfg.maxZoom;
    renderModeSelect.value = cfg.renderingMode;
    langSelect.value = cfg.language || 'auto';
    hudToggle.checked = cfg.showHud;

    settingsCard.style.opacity = cfg.enabled ? '1' : '0.5';
    settingsCard.style.pointerEvents = cfg.enabled ? 'auto' : 'none';

    applyTranslations();
  }

  function saveAndNotify() {
    if (browserApi.storage && browserApi.storage.local) {
      browserApi.storage.local.set({
        [STORAGE_KEY]: currentConfig
      });
    }

    browserApi.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        browserApi.tabs.sendMessage(tabs[0].id, {
          type: 'GMZ_POPUP_SET_CONFIG',
          config: currentConfig
        }, () => {
          if (browserApi.runtime.lastError) {}
        });
      }
    });

    applyTranslations();
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

  langSelect.addEventListener('change', (e) => {
    currentConfig.language = e.target.value;
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
