// Content script for YouTube Watch Later page
let isRunning = false;
let isPaused = false;
let shouldStop = false;
let currentDelay = 2000;
let processedCount = 0;
let totalCount = 0;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'start') {
    if (!isRunning) {
      currentDelay = message.delay || 2000;
      startProcessing();
    }
    sendResponse({ success: true });
  } else if (message.action === 'pause') {
    isPaused = true;
    sendResponse({ success: true });
  } else if (message.action === 'resume') {
    isPaused = false;
    sendResponse({ success: true });
  } else if (message.action === 'stop') {
    shouldStop = true;
    isRunning = false;
    isPaused = false;
    sendResponse({ success: true });
  }
  
  return true;
});

// Start processing videos
async function startProcessing() {
  if (isRunning) return;
  
  isRunning = true;
  shouldStop = false;
  processedCount = 0;
  
  sendStateUpdate({ 
    isRunning: true, 
    isPaused: false,
    status: 'Counting videos...',
    statusType: 'running'
  });
  
  // Get initial count of videos
  await waitForVideosToLoad();
  totalCount = getVideoCount();
  
  sendStateUpdate({ 
    total: totalCount,
    processed: 0,
    status: `Processing ${totalCount} videos...`,
    statusType: 'running'
  });
  
  // Process videos one by one
  await processVideos();
  
  isRunning = false;
  
  if (shouldStop) {
    sendStateUpdate({ 
      isRunning: false,
      status: 'Stopped by user',
      statusType: 'ready'
    });
  } else {
    sendStateUpdate({ 
      isRunning: false,
      status: 'All videos processed!',
      statusType: 'complete'
    });
  }
}

// Wait for videos to load on the page
async function waitForVideosToLoad() {
  const maxWait = 5000;
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    const videos = document.querySelectorAll('ytd-playlist-video-renderer');
    if (videos.length > 0) {
      return;
    }
    await sleep(100);
  }
}

// Get count of videos in the playlist
function getVideoCount() {
  const videos = document.querySelectorAll('ytd-playlist-video-renderer');
  return videos.length;
}

// Process all videos
async function processVideos() {
  while (!shouldStop && isRunning) {
    // Wait if paused
    while (isPaused && !shouldStop) {
      await sleep(100);
    }
    
    if (shouldStop) break;
    
    // Get the first video in the list
    const video = document.querySelector('ytd-playlist-video-renderer');
    
    if (!video) {
      // No more videos
      break;
    }
    
    try {
      // Process this video
      await processVideo(video);
      processedCount++;
      
      sendStateUpdate({
        processed: processedCount,
        total: totalCount,
        status: `Processing... (${processedCount}/${totalCount})`,
        statusType: 'running'
      });
      
      // Wait before processing next video
      await sleep(currentDelay);
    } catch (error) {
      console.error('Error processing video:', error);
      sendStateUpdate({
        status: 'Error: ' + error.message,
        statusType: 'error'
      });
      await sleep(currentDelay);
    }
  }
}

// Process a single video
async function processVideo(videoElement) {
  // Open the menu for this video
  const menuButton = videoElement.querySelector('button[aria-label*="Action menu"]') || 
                      videoElement.querySelector('button#button[aria-label="Action menu"]') ||
                      videoElement.querySelector('ytd-menu-renderer button');
  
  if (!menuButton) {
    throw new Error('Could not find menu button');
  }
  
  // Click the menu button
  menuButton.click();
  await sleep(500);
  
  // Find the "Add to playlist" option
  const menuItems = document.querySelectorAll('ytd-menu-service-item-renderer, tp-yt-paper-listbox tp-yt-paper-item');
  let addToPlaylistItem = null;
  
  for (const item of menuItems) {
    const text = item.textContent.toLowerCase();
    if (text.includes('add to playlist') || text.includes('save to playlist')) {
      addToPlaylistItem = item;
      break;
    }
  }
  
  if (addToPlaylistItem) {
    addToPlaylistItem.click();
    await sleep(500);
    
    // Wait for playlist dialog to appear
    const playlistDialog = await waitForElement('ytd-add-to-playlist-renderer', 2000);
    
    if (playlistDialog) {
      // Find the first non-Watch Later playlist checkbox and click it
      const checkboxes = playlistDialog.querySelectorAll('tp-yt-paper-checkbox');
      
      for (const checkbox of checkboxes) {
        const label = checkbox.closest('ytd-playlist-add-to-option-renderer');
        if (label && !label.textContent.includes('Watch Later')) {
          // Click the checkbox if not already checked
          if (!checkbox.hasAttribute('checked')) {
            checkbox.click();
            await sleep(300);
          }
          break;
        }
      }
      
      // Close the dialog
      const closeButton = playlistDialog.querySelector('button[aria-label="Close"]') ||
                          document.querySelector('ytd-add-to-playlist-renderer button[aria-label="Close"]');
      if (closeButton) {
        closeButton.click();
        await sleep(300);
      }
    }
  }
  
  // Now remove from Watch Later
  // Re-open the menu
  menuButton.click();
  await sleep(500);
  
  // Find "Remove from Watch Later" option
  const menuItems2 = document.querySelectorAll('ytd-menu-service-item-renderer, tp-yt-paper-listbox tp-yt-paper-item');
  let removeItem = null;
  
  for (const item of menuItems2) {
    const text = item.textContent.toLowerCase();
    if (text.includes('remove from') || text.includes('delete')) {
      removeItem = item;
      break;
    }
  }
  
  if (removeItem) {
    removeItem.click();
    await sleep(500);
  } else {
    // Close menu if we couldn't find remove option
    document.body.click();
    await sleep(300);
  }
}

// Wait for an element to appear
async function waitForElement(selector, timeout = 5000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
    await sleep(100);
  }
  
  return null;
}

// Sleep utility
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Send state update to popup
function sendStateUpdate(state) {
  chrome.runtime.sendMessage({
    action: 'updateState',
    state: state
  }).catch(() => {
    // Popup might be closed, ignore error
  });
}
