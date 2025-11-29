export const translations = {
  en: {
    appName: 'Color Thief Police',
    subtitle: 'Design System Inspector',
    scanBtn: 'Scan Colors',
    scanning: 'Scanning...',
    threshold: 'Color Similarity Threshold',
    clusters: 'Color Clusters',
    allColors: 'All Colors',
    noColors: 'No colors found. Click "Scan Colors" to start.',
    colors: 'colors',
    deltaEInfo: 'Color similarity is measured using Delta-E (CIEDE2000) algorithm. Lower values mean more similar colors.',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    frequency: 'Frequency',
  },
  zh: {
    appName: '顏色警察',
    subtitle: '設計系統檢查工具',
    scanBtn: '掃描顏色',
    scanning: '掃描中...',
    threshold: '顏色相似度閾值',
    clusters: '顏色群組',
    allColors: '所有顏色',
    noColors: '未找到顏色。點擊「掃描顏色」開始。',
    colors: '種顏色',
    deltaEInfo: '顏色相似度使用 Delta-E (CIEDE2000) 算法測量。值越低表示顏色越相似。',
    darkMode: '深色模式',
    lightMode: '淺色模式',
    frequency: '使用頻率',
  }
}

export function getLanguage() {
  // Try to get from chrome storage first
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return new Promise((resolve) => {
      chrome.storage.local.get('language', (data) => {
        resolve(data.language || navigator.language.startsWith('zh') ? 'zh' : 'en')
      })
    })
  }
  // Fallback to navigator language
  return Promise.resolve(navigator.language.startsWith('zh') ? 'zh' : 'en')
}

export function setLanguage(lang) {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ language: lang })
  }
}

export function t(key, lang) {
  return translations[lang]?.[key] || translations.en[key] || key
}
