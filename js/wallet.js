// wallet.js - Payment & Credits

async function processPayment() {
  const slider = document.getElementById('creditSlider');
  if (!slider) {
    if (typeof showToast === 'function') showToast('Payment slider not found.', 'error');
    return;
  }

  const amount = parseInt(slider.value, 10);

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
    const res = await fetch(`${API_BASE}/api/wallet/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${appState.authToken}`
      },
      body: JSON.stringify({ amount })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || data.message || 'Payment failed');
    }

    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl; // Stripe checkout
    } else {
      throw new Error('No checkout URL received');
    }
  } catch (e) {
    console.error('Payment error:', e);
    if (typeof hideLoading === 'function') hideLoading();
    if (typeof showToast === 'function') showToast(e.message || 'Payment failed', 'error');
  }
}

async function refreshBalance() {
  if (!appState.authToken) return;

  try {
    const res = await fetch(`${API_BASE}/api/wallet/balance`, {
      headers: { Authorization: `Bearer ${appState.authToken}` }
    });

    if (!res.ok) return;

    const data = await res.json().catch(() => ({}));
    const balanceNum = Number(data.balance ?? 0);

    appState.userBalance = Number.isFinite(balanceNum) ? balanceNum : 0;
    if (typeof updateBalanceDisplay === 'function') updateBalanceDisplay();
  } catch (e) {
    console.error('Balance refresh failed:', e);
  }
}

// Check for payment success on page load
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const paymentStatus = params.get('payment');
  if (!paymentStatus) return;

  if (paymentStatus === 'success') {
    if (typeof showToast === 'function') showToast('Payment successful!', 'success');
    refreshBalance();
  } else if (paymentStatus === 'cancelled') {
    if (typeof showToast === 'function') showToast('Payment cancelled', 'info');
  }

  // Clean URL
  window.history.replaceState({}, '', window.location.pathname);
});
