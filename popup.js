document.addEventListener('DOMContentLoaded', () => {
  const resolutionSelect = document.getElementById('resolution');
  const statusDiv = document.getElementById('status');

  // Load saved resolution
  chrome.storage.sync.get(['preferredResolution'], (result) => {
    if (result.preferredResolution) {
      resolutionSelect.value = result.preferredResolution;
    }
  });

  // Save resolution when changed
  resolutionSelect.addEventListener('change', () => {
    const selectedResolution = resolutionSelect.value;
    chrome.storage.sync.set({ preferredResolution: selectedResolution }, () => {
      // Show saved status with animation
      statusDiv.classList.add('show');
      setTimeout(() => {
        statusDiv.classList.remove('show');
      }, 2000);

      // Notify content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab.url.includes('youtube.com')) {
          chrome.tabs.sendMessage(activeTab.id, {
            type: 'RESOLUTION_CHANGED',
            resolution: selectedResolution
          });
        }
      });
    });
  });
}); 