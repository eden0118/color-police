import React, { useState, useEffect } from 'react'
import './popup.css'

export function Popup() {
  const [colors, setColors] = useState([])
  const [clusters, setClusters] = useState([])
  const [loading, setLoading] = useState(false)
  const [threshold, setThreshold] = useState(30)
  const [activeTab, setActiveTab] = useState('clusters')

  useEffect(() => {
    scanPage()
  }, [])

  const scanPage = async () => {
    setLoading(true)
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'scanColors',
      })

      if (response && response.colors) {
        setColors(response.colors)
        clusterColors(response.colors)
      }
    } catch (error) {
      console.error('Error scanning page:', error)
    } finally {
      setLoading(false)
    }
  }

  const clusterColors = async (colorList) => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'clusterColors',
        colors: colorList,
        threshold,
      })

      if (response && response.clusters) {
        setClusters(response.clusters)
      }
    } catch (error) {
      console.error('Error clustering colors:', error)
    }
  }

  const highlightColor = async (color) => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      await chrome.tabs.sendMessage(tab.id, {
        action: 'highlightColor',
        color,
      })
    } catch (error) {
      console.error('Error highlighting color:', error)
    }
  }

  const handleThresholdChange = (e) => {
    const newThreshold = parseInt(e.target.value)
    setThreshold(newThreshold)
    if (colors.length > 0) {
      clusterColors(colors)
    }
  }

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>Color Thief Police</h1>
        <p className="subtitle">Design System Inspector</p>
      </header>

      <div className="controls">
        <button className="scan-btn" onClick={scanPage} disabled={loading}>
          {loading ? 'Scanning...' : 'Scan Page'}
        </button>
        <div className="threshold-control">
          <label htmlFor="threshold">Delta-E Threshold:</label>
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
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'clusters' ? 'active' : ''}`}
          onClick={() => setActiveTab('clusters')}
        >
          Clusters ({clusters.length})
        </button>
        <button
          className={`tab ${activeTab === 'colors' ? 'active' : ''}`}
          onClick={() => setActiveTab('colors')}
        >
          All Colors ({colors.length})
        </button>
      </div>

      <div className="content">
        {activeTab === 'clusters' ? (
          <div className="clusters-view">
            {clusters.length === 0 ? (
              <p className="empty-state">No color clusters found. Scan a page to get started.</p>
            ) : (
              clusters.map((cluster, idx) => (
                <div key={idx} className="cluster-item">
                  <div className="cluster-header">
                    <div className="color-preview" style={{ backgroundColor: cluster.representative }}></div>
                    <div className="cluster-info">
                      <span className="cluster-title">{cluster.representative}</span>
                      <span className="cluster-count">{cluster.colors.length} similar colors</span>
                    </div>
                  </div>
                  <div className="cluster-colors">
                    {cluster.colors.map((color, i) => (
                      <div
                        key={i}
                        className="color-chip"
                        title={color}
                        onClick={() => highlightColor(color)}
                        style={{ backgroundColor: color }}
                      >
                        <span className="color-label">{color}</span>
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
              <p className="empty-state">No colors detected. Try scanning a different page.</p>
            ) : (
              <div className="color-grid">
                {colors.map((color, idx) => (
                  <div
                    key={idx}
                    className="color-item"
                    onClick={() => highlightColor(color)}
                    title={`Click to highlight: ${color}`}
                  >
                    <div className="color-square" style={{ backgroundColor: color }}></div>
                    <span className="color-code">{color}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
