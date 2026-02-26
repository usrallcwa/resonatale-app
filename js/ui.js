// ui.js – minimal helpers for ResonaTale storyboard

(function () {
  'use strict';

  // ============================================
  // LOADING OVERLAY
  // ============================================

  function showLoading(text) {
    var overlay = document.getElementById('loader');
    var loadingText = document.getElementById('loader-msg');
    if (!overlay) return;

    if (loadingText) {
      loadingText.textContent = text || 'Processing...';
    }
    overlay.classList.add('show');
  }

  function hideLoading() {
    var overlay = document.getElementById('loader');
    if (!overlay) return;

    overlay.classList.remove('show');
  }

  window.showLoading = showLoading;
  window.hideLoading = hideLoading;

  // ============================================
  // TOAST NOTIFICATIONS
  // ============================================

  var toastCooldownUntil = 0;

  function showToast(message, type) {
    var now = Date.now();
    if (now < toastCooldownUntil) return;
    toastCooldownUntil = now + 800;

    var toastHost = document.getElementById('toast');

    // If there's a built-in toast element (your new page has one), use it.
    if (toastHost) {
      toastHost.textContent = message || '';
      toastHost.className = 'toast show';
      if (type === 'success' || type === 'ok') {
        toastHost.classList.add('ok');
      } else {
        toastHost.classList.remove('ok');
      }
      setTimeout(function () {
        toastHost.classList.remove('show');
      }, 3000);
      return;
    }

    // Fallback: create a temporary toast element if no #toast exists.
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'info');
    toast.textContent = message || '';
    toast.style.cssText =
      'position:fixed;' +
      'bottom:2rem;' +
      'left:50%;' +
      'transform:translateX(-50%);' +
      'background:' +
      (type === 'error'
        ? '#EF4444'
        : type === 'success'
        ? '#10B981'
        : '#6366F1') +
      ';color:#fff;padding:0.8rem 1.6rem;border-radius:12px;' +
      'z-index:9999;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.35);';

    document.body.appendChild(toast);

    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(function () {
        toast.remove();
      }, 300);
    }, 3000);
  }

  window.showToast = showToast;

  // ============================================
  // GLOBAL ERROR HANDLING
  // ============================================

  window.addEventListener('error', function (e) {
    console.error('Global error:', e && (e.error || e.message || e));
    if (typeof showToast === 'function') {
      showToast('Something went wrong. Please try again.', 'error');
    }
  });

  window.addEventListener('unhandledrejection', function (e) {
    console.error('Unhandled promise rejection:', e && e.reason);
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof showToast === 'function') {
      showToast('Network error. Please check your connection.', 'error');
    }
  });
})();
