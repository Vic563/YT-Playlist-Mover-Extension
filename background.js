// Background service worker
let currentState = {
  isRunning: false,
  isPaused: false,
  processed: 0,
  total: 0,
  status: 'Ready',
  statusType: 'ready'
};

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getState') {
    sendResponse(currentState);
  } else if (message.action === 'updateState') {
    currentState = { ...currentState, ...message.state };
    sendResponse({ success: true });
  }
  
  return true;
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open popup (this is handled automatically by the manifest)
});
