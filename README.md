# Genshin Map Zoom Extender 🔍🗺️

🌐 **Languages / Idiomas:** **English** | [🇧🇷 Português](README.pt-BR.md)

An open-source browser extension and UserScript for **Waterfox** (and Firefox) that unlocks and significantly extends the zoom limits on the Genshin Impact interactive map at [genshin-impact-map.appsample.com](https://genshin-impact-map.appsample.com/).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Release](https://img.shields.io/github/v/release/kandiesky/genshin-map-zoom?style=flat)](https://github.com/kandiesky/genshin-map-zoom/releases/latest)
[![Compatible With Waterfox](https://img.shields.io/badge/Compatible-Waterfox%20%2F%20Firefox-blue.svg)](#compatibility)

---

## 🎯 The Problem

On the AppSample interactive map:
- The maximum zoom level is hard-coded to **15** (and **13** in areas like The Chasm and Enkanomiya).
- The map tile CDN has no pre-rendered image tiles for zoom levels 16+ (requesting them returns HTTP 404), which normally turns the background completely black if forced.
- In densely populated regions (caves, temples, multi-floor ruins, villages), chest, oculi, and quest markers are **tightly clustered on top of each other**, making it almost impossible to distinguish individual pins.

---

## 🚀 How This Extension Solves It

1. **Uncapped Zoom Limits**: Expands the maximum zoom level from 15 up to **20 (32x closer)** or even **22 (128x closer)**.
2. **Virtual Tile Upscaling Engine**: When zooming beyond the native resolution (levels 16 to 22), the engine dynamically maps each sub-tile to its corresponding parent tile at zoom 15 (which is already cached in browser memory) and renders hardware-accelerated sub-pixel crops. **Zero 404 errors, zero black screens, and instantaneous loading.**
3. **Natural Marker Separation**: Because Google Maps anchors markers and overlay layers to geographical coordinates (`lat, lng`), zooming closer causes crowded pins to **physically spread apart on your screen**, providing pinpoint precision.
4. **Native Controls + Floating HUD**: Works seamlessly with your **mouse scroll wheel**, **trackpad pinch-to-zoom**, **double-click**, and the site's own `+` and `−` buttons. Also includes an unobtrusive on-screen HUD indicator and a toolbar popup menu.

---

## 📦 Installation in Waterfox

You can install it either as a standalone browser extension or as a UserScript:

### Method 1: As a WebExtension (Recommended)

#### Option A — Load as Temporary Extension (Quick Test):
1. Open **Waterfox**.
2. In the address bar, type `about:debugging` and press Enter.
3. In the left sidebar, click **This Waterfox** (or Runtime).
4. Under *Temporary Extensions*, click **Load Temporary Add-on...**.
5. Select either:
   - `manifest.json` (inside the `extension/` folder), or
   - `genshin-map-zoom.xpi` (in the project root or from the [Releases](https://github.com/kandiesky/genshin-map-zoom/releases/latest) page).
6. That's it! The extension will be active immediately.

#### Option B — Permanent Installation in Waterfox:
Unlike standard Firefox, Waterfox allows installing unsigned extensions permanently:
1. In Waterfox, go to `about:config` and click *Accept the Risk and Continue*.
2. Search for `xpinstall.signatures.required` and toggle it to `false`.
3. Open `about:addons` (Add-ons Manager).
4. Click the gear icon ⚙ in the top right and select **Install Add-on From File...**.
5. Select the `genshin-map-zoom.xpi` file (or drag-and-drop it into the Waterfox window).
6. Confirm the prompt to install.

---

### Method 2: As a UserScript (Violentmonkey / Tampermonkey)

If you already use a userscript manager (such as **Violentmonkey**, **Tampermonkey**, or **FireMonkey**) in Waterfox:
1. Open your UserScript manager dashboard.
2. Create a new script.
3. Copy and paste the full contents of [`genshin-map-zoom.user.js`](./genshin-map-zoom.user.js).
4. Save the script (`Ctrl+S`).
5. Open [genshin-impact-map.appsample.com](https://genshin-impact-map.appsample.com/) and enjoy!

---

## 🎮 Controls & Features

### 1. On the Map
- **Mouse Wheel / Trackpad**: Zoom in and out freely past level 15 up to level 20+.
- **Native `+` and `−` Buttons**: Continue working smoothly up to the new zoom cap.
- **Floating HUD (Bottom-Right)**:
  - Displays the current zoom level in real time (e.g. `🔍 Zoom: 18 / 20`).
  - Quick `[−]` and `[+]` zoom buttons.
  - Reset button `[⟲]` to immediately return to default overview zoom (11).
  - Quick settings gear `[⚙]` to tweak options directly on the page without opening the browser toolbar.

### 2. Extension Toolbar Popup
- **Enable / Disable Toggle**: Easily enable or revert to the site's default zoom behavior.
- **Max Zoom Slider**: Select between 16 (2x), 18 (8x), 20 (32x - Recommended), or 22 (128x).
- **Image Filter Mode (Upscaling)**:
  - *Smooth (Bilinear)*: Default anti-aliased interpolation.
  - *Sharp (Pixelated)*: Crisp nearest-neighbor scaling.
- **Show/Hide HUD Toggle**: Option to hide the on-screen HUD for a completely clean view.

---

## 🛠️ Project Structure

```
GenshinMapZoom/
├── extension/                   # WebExtension source files
│   ├── manifest.json            # Extension manifest (Waterfox/Firefox)
│   ├── content.js               # Content script (injection & messaging bridge)
│   ├── inject.js                # Main hook & virtual upscaler engine
│   ├── popup/                   # Toolbar popup UI
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   └── icons/                   # Custom icons (16, 48, 128px)
├── genshin-map-zoom.user.js     # Single-file UserScript for Violentmonkey/Tampermonkey
├── genshin-map-zoom.xpi         # Pre-built extension package for 1-click install
├── genshin-map-zoom.zip         # Packaged zip archive
├── generate_icons.js            # Pure Node.js PNG generator
├── build.js                     # Packaging and validation script
├── test_engine.js               # Unit tests for tile calculation
├── test_hook_lifecycle.js       # Asynchronous Google Maps lifecycle tests
├── README.md                    # English documentation (this file)
└── README.pt-BR.md              # Portuguese documentation
```

---

## 💻 Compatibility
- **Waterfox**: Fully supported (Current & G-series releases).
- **Firefox**: Supported via `about:debugging` and UserScript managers.
- **Target Site**: [genshin-impact-map.appsample.com](https://genshin-impact-map.appsample.com/) (supports Teyvat, Enkanomiya, The Chasm, underground levels, and multi-floor overlays).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
