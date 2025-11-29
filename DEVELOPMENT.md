# Development Quick Start

This file provides a quick reference for common development tasks. For comprehensive documentation, see [README.md](README.md).

## Common Commands

```bash
# Install dependencies
npm install

# Development with hot reload
npm run dev

# Production build
npm run build

# Format code with Prettier
npx prettier --write .

# Check formatting
npx prettier --check .
```

## File Locations

| Task | File | Location |
|------|------|----------|
| UI Components | React | `src/popup/App.jsx` |
| Popup Styles | CSS | `src/popup/popup.css` |
| Page Colors | Content Script | `src/content/script.js` |
| Clustering | Algorithm | `src/utils/colorClustering.js` |
| Color Extract | Utilities | `src/utils/colorExtractor.js` |
| Translations | i18n | `src/i18n/translations.js` |
| Styling Config | Tailwind | `tailwind.config.js` |
| Build Config | Vite | `vite.config.js` |
| Code Format | Prettier | `.prettierrc` |

## Development Workflow

### Editing Popup UI
```bash
npm run dev
# Edit src/popup/App.jsx or src/popup/popup.css
# Refresh extension in Chrome (chrome://extensions)
```

### Editing Content Script
```bash
npm run dev
# Edit src/content/script.js
# Run: npm run build
# Refresh extension in Chrome
```

### Testing in Chrome
1. Run `npm run build`
2. Go to `chrome://extensions/`
3. Click refresh on Color Thief Police
4. Go to any website and test

## Key Dependencies

| Package | Purpose |
|---------|---------|
| React 18 | UI framework |
| Vite 5 | Build tool |
| Tailwind CSS | Styling |
| Colord | Color library |
| Prettier | Code formatting |

## Debugging Tips

- **Check console**: F12 → Console for errors
- **Inspect elements**: F12 → Elements to check DOM
- **View network**: F12 → Network for requests
- **Service worker**: `chrome://extensions` → Background page (for service worker)
- **Content script**: F12 → Sources → Content scripts

## Project Statistics

- **Total Lines**: 1,100+ in README + 2,000+ in code
- **Components**: 1 main React component
- **Utilities**: 25+ helper functions
- **Languages**: 2 (English, Chinese)
- **Build Size**: ~150KB unpacked, ~40KB minified
- **Performance**: <1s scan on most websites

## Architecture Overview

```
Popup (React)
    ↓
Content Script (DOM access)
    ↓
Background Worker (Clustering)
    ↓
Utilities (Color math)
```

## Next Steps

1. Read [README.md](README.md) for comprehensive docs
2. Check `src/` folder structure
3. Run `npm run dev` to start developing
4. Make changes and refresh extension
5. Use `npx prettier --write .` before committing

---

**For more details, see the comprehensive README.md file.**
