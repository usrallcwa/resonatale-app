// ============================================
// GLOBAL STATE & CONFIGURATION
// ============================================
const API_BASE = 'https://api.resonatale.com';

let appState = {
  currentScreen: 'heroScreen',
  previousScreen: null,
  photos: [],
  voiceBlob: null,
  voiceMimeType: null,
  voiceId: null,
  recordingStartTime: null,
  mediaRecorder: null,
  audioStream: null,
  turnstileToken: null,
  authToken: localStorage.getItem('authToken'),
  userId: localStorage.getItem('userId'),
  userBalance: 0,
  previewVideoUrl: null,
  audioObjectUrl: null
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  console.log('🎬 ResonaTale App Initialized');

  // Ensure header visibility is correct on initial paint.
  updateHeaderVisibility(appState.currentScreen);

  // Guard optional functions so one missing script doesn't kill the app.
  if (appState.authToken && typeof initAuthenticatedApp === 'function') {
    initAuthenticatedApp();
  }

  setupEventListeners();

  if (typeof animateFilmCounter === 'function') {
    animateFilmCounter();
  }
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
      if (e.touches && e.touches.length > 1) {
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

function updateHeaderVisibility(screenId) {
  const header = document.querySelector('.app-header');
  if (!header) return;

  if (screenId === 'heroScreen') {
    header.classList.add('hidden');
    return;
  }

  // Keep your existing intent: show header only when authenticated.
  if (appState.authToken) header.classList.remove('hidden');
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
    setTimeout(() => currentScreen.classList.remove('exiting'), 300);
  }

  nextScreen.classList.add('active');

  updateHeaderVisibility(screenId);
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
  const inputEl = event.target;
  const files = Array.from(inputEl.files || []);

  if (appState.photos.length + files.length > 12) {
    if (typeof showToast === 'function') showToast('Maximum 12 photos allowed', 'error');
    inputEl.value = ''; // allow re-selecting after error
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

  // IMPORTANT: reset so selecting the same file again triggers change.
  inputEl.value = '';
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
          <button class="photo-remove" type="button" onclick="removePhoto(${index})">×</button>
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
    if (typeof showToast === 'function') showToast('Please upload at least 6 photos', 'error');
    return;
  }

  // If you have a Script step, don't skip it when present.
  if (appState.currentScreen === 'uploadScreen' && document.getElementById('scriptScreen')) {
    navigateToScreen('scriptScreen');
    return;
  }

  navigateToScreen('voiceScreen');
}

// ============================================
// VOICE RECORDING
// ============================================
function pickBestAudioMimeType() {
  if (!window.MediaRecorder || typeof MediaRecorder.isTypeSupported !== 'function') return null;

  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg'
  ];

  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return null;
}

async function toggleRecording() {
  const btn = document.getElementById('recordBtn');
  if (!btn) return;

  if (!window.MediaRecorder) {
    if (typeof showToast === 'function') showToast('Recording not supported on this browser', 'error');
    return;
  }

  const icon = btn.querySelector('.record-icon');
  const text = btn.querySelector('.record-text');

  if (!appState.mediaRecorder || appState.mediaRecorder.state === 'inactive') {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      appState.audioStream = stream;

      const mimeType = pickBestAudioMimeType();
      appState.voiceMimeType = mimeType || undefined;

      appState.mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      const audioChunks = [];

      appState.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) audioChunks.push(event.data);
      };

      appState.mediaRecorder.onstop = () => {
        const type = appState.voiceMimeType || (audioChunks[0] && audioChunks[0].type) || 'audio/webm';
        const audioBlob = new Blob(audioChunks, { type });
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
        if (appState.mediaRecorder && appState.mediaRecorder.state === 'recording') stopRecording();
      }, 30000);
    } catch (error) {
      console.error('Microphone access error:', error);
      if (typeof showToast === 'function') showToast('Microphone access denied', 'error');
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
    if (!appState.recordingStartTime || !appState.mediaRecorder || appState.mediaRecorder.state !== 'recording') {
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

  // Revoke previous URL to avoid leaks.
  if (appState.audioObjectUrl) URL.revokeObjectURL(appState.audioObjectUrl);
  appState.audioObjectUrl = URL.createObjectURL(blob);

  audio.src = appState.audioObjectUrl;
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

  if (appState.audioObjectUrl) URL.revokeObjectURL(appState.audioObjectUrl);
  appState.audioObjectUrl = null;

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
    if (typeof showToast === 'function') showToast('Please record your voice first', 'error');
    return;
  }

  // If Script step exists and you're on it, continue to Voice; otherwise leave as-is.
  if (appState.currentScreen === 'scriptScreen' && document.getElementById('voiceScreen')) {
    navigateToScreen('voiceScreen');
  }
}

// ============================================
// GENERATE PREVIEW
// ============================================
async function generatePreview() {
  const briefDescEl = document.getElementById('briefDesc');
  const briefDesc = briefDescEl ? briefDescEl.value.trim() : '';

  if (!briefDesc) {
    if (typeof showToast === 'function') showToast('Please enter a brief description', 'error');
    return;
  }
  if (appState.photos.length < 6) {
    if (typeof showToast === 'function') showToast('Please upload at least 6 photos', 'error');
    return;
  }
  if (!appState.voiceBlob) {
    if (typeof showToast === 'function') showToast('Please record your voice', 'error');
    return;
  }

  if (typeof showLoading === 'function') showLoading('Uploading photos...');

  try {
    const photoUrls = await uploadPhotos();

    if (typeof showLoading === 'function') showLoading('Cloning your voice...');
    const voiceId = await uploadVoice();
    appState.voiceId = voiceId;

    if (typeof showLoading === 'function') showLoading('Creating your preview film...');
    const previewData = await generatePreviewRequest(photoUrls, voiceId, briefDesc);

    const mediaUrl =
      previewData.videoUrl ||
      previewData.previewUrl ||
      previewData.url ||
      previewData.audioUrl;

    appState.previewVideoUrl = mediaUrl || null;

    navigateToScreen('previewScreen');

    const video = document.getElementById('previewVideo');
    if (video && mediaUrl) video.src = mediaUrl;

    if (typeof hideLoading === 'function') hideLoading();
    if (typeof showToast === 'function') showToast('Preview ready!', 'success');
  } catch (error) {
    console.error('Preview generation error:', error);
    if (typeof hideLoading === 'function') hideLoading();
    if (typeof showToast === 'function') showToast(error.message || 'Failed to generate preview', 'error');
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

  const headers = {};
  if (appState.authToken) headers['Authorization'] = `Bearer ${appState.authToken}`;

  const response = await fetch(`${API_BASE}/api/voice/clone`, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!response.ok) {
    let msg = 'Voice upload failed';
    try {
      const err = await response.json();
      if (err && (err.error || err.message)) msg = err.error || err.message;
    } catch {}
    throw new Error(msg);
  }

  const data = await response.json();
  return data.voiceId;
}

async function generatePreviewRequest(photoUrls, voiceId, briefDesc) {
  const language = document.getElementById('languageSelect')?.value || 'en';
  const mood = document.getElementById('moodSelect')?.value || 'default';
  const genre = document.getElementById('genreSelect')?.value || 'default';
  const orientation = document.getElementById('orientationSelect')?.value || 'landscape';

  const headers = { 'Content-Type': 'application/json' };
  if (appState.authToken) headers['Authorization'] = `Bearer ${appState.authToken}`;

  const response = await fetch(`${API_BASE}/api/render/preview`, {
    method: 'POST',
    headers,
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
    let error = {};
    try {
      error = await response.json();
    } catch {}
    throw new Error(error.error || error.message || 'Preview generation failed');
  }

  return await response.json();
}

// ============================================
// AUTHENTICATED APP
// ============================================
async function initAuthenticatedApp() {
  if (!appState.authToken) return;

  try {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${appState.authToken}` }
    });

    if (!response.ok) {
      logout(true); // silent
      return;
    }

    const data = await response.json();
    const balanceNum = Number(data?.user?.balance ?? 0);

    appState.userBalance = Number.isFinite(balanceNum) ? balanceNum : 0;
    updateBalanceDisplay();

    const header = document.querySelector('.app-header');
    if (header && appState.currentScreen !== 'heroScreen') header.classList.remove('hidden');

    const emailEl = document.getElementById('menuEmail');
    if (emailEl) emailEl.textContent = data?.user?.email || '';

    const balanceEl = document.getElementById('menuBalance');
    if (balanceEl) balanceEl.textContent = appState.userBalance.toFixed(2);
  } catch (error) {
    console.error('Auth check error:', error);
    // Don’t force logout on transient network errors.
  }
}

function updateBalanceDisplay() {
  const balanceEls = document.querySelectorAll('#userBalance, #modalBalance, #menuBalance');
  balanceEls.forEach((el) => {
    el.textContent = Number(appState.userBalance || 0).toFixed(2);
  });
}

// ============================================
// MENU
// ============================================
function openMenu() {
  const overlay = document.getElementById('menuOverlay');
  if (!overlay) return;

  // Works even if HTML has inline style="display:none"
  overlay.style.display = 'flex';
  overlay.classList.add('open');
}

function closeMenu() {
  const overlay = document.getElementById('menuOverlay');
  if (!overlay) return;

  overlay.classList.remove('open');
  overlay.style.display = 'none';
}

function logout(silent = false) {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');

  appState.authToken = null;
  appState.userId = null;
  appState.userBalance = 0;

  closeMenu();
  hideLoading();
  closeCredits?.(); // if defined elsewhere

  navigateToScreen('heroScreen');

  const header = document.querySelector('.app-header');
  if (header) header.classList.add('hidden');

  if (!silent) showToast('Logged out successfully', 'success');
}

// ============================================
// CREDITS/WALLET (guarded for missing DOM)
// ============================================
function showAddCredits() {
  closeMenu();
  const modal = document.getElementById('creditsModal');
  if (!modal) return;

  modal.style.display = 'flex';
  modal.classList.add('active');

  const balanceEl = document.getElementById('modalBalance');
  if (balanceEl) balanceEl.textContent = Number(appState.userBalance || 0).toFixed(2);
}

function closeCredits() {
  const modal = document.getElementById('creditsModal');
  if (!modal) return;

  modal.classList.remove('active');
  modal.style.display = 'none';
}

function setAmount(amount) {
  const input = document.getElementById('creditAmount');
  if (input) input.value = amount;
}

// ============================================
// UI HELPERS
// ============================================
function showLoading(text = 'Processing...') {
  const overlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  if (!overlay || !loadingText) return;

  loadingText.textContent = text;
  overlay.style.display = 'flex';
  overlay.classList.add('active');
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (!overlay) return;

  overlay.classList.remove('active');
  overlay.style.display = 'none';
}

let __toastCooldownUntil = 0;
function showToast(message, type = 'info') {
  const now = Date.now();
  if (now < __toastCooldownUntil) return; // prevent toast spam during error storms
  __toastCooldownUntil = now + 800;

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
  // ErrorEvent.error can be undefined; use message fallback.
  console.error('Global error:', e?.error || e?.message || e); // robust logging [web:160][web:162]
  if (typeof showToast === 'function') showToast('Something went wrong. Please try again.', 'error');
});

window.addEventListener('unhandledrejection', function (e) {
  console.error('Unhandled promise rejection:', e?.reason);

  // Many environments allow suppressing default handling via preventDefault(). [web:151]
  if (typeof e?.preventDefault === 'function') e.preventDefault();

  if (typeof showToast === 'function') showToast('Network error. Please check your connection.', 'error');
});

