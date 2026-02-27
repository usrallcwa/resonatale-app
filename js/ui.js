(function () {
  'use strict';

  window.RT = window.RT || {};

  var toastTimer = null;
  var $toastEl = document.getElementById('toast');
  var $loader = document.getElementById('loader');
  var $loaderMsg = document.getElementById('loader-msg');
  var $loaderSteps = document.getElementById('loader-steps');

  // ── Toast ──
  RT.toast = function (msg, ok) {
    if (toastTimer) clearTimeout(toastTimer);
    $toastEl.textContent = msg;
    $toastEl.className = 'toast show' + (ok ? ' ok' : '');
    toastTimer = setTimeout(function () {
      $toastEl.classList.remove('show');
    }, 4500);
  };

  // ── Loader ──
  RT.loading = function (show, msg, steps) {
    $loaderMsg.textContent = msg || 'Preparing your experience...';
    if ($loaderSteps) {
      $loaderSteps.innerHTML = '';
      if (steps && Array.isArray(steps)) {
        steps.forEach(function (s) {
          var p = document.createElement('p');
          p.textContent = s;
          $loaderSteps.appendChild(p);
        });
      }
    }
    if (show) $loader.classList.add('show');
    else $loader.classList.remove('show');
  };

  // ── Escape HTML ──
  RT.esc = function (str) {
    if (!str) return '';
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  };

  // ── Screen Navigation ──
  RT.showScreen = function (id) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.remove('active');
    }
    var target = document.getElementById('s-' + id);
    if (target) {
      target.classList.add('active');
      window.scrollTo(0, 0);
    }
  };

  // ── Live Clock ──
  function tickClock() {
    var now = new Date();
    var hours = now.getHours() % 12;
    var minutes = now.getMinutes();
    var seconds = now.getSeconds();
    var millis = now.getMilliseconds();

    var secAngle = (seconds * 6) + (millis * 0.006);
    var minAngle = (minutes * 6) + (seconds * 0.1);
    var hourAngle = (hours * 30) + (minutes * 0.5);

    var $h = document.getElementById('c-h');
    var $m = document.getElementById('c-m');
    var $s = document.getElementById('c-s');

    if ($h) $h.setAttribute('transform', 'rotate(' + hourAngle + ' 100 100)');
    if ($m) $m.setAttribute('transform', 'rotate(' + minAngle + ' 100 100)');
    if ($s) $s.setAttribute('transform', 'rotate(' + secAngle + ' 100 100)');
  }

  tickClock();
  setInterval(tickClock, 50);

})();
