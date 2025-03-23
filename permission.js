// Function to encrypt password
async function encryptPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const key = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );
  const encryptedArray = new Uint8Array(encryptedData);
  const keyArray = await crypto.subtle.exportKey("raw", key);
  return {
    encrypted: Array.from(encryptedArray),
    iv: Array.from(iv),
    key: Array.from(keyArray)
  };
}

// Function to save encrypted password
async function savePassword(password) {
  try {
    const encrypted = await encryptPassword(password);
    await chrome.storage.sync.set({
      hasPassword: true,
      encryptedPassword: encrypted
    });
    return true;
  } catch (error) {
    console.error('Error saving password:', error);
    return false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const saveButton = document.getElementById('savePassword');

  saveButton.addEventListener('click', async () => {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!password || !confirmPassword) {
      showError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    if (password.length < 4) {
      showError('Password must be at least 4 characters long');
      return;
    }

    const success = await savePassword(password);
    if (success) {
      showSuccess('Password saved successfully');
      setTimeout(() => {
        window.close();
      }, 1500);
    } else {
      showError('Failed to save password');
    }
  });
});

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  document.querySelector('.permission-form').appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 3000);
}

function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;
  document.querySelector('.permission-form').appendChild(successDiv);
} 