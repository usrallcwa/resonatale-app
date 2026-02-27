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
    $loaderMsg.textContent = msg || 'Preparing your experience...';
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

  // ── Live Clock ──
  // Uses the user's local time automatically via new Date()
  // No timezone config needed — JavaScript Date() always returns local time

  function tickClock() {
    var now = new Date();
    var hours = now.getHours() % 12;
    var minutes = now.getMinutes();
    var seconds = now.getSeconds();
    var millis = now.getMilliseconds();

    // Smooth second hand (includes milliseconds)
    var secAngle = (seconds * 6) + (millis * 0.006);
    // Minute hand moves smoothly with seconds
    var minAngle = (minutes * 6) + (seconds * 0.1);
    // Hour hand moves smoothly with minutes
    var hourAngle = (hours * 30) + (minutes * 0.5);

    var $h = document.getElementById('c-h');
    var $m = document.getElementById('c-m');
    var $s = document.getElementById('c-s');

    if ($h) $h.setAttribute('transform', 'rotate(' + hourAngle + ' 100 100)');
    if ($m) $m.setAttribute('transform', 'rotate(' + minAngle + ' 100 100)');
    if ($s) $s.setAttribute('transform', 'rotate(' + secAngle + ' 100 100)');
  }

  // Run immediately so hands show correct time on first frame
  // Use DOMContentLoaded guard to ensure SVG is rendered
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      tickClock();
      setInterval(tickClock, 50);
    });
  } else {
    tickClock();
    setInterval(tickClock, 50);
  }

  // ── Export ──
  window.RT = window.RT || {};
  RT.toast = toast;
  RT.loading = loading;
  RT.esc = esc;
})();
