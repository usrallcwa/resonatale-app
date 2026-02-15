// auth.js - Authentication & Signup

// Simple login modal controls (matches #authModal in index.html)
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

// If you add a separate signup modal later, these stubs are safe no-ops
function showSignup() {
  const modal = document.getElementById('signupModal');
  if (!modal) return;
  modal.style.display = 'flex';
  modal.classList.add('active');
}

function closeSignup() {
  const modal = document.getElementById('signupModal');
  if (!modal) return;
  modal.classList.remove('active');
  modal.style.display = 'none';
}

function switchToSignup() {
  closeLogin();
  showSignup();
}

function switchToLogin() {
  closeSignup();
  showLogin();
}

// ----- LOGIN -----
async function handleLoginSubmit(event) {
  event.preventDefault();
  const emailEl = document.getElementById('loginEmail');
  const passwordEl = document.getElementById('loginPassword');
  if (!emailEl || !passwordEl) return;

  const email = emailEl.value.trim();
  const password = passwordEl.value;

  await handleLogin(email, password);
}

async function handleLogin(email, password) {
  if (!email || !password) {
    showToast?.('Please enter email and password', 'error');
    return;
  }

  showLoading?.('Logging in...');

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok || data.success === false) {
      throw new Error(data.error || data.message || 'Login failed');
    }

    // Normalized auth state
    appState.authToken = data.accessToken;
    appState.userId = data.user.id;
    appState.userBalance = data.user.balance || 0;

    localStorage.setItem('authToken', data.accessToken);
    localStorage.setItem('userId', data.user.id);

    updateBalanceDisplay?.();          // from app.js
    updateHeaderVisibility?.(appState.currentScreen);

    const emailEl = document.getElementById('menuEmail');
    if (emailEl) emailEl.textContent = data.user.email || email;

    closeLogin();
    hideLoading?.();
    showToast?.('Logged in!', 'success');

    navigateToScreen?.('uploadScreen');
  } catch (e) {
    console.error('Login error:', e);
    hideLoading?.();
    showToast?.(e.message || 'Login failed', 'error');
  }
}

// ----- SIGNUP -----
async function handleSignup(event) {
  event.preventDefault();

  const emailEl = document.getElementById('signupEmail');
  const passwordEl = document.getElementById('signupPassword');
  const nameEl = document.getElementById('signupName');
  const consentEl = document.getElementById('consentCheck');

  if (!emailEl || !passwordEl || !nameEl || !consentEl) {
    showToast?.('Signup form is incomplete.', 'error');
    return;
  }

  const email = emailEl.value.trim();
  const password = passwordEl.value;
  const name = nameEl.value.trim();
  const consent = consentEl.checked;

  if (!consent) {
    showToast?.('Please accept terms and confirm you are 18+.', 'error');
    return;
  }

  if (!appState.turnstileToken) {
    showToast?.('Please complete the verification check.', 'error');
    return;
  }

  showLoading?.('Creating account...');

  try {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        name,
        consentAccepted: true,
        turnstileToken: appState.turnstileToken
      })
    });

    const data = await res.json();

    if (!res.ok || data.success === false) {
      throw new Error(data.error || data.message || 'Signup failed');
    }

    appState.authToken = data.accessToken;
    appState.userId = data.user.id;
    appState.userBalance = data.user.balance || 0;

    localStorage.setItem('authToken', data.accessToken);
    localStorage.setItem('userId', data.user.id);

    updateBalanceDisplay?.();
    updateHeaderVisibility?.(appState.currentScreen);

    const emailMenuEl = document.getElementById('menuEmail');
    if (emailMenuEl) emailMenuEl.textContent = data.user.email || email;

    closeSignup();
    hideLoading?.();
    showToast?.('Account created!', 'success');

    // Optional: kick user into main flow
    navigateToScreen?.('uploadScreen');
  } catch (e) {
    console.error('Signup error:', e);
    hideLoading?.();
    showToast?.(e.message || 'Signup failed', 'error');
  }
}
