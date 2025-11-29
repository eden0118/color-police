import { extractColorsFromPage, getColoredElements, normalizeColor } from '../utils/colorExtractor.js'

// Track highlighted elements for cleanup
let highlightedElements = new Set()
let currentHighlightedColor = null // Track the currently highlighted color

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scanColors') {
    handleScanColors(sendResponse)
  } else if (request.action === 'highlightColor') {
    handleHighlightColor(request.color)
  } else if (request.action === 'clearHighlights') {
    clearHighlights()
  } else if (request.action === 'getHighlightedColor') {
    sendResponse({ color: currentHighlightedColor })
  }
})

/**
 * Scans the page and extracts all colors
 */
function handleScanColors(sendResponse) {
  try {
    const colors = extractColorsFromPage()
    sendResponse({ success: true, colors })
  } catch (error) {
    console.error('Error scanning colors:', error)
    sendResponse({ success: false, error: error.message })
  }
}

/**
 * Highlights all elements with a specific color (toggle behavior)
 */
function handleHighlightColor(color) {
  // If the same color is clicked again, toggle it off
  if (currentHighlightedColor === color) {
    clearHighlights()
    return
  }

  // Clear previous highlights before showing new ones
  clearHighlights()
  currentHighlightedColor = color

  const elements = document.querySelectorAll('*')
  const elementsToHighlight = []

  // First pass: collect all matching elements
  elements.forEach((element) => {
    if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE' || element.tagName === 'META' || element.tagName === 'LINK') {
      return
    }

    const computedStyle = window.getComputedStyle(element)
    const bgColor = normalizeColor(computedStyle.backgroundColor)
    const textColor = normalizeColor(computedStyle.color)
    const borderColor = normalizeColor(computedStyle.borderColor)

    if (bgColor === color || textColor === color || borderColor === color) {
      elementsToHighlight.push(element)
    }
  })

  // Second pass: filter out elements that are inside other highlighted elements
  const filteredElements = elementsToHighlight.filter((element) => {
    return !elementsToHighlight.some((otherElement) => {
      return otherElement !== element && otherElement.contains(element)
    })
  })

  // Third pass: add highlights only to filtered elements
  let count = 0
  filteredElements.forEach((element) => {
    const overlay = document.createElement('div')
    overlay.className = 'color-thief-police-highlight'
    overlay.dataset.targetColor = color

    // Only set position:relative if not already positioned
    const currentPosition = window.getComputedStyle(element).position
    if (currentPosition === 'static') {
      element.style.position = 'relative'
      element.dataset.ctpPositionSet = 'true'
    }

    element.classList.add('color-thief-police-highlighted')
    element.appendChild(overlay)

    highlightedElements.add(element)
    count++
  })

  // Inject highlight styles if not already present
  if (count > 0) {
    injectHighlightStyles()
  }
}

/**
 * Clears all highlights from the page
 */
function clearHighlights() {
  highlightedElements.forEach((element) => {
    element.classList.remove('color-thief-police-highlighted')
    const overlay = element.querySelector('.color-thief-police-highlight')
    if (overlay) {
      overlay.remove()
    }
    // Clean up style only if we added it
    if (element.dataset.ctpPositionSet === 'true') {
      element.style.position = ''
      delete element.dataset.ctpPositionSet
    }
  })
  highlightedElements.clear()
  currentHighlightedColor = null
}

/**
 * Injects highlight styles into the page
 */
function injectHighlightStyles() {
  if (document.getElementById('color-thief-police-styles')) {
    return // Already injected
  }

  const style = document.createElement('style')
  style.id = 'color-thief-police-styles'
  style.textContent = `
    .color-thief-police-highlight {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 2px solid #ff6b6b;
      box-shadow: inset 0 0 0 2px #ff6b6b, 0 0 8px rgba(255, 107, 107, 0.6);
      pointer-events: none;
      animation: color-thief-police-pulse 1.5s ease-in-out infinite;
      border-radius: inherit;
      z-index: 10000;
    }

    .color-thief-police-highlighted {
      z-index: auto;
    }

    @keyframes color-thief-police-pulse {
      0%, 100% {
        box-shadow: inset 0 0 0 2px #ff6b6b, 0 0 8px rgba(255, 107, 107, 0.6);
      }
      50% {
        box-shadow: inset 0 0 0 2px #ff6b6b, 0 0 16px rgba(255, 107, 107, 0.3);
      }
    }
  `
  document.head.appendChild(style)
}

console.log('Color Thief Police content script loaded')
