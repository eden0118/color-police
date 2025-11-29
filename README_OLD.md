# Color Thief Police

A Chrome Extension that scans webpages for all used colors, groups similar colors using Delta-E (CIEDE2000) clustering, and highlights them to detect design system inconsistencies.

## Features

- **Color Extraction**: Automatically scans a webpage and extracts all colors from backgrounds, text, and borders
- **Delta-E Clustering**: Groups similar colors using the CIEDE2000 color distance algorithm (perceptually accurate)
- **Interactive Highlighting**: Click on any color to highlight all elements using that color on the page
- **Adjustable Threshold**: Control the Delta-E threshold to make color grouping more or less strict
- **Color Statistics**: View all detected colors and their frequency of use
- **Real-time Analysis**: Instant feedback with visual clustering representation

## Installation

### Prerequisites
- Node.js 16+ and npm

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd color-police
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `dist` folder

### Development

For development with hot reload:
```bash
npm run dev
```

Then load the extension from the `dist` folder as described above.

## How to Use

1. **Open any webpage** in Chrome
2. **Click the Color Thief Police extension icon** in the toolbar
3. **Click "Scan Page"** to extract all colors
4. **View color clusters** - similar colors are grouped together
5. **Adjust Delta-E Threshold** to fine-tune grouping sensitivity:
   - Lower values (5-20): Stricter grouping, only very similar colors
   - Higher values (50-100): Looser grouping, more colors in each cluster
6. **Click any color** to highlight all elements using that color on the page
7. **Switch to "All Colors" tab** to see a complete list of detected colors

## Architecture

### Project Structure
```
src/
├── popup/              # React UI (popup component)
│   ├── App.jsx        # Main popup component
│   ├── main.jsx       # React entry point
│   ├── popup.css      # Popup styling
│   └── index.html     # HTML template
├── content/           # Content script (runs on page)
│   └── script.js      # Color extraction and highlighting
├── background/        # Background service worker
│   └── worker.js      # Color clustering logic
└── utils/             # Utility functions
    ├── colorExtractor.js   # DOM color extraction
    └── colorClustering.js  # Delta-E clustering algorithm
```

### Key Components

#### Color Extraction (`colorExtractor.js`)
- **`extractColorsFromPage()`**: Scans all DOM elements for computed colors
- **`normalizeColor()`**: Converts RGB/RGBA to hex format
- **`getColoredElements()`**: Groups elements by their colors

#### Color Clustering (`colorClustering.js`)
- **`deltaE2000()`**: Implements CIEDE2000 color distance formula
- **`rgbToLab()`**: Converts RGB to LAB color space for accurate perceptual distance
- **`clusterColors()`**: Groups colors by Delta-E threshold
- **`findMostSimilarColor()`**: Finds the closest color to a target

#### Content Script (`content/script.js`)
- Listens for messages from popup and background worker
- Extracts colors from the webpage
- Highlights elements with specific colors using animated borders

#### Popup UI (`popup/App.jsx`)
- React component with two views: Clusters and All Colors
- Interactive controls for scanning and threshold adjustment
- Click-to-highlight functionality for each color

#### Background Worker (`background/worker.js`)
- Performs computationally heavy color clustering
- Communicates clustering results back to popup

## Technical Details

### Delta-E (CIEDE2000)
The extension uses the CIEDE2000 color difference formula, which is the industry standard for measuring perceptual color differences. This is more accurate than simple RGB distance because it accounts for human perception of color.

- **Default threshold**: 30 (JND - Just Noticeable Difference)
- **Low values** (< 20): Only very similar colors grouped
- **High values** (> 50): More forgiving clustering

### Color Spaces
- Extraction happens in RGB (from computed styles)
- Clustering uses LAB color space (more perceptually uniform)
- Results displayed in hex format (#RRGGBB)

## Dependencies

- **react**: UI framework for the popup
- **react-dom**: React rendering
- **colord**: Color manipulation and conversion library
- **@crxjs/vite-plugin**: Vite plugin for Chrome extension bundling
- **vite**: Build tool with hot reload support
- **@vitejs/plugin-react**: React support for Vite

## API Reference

### Content Script Messages

#### `scanColors`
Scans the page for all colors.
```javascript
chrome.tabs.sendMessage(tabId, { action: 'scanColors' }, (response) => {
  console.log(response.colors) // Array of hex colors
})
```

#### `highlightColor`
Highlights all elements using a specific color.
```javascript
chrome.tabs.sendMessage(tabId, {
  action: 'highlightColor',
  color: '#FF0000'
})
```

#### `clearHighlights`
Removes all highlights from the page.
```javascript
chrome.tabs.sendMessage(tabId, { action: 'clearHighlights' })
```

### Background Worker Messages

#### `clusterColors`
Clusters colors by Delta-E distance.
```javascript
chrome.runtime.sendMessage({
  action: 'clusterColors',
  colors: ['#FF0000', '#FF1111', '#00FF00'],
  threshold: 30
}, (response) => {
  console.log(response.clusters)
})
```

## Design System Detection Use Cases

- **Identify color inconsistencies**: Spot similar colors used with slightly different hex values
- **Audit brand compliance**: Ensure only approved colors are used
- **Reduce color palette**: Find redundant colors that could be consolidated
- **Accessibility check**: Verify sufficient color contrast (future feature)
- **Design consistency**: Compare your site against design systems (Material, Bootstrap, etc.)

## Browser Compatibility

- Chrome/Chromium 88+
- Edge 88+
- Any Chromium-based browser

## Future Enhancements

- [ ] Accessibility checking (contrast ratios)
- [ ] CSS variable detection and suggestions
- [ ] Export color palette (JSON, CSS, Figma)
- [ ] Batch highlight multiple color clusters
- [ ] Color conversion to different formats (HSL, OKLCH)
- [ ] Design system comparison (Material, Bootstrap, etc.)
- [ ] Performance optimization for large pages
- [ ] Shadow/gradient extraction

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Made with ❤️ for designers and developers who care about design system consistency**
