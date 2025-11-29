/**
 * Utility function to calculate relative luminance of a color
 * Based on WCAG contrast calculation
 */
export function getLuminance(hexColor) {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Calculate luminance using WCAG formula
  const luminance =
    0.2126 * (r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)) +
    0.7152 * (g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)) +
    0.0722 * (b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4));

  return luminance;
}

/**
 * Determine if text should be light or dark based on background color
 * Returns 'white' or 'black'
 */
export function getContrastTextColor(hexColor) {
  const luminance = getLuminance(hexColor);
  // If luminance is high (light background), use dark text
  // If luminance is low (dark background), use light text
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
