// auth.js – Authentication, Signup & Password Reset

// ============================================
// MODAL CONTROLS
// ============================================
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

// ============================================
// FORGOT PASSWORD (REQUEST RESET EMAIL)
// ============================================
// Hook this to a "Forgot password?" link, e.g.:
// <a href="javascript:void(0)" onclick="handleForgotPasswordClick()">Forgot password?</a>
async function handleForgotPasswordClick() {
  const email = window.prompt('Enter your account email to reset your password:');
  if (!email) return;

  try {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() })
    });

    let data = {};
    try {
      data = await res.json();
    } catch (_) {
      data = {};
    }

    if (!res.ok || data.success === false) {
      throw new Error(data.error || data.message || 'Failed to start password reset');
    }

    if (typeof showToast === 'function') {
      showToast('If that email is registered, a reset link has been sent.', 'info');
    }
  } catch (e) {
    console.error('Forgot password error:', e);
    if (typeof showToast === 'function') {
      showToast(e.message || 'Could not start password reset', 'error');
    }
  }
}

// ============================================
// RESET PASSWORD (SUBMIT NEW PASSWORD)
// ============================================
// This assumes a dedicated reset page with a form like:
// <form onsubmit="handleResetPasswordSubmit(event)">
//   <input type="hidden" id="resetToken" value="...from URL...">
//   <input id="resetPassword" type="password">
//   <input id="resetPasswordConfirm" type="password">
// </form>
async function handleResetPasswordSubmit(event) {
  event.preventDefault();

  const tokenEl = document.getElementById('resetToken');
  const passwordEl = document.getElementById('resetPassword');
  const confirmEl = document.getElementById('resetPasswordConfirm');

  if (!tokenEl || !passwordEl || !confirmEl) {
    if (typeof showToast === 'function') showToast('Reset form is incomplete.', 'error');
    return;
  }

  const token = tokenEl.value.trim();
  const password = passwordEl.value;
  const confirm = confirmEl.value;

  if (!token || !password || !confirm) {
    if (typeof showToast === 'function') showToast('Please fill in all fields.', 'error');
    return;
  }

  if (password !== confirm) {
    if (typeof showToast === 'function') showToast('Passwords do not match.', 'error');
    return;
  }

  if (typeof showLoading === 'function') showLoading('Resetting password...');

  try {
    const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });

    let data = {};
    try {
      data = await res.json();
    } catch (_) {
      data = {};
    }

    if (!res.ok || data.success === false) {
      throw new Error(data.error || data.message || 'Password reset failed');
    }

    if (typeof hideLoading === 'function') hideLoading();
    if (typeof showToast === 'function') {
      showToast('Password reset successfully. Please log in.', 'success');
    }

    // Redirect back to login UI
    if (typeof navigateToScreen === 'function') {
      navigateToScreen('landing'); // adjust to your login/landing screen id
    }
    showLogin();
  } catch (e) {
    console.error('Reset password error:', e);
    if (typeof hideLoading === 'function') hideLoading();
    if (typeof showToast === 'function') {
      showToast(e.message || 'Password reset failed', 'error');
    }
  }
}

// ============================================
// LOGIN
// ============================================
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
    if (typeof showToast === 'function') showToast('Please enter email and password', 'error');
    return;
  }

  if (typeof showLoading === 'function') showLoading('Logging in...');

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })   // matches handleLogin in Worker
    });

    let data = {};
    try {
      data = await res.json();
    } catch (_) {
      data = {};
    }

    // Worker returns { success, user, tokens } or { success:false, error }
    if (!res.ok || data.success === false) {
      throw new Error(data.error || data.message || 'Login failed');
    }

    const user = data.user;
    const tokens = data.tokens || {};
    const accessToken = tokens.accessToken || data.accessToken; // support either shape

    if (!user || !accessToken) {
      throw new Error('Invalid login response');
    }

    window.appState = window.appState || {};
    appState.authToken = accessToken;
    appState.userId = user.id;
    // walletBalance in DB is exposed as walletBalance by toPublicUser
    appState.userBalance = Number(user.walletBalance ?? user.balance ?? 0);

    localStorage.setItem('authToken', accessToken);
    localStorage.setItem('userId', user.id);

    if (typeof updateBalanceDisplay === 'function') updateBalanceDisplay();
    if (typeof updateHeaderVisibility === 'function') {
      updateHeaderVisibility(appState.currentScreen);
    }

    const emailEl = document.getElementById('menuEmail');
    if (emailEl) emailEl.textContent = user.email || email;

    closeLogin();
    if (typeof hideLoading === 'function') hideLoading();
    if (typeof showToast === 'function') showToast('Logged in!', 'success');

    if (typeof navigateToScreen === 'function') navigateToScreen('uploadScreen');
  } catch (e) {
    console.error('Login error:', e);
    if (typeof hideLoading === 'function') hideLoading();
    if (typeof showToast === 'function') showToast(e.message || 'Login failed', 'error');
  }
}

// ============================================
// SIGNUP
// ============================================
async function handleSignup(event) {
  event.preventDefault();

  const emailEl = document.getElementById('signupEmail');
  const passwordEl = document.getElementById('signupPassword');
  const nameEl = document.getElementById('signupName');
  const consentEl = document.getElementById('consentCheck');

  if (!emailEl || !passwordEl || !nameEl || !consentEl) {
    if (typeof showToast === 'function') showToast('Signup form is incomplete.', 'error');
    return;
  }

  const email = emailEl.value.trim();
  const password = passwordEl.value;
  const name = nameEl.value.trim();
  const consent = consentEl.checked;

  if (!consent) {
    if (typeof showToast === 'function') {
      showToast('Please accept terms and confirm you are 18+.', 'error');
    }
    return;
  }

  if (!appState.turnstileToken) {
    if (typeof showToast === 'function') {
      showToast('Please complete the verification check.', 'error');
    }
    return;
  }

  if (typeof showLoading === 'function') showLoading('Creating account...');

  try {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Worker’s handleSignup expects { email, password, name }
      body: JSON.stringify({
        email,
        password,
        name
      })
    });

    let data = {};
    try {
      data = await res.json();
    } catch (_) {
      data = {};
    }

    // Worker returns { success, user, tokens } or { success:false, error }
    if (!res.ok || data.success === false) {
      throw new Error(data.error || data.message || 'Signup failed');
    }

    const user = data.user;
    const tokens = data.tokens || {};
    const accessToken = tokens.accessToken || data.accessToken;

    if (!user || !accessToken) {
      throw new Error('Invalid signup response');
    }

    window.appState = window.appState || {};
    appState.authToken = accessToken;
    appState.userId = user.id;
    appState.userBalance = Number(user.walletBalance ?? user.balance ?? 0);

    localStorage.setItem('authToken', accessToken);
    localStorage.setItem('userId', user.id);

    if (typeof updateBalanceDisplay === 'function') updateBalanceDisplay();
    if (typeof updateHeaderVisibility === 'function') {
      updateHeaderVisibility(appState.currentScreen);
    }

    const emailMenuEl = document.getElementById('menuEmail');
    if (emailMenuEl) emailMenuEl.textContent = user.email || email;

    closeSignup();
    if (typeof hideLoading === 'function') hideLoading();
    if (typeof showToast === 'function') showToast('Account created!', 'success');

    if (typeof navigateToScreen === 'function') navigateToScreen('uploadScreen');
  } catch (e) {
    console.error('Signup error:', e);
    if (typeof hideLoading === 'function') hideLoading();
    if (typeof showToast === 'function') showToast(e.message || 'Signup failed', 'error');
  }
}
