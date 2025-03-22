let currentVideo = null;
let resolutionChangeAttempts = 0;
const MAX_ATTEMPTS = 10;

// Function to find and click the resolution option
function setResolution(targetResolution) {
  const settingsButton = document.querySelector('.ytp-settings-button');
  if (settingsButton) {
    settingsButton.click();
    
    setTimeout(() => {
      const qualityMenuButton = Array.from(document.querySelectorAll('.ytp-menuitem'))
        .find(item => item.textContent.includes('Quality'));
      
      if (qualityMenuButton) {
        qualityMenuButton.click();
        
        setTimeout(() => {
          const qualityOptions = document.querySelectorAll('.ytp-menuitem');
          const targetOption = Array.from(qualityOptions)
            .find(option => option.textContent.includes(targetResolution + 'p'));
          
          if (targetOption) {
            targetOption.click();
            resolutionChangeAttempts = 0;
          } else {
            // If exact resolution not found, try next best available
            const availableResolutions = Array.from(qualityOptions)
              .map(option => parseInt(option.textContent.match(/\d+/)?.[0] || '0'))
              .filter(res => res > 0)
              .sort((a, b) => b - a);
            
            const nextBestResolution = availableResolutions.find(res => res <= targetResolution) ||
              availableResolutions[availableResolutions.length - 1];
            
            const nextBestOption = Array.from(qualityOptions)
              .find(option => option.textContent.includes(nextBestResolution + 'p'));
            
            if (nextBestOption) {
              nextBestOption.click();
              resolutionChangeAttempts = 0;
            }
          }
        }, 500);
      }
    }, 500);
  }
}

// Function to initialize resolution control
function initResolutionControl() {
  chrome.storage.sync.get(['preferredResolution'], (result) => {
    if (result.preferredResolution) {
      setResolution(result.preferredResolution);
    }
  });
}

// Watch for video player initialization
const observer = new MutationObserver((mutations) => {
  const video = document.querySelector('video');
  if (video && video !== currentVideo) {
    currentVideo = video;
    resolutionChangeAttempts = 0;
    
    // Wait for player to be ready
    setTimeout(() => {
      initResolutionControl();
    }, 2000);
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Listen for resolution change messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'RESOLUTION_CHANGED') {
    setResolution(message.resolution);
  }
}); 