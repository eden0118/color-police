# Quick Reference Guide

## File Locations & Responsibilities

### Entry Points
- **Popup**: `src/popup/index.html` → `src/popup/main.jsx` → `src/popup/App.jsx`
- **Content Script**: `src/content/script.js` (injected into all pages)
- **Background Worker**: `src/background/worker.js` (service worker)

### Core Logic
- **Color Detection**: `src/utils/colorExtractor.js`
  - `extractColorsFromPage()` - Get all colors on page
  - `normalizeColor()` - Convert RGB to hex
  - `getColoredElements()` - Group elements by color

- **Color Clustering**: `src/utils/colorClustering.js`
  - `deltaE2000()` - Calculate color distance
  - `rgbToLab()` - Convert to LAB color space
  - `clusterColors()` - Group similar colors
  - `findMostSimilarColor()` - Find closest match

### Styling
- **Popup UI**: `src/popup/popup.css` (all popup styles)
- **Page Highlights**: Injected via `src/content/script.js` (dynamic styles)

## Message Communication

### Popup → Content Script
```javascript
// Get colors from page
chrome.tabs.sendMessage(tabId, { action: 'scanColors' }, (response) => {
  // response.colors = ['#FF0000', '#00FF00', ...]
})

// Highlight a color
chrome.tabs.sendMessage(tabId, { action: 'highlightColor', color: '#FF0000' })

// Clear highlights
chrome.tabs.sendMessage(tabId, { action: 'clearHighlights' })
```

### Popup → Background Worker
```javascript
// Cluster colors
chrome.runtime.sendMessage({
  action: 'clusterColors',
  colors: ['#FF0000', '#FF1111', '#00FF00'],
  threshold: 30
}, (response) => {
  // response.clusters = [...]
})
```

## Building & Testing

```bash
# Install dependencies
npm install

# Development (watch mode)
npm run dev

# Production build
npm run build

# Files go to dist/ folder
```

## Loading in Chrome

1. `chrome://extensions/`
2. Toggle "Developer mode" on
3. Click "Load unpacked"
4. Select `dist` folder
5. Done!

## Making Changes

### Changing Popup UI
- Edit `src/popup/App.jsx` or `src/popup/popup.css`
- Vite auto-rebuilds
- Refresh extension in Chrome

### Changing Color Detection
- Edit `src/utils/colorExtractor.js`
- Content script uses this
- Full rebuild needed

### Changing Clustering Algorithm
- Edit `src/utils/colorClustering.js`
- Background worker uses this
- Full rebuild needed

### Changing Extension Behavior
- Edit `src/content/script.js` or `src/background/worker.js`
- May need full rebuild

## Chrome Extension APIs Used

- `chrome.tabs.query()` - Get current tab
- `chrome.tabs.sendMessage()` - Talk to content script
- `chrome.runtime.sendMessage()` - Talk to background worker
- `chrome.runtime.onMessage` - Receive messages
- `window.getComputedStyle()` - Get element colors
- `document.querySelectorAll()` - Find elements

## Debugging

### Check Extension Logs
```
chrome://extensions/ → Color Thief Police → Details → Errors
```

### Check Content Script
```
F12 on any page → Sources → Content scripts → color-police → script.js
```

### Check Background Worker
```
chrome://extensions/ → Color Thief Police → Details → Background page
```

## Performance Tips

- Color extraction is O(n) where n = number of elements
- Clustering is O(m²) where m = number of unique colors
- Large pages (10k+ elements) may take 1-2 seconds
- Most websites should complete in < 500ms

## Color Science

**Why Delta-E2000?**
- Accounts for human perception
- Better than Euclidean RGB distance
- Industry standard (CIEDE2000)
- Adjustable threshold handles various use cases

**LAB Color Space**
- L: Lightness (0-100)
- A: Green-Red axis (-128 to 127)
- B: Blue-Yellow axis (-128 to 127)
- More perceptually uniform than RGB

## Manifest Permissions

- `activeTab` - Access current tab
- `scripting` - Run content scripts
- `tabs` - Get tab info
- `storage` - Save settings (not used yet)
- `<all_urls>` - Run on all websites

## Vite Configuration

Vite handles:
- JSX transformation (React)
- Module bundling
- Hot reload (dev)
- Production optimization
- @crxjs/vite-plugin handles manifest & extension-specific bundling

## Package.json Scripts

```bash
npm run dev      # Watch & rebuild
npm run build    # Production build
npm run preview  # Preview build output
npm run watch    # Watch without dev server
```

## Useful Chrome URLs

- `chrome://extensions/` - Manage extensions
- `chrome://extensions/` (with DevMode) - View errors
- `chrome-extension://ID/src/popup/index.html` - Popup in new tab
- DevTools (F12) - Debug content scripts

## Icon Formats

All icons are SVG (scalable, small, modern):
- 16x16 - Toolbar icon
- 32x32 - Alternative toolbar
- 48x48 - Extension list
- 128x128 - Chrome Web Store

SVG benefits:
- Single file for all resolutions
- Smaller file size
- Crisp on any screen

## Common Tasks

**Add a new UI control to popup:**
1. Edit `src/popup/App.jsx`
2. Add state hook
3. Add CSS in `src/popup/popup.css`
4. Rebuild

**Change clustering threshold behavior:**
1. Edit `src/popup/App.jsx` (slider)
2. Edit `src/utils/colorClustering.js` (algorithm)
3. Edit `src/background/worker.js` (if needed)
4. Rebuild

**Add color format export (JSON/CSS):**
1. Create utility in `src/utils/export.js`
2. Call from `src/popup/App.jsx`
3. Trigger download via blob
4. No rebuild needed for simple changes

---

**Pro Tip**: Always check console errors (F12) when something doesn't work!
