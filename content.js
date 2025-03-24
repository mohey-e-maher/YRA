let currentVideo = null;
let resolutionChangeAttempts = 0;
const MAX_ATTEMPTS = 20;
let preferredResolution = null;

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

// Function to force quality change through UI
async function forceQualityChange(player, targetQuality) {
  try {
    // Click settings button
    const settingsButton = document.querySelector('.ytp-settings-button');
    if (!settingsButton) return false;
    
    settingsButton.click();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Click quality option
    const menuItems = document.querySelectorAll('.ytp-menuitem');
    const qualityButton = Array.from(menuItems).find(item => 
      item.textContent.includes('Quality')
    );
    
    if (!qualityButton) return false;
    qualityButton.click();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Select specific quality
    const qualityOptions = document.querySelectorAll('.ytp-menuitem');
    const targetOption = Array.from(qualityOptions).find(option => 
      option.textContent.includes(targetQuality.replace('hd', '') + 'p')
    );
    
    if (targetOption) {
      targetOption.click();
      return true;
    }
    
    // Close settings if we couldn't set quality
    settingsButton.click();
  } catch (error) {
    console.log('Manual quality change error:', error);
  }
  
  return false;
}

// Function to override YouTube's auto-quality
function overrideAutoQuality(player) {
  try {
    // Override the auto-quality function
    const originalSetPlaybackQuality = player.setPlaybackQuality;
    player.setPlaybackQuality = function(quality) {
      if (preferredResolution) {
        const targetQuality = QUALITY_MAP[preferredResolution];
        return originalSetPlaybackQuality.call(this, targetQuality);
      }
      return originalSetPlaybackQuality.call(this, quality);
    };

    // Override the quality range function
    const originalSetPlaybackQualityRange = player.setPlaybackQualityRange;
    player.setPlaybackQualityRange = function(min, max) {
      if (preferredResolution) {
        const targetQuality = QUALITY_MAP[preferredResolution];
        return originalSetPlaybackQualityRange.call(this, targetQuality, targetQuality);
      }
      return originalSetPlaybackQualityRange.call(this, min, max);
    };
  } catch (error) {
    console.log('Override error:', error);
  }
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

    // Override auto-quality functions
    overrideAutoQuality(player);

    // Try multiple methods to set quality
    // Method 1: Direct API calls
    player.setPlaybackQualityRange(targetQuality, targetQuality);
    player.setPlaybackQuality(targetQuality);

    // Method 2: Force through UI
    await new Promise(resolve => setTimeout(resolve, 500));
    if (player.getPlaybackQuality() !== targetQuality) {
      await forceQualityChange(player, targetQuality);
    }

    // Method 3: Set quality through video element
    const video = player.querySelector('video');
    if (video) {
      video.setAttribute('quality', targetQuality);
      // Override video element's quality setting
      Object.defineProperty(video, 'quality', {
        get: () => targetQuality,
        set: () => targetQuality
      });
    }

    // Store the preferred resolution
    preferredResolution = targetResolution;

    // Force quality again after a short delay
    setTimeout(() => {
      player.setPlaybackQuality(targetQuality);
      player.setPlaybackQualityRange(targetQuality, targetQuality);
    }, 1000);

  } catch (error) {
    console.log('Resolution setting error:', error);
  }
}

// Function to check and maintain resolution
async function maintainResolution() {
  if (!preferredResolution) return;

  const player = initPlayer();
  if (!player) return;

  const currentQuality = player.getPlaybackQuality();
  const targetQuality = QUALITY_MAP[preferredResolution];

  if (currentQuality !== targetQuality) {
    await setResolution(preferredResolution);
  }
}

// Function to initialize resolution control
async function initResolutionControl() {
  try {
    const result = await chrome.storage.sync.get(['preferredResolution']);
    if (result.preferredResolution) {
      preferredResolution = result.preferredResolution;
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
    // Start continuous monitoring with shorter interval
    setInterval(maintainResolution, 500);
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
    preferredResolution = message.resolution;
    setResolution(message.resolution);
    sendResponse({ success: true });
  }
  return true;
}); 