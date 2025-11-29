# Color Thief Police

A Chrome Extension that scans webpages for all used colors, groups similar colors using Delta-E (CIEDE2000) clustering, and highlights them to detect design system inconsistencies.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [How to Use](#how-to-use)
- [Architecture & Technical Details](#architecture--technical-details)
- [Development Guide](#development-guide)
- [API Reference](#api-reference)
- [Delta-E Algorithm](#delta-e-algorithm)
- [Browser Compatibility](#browser-compatibility)
- [Contributing](#contributing)

---

## Features

- **Color Extraction**: Automatically scans a webpage and extracts all colors from backgrounds, text, and borders
- **Delta-E Clustering**: Groups similar colors using the CIEDE2000 color distance algorithm (perceptually accurate)
- **Interactive Highlighting**: Click on any color to highlight all elements using that color on the page
- **Toggle Highlighting**: Click a highlighted color again to deselect it
- **Visual Distinction**: Selected colors show a distinct visual style in the popup
- **Adjustable Threshold**: Control the Delta-E threshold to make color grouping more or less strict
- **Color Statistics**: View all detected colors and their frequency of use
- **Real-time Analysis**: Instant feedback with visual clustering representation

---

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Google Chrome or Chromium-based browser

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Extension
```bash
npm run build
```

### 3. Load in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist` folder

### 4. Start Using
1. Go to any website
2. Click the Color Thief Police icon in the toolbar
3. Click "Scan Page"
4. Interact with colors!

---

## Installation

### For Users

Follow the Quick Start section above.

### For Development

```bash
# Clone or navigate to project
cd color-police

# Install dependencies
npm install

# Run in development mode with hot reload
npm run dev
```

After running `npm run dev`:
1. Go to `chrome://extensions/`
2. Click the refresh icon on Color Thief Police
3. Changes will reload automatically

**Build for production:**
```bash
npm run build
```

---

## How to Use

### Scanning Colors

1. **Open any webpage** in Chrome
2. **Click the Color Thief Police extension icon** in the toolbar
3. **Click "Scan Page"** to extract all colors
4. **View color clusters** - similar colors are grouped together
   - **Clusters tab**: Shows groups of perceptually similar colors
   - **All Colors tab**: Shows complete list of detected colors

### Adjusting Threshold

The Delta-E Threshold controls how strictly colors are grouped:

- **Lower values (5-20)**: Stricter grouping
  - Only very similar colors grouped together
  - More individual color groups
  - Better for finding exact color mismatches

- **Default (30)**: Just Noticeable Difference
  - Industry standard threshold
  - Most useful for general use
  - Balances precision with usability

- **Higher values (50-100)**: Looser grouping
  - Groups more colors together
  - Fewer, larger color families
  - Useful for understanding color families

### Highlighting Colors

1. **Click any color** in either view to highlight matching elements on the page
2. **Visual feedback**: The selected color shows a blue border in the popup
3. **Click again** to deselect and remove highlights
4. **Switching colors**: Clicking a different color automatically deselects the previous one

**Highlighted elements on the page:**
- Show an animated red border
- Include pulsing animation for visibility
- Work on background, text, and border colors

---

## Architecture & Technical Details

### Project Structure

```
color-police/
├── src/
│   ├── popup/
│   │   ├── App.jsx              # Main React popup component
│   │   ├── main.jsx             # React entry point
│   │   ├── popup.css            # Complete popup styling
│   │   └── index.html           # HTML template
│   ├── content/
│   │   └── script.js            # Content script (runs on pages)
│   ├── background/
│   │   └── worker.js            # Service worker (Manifest v3)
│   └── utils/
│       ├── colorExtractor.js    # DOM color detection
│       ├── colorClustering.js   # Delta-E algorithm
│       └── colorUtils.js        # Helper utilities
├── public/
│   └── icons/                   # Extension icons (SVG)
├── manifest.json                # Extension configuration
├── vite.config.js              # Build configuration
├── package.json                # Dependencies
└── README.md                   # This file
```

### How It Works

#### 1. **Popup (React UI)** - `src/popup/App.jsx`
- User interface for the extension
- Two views: Color Clusters and All Colors
- State management for colors, clusters, and highlighted color
- Communicates with content script via `chrome.tabs.sendMessage()`
- Communicates with background worker via `chrome.runtime.sendMessage()`

**Key features:**
- Scan button to trigger color extraction
- Delta-E threshold slider (5-100)
- Tab navigation between Clusters and All Colors views
- Click-to-highlight functionality
- Visual distinction for highlighted colors

#### 2. **Content Script** - `src/content/script.js`
- Injected into every webpage automatically
- Extracts colors from computed DOM styles
- Highlights elements matching selected colors
- Manages highlight lifecycle (add/remove)
- Tracks currently highlighted color for toggle behavior

**Functions:**
- `handleScanColors()` - Extracts all colors from page
- `handleHighlightColor()` - Highlights elements (toggle behavior)
- `clearHighlights()` - Removes all highlights
- `injectHighlightStyles()` - Injects CSS for highlight styling

#### 3. **Background Worker** - `src/background/worker.js`
- Service worker (Manifest v3 compliant)
- Performs heavy color clustering computation
- Implements Delta-E algorithm
- Returns clustered results to popup

**Functions:**
- `handleClusterColors()` - Groups colors by Delta-E distance

#### 4. **Utility Functions**

**colorExtractor.js:**
- `extractColorsFromPage()` - Scans all DOM elements for colors
- `normalizeColor()` - Converts RGB/RGBA to hex format
- `getColoredElements()` - Groups elements by color

**colorClustering.js:**
- `deltaE2000()` - Implements CIEDE2000 color distance formula
- `rgbToLab()` - Converts RGB to LAB color space
- `clusterColors()` - Groups colors by Delta-E threshold
- `findMostSimilarColor()` - Finds closest color to target

### Message Communication

#### Popup → Content Script

**Scan Colors:**
```javascript
chrome.tabs.sendMessage(tabId, { action: 'scanColors' }, (response) => {
  console.log(response.colors) // Array of hex colors: ['#FF0000', '#00FF00', ...]
})
```

**Highlight Color (toggle behavior):**
```javascript
chrome.tabs.sendMessage(tabId, {
  action: 'highlightColor',
  color: '#FF0000'
})
// If same color clicked: toggles off
// If different color: highlights new color
```

**Clear Highlights:**
```javascript
chrome.tabs.sendMessage(tabId, { action: 'clearHighlights' })
```

#### Popup → Background Worker

**Cluster Colors:**
```javascript
chrome.runtime.sendMessage({
  action: 'clusterColors',
  colors: ['#FF0000', '#FF1111', '#00FF00'],
  threshold: 30
}, (response) => {
  console.log(response.clusters) // Grouped colors
})
```

---

## Development Guide

### Project Architecture

```
User clicks "Scan Page"
    ↓
Popup → Content Script: "scanColors"
    ↓
Content Script extracts DOM colors
    ↓
Content Script → Popup: array of colors
    ↓
Popup → Background Worker: "clusterColors" with threshold
    ↓
Background Worker runs Delta-E algorithm
    ↓
Background Worker → Popup: clustered results
    ↓
Popup displays in UI

---

User clicks on color
    ↓
Popup → Content Script: "highlightColor" with color
    ↓
Content Script checks if same color (toggle logic)
    ↓
If same: clear highlights, set currentHighlightedColor = null
If different: clear old highlights, add new highlights
    ↓
Content Script injects highlight styles
    ↓
Popup updates UI with active color state
```

### Development Workflow

**Start development server:**
```bash
npm run dev
```

**Make changes:**
- Edit React components in `src/popup/`
- Edit content script in `src/content/`
- Edit utilities in `src/utils/`

**Reload in Chrome:**
1. Go to `chrome://extensions/`
2. Click refresh button on Color Thief Police
3. Changes appear instantly

**Build for production:**
```bash
npm run build
```

Output in `dist/` folder ready to upload to Chrome Web Store.

### Key Implementation Details

#### Delta-E Clustering
- Uses **CIEDE2000** formula (industry standard for perceptual color distance)
- Default threshold: **30** (Just Noticeable Difference)
- Colors converted to **LAB color space** for accurate calculation
- Results grouped by similarity threshold
- O(m²) complexity where m = unique colors

#### Color Extraction
- Scans all visible DOM elements (except `<script>` and `<style>`)
- Extracts: background-color, color (text), border-color
- Normalizes to hex format (#RRGGBB)
- Filters out transparent colors
- O(n) complexity where n = page elements

#### Highlighting with Toggle
- Tracks `currentHighlightedColor` in content script
- First click highlights matching elements
- Second click on same color deselects/removes highlights
- Clicking different color switches highlights
- Popup UI shows visual distinction for active color
- Red animated borders on highlighted elements

#### Styling for Active Colors
- **Color chips (clusters view)**:
  - Blue border (2px)
  - Background glow effect
  - Slight scale increase
- **Color items (all colors view)**:
  - Blue border (3px)
  - Background glow effect with larger radius
  - Enhanced shadow

### Testing

**Verify functionality on multiple websites:**
- E-commerce (Amazon, eBay)
- SaaS platforms (Figma, Notion)
- News sites (Medium, NY Times)
- Social media (Twitter, LinkedIn)

**Test edge cases:**
- Sites with very few colors
- Sites with many colors (100+)
- Pages with iframes
- Dynamic content
- Pages with SVG elements

---

## API Reference

### Chrome Message API

#### Content Script Messages

##### scanColors
Scans the page for all colors.

```javascript
chrome.tabs.sendMessage(tabId, { action: 'scanColors' }, (response) => {
  if (response.success) {
    console.log(response.colors) // ['#FF0000', '#00FF00', '#0000FF']
  }
})
```

Response: `{ success: boolean, colors?: string[], error?: string }`

##### highlightColor
Highlights elements with specific color (toggle behavior).

```javascript
chrome.tabs.sendMessage(tabId, {
  action: 'highlightColor',
  color: '#FF0000'
})
```

**Toggle behavior:**
- First call: highlights matching elements
- Second call with same color: removes highlights
- Call with different color: switches highlights

##### clearHighlights
Removes all highlights from page.

```javascript
chrome.tabs.sendMessage(tabId, { action: 'clearHighlights' })
```

##### getHighlightedColor
Gets currently highlighted color (if any).

```javascript
chrome.tabs.sendMessage(tabId, { action: 'getHighlightedColor' }, (response) => {
  console.log(response.color) // '#FF0000' or null
})
```

#### Background Worker Messages

##### clusterColors
Clusters colors by Delta-E distance.

```javascript
chrome.runtime.sendMessage({
  action: 'clusterColors',
  colors: ['#FF0000', '#FF1111', '#00FF00'],
  threshold: 30
}, (response) => {
  if (response.success) {
    console.log(response.clusters)
    // [
    //   {
    //     representative: '#FF0000',
    //     colors: ['#FF0000', '#FF1111'],
    //     count: 2
    //   },
    //   ...
    // ]
  }
})
```

Response: `{ success: boolean, clusters?: object[], error?: string }`

---

## Delta-E Algorithm

### Why CIEDE2000?

The human eye doesn't perceive color differences uniformly across the color spectrum. Examples:
- Small changes in blue are more noticeable than changes in red
- Saturation affects perception of lightness differences
- Color angle from neutral affects perception

**CIEDE2000** accounts for all these factors and is the **industry standard** for measuring perceptual color differences.

### How It Works

```
Input: Two colors in RGB format
    ↓
Step 1: Convert RGB → LAB color space
  - L: Lightness (0-100)
  - A: Green-Red axis (-128 to 127)
  - B: Blue-Yellow axis (-128 to 127)
    ↓
Step 2: Calculate differences
  - ΔL: Lightness difference
  - ΔC: Chroma (saturation) difference
  - ΔH: Hue (color) difference
    ↓
Step 3: Apply weighting factors
  - Account for lightness level
  - Account for chroma level
  - Account for hue angle
    ↓
Output: Delta-E value (0-100+)
  - 0 = identical colors
  - < 1 = imperceptible difference
  - 1-2 = barely noticeable
  - 2-10 = noticeable
  - > 10 = very different
```

### Color Spaces

- **RGB** (Red, Green, Blue): Standard computer color format
- **LAB** (Lightness, A, B): Perceptually uniform color space
  - L (Lightness): 0-100 (black to white)
  - A (Green-Red): -128 to 127 (green to red)
  - B (Blue-Yellow): -128 to 127 (blue to yellow)
- **Hex** (#RRGGBB): Display format

---

## Dependencies

### Production Dependencies
- **react** (18.2.0): UI framework for the popup
- **react-dom** (18.2.0): React rendering
- **colord** (2.9.3): Color manipulation and conversion library

### Development Dependencies
- **vite** (5.0.0): Fast build tool with HMR
- **@vitejs/plugin-react** (4.2.0): React support for Vite
- **@crxjs/vite-plugin** (2.0.0-beta.23): Chrome extension bundling

---

## Browser Compatibility

| Browser | Support | Version |
|---------|---------|---------|
| Chrome | ✅ | 88+ |
| Edge | ✅ | 88+ |
| Chromium | ✅ | Recent versions |
| Firefox | ⏳ | Future |
| Safari | ⏳ | Future |

Uses Chrome Extension Manifest v3 (modern standard).

---

## Design System Detection Use Cases

- **Identify color inconsistencies**: Spot similar colors with different hex values
- **Audit brand compliance**: Ensure only approved colors are used
- **Reduce color palette**: Find redundant colors to consolidate
- **Design consistency**: Check site compliance with design systems
- **Accessibility check**: Prepare for WCAG contrast analysis (future)

---

## Troubleshooting

### Extension doesn't appear in toolbar
- Verify `npm run build` completed successfully
- Check that `dist/` folder exists
- Try reloading `chrome://extensions/`

### No colors detected
- Some websites block content scripts (security policy)
- Try a different website
- Check F12 → Console for errors
- Verify content script loaded (F12 → Sources → Content scripts)

### Colors not highlighting
- Verify content script is injected
- Some elements may have `pointer-events: none` CSS
- Try a simpler website
- Check page loaded completely

### Performance is slow
- Large pages with 1000+ elements may take 1-2 seconds
- Reduce Delta-E threshold to speed up clustering
- Try websites with fewer elements

---

## Future Enhancements

- [ ] WCAG contrast ratio checking
- [ ] Export palette (JSON, CSS, Figma)
- [ ] Design system comparison (Material, Bootstrap)
- [ ] CSS variable detection
- [ ] Gradient extraction
- [ ] Shadow color detection
- [ ] Cross-page color tracking
- [ ] Keyboard shortcuts
- [ ] Settings persistence
- [ ] Team collaboration features

---

## License

MIT

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.

---

**Made with ❤️ for designers and developers who care about design system consistency**

---

## Getting Help

### Questions about features?
- Check the "How to Use" section above

### Need to understand the code?
- See "Architecture & Technical Details"
- Check source code comments in `src/`

### Want to develop?
- Follow "Development Guide" section

### Having technical issues?
- Check "Troubleshooting" section
- Look at console errors (F12)
- Verify extension loaded correctly

