// Function to decrypt password
async function decryptPassword(encryptedData) {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(encryptedData.key),
      "AES-GCM",
      true,
      ["decrypt"]
    );
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(encryptedData.iv),
      },
      key,
      new Uint8Array(encryptedData.encrypted)
    );
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

// Function to verify password
async function verifyPassword(password) {
  try {
    const result = await chrome.storage.sync.get(['encryptedPassword']);
    if (!result.encryptedPassword) return false;
    
    const decryptedPassword = await decryptPassword(result.encryptedPassword);
    return password === decryptedPassword;
  } catch (error) {
    console.error('Verification error:', error);
    return false;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('loginForm');
  const settingsContent = document.getElementById('settingsContent');
  const passwordInput = document.getElementById('password');
  const loginButton = document.getElementById('loginButton');
  const lockButton = document.getElementById('lockButton');
  const resolutionSelect = document.getElementById('resolution');
  const statusDiv = document.getElementById('status');

  // Check if password is set
  const result = await chrome.storage.sync.get(['hasPassword']);
  
  if (!result.hasPassword) {
    // First time setup - redirect to permission page
    window.location.href = 'permission.html';
    return;
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

  // Handle login
  loginButton.addEventListener('click', async () => {
    const password = passwordInput.value;
    if (!password) {
      showStatus('Please enter your password', true);
      return;
    }

    const isValid = await verifyPassword(password);
    if (isValid) {
      loginForm.style.display = 'none';
      settingsContent.style.display = 'block';
      lockButton.querySelector('.material-icons-round').textContent = 'lock_open';
      showStatus('Settings unlocked');
    } else {
      showStatus('Incorrect password', true);
      passwordInput.value = '';
    }
  });

  // Handle lock button
  lockButton.addEventListener('click', () => {
    loginForm.style.display = 'block';
    settingsContent.style.display = 'none';
    lockButton.querySelector('.material-icons-round').textContent = 'lock';
    passwordInput.value = '';
    showStatus('Settings locked');
  });

  // Load saved resolution
  chrome.storage.sync.get(['preferredResolution'], (result) => {
    if (result.preferredResolution) {
      resolutionSelect.value = result.preferredResolution;
    }
  });

  // Save resolution when changed
  resolutionSelect.addEventListener('change', async () => {
    const selectedResolution = resolutionSelect.value;
    
    try {
      await chrome.storage.sync.set({ preferredResolution: selectedResolution });
      
      // Try to update current video if on YouTube
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.url.includes('youtube.com/watch')) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'RESOLUTION_CHANGED',
            resolution: selectedResolution
          });
          showStatus('Settings saved successfully!');
        } catch (error) {
          showStatus('Settings saved. Will apply to next video.');
        }
      } else {
        showStatus('Settings saved successfully!');
      }
    } catch (error) {
      console.log('Error saving settings:', error);
      showStatus('Error saving settings. Please try again.', true);
    }
  });
}); 