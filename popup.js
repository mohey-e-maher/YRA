document.addEventListener('DOMContentLoaded', () => {
  const resolutionSelect = document.getElementById('resolution');
  const statusDiv = document.getElementById('status');

  // Function to safely send messages to content script
  async function sendMessageToContentScript(message) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.url.includes('youtube.com/watch')) {
        return await chrome.tabs.sendMessage(tab.id, message);
      }
      return null;
    } catch (error) {
      console.log('Content script message error:', error);
      return null;
    }
  }

  // Function to show status message
  function showStatus(message, isError = false) {
    statusDiv.textContent = message;
    statusDiv.style.backgroundColor = isError ? '#fee2e2' : '#ecfdf5';
    statusDiv.style.color = isError ? '#dc2626' : '#059669';
    statusDiv.classList.add('show');
    setTimeout(() => {
      statusDiv.classList.remove('show');
    }, 2000);
  }

  // Load saved resolution
  chrome.storage.sync.get(['preferredResolution', 'isDefault'], (result) => {
    if (result.preferredResolution) {
      resolutionSelect.value = result.preferredResolution;
    }
  });

  // Save resolution when changed
  resolutionSelect.addEventListener('change', async () => {
    const selectedResolution = resolutionSelect.value;
    
    try {
      // Save to storage and set as default
      await chrome.storage.sync.set({ 
        preferredResolution: selectedResolution,
        isDefault: true 
      });
      
      // Try to update current video if on YouTube
      const response = await sendMessageToContentScript({
        type: 'RESOLUTION_CHANGED',
        resolution: selectedResolution
      });

      if (response) {
        showStatus('Default resolution saved successfully!');
      } else {
        showStatus('Default resolution saved. Will apply to next video.');
      }
    } catch (error) {
      console.log('Error saving settings:', error);
      showStatus('Error saving settings. Please try again.', true);
    }
  });
}); 