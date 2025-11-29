# Development Notes

## Setup Instructions

### First-time Setup
```bash
npm install
npm run build
```

### Load Extension in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Navigate to the `dist` folder and select it

### Development Workflow
```bash
npm run dev
```

After running `dev`, you'll need to:
1. Go to `chrome://extensions/`
2. Click the refresh icon on the extension
3. The extension will hot-reload with your changes

### Build for Production
```bash
npm run build
```

The production build will be in the `dist` folder.

## Project Architecture

### How It Works

1. **Popup (React UI)** (`src/popup/`)
   - User interface for the extension
   - Displays color clusters and all detected colors
   - Allows threshold adjustment
   - Communicates with content script via `chrome.tabs.sendMessage()`

2. **Content Script** (`src/content/script.js`)
   - Injected into every webpage
   - Extracts colors from DOM elements (background, text, border)
   - Highlights elements when user clicks a color
   - Uses `chrome.runtime.onMessage` to receive commands from popup

3. **Background Worker** (`src/background/worker.js`)
   - Processes heavy computations (color clustering)
   - Performs Delta-E calculations
   - Responds to clustering requests from popup

4. **Utility Functions**
   - `colorExtractor.js`: Extracts colors from DOM
   - `colorClustering.js`: CIEDE2000 Delta-E implementation

### Message Flow

```
User clicks "Scan Page"
    ↓
Popup sends "scanColors" message
    ↓
Content script extracts colors from page
    ↓
Returns array of hex colors to popup
    ↓
Popup sends "clusterColors" message to background worker
    ↓
Background worker clusters colors by Delta-E
    ↓
Returns clusters to popup
    ↓
Popup displays results
```

## Key Implementation Details

### Delta-E Clustering
- Uses CIEDE2000 formula (most accurate perceptual color distance)
- Default threshold: 30 (JND - Just Noticeable Difference)
- Colors are converted to LAB color space for calculation
- Results are grouped by similarity threshold

### Color Extraction
- Scans all visible DOM elements
- Extracts: background-color, color (text), border-color
- Normalizes to hex format (#RRGGBB)
- Filters out transparent colors

### Highlighting
- Adds animated border overlay to matched elements
- Uses z-index to ensure visibility
- Includes pulsing animation for visual feedback
- Can be cleared with "clearHighlights" message

## Testing Checklist

- [ ] Extension loads without errors in Chrome
- [ ] "Scan Page" button works and detects colors
- [ ] Color clusters display correctly
- [ ] Threshold slider adjusts clustering
- [ ] Clicking a color highlights matching elements
- [ ] All Colors tab displays full list
- [ ] Works on various websites (news sites, SaaS apps, etc.)
- [ ] Performance is acceptable on large pages (< 2s scan time)

## Troubleshooting

### Extension doesn't load
- Check the console for errors (`chrome://extensions/` > Details)
- Ensure all dependencies are installed: `npm install`
- Rebuild: `npm run build`

### No colors detected
- Ensure the website has visible colors
- Check if content script is injected (F12 > Sources > Content scripts)
- Try a different website (some sites may have restrictions)

### Highlighting not working
- Verify content script loaded on the page
- Check if elements are rendered dynamically (may need to scan after page loads)
- Look for CSS issues (element might be hidden or have pointer-events: none)

### Colors not clustering correctly
- Adjust the Delta-E threshold (try 15 or 50)
- Remember that very similar colors might not be detected due to rounding
- Different browsers/OS may have slightly different computed colors

## Extension Manifest (manifest.json)

Key permissions:
- `activeTab`: Access current tab
- `scripting`: Execute content scripts
- `tabs`: Get tab information
- `storage`: Save user preferences (future)

Content script matches all URLs to ensure it loads everywhere.

## Future Improvements

1. **Settings Storage**: Remember user preferences (threshold, etc.)
2. **Export Functionality**: Save color palette as JSON/CSS
3. **Advanced Filtering**: Filter by element type, visibility, etc.
4. **Performance**: Optimize for very large pages
5. **Accessibility**: Check WCAG contrast ratios
6. **Design System Comparison**: Compare against known design systems
7. **Persistence**: Highlight colors across page navigations

## Build System

The project uses:
- **Vite**: Fast bundler with HMR (Hot Module Replacement)
- **@crxjs/vite-plugin**: Handles Chrome extension bundling
- **React**: UI framework
- **Babel**: JSX transpilation

The CRX plugin automatically:
- Injects the manifest.json content
- Handles content script injection
- Manages service worker lifecycle
- Generates proper bundle structure

## Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [CIEDE2000 Color Difference](https://en.wikipedia.org/wiki/Color_difference#CIEDE2000)
- [Colord Library](https://colord.omgovich.ru/)
- [Vite Documentation](https://vitejs.dev/)
