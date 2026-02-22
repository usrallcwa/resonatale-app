// auth.js – Authentication, Signup & Password Reset
// Uses AUTH_API_BASE for auth routes (defined in app.js)
// appState is also defined in app.js

// ============================================
// MODAL CONTROLS
// ============================================
function showLogin() {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  modal.style.display = "flex";
  modal.classList.add("active");
}

function closeLogin() {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  modal.classList.remove("active");
  modal.style.display = "none";
}

function showSignup() {
  const modal = document.getElementById("signupModal");
  if (!modal) return;
  modal.style.display = "flex";
  modal.classList.add("active");
}

function closeSignup() {
  const modal = document.getElementById("signupModal");
  if (!modal) return;
  modal.classList.remove("active");
  modal.style.display = "none";
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
async function handleForgotPasswordClick() {
  const emailInput = document.getElementById("loginEmail");
  const email = (emailInput?.value || "").trim();

  if (!email) {
    if (typeof showToast === "function") {
      showToast(
        "Enter your account email first, then tap Forgot password.",
        "error"
      );
    }
    return;
  }

  if (typeof showLoading === "function") {
    showLoading("Sending reset link...");
  }

  try {
    const res = await fetch(`${AUTH_API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    let data = {};
    try {
      data = await res.json();
    } catch (_) {
      data = {};
    }

    if (!res.ok || data.success === false) {
      throw new Error(
        data.error || data.message || "Failed to start password reset"
      );
    }

    if (typeof hideLoading === "function") hideLoading();
    if (typeof showToast === "function") {
      showToast(
        "If that email is registered, a reset link has been sent.",
        "info"
      );
    }
  } catch (e) {
    console.error("Forgot password error:", e);
    if (typeof hideLoading === "function") hideLoading();
    if (typeof showToast === "function") {
      showToast(e.message || "Could not start password reset", "error");
    }
  }
}

// ============================================
// RESET PASSWORD (SUBMIT NEW PASSWORD)
// (Used on a dedicated reset page, not in the main app flow)
// ============================================
async function handleResetPasswordSubmit(event) {
  event.preventDefault();

  const tokenEl = document.getElementById("resetToken");
  const passwordEl = document.getElementById("resetPassword");
  const confirmEl = document.getElementById("resetPasswordConfirm");

  if (!tokenEl || !passwordEl || !confirmEl) {
    if (typeof showToast === "function")
      showToast("Reset form is incomplete.", "error");
    return;
  }

  const token = tokenEl.value.trim();
  const password = passwordEl.value;
  const confirm = confirmEl.value;

  if (!token || !password || !confirm) {
    if (typeof showToast === "function")
      showToast("Please fill in all fields.", "error");
    return;
  }

  if (password !== confirm) {
    if (typeof showToast === "function")
      showToast("Passwords do not match.", "error");
    return;
  }

  if (typeof showLoading === "function")
    showLoading("Resetting password...");

  try {
    const res = await fetch(`${AUTH_API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password })
    });

    let data = {};
    try {
      data = await res.json();
    } catch (_) {
      data = {};
    }

    if (!res.ok || data.success === false) {
      throw new Error(
        data.error || data.message || "Password reset failed"
      );
    }

    if (typeof hideLoading === "function") hideLoading();
    if (typeof showToast === "function") {
      showToast("Password reset successfully. Please log in.", "success");
    }

    showLogin();
  } catch (e) {
    console.error("Reset password error:", e);
    if (typeof hideLoading === "function") hideLoading();
    if (typeof showToast === "function") {
      showToast(e.message || "Password reset failed", "error");
    }
  }
}

// ============================================
// LOGIN
// ============================================
async function handleLoginSubmit(event) {
  event.preventDefault();
  const emailEl = document.getElementById("loginEmail");
  const passwordEl = document.getElementById("loginPassword");
  if (!emailEl || !passwordEl) return;

  const email = emailEl.value.trim();
  const password = passwordEl.value;

  await handleLogin(email, password);
}

async function handleLogin(email, password) {
  if (!email || !password) {
    if (typeof showToast === "function")
      showToast("Please enter email and password.", "error");
    return;
  }

  if (typeof showLoading === "function") showLoading("Logging in...");

  try {
    const res = await fetch(`${AUTH_API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    let data = {};
    try {
      data = await res.json();
    } catch (_) {
      data = {};
    }

    if (!res.ok || data.success === false) {
      throw new Error(data.error || data.message || "Login failed");
    }

    const user = data.user;
    const tokens = data.tokens || {};
    const accessToken = tokens.accessToken || data.accessToken;

    if (!user || !accessToken) {
      throw new Error("Invalid login response");
    }

    window.appState = window.appState || {};
    appState.authToken = accessToken;
    appState.userId = user.id;
    appState.userBalance = Number(
      user.walletBalance ?? user.balance ?? 0
    );

    appState.hasSavedPhotos = Boolean(user.hasPhotos);
    appState.hasSavedVoice = Boolean(user.hasVoice);

    localStorage.setItem("authToken", accessToken);
    localStorage.setItem("userId", user.id);

    if (typeof updateBalanceDisplay === "function")
      updateBalanceDisplay();
    if (typeof updateHeaderVisibility === "function") {
      updateHeaderVisibility(appState.currentScreen);
    }

    const emailElMenu = document.getElementById("menuEmail");
    if (emailElMenu) emailElMenu.textContent = user.email || email;

    closeLogin();
    if (typeof hideLoading === "function") hideLoading();
    if (typeof showToast === "function")
      showToast("Logged in!", "success");

    if (typeof navigateToScreen === "function") {
      if (appState.hasSavedPhotos && appState.hasSavedVoice) {
        const recordingHint = document.getElementById("recordingHint");
        if (recordingHint) {
          recordingHint.textContent =
            "We’re using your saved photos and voice from last time. Just describe the new story you want to tell.";
        }
        navigateToScreen("voiceScreen");
      } else {
        navigateToScreen("uploadScreen");
      }
    }
  } catch (e) {
    console.error("Login error:", e);
    if (typeof hideLoading === "function") hideLoading();
    if (typeof showToast === "function")
      showToast(e.message || "Login failed", "error");
  }
}

// ============================================
// SIGNUP
// ============================================
async function handleSignup(event) {
  event.preventDefault();

  const emailEl = document.getElementById("signupEmail");
  const passwordEl = document.getElementById("signupPassword");
  const nameEl = document.getElementById("signupName");
  const consentEl = document.getElementById("consentCheck");

  if (!emailEl || !passwordEl || !nameEl || !consentEl) {
    if (typeof showToast === "function")
      showToast("Signup form is incomplete.", "error");
    return;
  }

  const email = emailEl.value.trim();
  const password = passwordEl.value;
  const name = nameEl.value.trim();
  const consent = consentEl.checked;

  if (!consent) {
    if (typeof showToast === "function") {
      showToast(
        "Please accept terms and confirm you are 18+.",
        "error"
      );
    }
    return;
  }

  if (!appState.turnstileToken) {
    if (typeof showToast === "function") {
      showToast("Please complete the verification check.", "error");
    }
    return;
  }

  if (typeof showLoading === "function")
    showLoading("Creating account...");

  try {
    const res = await fetch(`${AUTH_API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

    if (!res.ok || data.success === false) {
      throw new Error(data.error || data.message || "Signup failed");
    }

    const user = data.user;
    const tokens = data.tokens || {};
    const accessToken = tokens.accessToken || data.accessToken;

    if (!user || !accessToken) {
      throw new Error("Invalid signup response");
    }

    window.appState = window.appState || {};
    appState.authToken = accessToken;
    appState.userId = user.id;
    appState.userBalance = Number(
      user.walletBalance ?? user.balance ?? 0
    );

    appState.hasSavedPhotos = Boolean(user.hasPhotos);
    appState.hasSavedVoice = Boolean(user.hasVoice);

    localStorage.setItem("authToken", accessToken);
    localStorage.setItem("userId", user.id);

    if (typeof updateBalanceDisplay === "function")
      updateBalanceDisplay();
    if (typeof updateHeaderVisibility === "function") {
      updateHeaderVisibility(appState.currentScreen);
    }

    const emailMenuEl = document.getElementById("menuEmail");
    if (emailMenuEl) emailMenuEl.textContent = user.email || email;

    closeSignup();
    if (typeof hideLoading === "function") hideLoading();
    if (typeof showToast === "function")
      showToast("Account created!", "success");

    if (typeof navigateToScreen === "function") {
      navigateToScreen("uploadScreen");
    }
  } catch (e) {
    console.error("Signup error:", e);
    if (typeof hideLoading === "function") hideLoading();
    if (typeof showToast === "function")
      showToast(e.message || "Signup failed", "error");
  }
}

// ============================================
// GLOBAL EXPORTS
// ============================================
window.showLogin = showLogin;
window.closeLogin = closeLogin;
window.showSignup = showSignup;
window.closeSignup = closeSignup;
window.switchToSignup = switchToSignup;
window.switchToLogin = switchToLogin;
window.handleForgotPasswordClick = handleForgotPasswordClick;
window.handleResetPasswordSubmit = handleResetPasswordSubmit;
window.handleLoginSubmit = handleLoginSubmit;
window.handleSignup = handleSignup;
