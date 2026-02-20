// app.js

// ============================================
// GLOBAL STATE & CONFIGURATION
// ============================================
const API_BASE = 'https://api.resonatale.com';

// Subset of ElevenLabs multilingual languages with flags and codes
// Codes match Eleven v3 / Multilingual v2 language tags like ENG, SPA, FRA, etc. [web:486][web:540]
const SUPPORTED_LANGUAGES = [
  { code: 'ENG', label: 'English', flag: '🇺🇸' },
  { code: 'SPA', label: 'Español', flag: '🇪🇸' },
  { code: 'MEX', label: 'Español (México)', flag: '🇲🇽' }, // if you distinguish in backend
  { code: 'FRA', label: 'Français', flag: '🇫🇷' },
  { code: 'DEU', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'POR', label: 'Português', flag: '🇧🇷' },        // PT-BR
  { code: 'ITA', label: 'Italiano', flag: '🇮🇹' },
  { code: 'JPN', label: '日本語', flag: '🇯🇵' },
  { code: 'CMN', label: '中文 (普通话)', flag: '🇨🇳' },
  { code: 'KOR', label: '한국어', flag: '🇰🇷' },
  { code: 'HIN', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ARA', label: 'العربية', flag: '🇸🇦' },
  { code: 'RUS', label: 'Русский', flag: '🇷🇺' },
  { code: 'TUR', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'SWE', label: 'Svenska', flag: '🇸🇪' },
  { code: 'NLD', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'POL', label: 'Polski', flag: '🇵🇱' },
  { code: 'UKR', label: 'Українська', flag: '🇺🇦' },
  { code: 'VIE', label: 'Tiếng Việt', flag: '🇻🇳' }
];

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

  get turnstileToken() {
    return window.turnstileToken || null;
  },

  authToken: localStorage.getItem('authToken'),
  userId: localStorage.getItem('userId'),
  userBalance: 0,
  previewVideoUrl: null,
  audioObjectUrl: null,

  // ElevenLabs-related
  voiceLanguage: 'ENG',  // default English
  voiceMood: 'calm'      // default mood
};

// expose for other scripts if needed
window.appState = appState;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  console.log('🎬 ResonaTale App Initialized');

  if (typeof initCompliance === 'function') {
    initCompliance();
  }

  updateHeaderVisibility(appState.currentScreen);

  if (appState.authToken && typeof initAuthenticatedApp === 'function') {
    initAuthenticatedApp();
  }

  setupEventListeners();
  initLanguageSelector();
  initMoodPicker();

  if (typeof animateFilmCounter === 'function') {
    animateFilmCounter();
  }

  // Wire "Get full video" button on preview screen
  const getFullBtn = document.getElementById('getFullVideoBtn');
  if (getFullBtn) {
    getFullBtn.addEventListener('click', onGetFullVideoClicked);
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
// LANGUAGE SELECTOR (flags + label)
// ============================================
// HTML you need somewhere on voice or story screen, e.g.:
// <select id="voiceLanguageSelect" class="lang-select"></select>
function initLanguageSelector() {
  const select = document.getElementById('voiceLanguageSelect');
  if (!select) return;

  select.innerHTML = SUPPORTED_LANGUAGES.map(
    (lang) =>
      `<option value="${lang.code}">${lang.flag} ${lang.label}</option>`
  ).join('');

  select.value = appState.voiceLanguage;

  select.addEventListener('change', (e) => {
    appState.voiceLanguage = e.target.value;
  });
}

// ============================================
// MOOD PICKER (buttons that change color)
// ============================================
// HTML you need, for example:
// <div id="moodPicker">
//   <button type="button" class="mood-btn" data-mood="calm">Calm</button>
//   <button type="button" class="mood-btn" data-mood="romantic">Romantic</button>
//   <button type="button" class="mood-btn" data-mood="dramatic">Dramatic</button>
//   <button type="button" class="mood-btn" data-mood="excited">Excited</button>
// </div>
function initMoodPicker() {
  const container = document.getElementById('moodPicker');
  if (!container) return;

  const buttons = container.querySelectorAll('.mood-btn');

  const applyActiveStyles = (activeMood) => {
    buttons.forEach((btn) => {
      const mood = btn.dataset.mood;
      if (mood === activeMood) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mood = btn.dataset.mood || 'calm';
      appState.voiceMood = mood;
      applyActiveStyles(mood);
    });
  });

  // Set initial state
  applyActiveStyles(appState.voiceMood);
}

// Suggested CSS (add in your stylesheet):
// .mood-btn { border-radius: 999px; padding: 0.5rem 1rem; border: 1px solid #4b5563; background:#111827; color:#e5e7eb; cursor:pointer; }
// .mood-btn.active[data-mood="calm"] { background:#10B981; border-color:#10B981; }
// .mood-btn.active[data-mood="romantic"] { background:#EC4899; border-color:#EC4899; }
// .mood-btn.active[data-mood="dramatic"] { background:#F97316; border-color:#F97316; }
// .mood-btn.active[data-mood="excited"] { background:#6366F1; border-color:#6366F1; }

// ============================================
// NAVIGATION
// ============================================
function startApp() {
  navigateToScreen('uploadScreen');
}

function updateHeaderVisibility(screenId) {
  const header = document.querySelector('.app-header');
  if (!header) return;
  header.classList.remove('hidden');
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
// 18+ CONSENT / TURNSTILE GUARDS
// ============================================
const CONSENT_KEY = 'rt_consent_18plus_v1';

function hasConsent() {
  return localStorage.getItem(CONSENT_KEY) === 'true';
}

function requireConsentOrBlock() {
  if (hasConsent()) return true;
  if (typeof showConsentModal === 'function') {
    showConsentModal();
  } else if (typeof showToast === 'function') {
    showToast('Please confirm you are 18+ before continuing.', 'error');
  }
  return false;
}

function requireTurnstileOrBlock() {
  if (appState.turnstileToken) return true;
  if (typeof showToast === 'function') {
    showToast('Please complete the verification check.', 'error');
  }
  return false;
}

function showConsentModal() {
  const modal = document.getElementById('consentModal');
  if (!modal) return;
  modal.style.display = 'flex';
  modal.classList.add('active');
}

function closeConsentModal() {
  const modal = document.getElementById('consentModal');
  if (!modal) return;
  modal.classList.remove('active');
  modal.style.display = 'none';
}

function acceptConsent() {
  const checkbox = document.getElementById('consentCheckbox');
  if (!checkbox || !checkbox.checked) {
    if (typeof showToast === 'function') {
      showToast('Please confirm you are 18+ and accept the terms.', 'error');
    }
    return;
  }

  localStorage.setItem(CONSENT_KEY, 'true');
  closeConsentModal();

  if (typeof showToast === 'function') {
    showToast('Thank you, you can continue.', 'success');
  }
}

// ============================================
// PHOTO UPLOAD (Step 1)
// ============================================
function triggerFileInput() {
  if (!requireConsentOrBlock()) return;
  if (!requireTurnstileOrBlock()) return;

  const input = document.getElementById('photoInput');
  if (input) input.click();
}

function handlePhotoSelection(event) {
  const inputEl = event.target;
  const files = Array.from(inputEl.files || []);

  if (appState.photos.length + files.length > 12) {
    if (typeof showToast === 'function') showToast('Maximum 12 photos allowed', 'error');
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
  navigateToScreen('voiceScreen');
}

// ============================================
// VOICE RECORDING (Step 2 - part 1)
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

  if (!requireConsentOrBlock()) return;
  if (!requireTurnstileOrBlock()) return;

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
        const type =
          appState.voiceMimeType || (audioChunks[0] && audioChunks[0].type) || 'audio/webm';
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

  if (appState.currentScreen === 'scriptScreen' && document.getElementById('voiceScreen')) {
    navigateToScreen('voiceScreen');
  }
}

// ============================================
// GENERATE PREVIEW (Step 2 - part 2 → Step 3)
// ============================================
async function generatePreview() {
  const briefDescEl = document.getElementById('briefDesc');
  const briefDesc = briefDescEl ? briefDescEl.value.trim() : '';

  if (!hasConsent()) {
    if (typeof showConsentModal === 'function') showConsentModal();
    if (typeof showToast === 'function') {
      showToast('Please confirm you are 18+ before generating a preview.', 'error');
    }
    return;
  }
  if (!appState.turnstileToken) {
    if (typeof showToast === 'function') {
      showToast('Please complete the verification check.', 'error');
    }
    return;
  }
  if (!briefDesc) {
    if (typeof showToast === 'function') showToast('Please enter a brief description', 'error');
    return;
  }
  if (appState.photos.length < 6) {
    if (typeof showToast === 'function') showToast('Please upload at least 6 photos', 'error');
    return;
  }
  if (!appState.voiceBlob && !appState.voiceId) {
    if (typeof showToast === 'function') showToast('Please record your voice', 'error');
    return;
  }

  if (typeof showLoading === 'function') showLoading('Uploading photos...');

  try {
    const photoUrls = await uploadPhotos();

    if (!appState.voiceId) {
      if (typeof showLoading === 'function') showLoading('Cloning your voice...');
      const voiceId = await uploadVoice();
      appState.voiceId = voiceId;
    }

    if (typeof showLoading === 'function') showLoading('Creating your preview film...');
    const previewData = await generatePreviewRequest(photoUrls, appState.voiceId, briefDesc);

    const audioUrl = previewData.audioUrl || null;
    const scriptText = previewData.script || '';

    appState.previewVideoUrl = audioUrl;

    navigateToScreen('previewScreen');

    const mediaEl = document.getElementById('previewVideo');
    if (mediaEl && audioUrl) {
      mediaEl.src = audioUrl;
    }

    const scriptEl = document.getElementById('previewScript');
    if (scriptEl) {
      scriptEl.textContent = scriptText;
    }

    if (typeof hideLoading === 'function') hideLoading();
    if (typeof showToast === 'function') {
      showToast(previewData.message || 'Preview ready!', 'success');
    }
  } catch (error) {
    console.error('Preview generation error:', error);
    if (typeof hideLoading === 'function') hideLoading();
    if (typeof showToast === 'function') {
      showToast(error.message || 'Failed to generate preview', 'error');
    }
  }
}

async function uploadPhotos() {
  return appState.photos.map((photo, i) => `photo_${i}_${Date.now()}`);
}

async function uploadVoice() {
  if (!hasConsent()) {
    if (typeof showConsentModal === 'function') showConsentModal();
    throw new Error('Consent required');
  }
  if (!appState.turnstileToken) {
    throw new Error('Verification required');
  }

  const formData = new FormData();
  formData.append('audio', appState.voiceBlob, 'voice.webm');
  formData.append('name', 'User Voice');
  formData.append('turnstileToken', appState.turnstileToken);

  const headers = {};
  if (appState.authToken) headers['Authorization'] = `Bearer ${appState.authToken}`;

  const response = await fetch(`${API_BASE}/apiuservoiceupload`, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!response.ok) {
    let msg = 'Voice upload failed';
    try {
      const err = await response.json();
      console.error('Voice upload error body:', err);
      if (err && (err.error || err.message)) msg = err.error || err.message;
    } catch (e) {
      console.error('Voice upload non-JSON error:', e);
    }
    throw new Error(msg);
  }

  const data = await response.json();
  return data.voiceId;
}

async function generatePreviewRequest(photoUrls, voiceId, briefDesc) {
  const headers = { 'Content-Type': 'application/json' };
  if (appState.authToken) headers['Authorization'] = `Bearer ${appState.authToken}`;

  const response = await fetch(`${API_BASE}/api/render/preview`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: briefDesc,
      photoUrls,
      voiceId,
      photoCount: photoUrls.length,
      language: appState.voiceLanguage,
      mood: appState.voiceMood
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
// FULL VIDEO GENERATION (paid, after wallet)
// ============================================
async function generateFullVideo(briefDesc) {
  if (!appState.authToken) {
    throw new Error('Please log in before generating full video');
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${appState.authToken}`
  };

  const res = await fetch(`${API_BASE}/api/render/video`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: briefDesc,
      photoCount: appState.photos.length || 6,
      language: appState.voiceLanguage,
      mood: appState.voiceMood
    })
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.success === false) {
    throw new Error(data.error || data.message || 'Failed to start full render');
  }

  // Backend returns { success, videoId, newBalance, charged, message }
  return data.videoId;
}

async function onGetFullVideoClicked() {
  const briefDescEl = document.getElementById('briefDesc');
  const briefDesc = briefDescEl ? briefDescEl.value.trim() : '';

  if (!briefDesc) {
    if (typeof showToast === 'function') {
      showToast('Please enter a brief description first.', 'error');
    }
    return;
  }

  try {
    if (typeof showLoading === 'function') {
      showLoading('Starting full video render...');
    }

    const videoId = await generateFullVideo(briefDesc);

    if (typeof showToast === 'function') {
      showToast('Full video render started. We’ll notify you when it’s ready.', 'success');
    }

    const poll = async () => {
      const res = await fetch(`${API_BASE}/api/render/status/${videoId}`);
      const data = await res.json().catch(() => ({}));

      if (data.status === 'done' && data.url) {
        if (typeof hideLoading === 'function') hideLoading();

        const mediaEl = document.getElementById('previewVideo');
        if (mediaEl) {
          mediaEl.src = data.url;
        }

        if (typeof showToast === 'function') {
          showToast('Your full video is ready!', 'success');
        }
      } else {
        setTimeout(poll, 4000);
      }
    };

    poll();
  } catch (err) {
    console.error('Get full video error:', err);
    if (typeof hideLoading === 'function') hideLoading();
    if (typeof showToast === 'function') {
      showToast(err.message || 'Failed to start full video', 'error');
    }
  }
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
      logout(true);
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
  }
}

function updateBalanceDisplay() {
  const balanceEls = document.querySelectorAll('#userBalance, #modalBalance, #menuBalance');
  balanceEls.forEach((el) => {
    el.textContent = Number(appState.userBalance || 0).toFixed(2);
  });
}

// ============================================
// MENU & AUTH MODAL
// ============================================
function openMenu() {
  const overlay = document.getElementById('menuOverlay');
  if (!overlay) return;

  overlay.style.display = 'flex';
  overlay.classList.add('open');
}

function closeMenu() {
  const overlay = document.getElementById('menuOverlay');
  if (!overlay) return;

  overlay.classList.remove('open');
  overlay.style.display = 'none';
}

function showLogin() {
  const modal = document.getElementById('authModal');
  if (!modal) return;

  modal.style.display = 'flex';
  modal.classList.add('active');
}

function closeLogin() {
  const modal = document.getElementById('authModal');
  if (!modal) return;

  modal.classList.remove('active');
  modal.style.display = 'none';
}

function logout(silent = false) {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');

  appState.authToken = null;
  appState.userId = null;
  appState.userBalance = 0;

  closeMenu();
  hideLoading();
  if (typeof closeCredits === 'function') closeCredits();

  navigateToScreen('heroScreen');

  const header = document.querySelector('.app-header');
  if (header) header.classList.add('hidden');

  if (!silent && typeof showToast === 'function') {
    showToast('Logged out successfully', 'success');
  }
}

// ============================================
// CREDITS / WALLET
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
  if (now < __toastCooldownUntil) return;
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
// GLOBAL ERROR HANDLING
// ============================================
window.addEventListener('error', function (e) {
  console.error('Global error:', e?.error || e?.message || e);
  if (typeof showToast === 'function') {
    showToast('Something went wrong. Please try again.', 'error');
  }
});

window.addEventListener('unhandledrejection', function (e) {
  console.error('Unhandled promise rejection:', e?.reason);
  if (typeof e?.preventDefault === 'function') e.preventDefault();
  if (typeof showToast === 'function') {
    showToast('Network error. Please check your connection.', 'error');
  }
});
