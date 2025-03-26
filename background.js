// Listen for installation or update
chrome.runtime.onInstalled.addListener(() => {
  // Initialize default settings
  chrome.storage.sync.get(['preferredResolution'], (result) => {
    if (!result.preferredResolution) {
      chrome.storage.sync.set({ preferredResolution: '480' });
    }
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_DEFAULT_RESOLUTION') {
    // Save the resolution as default
    chrome.storage.sync.set({ 
      preferredResolution: message.resolution,
      isDefault: true 
    }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
}); 