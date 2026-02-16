// wallet.js - Payment & Credits (Stripe + credits service)

// Amount slider -> wallet credits via Stripe Checkout
async function processPayment() {
  const slider = document.getElementById('creditSlider');
  if (!slider) {
    if (typeof showToast === 'function') showToast('Payment slider not found.', 'error');
    return;
  }

  const amount = parseInt(slider.value, 10);

  // Match pricing constraints MINDEPOSIT / MAXDEPOSIT (20–500)
  if (Number.isNaN(amount) || amount < 20 || amount > 500) {
    if (typeof showToast === 'function') showToast('Amount must be $20–$500', 'error');
    return;
  }

  if (!appState.authToken) {
    if (typeof showToast === 'function') showToast('Please login first', 'error');
    if (typeof showLogin === 'function') showLogin();
    return;
  }

  if (typeof showLoading === 'function') showLoading('Processing payment...');

  try {
    // First get the authenticated user so we have id + email
    const meRes = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${appState.authToken}` }
    });

    const meData = await meRes.json().catch(() => ({}));
    if (!meRes.ok || !meData.user) {
      throw new Error(meData.error || meData.message || 'Unable to load account');
    }

    const user = meData.user;

    // Backend route: POST /api/credits/checkout/create
    // Body: { userId, email, amount, credits, type }
    const checkoutRes = await fetch(`${API_BASE}/api/credits/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${appState.authToken}`
      },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        amount,          // dollars
        credits: amount, // for simplicity: 1 wallet credit == $1
        type: 'wallet'
      })
    });

    const checkoutData = await checkoutRes.json().catch(() => ({}));

    if (!checkoutRes.ok || checkoutData.success === false) {
      throw new Error(checkoutData.error || checkoutData.message || 'Payment failed');
    }

    const url = checkoutData.url || checkoutData.checkoutUrl;
    if (url) {
      // Redirect to Stripe-hosted checkout
      window.location.href = url;
    } else {
      throw new Error('No checkout URL received');
    }
  } catch (e) {
    console.error('Payment error:', e);
    if (typeof hideLoading === 'function') hideLoading();
    if (typeof showToast === 'function') showToast(e.message || 'Payment failed', 'error');
  }
}

// Refresh wallet balance using /api/credits
async function refreshBalance() {
  if (!appState.authToken) return;

  try {
    const res = await fetch(`${API_BASE}/api/credits`, {
      headers: { Authorization: `Bearer ${appState.authToken}` }
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      console.error('Credits fetch error:', data.error || data.message);
      return;
    }

    // CreditsService.getBalance returns { success, balance: { wallet, videos } }
    const walletBalance = Number(data.balance?.wallet ?? 0);
    appState.userBalance = Number.isFinite(walletBalance) ? walletBalance : 0;

    if (typeof updateBalanceDisplay === 'function') updateBalanceDisplay();
  } catch (e) {
    console.error('Balance refresh failed:', e);
  }
}

// Handle Stripe return redirect: verify and update balance
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id') || params.get('sessionId');
  const statusFlag = params.get('payment'); // legacy flag, keep for now

  // If we have a Stripe session id, verify with backend
  if (sessionId) {
    try {
      const verifyRes = await fetch(`${API_BASE}/api/credits/checkout/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // verification endpoint does not require auth in Worker, but header is harmless
          Authorization: appState.authToken ? `Bearer ${appState.authToken}` : undefined
        },
        body: JSON.stringify({ sessionId })
      });

      const verifyData = await verifyRes.json().catch(() => ({}));

      if (!verifyRes.ok || verifyData.success === false) {
        if (typeof showToast === 'function') {
          showToast(verifyData.error || 'Payment verification failed', 'error');
        }
      } else {
        if (typeof showToast === 'function') {
          showToast('Payment successful! Credits added to your wallet.', 'success');
        }
        await refreshBalance();
      }
    } catch (e) {
      console.error('Payment verification error:', e);
      if (typeof showToast === 'function') {
        showToast('Could not verify payment.', 'error');
      }
    }

    // Clean Stripe params from URL
    window.history.replaceState({}, '', window.location.pathname);
    return;
  }

  // Fallback: simple ?payment=success|cancelled flag
  if (statusFlag === 'success') {
    if (typeof showToast === 'function') showToast('Payment successful!', 'success');
    refreshBalance();
  } else if (statusFlag === 'cancelled') {
    if (typeof showToast === 'function') showToast('Payment cancelled', 'info');
  }

  window.history.replaceState({}, '', window.location.pathname);
});
