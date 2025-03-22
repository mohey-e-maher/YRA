let currentVideo = null;
let resolutionChangeAttempts = 0;
const MAX_ATTEMPTS = 20;

// Quality options mapping
const QUALITY_MAP = {
  '2160': 'hd2160',
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
  const player = document.getElementById('movie_player');
  if (!player) return null;

  // Check for HTML5 player
  const html5 = player.getElementsByTagName('video').length > 0;

  // Make sure player API is ready
  if (typeof player.getPlayerState === 'undefined') {
    return null;
  }

  return player;
}

// Function to force quality change
async function forceQualityChange(player, targetQuality) {
  // First, disable auto quality
  try {
    const settingsButton = document.querySelector('.ytp-settings-button');
    if (settingsButton) {
      settingsButton.click();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const menuItems = document.querySelectorAll('.ytp-menuitem');
      const qualityButton = Array.from(menuItems).find(item => 
        item.textContent.includes('Quality')
      );
      
      if (qualityButton) {
        qualityButton.click();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const qualityOptions = document.querySelectorAll('.ytp-menuitem');
        const targetOption = Array.from(qualityOptions).find(option => 
          option.textContent.includes(targetQuality.replace('hd', '') + 'p')
        );
        
        if (targetOption) {
          targetOption.click();
          return true;
        }
      }
      
      // Close settings if we couldn't set quality
      settingsButton.click();
    }
  } catch (error) {
    console.log('Manual quality change error:', error);
  }
  
  return false;
}

// Function to set resolution directly through YouTube's player API
async function setResolution(targetResolution) {
  try {
    const player = initPlayer();
    if (!player) return;

    // Get available quality levels
    const levels = player.getAvailableQualityLevels();
    if (!levels || levels.length === 0) return;

    // Map resolution to quality level
    const targetQuality = QUALITY_MAP[targetResolution] || 'large';

    // Try to set quality through API first
    player.setPlaybackQualityRange(targetQuality, targetQuality);
    player.setPlaybackQuality(targetQuality);

    // If the quality didn't change, try manual method
    await new Promise(resolve => setTimeout(resolve, 500));
    if (player.getPlaybackQuality() !== targetQuality) {
      await forceQualityChange(player, targetQuality);
    }

  } catch (error) {
    console.log('Resolution setting error:', error);
  }
}

// Function to initialize resolution control
async function initResolutionControl() {
  try {
    const result = await chrome.storage.sync.get(['preferredResolution']);
    if (result.preferredResolution) {
      await setResolution(result.preferredResolution);
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

  const player = initPlayer();
  if (player) {
    initResolutionControl();
    return true;
  }

  setTimeout(() => {
    startResolutionControl(attempts + 1);
  }, 200);
}

// Watch for video player initialization and quality changes
const observer = new MutationObserver((mutations) => {
  if (!isYouTubeVideoPage()) return;

  const video = document.querySelector('video');
  if (video && video !== currentVideo) {
    currentVideo = video;
    resolutionChangeAttempts = 0;
    startResolutionControl();
  }
});

// Start observing only on YouTube video pages
if (isYouTubeVideoPage()) {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  startResolutionControl();
}

// Listen for resolution change messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'RESOLUTION_CHANGED') {
    setResolution(message.resolution);
    sendResponse({ success: true });
  }
  return true;
}); 