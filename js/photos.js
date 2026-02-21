// photos.js

// ============================================
// PHOTO UPLOAD (Step 1)
// ============================================

function triggerFileInput() {
  if (typeof window.requireConsentOrBlock === 'function') {
    if (!window.requireConsentOrBlock()) return;
  }
  if (typeof window.requireTurnstileOrBlock === 'function') {
    if (!window.requireTurnstileOrBlock()) return;
  }

  const input = document.getElementById('photoInput');
  if (input) input.click();
}

function handlePhotoSelection(event) {
  const appState = window.appState;
  if (!appState) return;

  const inputEl = event.target;
  const files = Array.from(inputEl.files || []);

  if (appState.photos.length + files.length > 12) {
    if (typeof window.showToast === 'function') {
      window.showToast('Maximum 12 photos allowed', 'error');
    }
    inputEl.value = '';
    return;
  }

  files.forEach((file) => {
    if (file && file.type && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function (e) {
        appState.photos.push({
          file: file,
          dataUrl: e.target.result
        });
        updatePhotoGrid();
        updatePhotoContinueButton();
      };
      reader.readAsDataURL(file);
    }
  });

  inputEl.value = '';
}

function updatePhotoGrid() {
  const appState = window.appState;
  if (!appState) return;

  const grid = document.getElementById('photoGrid');
  const count = document.getElementById('photoCount');
  if (!grid || !count) return;

  count.textContent = appState.photos.length;

  grid.innerHTML = appState.photos
    .map(
      (photo, index) => `
        <div class="photo-item">
          <img src="${photo.dataUrl}" alt="Photo ${index + 1}">
          <button class="photo-remove" type="button" onclick="removePhoto(${index})">×</button>
        </div>
      `
    )
    .join('');
}

function removePhoto(index) {
  const appState = window.appState;
  if (!appState) return;

  appState.photos.splice(index, 1);
  updatePhotoGrid();
  updatePhotoContinueButton();
}

function updatePhotoContinueButton() {
  const appState = window.appState;
  if (!appState) return;

  const btn = document.getElementById('photoContinueBtn');
  if (!btn) return;
  btn.disabled = appState.photos.length < 6;
}

function goToVoice() {
  const appState = window.appState;
  if (!appState) return;

  if (appState.photos.length < 6) {
    if (typeof window.showToast === 'function') {
      window.showToast('Please upload at least 6 photos', 'error');
    }
    return;
  }
  if (typeof window.navigateToScreen === 'function') {
    window.navigateToScreen('voiceScreen');
  }
}

// Expose globally for HTML/app.js
window.triggerFileInput = triggerFileInput;
window.handlePhotoSelection = handlePhotoSelection;
window.updatePhotoGrid = updatePhotoGrid;
window.removePhoto = removePhoto;
window.updatePhotoContinueButton = updatePhotoContinueButton;
window.goToVoice = goToVoice;

