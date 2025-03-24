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

  // Pause to avoid flicker caused by loading different quality
  player.pauseVideo();

  // In Chrome Flash player, player.setQualityLevel() doesn't work unless video has started playing
  if (!isHTML5 && player.getPlayerState() < 1) {
    return null;
  }

  return player;
}

// Function to set resolution
function setResolution(targetResolution) {
  try {
    const player = initPlayer();
    if (!player) return;

    // Get available quality levels
    const levels = player.getAvailableQualityLevels();
    if (!levels) return;

    // Get the target quality from our mapping
    const targetQuality = QUALITY_MAP[targetResolution];
    
    // Set playback quality
    if (levels.indexOf(targetQuality) >= 0) {
      player.setPlaybackQuality(targetQuality);
      player.setPlaybackQualityRange(targetQuality, targetQuality);
    } else {
      // Find the best available quality
      const availableQualities = Object.values(QUALITY_MAP)
        .filter(quality => levels.indexOf(quality) >= 0)
        .map(quality => parseInt(Object.keys(QUALITY_MAP).find(key => QUALITY_MAP[key] === quality)))
        .sort((a, b) => b - a);

      const bestQuality = availableQualities.find(quality => quality <= targetResolution) || 
                         availableQualities[availableQualities.length - 1];
      
      const bestQualityString = QUALITY_MAP[bestQuality];
      player.setPlaybackQuality(bestQualityString);
      player.setPlaybackQualityRange(bestQualityString, bestQualityString);
    }

    // Resume playback
    player.playVideo();
  } catch (error) {
    console.log('Resolution setting error:', error);
  }
}

// Function to initialize resolution control
async function initResolutionControl() {
  try {
    const result = await chrome.storage.sync.get(['preferredResolution']);
    if (result.preferredResolution) {
      setResolution(result.preferredResolution);
    }
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
    setResolution(message.resolution);
    sendResponse({ success: true });
  }
  return true;
}); 