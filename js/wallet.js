// wallet.js - Payment & Credits

async function processPayment() {
  const slider = document.getElementById('creditSlider');
  if (!slider) {
    showToast?.('Payment slider not found.', 'error');
    return;
  }

  const amount = parseInt(slider.value, 10);

  if (Number.isNaN(amount) || amount < 20 || amount > 500) {
    showToast?.('Amount must be $20–$500', 'error');
    return;
  }

  if (!appState.authToken) {
    showToast?.('Please login first', 'error');
    showLogin?.();
    return;
  }

  showLoading?.('Processing payment...');

  try {
    const res = await fetch(`${API_BASE}/wallet/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${appState.authToken}`
      },
      body: JSON.stringify({ amount })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || data.message || 'Payment failed');
    }

    if (data.checkoutUrl) {
      // Let Stripe take over
      window.location.href = data.checkoutUrl;
    } else {
      throw new Error('No checkout URL received');
    }
  } catch (e) {
    console.error('Payment error:', e);
    hideLoading?.();
    showToast?.(e.message || 'Payment failed', 'error');
  }
}

async function refreshBalance() {
  if (!appState.authToken) return;

  try {
    const res = await fetch(`${API_BASE}/wallet/balance`, {
      headers: { Authorization: `Bearer ${appState.authToken}` }
    });

    if (!res.ok) return;

    const data = await res.json();
    const balanceNum = Number(data.balance ?? 0);

    appState.userBalance = Number.isFinite(balanceNum) ? balanceNum : 0;
    updateBalanceDisplay?.();
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
    showToast?.('Payment successful!', 'success');
    refreshBalance();
  } else if (paymentStatus === 'cancelled') {
    showToast?.('Payment cancelled', 'info');
  }

  // Clean URL
  window.history.replaceState({}, '', window.location.pathname);
});
