// ============================================
// GLOBAL STATE & CONFIGURATION
// ============================================
const API_BASE = 'https://api.resonatale.com';

let appState = {
  currentScreen: 'heroScreen',
  previousScreen: null,
  photos: [],
  voiceBlob: null,
  voiceId: null,
  recordingStartTime: null,
  mediaRecorder: null,
  audioStream: null,
  turnstileToken: null,
  authToken: localStorage.getItem('authToken'),
  userId: localStorage.getItem('userId'),
  userBalance: 0,
  previewVideoUrl: null
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  console.log('🎬 ResonaTale App Initialized');

  if (appState.authToken) {
    initAuthenticatedApp();
  }

  setupEventListeners();
  animateFilmCounter();
});

function setupEventListeners() {
  const photoInput = document.getElementById('photoInput');
  if (photoInput) {
    photoInput.addEventListener('change', handlePhotoSelection);
  }

  const briefDesc = document.getElementById('briefDesc');
  if (briefDesc) {
    briefDesc.addEventListener('input', function (e) {
      const count = e.target.value.length;
      const counterEl = document.getElementById('briefCount');
      if (counterEl) counterEl.textContent = count;
    });
  }

  // Prevent pull-to-refresh on mobile (multi-touch only)
  document.body.addEventListener(
    'touchmove',
    function (e) {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );
}

// ============================================
// NAVIGATION
// ============================================
function startApp() {
  navigateToScreen('uploadScreen');
}

function navigateToScreen(screenId) {
  const currentScreen = document.querySelector('.screen.active');
  const nextScreen = document.getElementById(screenId);

  if (!nextScreen) return;

  appState.previousScreen = appState.currentScreen;
  appState.currentScreen = screenId;

  if (currentScreen) {
    currentScreen.classList.remove('active');
    currentScreen.classList.add('exiting');
    setTimeout(() => {
      currentScreen.classList.remove('exiting');
    }, 300);
  }

  nextScreen.classList.add('active');

  // Header visibility (your header has class, not id)
  const header = document.querySelector('.app-header');
  if (!header) return;

  if (screenId === 'heroScreen') {
    header.classList.add('hidden');
  } else if (appState.authToken) {
    header.classList.remove('hidden');
  }
}

function goBack(screenId) {
  navigateToScreen(screenId);
}

// ============================================
// PHOTO UPLOAD
// ============================================
function triggerFileInput() {
  const input = document.getElementById('photoInput');
  if (input) input.click();
}

function handlePhotoSelection(event) {
  const files = Array.from(event.target.files || []);

  if (appState.photos.length + files.length > 12) {
    showToast('Maximum 12 photos allowed', 'error');
    return;
  }

  files.forEach((file) => {
    if (file.type.startsWith('image/')) {
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
}

function updatePhotoGrid() {
  const grid = document.getElementById('photoGrid');
  const count = document.getElementById('photoCount');
  if (!grid || !count) return;

  count.textContent = appState.photos.length;

  grid.innerHTML = appState.photos
    .map(
      (photo, index) => `
        <div class="photo-item">
          <img src="${photo.dataUrl}" alt="Photo ${index + 1}">
          <button class="photo-remove" onclick="removePhoto(${index})">×</button>
        </div>
      `
    )
    .join('');
}

function removePhoto(index) {
  appState.photos.splice(index, 1);
  updatePhotoGrid();
  updatePhotoContinueButton();
}

function updatePhotoContinueButton() {
  const btn = document.getElementById('photoContinueBtn');
  if (!btn) return;
  btn.disabled = appState.photos.length < 6;
}

function goToVoice() {
  if (appState.photos.length < 6) {
    showToast('Please upload at least 6 photos', 'error');
    return;
  }
  navigateToScreen('voiceScreen');
}

// ============================================
// VOICE RECORDING
// ============================================
async function toggleRecording() {
  const btn = document.getElementById('recordBtn');
  if (!btn) return;

  const icon = btn.querySelector('.record-icon');
  const text = btn.querySelector('.record-text');

  if (!appState.mediaRecorder || appState.mediaRecorder.state === 'inactive') {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      appState.audioStream = stream;
      appState.mediaRecorder = new MediaRecorder(stream);

      const audioChunks = [];

      appState.mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      appState.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        appState.voiceBlob = audioBlob;
        showAudioPreview(audioBlob);
        stopAllStreams();
      };

      appState.mediaRecorder.start();
      appState.recordingStartTime = Date.now();

      btn.classList.add('recording');
      if (icon) icon.textContent = '⏹';
      if (text) text.textContent = 'Stop Recording';

      startRecordingTimer();

      setTimeout(() => {
        if (appState.mediaRecorder && appState.mediaRecorder.state === 'recording') {
          stopRecording();
        }
      }, 30000);
    } catch (error) {
      console.error('Microphone access error:', error);
      showToast('Microphone access denied', 'error');
    }
  } else {
    stopRecording();
  }
}

function stopRecording() {
  if (appState.mediaRecorder && appState.mediaRecorder.state === 'recording') {
    appState.mediaRecorder.stop();

    const btn = document.getElementById('recordBtn');
    if (!btn) return;

    const icon = btn.querySelector('.record-icon');
    const text = btn.querySelector('.record-text');

    btn.classList.remove('recording');
    if (icon) icon.textContent = '⏺';
    if (text) text.textContent = 'Start Recording';
  }
}

function startRecordingTimer() {
  const timerEl = document.getElementById('recordTimer');
  if (!timerEl) return;

  const interval = setInterval(() => {
    if (
      !appState.recordingStartTime ||
      !appState.mediaRecorder ||
      appState.mediaRecorder.state !== 'recording'
    ) {
      clearInterval(interval);
      timerEl.textContent = '0:00 / 0:30';
      return;
    }

    const elapsed = Math.floor((Date.now() - appState.recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')} / 0:30`;
  }, 100);
}

function showAudioPreview(blob) {
  const preview = document.getElementById('audioPreview');
  const audio = document.getElementById('audioPlayback');
  if (!preview || !audio) return;

  audio.src = URL.createObjectURL(blob);
  preview.classList.remove('hidden');

  const hint = document.getElementById('recordingHint');
  if (hint) hint.style.display = 'none';

  const btn = document.getElementById('voiceContinueBtn');
  if (btn) btn.disabled = false;
}

function reRecord() {
  const preview = document.getElementById('audioPreview');
  if (preview) preview.classList.add('hidden');

  const hint = document.getElementById('recordingHint');
  if (hint) hint.style.display = 'block';

  const btn = document.getElementById('voiceContinueBtn');
  if (btn) btn.disabled = true;

  appState.voiceBlob = null;

  const audio = document.getElementById('audioPlayback');
  if (audio) audio.src = '';
}

function stopAllStreams() {
  if (appState.audioStream) {
    appState.audioStream.getTracks().forEach((track) => track.stop());
    appState.audioStream = null;
  }
}

function goToStory() {
  if (!appState.voiceBlob) {
    showToast('Please record your voice first', 'error');
    return;
  }
  // If you have a storyScreen later, navigate; otherwise comment this out
  // navigateToScreen('storyScreen');
}

// ============================================
// GENERATE PREVIEW
// ============================================
async function generatePreview() {
  const briefDescEl = document.getElementById('briefDesc');
  const briefDesc = briefDescEl ? briefDescEl.value.trim() : '';

  if (!briefDesc) {
    showToast('Please enter a brief description', 'error');
    return;
  }

  if (appState.photos.length < 6) {
    showToast('Please upload at least 6 photos', 'error');
    return;
  }

  if (!appState.voiceBlob) {
    showToast('Please record your voice', 'error');
    return;
  }

  showLoading('Uploading photos...');

  try {
    const photoUrls = await uploadPhotos();

    showLoading('Cloning your voice...');
    const voiceId = await uploadVoice();
    appState.voiceId = voiceId;

    showLoading('Creating your preview film...');
    const previewData = await generatePreviewRequest(photoUrls, voiceId, briefDesc);

    appState.previewVideoUrl = previewData.audioUrl; // placeholder

    navigateToScreen('previewScreen');

    const video = document.getElementById('previewVideo');
    if (video) video.src = previewData.audioUrl;

    hideLoading();
    showToast('Preview ready!', 'success');
  } catch (error) {
    console.error('Preview generation error:', error);
    hideLoading();
    showToast(error.message || 'Failed to generate preview', 'error');
  }
}

async function uploadPhotos() {
  // Placeholder: return fake URLs based on count
  return appState.photos.map((photo, i) => `photo_${i}_${Date.now()}`);
}

async function uploadVoice() {
  const formData = new FormData();
  formData.append('audio', appState.voiceBlob, 'voice.webm');
  formData.append('name', 'User Voice');

  const response = await fetch(`${API_BASE}/api/voice/clone`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Voice upload failed');
  }

  const data = await response.json();
  return data.voiceId;
}

async function generatePreviewRequest(photoUrls, voiceId, briefDesc) {
  const language = document.getElementById('languageSelect')?.value || 'en';
  const mood = document.getElementById('moodSelect')?.value || 'default';
  const genre = document.getElementById('genreSelect')?.value || 'default';
  const orientation = document.getElementById('orientationSelect')?.value || 'landscape';

  const response = await fetch(`${API_BASE}/api/render/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: briefDesc,
      photoUrls: photoUrls,
      voiceId: voiceId,
      photoCount: photoUrls.length,
      language,
      mood,
      genre,
      orientation
    })
  });

  if (!response.ok) {
    let error;
    try {
      error = await response.json();
    } catch {
      error = {};
    }
    throw new Error(error.error || 'Preview generation failed');
  }

  return await response.json();
}

// ============================================
// AUTHENTICATED APP
// ============================================
async function initAuthenticatedApp() {
  try {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${appState.authToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      appState.userBalance = data.user.balance || 0;
      updateBalanceDisplay();

      const header = document.querySelector('.app-header');
      if (header && appState.currentScreen !== 'heroScreen') {
        header.classList.remove('hidden');
      }

      const emailEl = document.getElementById('menuEmail');
      if (emailEl) emailEl.textContent = data.user.email;

      const balanceEl = document.getElementById('menuBalance');
      if (balanceEl) balanceEl.textContent = (data.user.balance ?? 0).toFixed(2);
    } else {
      logout();
    }
  } catch (error) {
    console.error('Auth check error:', error);
  }
}

function updateBalanceDisplay() {
  const balanceEls = document.querySelectorAll('#userBalance, #modalBalance, #menuBalance');
  balanceEls.forEach((el) => {
    el.textContent = appState.userBalance.toFixed(2);
  });
}

// ============================================
// MENU
// ============================================
function openMenu() {
  const overlay = document.getElementById('menuOverlay');
  if (overlay) {
    overlay.classList.add('open');
  }
}

function closeMenu() {
  const overlay = document.getElementById('menuOverlay');
  if (overlay) {
    overlay.classList.remove('open');
  }
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  appState.authToken = null;
  appState.userId = null;
  appState.userBalance = 0;

  closeMenu();
  navigateToScreen('heroScreen');

  const header = document.querySelector('.app-header');
  if (header) header.classList.add('hidden');

  showToast('Logged out successfully', 'success');
}

// ============================================
// CREDITS/WALLET (guarded for missing DOM)
// ============================================
function showAddCredits() {
  closeMenu();
  const modal = document.getElementById('creditsModal');
  if (!modal) return;
  modal.classList.add('active');

  const balanceEl = document.getElementById('modalBalance');
  if (balanceEl) balanceEl.textContent = appState.userBalance.toFixed(2);
}

function closeCredits() {
  const modal = document.getElementById('creditsModal');
  if (!modal) return;
  modal.classList.remove('active');
}

function setAmount(amount) {
  const input = document.getElementById('creditAmount');
  if (input) input.value = amount;
}

// ============================================
// INLINE PAGES (Contact, Terms, Privacy)
// ============================================
// NOTE: index.html already defines a showPage(id) helper inline;
// to avoid conflicts, this app.js does NOT override it.

// ============================================
// UI HELPERS
// ============================================
function showLoading(text = 'Processing...') {
  const overlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  if (!overlay || !loadingText) return;

  loadingText.textContent = text;
  overlay.classList.add('active');
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (!overlay) return;
  overlay.classList.remove('active');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'error' ? '#EF4444' : type === 'success' ? '#10B981' : '#6366F1'};
    color: white;
    padding: 1rem 2rem;
    border-radius: 12px;
    z-index: 9999;
    font-weight: 600;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================
// SOCIAL PROOF COUNTER
// ============================================
function animateFilmCounter() {
  const counter = document.getElementById('filmCounter');
  if (!counter) return;

  let count = 47329;
  setInterval(() => {
    count += Math.floor(Math.random() * 3) + 1;
    counter.textContent = count.toLocaleString();
  }, 5000);
}

// ============================================
// ERROR HANDLING
// ============================================
window.addEventListener('error', function (e) {
  console.error('Global error:', e.error);
  showToast('Something went wrong. Please try again.', 'error');
});

window.addEventListener('unhandledrejection', function (e) {
  console.error('Unhandled promise rejection:', e.reason);
  showToast('Network error. Please check your connection.', 'error');
});
