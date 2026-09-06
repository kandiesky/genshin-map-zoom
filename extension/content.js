/**
 * Genshin Map Zoom Extender - Content Script
 * Injects the core engine into the page and handles communication
 */
(function() {
  'use strict';

  const browserApi = (typeof browser !== 'undefined') ? browser : chrome;

  // Inject inject.js into the main execution context
  function injectScript() {
    try {
      const script = document.createElement('script');
      script.src = browserApi.runtime.getURL('inject.js');
      script.async = false;
      (document.head || document.documentElement).appendChild(script);
      script.onload = () => script.remove();
      console.log('[GenshinMapZoom] inject.js dispatched to page context.');
    } catch (err) {
      console.error('[GenshinMapZoom] Failed to inject script:', err);
    }
  }

  injectScript();

  // Listen for storage changes and forward to page script
  if (browserApi.storage && browserApi.storage.onChanged) {
    browserApi.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.genshin_map_zoom_config) {
        window.postMessage({
          type: 'GMZ_SET_CONFIG',
          config: changes.genshin_map_zoom_config.newValue
        }, '*');
      }
    });
  }

  // Listen for messages from popup
  if (browserApi.runtime && browserApi.runtime.onMessage) {
    browserApi.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'GMZ_POPUP_SET_CONFIG') {
        window.postMessage({
          type: 'GMZ_SET_CONFIG',
          config: message.config
        }, '*');
        sendResponse({ success: true });
      }
    });
  }

  // Listen for config updates from inject.js to sync with browser storage
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'GMZ_CONFIG_UPDATED') {
      if (browserApi.storage && browserApi.storage.local) {
        browserApi.storage.local.set({
          genshin_map_zoom_config: event.data.config
        });
      }
    }
  });

})();
