import { clusterColors } from '../utils/colorClustering.js';

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'clusterColors') {
    handleClusterColors(request.colors, request.threshold, sendResponse);
  }
});

/**
 * Clusters colors using Delta-E2000
 */
async function handleClusterColors(colors, threshold, sendResponse) {
  try {
    const clusters = clusterColors(colors, threshold);

    // Format clusters for display
    const formattedClusters = clusters.map((cluster) => ({
      representative: cluster.representative,
      colors: cluster.colors,
      count: cluster.colors.length,
    }));

    // Sort by count descending
    formattedClusters.sort((a, b) => b.count - a.count);

    sendResponse({ success: true, clusters: formattedClusters });
  } catch (error) {
    console.error('Error clustering colors:', error);
    sendResponse({ success: false, error: error.message });
  }
}

console.log('Color Thief Police background worker loaded');
