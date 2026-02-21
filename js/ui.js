// ui.js

// ============================================
// LOADING OVERLAY
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

window.showLoading = showLoading;
window.hideLoading = hideLoading;

// ============================================
// TOAST NOTIFICATIONS
// ============================================

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

window.showToast = showToast;

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

