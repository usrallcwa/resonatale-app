// wallet.js - Payment & Credits

async function processPayment() {
    const amount = parseInt(document.getElementById('creditSlider').value);
    
    if (amount < 20 || amount > 500) {
        showToast('Amount must be $20-$500', 'error');
        return;
    }
    
    if (!state.authToken) {
        showToast('Please login first', 'error');
        return;
    }
    
    showLoading('Processing payment...');
    
    try {
        // Create Stripe checkout session
        const res = await fetch(`${API_BASE}/api/wallet/create-checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.authToken}`
            },
            body: JSON.stringify({ amount })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || 'Payment failed');
        }
        
        // Redirect to Stripe checkout
        if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
        } else {
            throw new Error('No checkout URL received');
        }
        
    } catch (e) {
        hideLoading();
        showToast(e.message, 'error');
    }
}

async function refreshBalance() {
    if (!state.authToken) return;
    
    try {
        const res = await fetch(`${API_BASE}/api/wallet/balance`, {
            headers: { 'Authorization': `Bearer ${state.authToken}` }
        });
        
        if (res.ok) {
            const data = await res.json();
            state.balance = data.balance || 0;
            updateBalance();
        }
    } catch (e) {
        console.error('Balance refresh failed:', e);
    }
}

// Check for payment success on page load
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('payment') === 'success') {
        showToast('Payment successful!', 'success');
        refreshBalance();
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('payment') === 'cancelled') {
        showToast('Payment cancelled', 'info');
        window.history.replaceState({}, '', window.location.pathname);
    }
});
