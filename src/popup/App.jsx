import React, { useState, useEffect } from 'react';
import './popup.css';
import { translations, getLanguage, setLanguage, t } from '../i18n/translations';
import { getContrastTextColor } from '../utils/colorContrast';

export function Popup() {
  const [colors, setColors] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [threshold, setThreshold] = useState(20); // delta-E value
  const [activeTab, setActiveTab] = useState('clusters');
  const [highlightedColor, setHighlightedColor] = useState(null);
  const [language, setLanguageState] = useState('en');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Load language and theme preferences
    const loadPreferences = async () => {
      const lang = await getLanguage();
      setLanguageState(lang);

      // Load dark mode preference
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get('darkMode', (data) => {
          const darkMode = data.darkMode !== false;
          setIsDarkMode(darkMode);
          applyTheme(darkMode);
        });
      }
    };
    loadPreferences();
  }, []);

  const applyTheme = (dark) => {
    const container = document.querySelector('.popup-container');
    if (container) {
      if (dark) {
        container.classList.add('dark-mode');
      } else {
        container.classList.remove('dark-mode');
      }
    }
  };

  const handleLanguageChange = (lang) => {
    setLanguageState(lang);
    setLanguage(lang);
  };

  const handleThemToggle = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    applyTheme(newDarkMode);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ darkMode: newDarkMode });
    }
  };

  const scanPage = async () => {
    setLoading(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      // Clear all highlights first before scanning
      await chrome.tabs.sendMessage(tab.id, { action: 'clearHighlights' });

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'scanColors',
      });

      if (response && response.colors) {
        setColors(response.colors);
        clusterColors(response.colors);
        // Clear highlighted color when scanning
        setHighlightedColor(null);
      }
    } catch (error) {
      console.error('Error scanning page:', error);
    } finally {
      setLoading(false);
    }
  };

  const clusterColors = async (colorList) => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'clusterColors',
        colors: colorList,
        threshold,
      });

      if (response && response.clusters) {
        setClusters(response.clusters);
      }
    } catch (error) {
      console.error('Error clustering colors:', error);
    }
  };

  const highlightColor = async (color) => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id, {
        action: 'highlightColor',
        color,
      });

      // Toggle: if clicking the same color, it will deselect
      setHighlightedColor(highlightedColor === color ? null : color);
    } catch (error) {
      console.error('Error highlighting color:', error);
    }
  };

  const handleThresholdChange = (e) => {
    const newThreshold = parseInt(e.target.value);
    setThreshold(newThreshold);
    if (colors.length > 0) {
      clusterColors(colors);
    }
  };

  return (
    <div className="popup-container" style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}>
      <header className="popup-header">
        <div className="header-top">
          <div>
            <h1>{t('appName', language)}</h1>
            <p className="subtitle">{t('subtitle', language)}</p>
          </div>
          <div className="header-controls">
            <button
              className="theme-btn"
              onClick={handleThemToggle}
              title={isDarkMode ? t('lightMode', language) : t('darkMode', language)}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <select
              className="language-select"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              <option value="en">English</option>
              <option value="zh">中文</option>
            </select>
          </div>
        </div>
      </header>

      <div className="controls">
        <button className="scan-btn" onClick={scanPage} disabled={loading}>
          {loading ? t('scanning', language) : t('scanBtn', language)}
        </button>
        <div className="threshold-control">
          <label htmlFor="threshold">{t('threshold', language)}:</label>
          <input
            id="threshold"
            type="range"
            min="5"
            max="100"
            step="5"
            value={threshold}
            onChange={handleThresholdChange}
          />
          <span className="threshold-value">{threshold}</span>
        </div>
        <p className="delta-e-info">{t('deltaEInfo', language)}</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'clusters' ? 'active' : ''}`}
          onClick={() => setActiveTab('clusters')}
        >
          {t('clusters', language)} ({clusters.length})
        </button>
        <button
          className={`tab ${activeTab === 'colors' ? 'active' : ''}`}
          onClick={() => setActiveTab('colors')}
        >
          {t('allColors', language)} ({colors.length})
        </button>
      </div>

      <div className="content">
        {activeTab === 'clusters' ? (
          <div className="clusters-view">
            {clusters.length === 0 ? (
              <p className="empty-state">{t('noColors', language)}</p>
            ) : (
              clusters.map((cluster, idx) => (
                <div key={idx} className="cluster-item">
                  <div className="cluster-header">
                    <div
                      className="color-preview"
                      style={{ backgroundColor: cluster.representative }}
                    ></div>
                    <div className="cluster-info">
                      <span className="cluster-title">{cluster.representative}</span>
                      <span className="cluster-count">
                        {cluster.colors.length} {t('colors', language)}
                      </span>
                    </div>
                  </div>
                  <div className="cluster-colors">
                    {cluster.colors.map((color, i) => (
                      <div
                        key={i}
                        className={`color-chip ${highlightedColor === color ? 'active' : ''}`}
                        title={color}
                        onClick={() => highlightColor(color)}
                        style={{ backgroundColor: color }}
                      >
                        <span
                          className="color-label"
                          style={{ color: getContrastTextColor(color) }}
                        >
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="colors-view">
            {colors.length === 0 ? (
              <p className="empty-state">{t('noColors', language)}</p>
            ) : (
              <div className="color-grid">
                {colors.map((color, idx) => (
                  <div
                    key={idx}
                    className={`color-item ${highlightedColor === color ? 'active' : ''}`}
                    onClick={() => highlightColor(color)}
                    title={`${language === 'zh' ? '點擊highlight: ' : 'Click to highlight: '}${color}`}
                  >
                    <div className="color-square" style={{ backgroundColor: color }}></div>
                    <span
                      className="color-code"
                      style={{ color: getContrastTextColor(color), backgroundColor: color }}
                    >
                      {color}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
