// Popup script for controlling the extension
let currentState = {
  isRunning: false,
  isPaused: false,
  processed: 0,
  total: 0
};

// DOM elements
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const statusDiv = document.getElementById('status');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const delayInput = document.getElementById('delayInput');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Check current state from background
  const state = await chrome.runtime.sendMessage({ action: 'getState' });
  if (state) {
    updateUI(state);
  }
  
  // Load saved delay
  const result = await chrome.storage.local.get(['delay']);
  if (result.delay) {
    delayInput.value = result.delay;
  }
});

// Start button
startBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url || !tab.url.includes('youtube.com/playlist?list=WL')) {
    updateStatus('Please open YouTube Watch Later playlist first', 'error');
    return;
  }
  
  // Save delay setting
  const delay = parseInt(delayInput.value);
  await chrome.storage.local.set({ delay });
  
  // Send start message to content script
  chrome.tabs.sendMessage(tab.id, { 
    action: 'start',
    delay: delay
  }, (response) => {
    if (chrome.runtime.lastError) {
      updateStatus('Error: ' + chrome.runtime.lastError.message, 'error');
    }
  });
  
  currentState.isRunning = true;
  currentState.isPaused = false;
  updateButtons();
  updateStatus('Starting...', 'running');
});

// Pause button
pauseBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (currentState.isPaused) {
    // Resume
    chrome.tabs.sendMessage(tab.id, { action: 'resume' });
    currentState.isPaused = false;
    updateStatus('Running...', 'running');
  } else {
    // Pause
    chrome.tabs.sendMessage(tab.id, { action: 'pause' });
    currentState.isPaused = true;
    updateStatus('Paused', 'paused');
  }
  
  updateButtons();
});

// Stop button
stopBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.tabs.sendMessage(tab.id, { action: 'stop' });
  
  currentState.isRunning = false;
  currentState.isPaused = false;
  updateButtons();
  updateStatus('Stopped', 'ready');
});

// Listen for state updates from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateState') {
    updateUI(message.state);
  }
});

// Update UI based on state
function updateUI(state) {
  currentState = { ...currentState, ...state };
  
  if (state.isRunning !== undefined || state.isPaused !== undefined) {
    updateButtons();
  }
  
  if (state.status) {
    updateStatus(state.status, state.statusType || 'running');
  }
  
  if (state.processed !== undefined || state.total !== undefined) {
    updateProgress(state.processed, state.total);
  }
}

// Update button states
function updateButtons() {
  if (currentState.isRunning) {
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
    
    if (currentState.isPaused) {
      pauseBtn.textContent = 'Resume';
    } else {
      pauseBtn.textContent = 'Pause';
    }
  } else {
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    pauseBtn.textContent = 'Pause';
  }
  
  // Disable delay input while running
  delayInput.disabled = currentState.isRunning;
}

// Update status display
function updateStatus(text, type = 'ready') {
  statusDiv.className = 'status ' + type;
  statusDiv.querySelector('.status-text').textContent = text;
}

// Update progress display
function updateProgress(processed, total) {
  currentState.processed = processed;
  currentState.total = total;
  
  if (total > 0) {
    progressContainer.style.display = 'block';
    const percentage = (processed / total) * 100;
    progressFill.style.width = percentage + '%';
    progressText.textContent = `${processed} / ${total} videos processed`;
  } else {
    progressContainer.style.display = 'none';
  }
}
