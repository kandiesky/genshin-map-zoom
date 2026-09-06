/**
 * Test i18n dictionary and language resolver
 */
const assert = require('assert');

const TRANSLATIONS = {
  en: {
    zoom: 'Zoom',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    resetZoom: 'Reset zoom (11)',
    settings: 'Zoom settings',
    maxZoom: 'Maximum zoom:',
    imageFilter: 'Image filter (upscaling):',
    smooth: 'Smooth (Bilinear - Recommended)',
    sharp: 'Sharp (Pixelated)',
    extendedZoom: 'Extended zoom enabled',
    language: 'Language:',
    langAuto: 'Auto (Browser)',
    langEn: 'English',
    langPt: 'Português',
    showHud: 'Show HUD on screen',
    resetDefaults: 'Reset defaults',
    recommended: 'Recommended'
  },
  'pt-BR': {
    zoom: 'Zoom',
    zoomIn: 'Aumentar zoom',
    zoomOut: 'Diminuir zoom',
    resetZoom: 'Resetar zoom (11)',
    settings: 'Configurações de zoom',
    maxZoom: 'Zoom máximo:',
    imageFilter: 'Filtro de imagem (upscaling):',
    smooth: 'Suave (Bilinear - Recomendado)',
    sharp: 'Nítido (Pixelado)',
    extendedZoom: 'Zoom estendido ativado',
    language: 'Idioma:',
    langAuto: 'Automático (Navegador)',
    langEn: 'English',
    langPt: 'Português',
    showHud: 'Exibir indicador (HUD) na tela',
    resetDefaults: 'Resetar padrões',
    recommended: 'Recomendado'
  }
};

function getEffectiveLang(pref, browserLang) {
  if (pref && pref !== 'auto' && TRANSLATIONS[pref]) {
    return pref;
  }
  const bl = (browserLang || 'en').toLowerCase();
  if (bl.startsWith('pt')) return 'pt-BR';
  return 'en';
}

function t(key, lang) {
  const table = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return table[key] || TRANSLATIONS.en[key] || key;
}

// Test detection
assert.strictEqual(getEffectiveLang('auto', 'pt-BR'), 'pt-BR');
assert.strictEqual(getEffectiveLang('auto', 'pt-PT'), 'pt-BR');
assert.strictEqual(getEffectiveLang('auto', 'en-US'), 'en');
assert.strictEqual(getEffectiveLang('auto', 'fr-FR'), 'en');
assert.strictEqual(getEffectiveLang('en', 'pt-BR'), 'en');
assert.strictEqual(getEffectiveLang('pt-BR', 'en-US'), 'pt-BR');

// Test string retrieval
assert.strictEqual(t('zoomIn', 'en'), 'Zoom in');
assert.strictEqual(t('zoomIn', 'pt-BR'), 'Aumentar zoom');

console.log('All i18n tests passed! ✨');
