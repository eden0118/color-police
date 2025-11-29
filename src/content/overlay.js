/**
 * Creates a draggable floating panel overlay on the webpage
 */

let overlayPanel = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

/**
 * Creates and injects the floating panel into the page
 */
export function createFloatingPanel(colors, clusters) {
  // Remove existing panel if any
  if (overlayPanel) {
    overlayPanel.remove();
  }

  // Create panel container
  const panel = document.createElement('div');
  panel.id = 'color-thief-police-panel';
  panel.className = 'ctp-floating-panel';

  // Create header
  const header = document.createElement('div');
  header.className = 'ctp-panel-header';
  header.innerHTML = `
    <h3>Color Thief Police</h3>
    <button class="ctp-close-btn">✕</button>
  `;

  // Create content
  const content = document.createElement('div');
  content.className = 'ctp-panel-content';

  // Add clusters
  const clustersHtml = clusters
    .map((cluster, idx) => {
      const mainColor = cluster[0];
      return `
      <div class="ctp-cluster" data-color="${mainColor}">
        <div class="ctp-color-preview" style="background-color: ${mainColor}"></div>
        <div class="ctp-cluster-info">
          <div class="ctp-color-code">${mainColor}</div>
          <div class="ctp-cluster-count">${cluster.length} colors</div>
        </div>
      </div>
    `;
    })
    .join('');

  content.innerHTML = clustersHtml;

  // Assemble panel
  panel.appendChild(header);
  panel.appendChild(content);

  // Inject styles
  injectPanelStyles();

  // Add to page
  document.body.appendChild(panel);
  overlayPanel = panel;

  // Add event listeners
  header.addEventListener('mousedown', handleHeaderMouseDown);

  // Close button
  const closeBtn = panel.querySelector('.ctp-close-btn');
  closeBtn.addEventListener('click', () => {
    if (overlayPanel) {
      overlayPanel.remove();
      overlayPanel = null;
    }
  });

  // Color click handlers
  panel.querySelectorAll('.ctp-cluster').forEach((cluster) => {
    cluster.addEventListener('click', () => {
      const color = cluster.dataset.color;
      // Send message to highlight
      chrome.runtime.sendMessage({
        action: 'highlightColorFromOverlay',
        color: color,
      });
    });
  });
}

/**
 * Handles mouse down on header for dragging
 */
function handleHeaderMouseDown(e) {
  if (e.target.closest('.ctp-close-btn')) return;

  isDragging = true;
  const rect = overlayPanel.getBoundingClientRect();
  dragOffset.x = e.clientX - rect.left;
  dragOffset.y = e.clientY - rect.top;

  overlayPanel.style.cursor = 'grabbing';

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  e.preventDefault();
}

/**
 * Handles mouse move while dragging
 */
function handleMouseMove(e) {
  if (!isDragging || !overlayPanel) return;

  overlayPanel.style.left = e.clientX - dragOffset.x + 'px';
  overlayPanel.style.top = e.clientY - dragOffset.y + 'px';
}

/**
 * Handles mouse up to stop dragging
 */
function handleMouseUp() {
  isDragging = false;
  if (overlayPanel) {
    overlayPanel.style.cursor = 'grab';
  }
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
}

/**
 * Injects CSS styles for the floating panel
 */
function injectPanelStyles() {
  if (document.getElementById('ctp-panel-styles')) {
    return; // Already injected
  }

  const style = document.createElement('style');
  style.id = 'ctp-panel-styles';
  style.textContent = `
    #color-thief-police-panel {
      position: fixed;
      left: 20px;
      top: 20px;
      z-index: 999998;
      width: 320px;
      background: #f8f9fa;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      overflow: hidden;
    }

    .ctp-panel-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: grab;
      user-select: none;
      border-bottom: 2px solid #764ba2;
    }

    .ctp-panel-header:active {
      cursor: grabbing;
    }

    .ctp-panel-header h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .ctp-close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s;
    }

    .ctp-close-btn:hover {
      opacity: 0.8;
    }

    .ctp-panel-content {
      max-height: 500px;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .ctp-panel-content::-webkit-scrollbar {
      width: 6px;
    }

    .ctp-panel-content::-webkit-scrollbar-track {
      background: transparent;
    }

    .ctp-panel-content::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 3px;
    }

    .ctp-panel-content::-webkit-scrollbar-thumb:hover {
      background: #999;
    }

    .ctp-cluster {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .ctp-cluster:hover {
      border-color: #667eea;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
      transform: translateY(-1px);
    }

    .ctp-color-preview {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
      flex-shrink: 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .ctp-cluster-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
    }

    .ctp-color-code {
      font-size: 12px;
      font-weight: 600;
      font-family: 'Courier New', monospace;
      color: #333;
      word-break: break-all;
    }

    .ctp-cluster-count {
      font-size: 11px;
      color: #999;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Removes the floating panel
 */
export function removeFloatingPanel() {
  if (overlayPanel) {
    overlayPanel.remove();
    overlayPanel = null;
  }
}
