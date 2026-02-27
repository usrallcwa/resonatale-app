(function () {
  'use strict';

  var toastTimer = null;
  var $toastEl = document.getElementById('toast');
  var $loader = document.getElementById('loader');
  var $loaderMsg = document.getElementById('loader-msg');

  // ── Toast ──
  function toast(msg, ok) {
    if (toastTimer) clearTimeout(toastTimer);
    $toastEl.textContent = msg;
    $toastEl.className = 'toast show' + (ok ? ' ok' : '');
    toastTimer = setTimeout(function () {
      $toastEl.classList.remove('show');
    }, 4500);
  }

  // ── Loader ──
  function loading(show, msg) {
    $loaderMsg.textContent = msg || 'Generating scenes...';
    if (show) $loader.classList.add('show');
    else $loader.classList.remove('show');
  }

  // ── Escape HTML ──
  function esc(str) {
    if (!str) return '';
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ── Clock ──
  function tickClock() {
    var now = new Date();
    var h = now.getHours() % 12;
    var m = now.getMinutes();
    var s = now.getSeconds();
    var $h = document.getElementById('clock-h');
    var $m = document.getElementById('clock-m');
    var $s = document.getElementById('clock-s');
    if ($h) $h.setAttribute('transform', 'rotate(' + ((h * 30) + (m * 0.5)) + ' 50 50)');
    if ($m) $m.setAttribute('transform', 'rotate(' + (m * 6) + ' 50 50)');
    if ($s) $s.setAttribute('transform', 'rotate(' + (s * 6) + ' 50 50)');
  }
  tickClock();
  setInterval(tickClock, 1000);

  // Export
  window.RT = window.RT || {};
  RT.toast = toast;
  RT.loading = loading;
  RT.esc = esc;
})();
