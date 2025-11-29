# Color Thief Police - Complete Project Documentation

## 🎯 Project Overview

**Color Thief Police** is a Chrome Extension that helps designers and developers identify design system inconsistencies by scanning webpages for colors and grouping similar ones using perceptually-accurate Delta-E (CIEDE2000) clustering.

### Key Problem Solved
Many websites have unintended color variations (e.g., `#FF0000` vs `#FF1111` used for the same semantic color). This extension makes those inconsistencies visible.

### Target Users
- Design system auditors
- Brand compliance checkers
- Design QA testers
- Developers building consistent color palettes
- UI/UX designers

---

## 📁 Project Structure

```
color-police/
├── src/
│   ├── popup/                      # React UI
│   │   ├── App.jsx                 # Main popup component
│   │   ├── main.jsx                # React entry point
│   │   ├── index.html              # HTML template
│   │   └── popup.css               # Complete styling
│   │
│   ├── content/
│   │   └── script.js               # Runs on every webpage
│   │                               # Extracts colors, highlights elements
│   │
│   ├── background/
│   │   └── worker.js               # Service worker (Manifest v3)
│   │                               # Handles color clustering
│   │
│   └── utils/
│       ├── colorExtractor.js       # DOM color detection
│       ├── colorClustering.js      # CIEDE2000 algorithm
│       └── colorUtils.js           # Future feature helpers
│
├── public/
│   └── icons/                      # Extension icons (SVG)
│       ├── icon-16.svg
│       ├── icon-32.svg
│       ├── icon-48.svg
│       └── icon-128.svg
│
├── manifest.json                   # Extension configuration
├── vite.config.js                  # Build configuration
├── package.json                    # Dependencies
├── .gitignore                      # Git ignore rules
│
├── README.md                       # User documentation
├── DEV_NOTES.md                    # Development guide
├── QUICK_REFERENCE.md              # Developer quick ref
├── SETUP_COMPLETE.md               # Setup instructions
└── THIS_FILE.md                    # Complete docs
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm installed
- Chrome/Edge 88+ browser
- Basic understanding of Chrome Extensions

### Installation Steps

```bash
# 1. Navigate to project directory
cd /Users/eden/Coding/color-police

# 2. Install dependencies
npm install

# 3. Build the extension
npm run build

# 4. Load in Chrome
# - Go to chrome://extensions/
# - Toggle "Developer mode" (top-right)
# - Click "Load unpacked"
# - Select the dist/ folder
```

### Development Workflow

```bash
# Start development server with watch mode
npm run dev

# Reload extension in Chrome after each change
# chrome://extensions/ → Color Thief Police → Refresh button
```

---

## 🎨 How It Works

### User Flow

```
1. User opens any website
   ↓
2. Clicks Color Thief Police extension icon
   ↓
3. Extension popup opens (React UI)
   ↓
4. User clicks "Scan Page" button
   ↓
5. Content script scans DOM and extracts all colors
   ↓
6. Colors sent to background worker for clustering
   ↓
7. Background worker runs Delta-E algorithm
   ↓
8. Results displayed in popup UI
   ↓
9. User can:
   - View color clusters (grouped by similarity)
   - View all colors (complete list)
   - Adjust Delta-E threshold
   - Click any color to highlight matching elements
```

### Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CHROME BROWSER                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐         ┌──────────────────────┐  │
│  │ Content Script   │         │   Webpage DOM        │  │
│  │ (Runs on page)   │◄────────►(All Elements)       │  │
│  │                  │         │                      │  │
│  │ • Extract colors │         │ • Background colors  │  │
│  │ • Highlight      │         │ • Text colors        │  │
│  │   elements       │         │ • Border colors      │  │
│  └────────┬─────────┘         └──────────────────────┘  │
│           │                                              │
│           │ chrome.tabs.sendMessage()                    │
│           ▼                                              │
│  ┌──────────────────┐         ┌──────────────────────┐  │
│  │  Popup (React)   │         │ Background Worker    │  │
│  │                  │◄───────►│                      │  │
│  │ • Show colors    │         │ • Cluster by Delta-E │  │
│  │ • Show clusters  │         │ • Compute distances  │  │
│  │ • Adjust slider  │         │ • Return clusters    │  │
│  └──────────────────┘         └──────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🔬 Delta-E (CIEDE2000) Algorithm

The core of Color Thief Police is the CIEDE2000 color difference formula.

### Why CIEDE2000?

The human eye doesn't perceive color differences uniformly across the color spectrum. For example:
- Small changes in blue are more noticeable than small changes in red
- Saturation affects perception of lightness differences
- The angle of color from neutral affects perception

CIEDE2000 accounts for all these factors, making it the industry standard.

### How It Works

```
Input: Two colors (RGB)
  ↓
Convert RGB → LAB color space
  ├─ L: Lightness (0-100)
  ├─ A: Green-Red axis (-128 to 127)
  └─ B: Blue-Yellow axis (-128 to 127)
  ↓
Calculate color difference considering:
  ├─ Lightness difference (ΔL)
  ├─ Chroma difference (ΔC)
  ├─ Hue difference (ΔH)
  ├─ Viewing angle compensation
  └─ Weight factors
  ↓
Output: Delta-E value (0-100+)
  └─ 0 = identical colors
  └─ < 1 = imperceptible difference
  └─ 1-2 = barely noticeable
  └─ 2-10 = noticeable
  └─ > 10 = very different
```

### Threshold Guide

The extension lets you adjust the clustering threshold:

| Threshold | Behavior | Use Case |
|-----------|----------|----------|
| 5-10 | Very strict | Finding exact color mismatches |
| 15-25 | Strict | QA testing, auditing |
| **30** | **Default (JND)** | **General use** |
| 40-50 | Loose | Grouping all reds/blues together |
| 60-100 | Very loose | Finding color families |

### Implementation

Located in `src/utils/colorClustering.js`:

```javascript
// Core algorithm
deltaE2000(color1, color2) → number
  - Converts both colors to LAB
  - Applies CIEDE2000 formula
  - Returns perceptual distance

// Clustering
clusterColors(colors, threshold=30) → clusters
  - Groups colors where distance < threshold
  - Returns representative color per cluster
  - Includes all colors in each cluster
```

---

## 📦 Key Components

### 1. Color Extractor (`src/utils/colorExtractor.js`)

**Responsibility**: Scan DOM and extract colors

**Functions**:
- `extractColorsFromPage()` - Get unique colors from DOM
- `normalizeColor(colorString)` - Convert RGB/RGBA to hex
- `getColoredElements()` - Group elements by color

**Example**:
```javascript
const colors = extractColorsFromPage()
// Returns: ['#FF0000', '#00FF00', '#0000FF', ...]
```

**How it works**:
```
For each DOM element:
  1. Skip <script> and <style> tags
  2. Get computed styles
  3. Extract background-color, color (text), border-color
  4. Convert to hex format
  5. Filter out transparent colors
  6. Return deduplicated Set
```

### 2. Color Clustering (`src/utils/colorClustering.js`)

**Responsibility**: Group similar colors using Delta-E

**Functions**:
- `deltaE2000(color1, color2)` - Perceptual distance
- `rgbToLab(hexColor)` - Convert to LAB space
- `clusterColors(colors, threshold)` - Group by similarity
- `findMostSimilarColor(target, list)` - Find closest match

**Example**:
```javascript
const clusters = clusterColors(
  ['#FF0000', '#FF1111', '#00FF00'],
  threshold=30
)
// Returns grouped colors with representatives
```

### 3. Content Script (`src/content/script.js`)

**Responsibility**: Run on every webpage, interact with DOM

**Features**:
- Extracts colors on command
- Highlights elements with specific colors
- Injects highlight styles
- Cleans up highlights

**Message Handlers**:
```javascript
'scanColors' → Returns extracted colors
'highlightColor' → Highlights matching elements
'clearHighlights' → Removes all highlights
```

### 4. Background Worker (`src/background/worker.js`)

**Responsibility**: Perform heavy computations

**Features**:
- Clusters colors by Delta-E
- Formats results for display
- Sorts by frequency

**Message Handlers**:
```javascript
'clusterColors' → {colors, threshold} → Returns clusters
```

### 5. React Popup (`src/popup/App.jsx`)

**Responsibility**: User interface

**Features**:
- Two view modes (Clusters / All Colors)
- Real-time threshold adjustment
- Click-to-highlight functionality
- Visual color previews

**State Management**:
```javascript
colors[] - All extracted colors
clusters[] - Grouped similar colors
threshold - Delta-E threshold (5-100)
activeTab - 'clusters' or 'colors'
loading - Scan in progress
```

---

## 🎯 Core Functions Reference

### Color Extraction

```javascript
// Get all colors from page
const colors = extractColorsFromPage()
// → ['#FF0000', '#00FF00', '#0000FF']

// Normalize RGB to hex
const hex = normalizeColor('rgb(255, 0, 0)')
// → '#FF0000'
```

### Color Clustering

```javascript
// Calculate perceptual distance
const distance = deltaE2000('#FF0000', '#FF1111')
// → 0.5 (very similar)

// Cluster colors
const clusters = clusterColors(colors, threshold=30)
// → [{representative: '#FF0000', colors: ['#FF0000', '#FF0011'], count: 2}, ...]

// Find similar color
const {color, distance} = findMostSimilarColor('#FF0000', colorList)
```

### Color Communication

```javascript
// From popup to content script
chrome.tabs.sendMessage(tabId, {
  action: 'scanColors' | 'highlightColor' | 'clearHighlights',
  color: '#FF0000' // for highlightColor
})

// From popup to background
chrome.runtime.sendMessage({
  action: 'clusterColors',
  colors: ['#FF0000', ...],
  threshold: 30
})
```

---

## 💾 Data Structures

### Color Format
```javascript
// All colors stored as hex strings
'#RRGGBB' // Example: '#FF0000'
```

### Cluster Object
```javascript
{
  representative: '#FF0000',  // Best color to show
  colors: ['#FF0000', '#FF1111'],  // All colors in cluster
  count: 2  // Number of colors
}
```

### LAB Color
```javascript
{
  l: 50,    // Lightness (0-100)
  a: 50,    // Green-Red (-128 to 127)
  b: -30,   // Blue-Yellow (-128 to 127)
  c: 58.3,  // Chroma (saturation)
  h: 325    // Hue (0-360)
}
```

### RGB Object
```javascript
{
  r: 255,   // 0-255
  g: 0,     // 0-255
  b: 0      // 0-255
}
```

---

## 🔧 Building & Distribution

### Build Process

```bash
npm run build
```

Steps:
1. Vite transpiles JSX to JavaScript
2. Bundles all modules
3. @crxjs/vite-plugin handles extension structure
4. Creates `dist/` folder with:
   - manifest.json
   - popup.html and JavaScript
   - content script
   - background worker
   - icons

### Loading as Unpacked Extension

```
chrome://extensions/
  ↓ Enable Developer mode
  ↓ Click "Load unpacked"
  ↓ Select dist/ folder
  ↓ Extension appears in toolbar
```

### Publishing (Future)

To publish on Chrome Web Store:
1. Create developer account
2. Pay one-time fee ($5)
3. Upload dist/ folder as .zip
4. Fill out store listing
5. Google reviews & approves
6. Published on Chrome Web Store

---

## 🚀 Future Enhancement Ideas

### Priority 1: Analytics
- [ ] Export colors as JSON/CSS
- [ ] Display color statistics (frequency, distribution)
- [ ] Suggest color consolidation

### Priority 2: Accessibility
- [ ] Check WCAG contrast ratios
- [ ] Warn about color-only information
- [ ] Suggest accessible color alternatives

### Priority 3: Design System Integration
- [ ] Compare against Material Design palette
- [ ] Compare against Bootstrap colors
- [ ] Custom design system upload

### Priority 4: Advanced Features
- [ ] Gradient extraction
- [ ] Shadow color detection
- [ ] CSS variable mapping
- [ ] Cross-page color tracking
- [ ] Historical color trends

### Priority 5: Performance
- [ ] Incremental scanning (scan visible area first)
- [ ] Worker threads for large pages
- [ ] Color palette caching

---

## 🐛 Troubleshooting

### Extension doesn't appear
```
Solution:
1. Check chrome://extensions/
2. Look for errors in Extension Details
3. Ensure dist/ folder exists and has files
4. Try: npm run build && reload
```

### "No colors detected"
```
Solutions:
1. Try different website (some block content scripts)
2. Check browser console (F12) for errors
3. Verify content script loaded: F12 → Sources → Content scripts
4. Wait for page to fully load
```

### Colors not highlighting
```
Solutions:
1. Check if content script is injected
2. Some elements might have pointer-events: none
3. Try clicking a different color
4. Refresh page and try again
```

### Performance is slow
```
Solutions:
1. Reduce page complexity (avoid scanning giant pages)
2. Increase Delta-E threshold (groups colors faster)
3. Try smaller website sections
4. Performance is O(m²) where m = unique colors
```

---

## 📊 Performance Characteristics

| Operation | Complexity | Time (typical page) |
|-----------|-----------|-------------------|
| Extract colors | O(n) | 100-500ms |
| Cluster 100 colors | O(m²) | 50-200ms |
| Highlight elements | O(n) | 10-50ms |
| Total scan | O(n + m²) | 200-800ms |

Where:
- n = number of elements on page
- m = number of unique colors

---

## 📚 Resources

### Learning
- [CIEDE2000 Paper](https://en.wikipedia.org/wiki/Color_difference#CIEDE2000)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Colord Library](https://colord.omgovich.ru/)
- [Vite Guide](https://vitejs.dev/)

### Tools
- Chrome DevTools (F12)
- Chrome Extensions Management (chrome://extensions/)
- Online Delta-E calculator
- Color picker browser extensions

### Related Tools
- [Coolors.co](https://coolors.co/) - Color palette generator
- [Accessible Colors](https://accessible-colors.com/) - Contrast checker
- [Material Design](https://material.io/design/color/) - Design system
- [Figma Color Plugins](https://www.figma.com/) - Design tools

---

## 📄 License & Attribution

This project is created as an educational tool for design consistency checking.

### Dependencies
- **React** - MIT License
- **Colord** - MIT License
- **Vite** - MIT License
- **@crxjs/vite-plugin** - Apache 2.0

All code written for this project is available for modification and redistribution.

---

## 👨‍💻 Development Tips

### Debugging Content Script
```
F12 on any webpage
  → Sources tab
  → Content scripts section
  → Find "color-police"
  → Set breakpoints
```

### Debugging Popup
```
chrome://extensions/
  → Color Thief Police
  → Click on "popup.html" or "Details"
  → DevTools opens for popup
  → Set breakpoints
```

### Debugging Background Worker
```
chrome://extensions/
  → Color Thief Police
  → Click on "service worker" or "Details"
  → DevTools opens for background
  → Set breakpoints
```

### Hot Reload During Development
```bash
# Terminal 1
npm run dev

# Terminal 2
# Watch dist folder and reload extension manually
# chrome://extensions/ → Click refresh on extension
```

### Testing Checklist
- [ ] Extension loads without errors
- [ ] "Scan Page" detects colors
- [ ] Clustering works with different thresholds
- [ ] Highlighting works on multiple websites
- [ ] No memory leaks after repeated scans
- [ ] Performance acceptable on large pages
- [ ] Works on different websites (news, SaaS, e-commerce)

---

## 🎓 Learning Outcomes

Building this extension teaches:
- Chrome Extension architecture (Manifest v3)
- React for UI development
- Color science (LAB space, Delta-E)
- Content script injection and communication
- Service workers in browsers
- Build tools (Vite)
- DOM manipulation and element selection
- Message passing between scripts

---

**Last Updated**: November 29, 2025
**Status**: ✅ Ready for Development and Testing
**Version**: 1.0.0

---

Questions? Check:
1. **Quick Reference** → QUICK_REFERENCE.md
2. **Setup Help** → SETUP_COMPLETE.md
3. **Dev Guide** → DEV_NOTES.md
4. **User Guide** → README.md

