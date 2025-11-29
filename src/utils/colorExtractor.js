/**
 * Extracts all colors from a webpage by scanning computed styles
 */
export function extractColorsFromPage() {
  const colors = new Set()
  const elements = document.querySelectorAll('*')

  elements.forEach((element) => {
    // Skip script and style elements
    if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
      return
    }

    const computedStyle = window.getComputedStyle(element)

    // Extract background colors
    const bgColor = computedStyle.backgroundColor
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
      colors.add(normalizeColor(bgColor))
    }

    // Extract text colors
    const textColor = computedStyle.color
    if (textColor) {
      colors.add(normalizeColor(textColor))
    }

    // Extract border colors
    const borderColor = computedStyle.borderColor
    if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)') {
      colors.add(normalizeColor(borderColor))
    }
  })

  return Array.from(colors).filter((color) => color !== null)
}

/**
 * Normalizes color strings to hex format
 */
export function normalizeColor(colorString) {
  // Handle rgb/rgba format
  const rgbaMatch = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/)
  if (rgbaMatch) {
    const [, r, g, b] = rgbaMatch
    return `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`.toUpperCase()
  }

  // Handle hex format
  if (colorString.startsWith('#')) {
    return colorString.toUpperCase()
  }

  return null
}

/**
 * Groups elements by their computed background and text colors
 */
export function getColoredElements() {
  const colorMap = new Map()
  const elements = document.querySelectorAll('*')

  elements.forEach((element) => {
    if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
      return
    }

    const computedStyle = window.getComputedStyle(element)
    const bgColor = normalizeColor(computedStyle.backgroundColor)
    const textColor = normalizeColor(computedStyle.color)

    if (bgColor || textColor) {
      const colorKey = `${bgColor || 'none'}-${textColor || 'none'}`
      if (!colorMap.has(colorKey)) {
        colorMap.set(colorKey, {
          bgColor,
          textColor,
          elements: [],
        })
      }
      colorMap.get(colorKey).elements.push(element)
    }
  })

  return Array.from(colorMap.values())
}
