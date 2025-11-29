/**
 * Utility functions for future features
 * These are ready-to-use helpers for extending the extension
 */

/**
 * Converts color to CSS variable format
 * Example: #FF0000 → --color-red-500
 */
export function hexToCSS(hexColor, colorName = 'color') {
  const rgbMatch = hexToRgb(hexColor);
  if (!rgbMatch) return null;

  return `--${colorName}-primary: ${hexColor};`;
}

/**
 * Converts hex to RGB format
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Converts hex to HSL format for CSS
 */
export function hexToHsl(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Calculates WCAG contrast ratio
 * Returns: ratio (1-21)
 */
export function contrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const lum1 = relativeLuminance(rgb1);
  const lum2 = relativeLuminance(rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Helper for contrast ratio calculation
 */
function relativeLuminance(rgb) {
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Checks if contrast meets WCAG standards
 * level: 'AA' | 'AAA' | 'WCAG2'
 */
export function meetsWCAG(color1, color2, level = 'AA') {
  const ratio = contrastRatio(color1, color2);

  const minimums = {
    AA: 4.5, // Normal text
    AAA: 7, // Enhanced
    WCAG2: 4.5,
  };

  return ratio >= (minimums[level] || 4.5);
}

/**
 * Exports colors as JSON
 */
export function exportAsJSON(colors, clusters) {
  const data = {
    metadata: {
      exported: new Date().toISOString(),
      totalColors: colors.length,
      clusterCount: clusters.length,
    },
    colors,
    clusters,
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Exports colors as CSS variables
 */
export function exportAsCSS(colors, prefix = 'color') {
  let css = `:root {\n`;

  colors.forEach((color, index) => {
    const varName = `--${prefix}-${index}`;
    css += `  ${varName}: ${color};\n`;
  });

  css += `}\n`;

  return css;
}

/**
 * Finds contrasting text color (black or white) for a background
 */
export function contrastingTextColor(backgroundColor) {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#000000';

  const luminance = relativeLuminance(rgb);

  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Generates a color palette name based on dominant colors
 */
export function generatePaletteName(colors) {
  if (colors.length === 0) return 'Empty Palette';
  if (colors.length === 1) return 'Monochrome';
  if (colors.length <= 3) return 'Limited';
  if (colors.length <= 5) return 'Standard';
  return 'Extended';
}

/**
 * Sorts colors by luminance
 */
export function sortByLuminance(colors) {
  return [...colors].sort((a, b) => {
    const lumA = relativeLuminance(hexToRgb(a) || { r: 0, g: 0, b: 0 });
    const lumB = relativeLuminance(hexToRgb(b) || { r: 0, g: 0, b: 0 });
    return lumB - lumA; // Darkest first
  });
}

/**
 * Groups colors by their hue (basic color family)
 */
export function groupByHue(colors) {
  const groups = {
    red: [],
    orange: [],
    yellow: [],
    green: [],
    cyan: [],
    blue: [],
    purple: [],
    magenta: [],
    gray: [],
  };

  colors.forEach((color) => {
    const hsl = hexToHsl(color);
    if (!hsl) return;

    const { h } = hsl;
    let group = 'gray';

    if (h >= 0 && h < 30) group = 'red';
    else if (h >= 30 && h < 60) group = 'orange';
    else if (h >= 60 && h < 90) group = 'yellow';
    else if (h >= 90 && h < 150) group = 'green';
    else if (h >= 150 && h < 210) group = 'cyan';
    else if (h >= 210 && h < 270) group = 'blue';
    else if (h >= 270 && h < 300) group = 'purple';
    else if (h >= 300 && h < 360) group = 'magenta';

    groups[group].push(color);
  });

  return Object.fromEntries(Object.entries(groups).filter(([, v]) => v.length > 0));
}

/**
 * Detects if palette is monochromatic, analogous, or complementary
 */
export function detectColorScheme(colors) {
  if (colors.length < 2) return 'monochromatic';

  const hues = colors.map((color) => hexToHsl(color)?.h).filter((h) => h !== undefined);

  if (hues.length === 0) return 'unknown';

  const minHue = Math.min(...hues);
  const maxHue = Math.max(...hues);
  const hueRange = maxHue - minHue;

  if (hueRange <= 30) return 'monochromatic';
  if (hueRange <= 60) return 'analogous';
  if (Math.abs(hueRange - 180) <= 30) return 'complementary';

  return 'triadic';
}

export default {
  hexToCSS,
  hexToRgb,
  hexToHsl,
  contrastRatio,
  meetsWCAG,
  exportAsJSON,
  exportAsCSS,
  contrastingTextColor,
  generatePaletteName,
  sortByLuminance,
  groupByHue,
  detectColorScheme,
};
