// app.js

// ============================================
// GLOBAL STATE & CONFIGURATION
// ============================================
const API_BASE = 'https://api.resonatale.com';

// Subset of ElevenLabs multilingual languages with flags and codes
const SUPPORTED_LANGUAGES = [
  { code: 'ENG', label: 'English', flag: '🇺🇸' },
  { code: 'SPA', label: 'Español', flag: '🇪🇸' },
  { code: 'MEX', label: 'Español (México)', flag: '🇲🇽' },
  { code: 'FRA', label: 'Français', flag: '🇫🇷' },
  { code: 'DEU', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'POR', label: 'Português', flag: '🇧🇷' },
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

  voiceLanguage: 'ENG',
  voiceMood: 'calm'
};

// expose for other scripts
window.appState = appState;
window.API_BASE = API_BASE;
window.SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES;

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

  if (typeof initLanguageSelector === 'function') {
    initLanguageSelector();
  }
  if (typeof initMoodPicker === 'function') {
    initMoodPicker();
  }

  if (typeof animateFilmCounter === 'function') {
    animateFilmCounter();
  }

  const getFullBtn = document.getElementById('getFullVideoBtn');
  if (getFullBtn && typeof onGetFullVideoClicked === 'function') {
    getFullBtn.addEventListener('click', onGetFullVideoClicked);
  }
});

function setupEventListeners() {
  const photoInput = document.getElementById('photoInput');
  if (photoInput && typeof handlePhotoSelection === 'function') {
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
// LANGUAGE SELECTOR
// ============================================
function initLanguageSelector() {
  const select = document.getElementById('voiceLanguageSelect');
  if (!select) return;

  select.innerHTML = SUPPORTED_LANGUAGES.map(
    (lang) => `<option value="${lang.code}">${lang.flag} ${lang.label}</option>`
  ).join('');

  select.value = appState.voiceLanguage;

  select.addEventListener('change', (e) => {
    appState.voiceLanguage = e.target.value;
  });
}

// ============================================
// MOOD PICKER
// ============================================
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

  applyActiveStyles(appState.voiceMood);
}

// ============================================
// NAVIGATION
// ============================================
function startApp() {
  navigateToScreen('uploadScreen');
}
window.startApp = startApp;

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
window.navigateToScreen = navigateToScreen;

function goBack(screenId) {
  navigateToScreen(screenId);
}
window.goBack = goBack;

// ============================================
// CONSENT / TURNSTILE
// ============================================
const CONSENT_KEY = 'rt_consent_18plus_v1';

function hasConsent() {
  return localStorage.getItem(CONSENT_KEY) === 'true';
}
window.hasConsent = hasConsent;

function requireConsentOrBlock() {
  if (hasConsent()) return true;
  if (typeof showConsentModal === 'function') {
    showConsentModal();
  } else if (typeof showToast === 'function') {
    showToast('Please confirm you are 18+ before continuing.', 'error');
  }
  return false;
}
window.requireConsentOrBlock = requireConsentOrBlock;

function requireTurnstileOrBlock() {
  if (appState.turnstileToken) return true;
  if (typeof showToast === 'function') {
    showToast('Please complete the verification check.', 'error');
  }
  return false;
}
window.requireTurnstileOrBlock = requireTurnstileOrBlock;

function showConsentModal() {
  const modal = document.getElementById('consentModal');
  if (!modal) return;
  modal.style.display = 'flex';
  modal.classList.add('active');
}
window.showConsentModal = showConsentModal;

function closeConsentModal() {
  const modal = document.getElementById('consentModal');
  if (!modal) return;
  modal.classList.remove('active');
  modal.style.display = 'none';
}
window.closeConsentModal = closeConsentModal;

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
window.acceptConsent = acceptConsent;

// ============================================
// AUTH / MENU / WALLET HOOKS
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
window.initAuthenticatedApp = initAuthenticatedApp;

function updateBalanceDisplay() {
  const balanceEls = document.querySelectorAll('#userBalance, #modalBalance, #menuBalance');
  balanceEls.forEach((el) => {
    el.textContent = Number(appState.userBalance || 0).toFixed(2);
  });
}
window.updateBalanceDisplay = updateBalanceDisplay;

function openMenu() {
  const overlay = document.getElementById('menuOverlay');
  if (!overlay) return;

  overlay.style.display = 'flex';
  overlay.classList.add('open');
}
window.openMenu = openMenu;

function closeMenu() {
  const overlay = document.getElementById('menuOverlay');
  if (!overlay) return;

  overlay.classList.remove('open');
  overlay.style.display = 'none';
}
window.closeMenu = closeMenu;

function showLogin() {
  const modal = document.getElementById('authModal');
  if (!modal) return;

  modal.style.display = 'flex';
  modal.classList.add('active');
}
window.showLogin = showLogin;

function closeLogin() {
  const modal = document.getElementById('authModal');
  if (!modal) return;

  modal.classList.remove('active');
  modal.style.display = 'none';
}
window.closeLogin = closeLogin;

function logout(silent = false) {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');

  appState.authToken = null;
  appState.userId = null;
  appState.userBalance = 0;

  closeMenu();
  if (typeof hideLoading === 'function') hideLoading();
  if (typeof closeCredits === 'function') closeCredits();

  navigateToScreen('heroScreen');

  const header = document.querySelector('.app-header');
  if (header) header.classList.add('hidden');

  if (!silent && typeof showToast === 'function') {
    showToast('Logged out successfully', 'success');
  }
}
window.logout = logout;

function showAddCredits() {
  closeMenu();
  const modal = document.getElementById('creditsModal');
  if (!modal) return;

  modal.style.display = 'flex';
  modal.classList.add('active');

  const balanceEl = document.getElementById('modalBalance');
  if (balanceEl) balanceEl.textContent = Number(appState.userBalance || 0).toFixed(2);
}
window.showAddCredits = showAddCredits;

function closeCredits() {
  const modal = document.getElementById('creditsModal');
  if (!modal) return;

  modal.classList.remove('active');
  modal.style.display = 'none';
}
window.closeCredits = closeCredits;

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
window.animateFilmCounter = animateFilmCounter;
