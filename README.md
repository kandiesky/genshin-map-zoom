# Genshin Map Zoom Extender

Languages: English | [Português](README.pt-BR.md)

This project provides a browser extension and a UserScript for Firefox and compatible browsers (such as Waterfox). The software increases the maximum zoom limit on the interactive map website [genshin-impact-map.appsample.com](https://genshin-impact-map.appsample.com/).

---

## Purpose

The target website limits map zoom to level 15 on the primary map and level 13 on secondary maps (such as The Chasm and Enkanomiya). The tile server does not store image tiles above these levels. When markers are close to each other, they overlap.

This software modifies the map behavior:
- It increases the maximum zoom level up to level 20 or 22.
- It calculates parent tile coordinates and scales existing cached tiles for higher zoom levels.
- It separates overlapping markers on the screen.
- It retains compatibility with mouse wheel zoom, double-click zoom, and on-screen zoom buttons.

---

## Installation

You can install this software as a browser extension or as a UserScript.

### Option 1: Browser Extension (Firefox / Waterfox)

#### Temporary Installation
1. Start Firefox or Waterfox.
2. In the address bar, enter `about:debugging`.
3. In the left navigation menu, click **This Firefox** (or **This Waterfox**).
4. In the **Temporary Extensions** section, click **Load Temporary Add-on...**.
5. Select the `extension/manifest.json` file, or the `genshin-map-zoom.xpi` file.

#### Permanent Installation (Waterfox, Firefox Developer Edition, or Nightly)
Standard Firefox requires digital signatures by Mozilla. Waterfox, Firefox Developer Edition, and Firefox Nightly allow unsigned extensions:
1. In the address bar, enter `about:config`.
2. Click **Accept the Risk and Continue**.
3. In the search field, enter `xpinstall.signatures.required`.
4. Set the preference value to `false`.
5. Open `about:addons`.
6. Click the gear icon, then click **Install Add-on From File...**.
7. Select the `genshin-map-zoom.xpi` file.
8. Confirm the installation prompt.

### Option 2: UserScript (Violentmonkey, Tampermonkey, or FireMonkey)

This method works permanently on standard Firefox, Waterfox, and all derivative browsers without signature restrictions:
1. Open your UserScript manager in Firefox or Waterfox.
2. Create a new UserScript.
3. Replace the script contents with the code from `genshin-map-zoom.user.js`.
4. Save the script (`Ctrl+S`).
5. Open [genshin-impact-map.appsample.com](https://genshin-impact-map.appsample.com/).

---

## User Controls

### On-Screen Interface
- **Mouse Wheel / Trackpad**: Scroll to change the zoom level.
- **On-Screen Zoom Buttons**: Click `+` or `-` to adjust the zoom level.
- **HUD Panel (Bottom Right)**:
  - Displays the current zoom level and maximum zoom level.
  - Click `+` or `-` to adjust zoom.
  - Click `Reset` to set zoom to level 11.
  - Click the gear icon to configure options (maximum zoom, image filter, and language).

### Extension Popup Menu
Click the extension icon in the browser toolbar to change options:
- **Enable Extension**: Turn zoom expansion on or off.
- **Max Zoom**: Select a maximum zoom limit between 16 and 22.
- **Image Filter**: Select `Smooth` (bilinear) or `Sharp` (pixelated).
- **Language**: Select `Auto (Browser)`, `English`, or `Português`.
- **Show HUD**: Show or hide the on-screen display.

---

## Technical Operation

1. The script injects before page scripts run (`document-start`).
2. It monitors `window.google.maps`.
3. When `google.maps.Map` initializes, the script sets `options.maxZoom` to the user-selected value.
4. When `google.maps.ImageMapType` initializes, the script overrides `getTile`:
   - For zoom levels at or below the native limit, it calls the original tile function.
   - For zoom levels above the native limit, it calculates:
     - `k = zoom - nativeMax`
     - `scale = 2^k`
     - `parentX = floor(coord.x / scale)`
     - `parentY = floor(coord.y / scale)`
     - `dx = coord.x - parentX * scale`
     - `dy = coord.y - parentY * scale`
   - It creates a container element that displays the scaled parent tile image with CSS offsets.

---

## Project Structure

```
GenshinMapZoom/
├── extension/                   # WebExtension source files
│   ├── manifest.json            # Extension manifest
│   ├── content.js               # Content script
│   ├── inject.js                # Map hook and tile upscaler
│   ├── popup/                   # Extension popup interface
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   └── icons/                   # Extension icons
├── genshin-map-zoom.user.js     # Standalone UserScript
├── genshin-map-zoom.xpi         # Packaged extension file
├── genshin-map-zoom.zip         # Packaged archive
├── generate_icons.js            # Icon generator script
├── build.js                     # Packaging script
├── test_engine.js               # Coordinate calculation tests
├── test_hook_lifecycle.js       # Asynchronous hook tests
├── README.md                    # English documentation
└── README.pt-BR.md              # Portuguese documentation
```

---

## Compatibility

- **Browsers**: Firefox, Waterfox, LibreWolf, Floorp.
- **UserScript Managers**: Violentmonkey, Tampermonkey, FireMonkey.
- **Website**: [genshin-impact-map.appsample.com](https://genshin-impact-map.appsample.com/).

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
