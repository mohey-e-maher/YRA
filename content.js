let currentVideo = null;
let resolutionChangeAttempts = 0;
const MAX_ATTEMPTS = 20;

// Quality options mapping
const QUALITY_MAP = {
  '2160': 'highres',
  '1440': 'hd1440',
  '1080': 'hd1080',
  '720': 'hd720',
  '480': 'large',
  '360': 'medium',
  '240': 'small',
  '144': 'tiny'
};

// Function to safely send messages to the extension
async function sendMessageToExtension(message) {
  try {
    return await chrome.runtime.sendMessage(message);
  } catch (error) {
    console.log('Extension message error:', error);
    return null;
  }
}

// Function to initialize player
function initPlayer() {
  let player = document.getElementById('movie_player');
  if (!player) {
    player = document.getElementById('movie_player-flash');
  }
  
  if (!player) return null;

  // Check for HTML5 player
  const isHTML5 = player.getElementsByTagName('video').length > 0;

  // Make sure player API is ready
  if (typeof player.pauseVideo === 'undefined') {
    return null;
  }

  return player;
}

// Function to set lowest resolution
function setLowestResolution() {
  try {
    const player = initPlayer();
    if (!player) return;

    // Get available quality levels
    const levels = player.getAvailableQualityLevels();
    if (!levels) return;

    // Find the lowest available quality
    const lowestQuality = levels[levels.length - 1];
    
    // Set playback quality to lowest
    player.setPlaybackQuality(lowestQuality);
    player.setPlaybackQualityRange(lowestQuality, lowestQuality);
    
    // Force quality settings
    player.setPlaybackQualityRange(lowestQuality, lowestQuality);
    
    // Additional quality enforcement
    const video = document.querySelector('video');
    if (video) {
      video.setAttribute('quality', lowestQuality);
    }

    console.log('Set resolution to:', lowestQuality);
  } catch (error) {
    console.log('Resolution setting error:', error);
  }
}

// Function to initialize resolution control
async function initResolutionControl() {
  try {
    setLowestResolution();
  } catch (error) {
    console.log('Storage access error:', error);
  }
}

// Function to check if we're on a YouTube video page
function isYouTubeVideoPage() {
  return window.location.pathname === '/watch';
}

// Function to start resolution control with retries
function startResolutionControl(attempts = 0) {
  if (attempts > MAX_ATTEMPTS) return;

  if (isYouTubeVideoPage()) {
    const video = document.querySelector('video');
    if (video && video !== currentVideo) {
      currentVideo = video;
      resolutionChangeAttempts = 0;
      
      // Wait for player to be ready
      setTimeout(() => {
        initResolutionControl();
      }, 1000);
    }
  }

  // Try again if needed
  setTimeout(() => {
    startResolutionControl(attempts + 1);
  }, 200);
}

// Start resolution control
startResolutionControl();

// Listen for resolution change messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'RESOLUTION_CHANGED') {
    setLowestResolution();
    sendResponse({ success: true });
  }
  return true;
});

// Additional observer to catch dynamic video changes
const observer = new MutationObserver((mutations) => {
  if (isYouTubeVideoPage()) {
    const video = document.querySelector('video');
    if (video && video !== currentVideo) {
      currentVideo = video;
      setLowestResolution();
    }
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
}); 