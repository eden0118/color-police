import { Colord, colord } from 'colord'

/**
 * Implements CIEDE2000 Delta-E color distance calculation
 * Reference: https://en.wikipedia.org/wiki/Color_difference#CIEDE2000
 */
export function deltaE2000(color1, color2) {
  const lab1 = rgbToLab(color1)
  const lab2 = rgbToLab(color2)

  const dL = lab2.l - lab1.l
  const dC = lab2.c - lab1.c

  const lMean = (lab1.l + lab2.l) / 2
  const cMean = (lab1.c + lab2.c) / 2

  const g = (1 - Math.sqrt(Math.pow(cMean, 7) / (Math.pow(cMean, 7) + Math.pow(25, 7)))) / 2
  const ap1 = lab1.a * (1 + g)
  const ap2 = lab2.a * (1 + g)

  const cp1 = Math.sqrt(ap1 * ap1 + lab1.b * lab1.b)
  const cp2 = Math.sqrt(ap2 * ap2 + lab2.b * lab2.b)

  const dCp = cp2 - cp1
  const dHp = Math.sqrt(
    Math.pow(lab2.a - lab1.a - dCp * Math.cos(2 * Math.PI * (lab1.h - lab2.h) / 360), 2) +
    Math.pow(lab2.b - lab1.b - dCp * Math.sin(2 * Math.PI * (lab1.h - lab2.h) / 360), 2)
  )

  const cMeanp = (cp1 + cp2) / 2
  const hMean = Math.abs(lab1.h - lab2.h) > 180 ? ((lab1.h + lab2.h + 360) % 360) / 2 : (lab1.h + lab2.h) / 2

  const t =
    1 -
    0.17 * Math.cos(Math.PI * (hMean - 30) / 180) +
    0.24 * Math.cos(2 * Math.PI * hMean / 180) +
    0.32 * Math.cos(Math.PI * (3 * hMean + 6) / 180) -
    0.2 * Math.cos(Math.PI * (4 * hMean - 63) / 180)

  const sl = 1 + (0.015 * Math.pow(lMean - 50, 2)) / Math.sqrt(20 + Math.pow(lMean - 50, 2))
  const sc = 1 + 0.045 * cMeanp
  const sh = 1 + 0.015 * cMeanp * t

  const dTheta = 30 * Math.exp(-Math.pow((hMean - 275) / 25, 2))
  const rc = 2 * Math.sqrt(Math.pow(cMeanp, 7) / (Math.pow(cMeanp, 7) + Math.pow(25, 7)))

  const dE = Math.sqrt(
    Math.pow(dL / sl, 2) +
    Math.pow(dCp / sc, 2) +
    Math.pow(dHp / sh, 2) +
    rc * (dCp / sc) * (dHp / sh)
  )

  return dE
}

/**
 * Converts RGB hex color to LAB color space
 */
export function rgbToLab(hexColor) {
  const color = colord(hexColor)
  const rgb = color.toRgb()

  // RGB to XYZ
  let r = rgb.r / 255
  let g = rgb.g / 255
  let b = rgb.b / 255

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92

  const x = r * 0.4124 + g * 0.3576 + b * 0.1805
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505

  // XYZ to LAB
  let xn = x / 0.95047
  let yn = y / 1.0
  let zn = z / 1.08883

  xn = xn > 0.008856 ? Math.pow(xn, 1 / 3) : 7.787 * xn + 16 / 116
  yn = yn > 0.008856 ? Math.pow(yn, 1 / 3) : 7.787 * yn + 16 / 116
  zn = zn > 0.008856 ? Math.pow(zn, 1 / 3) : 7.787 * zn + 16 / 116

  const l = 116 * yn - 16
  const a = 500 * (xn - yn)
  const labB = 200 * (yn - zn)

  // Calculate C* and h
  const c = Math.sqrt(a * a + labB * labB)
  let h = Math.atan2(labB, a) * (180 / Math.PI)
  if (h < 0) h += 360

  return { l, a, b: labB, c, h }
}

/**
 * Clusters colors using Delta-E2000 with a threshold
 * threshold: maximum Delta-E value to consider colors similar (default: 30)
 */
export function clusterColors(colors, threshold = 30) {
  if (colors.length === 0) return []

  const clusters = []
  const used = new Set()

  for (let i = 0; i < colors.length; i++) {
    if (used.has(i)) continue

    const cluster = [colors[i]]
    used.add(i)

    for (let j = i + 1; j < colors.length; j++) {
      if (used.has(j)) continue

      const distance = deltaE2000(colors[i], colors[j])
      if (distance <= threshold) {
        cluster.push(colors[j])
        used.add(j)
      }
    }

    clusters.push({
      colors: cluster,
      representative: cluster[0],
      distance: 0,
    })
  }

  return clusters
}

/**
 * Finds the most similar color in a list to a given color
 */
export function findMostSimilarColor(targetColor, colorList) {
  let minDistance = Infinity
  let mostSimilar = null

  for (const color of colorList) {
    const distance = deltaE2000(targetColor, color)
    if (distance < minDistance) {
      minDistance = distance
      mostSimilar = color
    }
  }

  return { color: mostSimilar, distance: minDistance }
}
