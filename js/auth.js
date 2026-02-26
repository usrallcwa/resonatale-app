// ui.js – minimal helpers for the new story app

(function () {
  'use strict';

  var $toast = document.getElementById('toast');
  var $loader = document.getElementById('loader');
  var $loaderMsg = document.getElementById('loader-msg');
  var toastTimer = null;

  function showToast(message, type) {
    if (!$toast) return;
    if (toastTimer) clearTimeout(toastTimer);

    $toast.textContent = message;
    $toast.className = 'toast show';
    if (type === 'success' || type === 'ok') {
      $toast.classList.add('ok');
    }

    toastTimer = setTimeout(function () {
      $toast.classList.remove('show');
    }, 3500);
  }

  function showLoading(message) {
    if (!$loader || !$loaderMsg) return;
    $loaderMsg.textContent = message || 'Processing...';
    $loader.classList.add('show');
  }

  function hideLoading() {
    if (!$loader) return;
    $loader.classList.remove('show');
  }

  // expose globals for app.js
  window.showToast = showToast;
  window.showLoading = showLoading;
  window.hideLoading = hideLoading;
})();
