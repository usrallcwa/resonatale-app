(function () {
  'use strict';

  var toastTimer = null;

  RT.toast = function (msg, ok) {
    var el = RT.$('toast');
    if (!el) return;
    if (toastTimer) clearTimeout(toastTimer);
    el.textContent = msg;
    el.className = 'toast show' + (ok ? ' ok' : '');
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 4500);
  };

  RT.loading = function (show, msg) {
    var el = RT.$('loading-overlay');
    var m = RT.$('loading-msg');
    if (!el) return;
    if (m) m.textContent = msg || 'Loading...';
    if (show) el.classList.remove('hide');
    else el.classList.add('hide');
  };

  RT.showScreen = function (id) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.remove('active');
    }
    var s = document.getElementById('s-' + id) || document.getElementById(id);
    if (s) {
      s.classList.add('active');
    }
    window.scrollTo(0, 0);
  };

  RT.updateCredits = function (n) {
    RT.credits = n || 0;
    var els = document.querySelectorAll('.js-credits');
    for (var i = 0; i < els.length; i++) els[i].textContent = RT.credits;
  };

  RT.renderShareButtons = function (container, videoUrl) {
    if (!container || !videoUrl) return;
    container.innerHTML = '';
    var text = encodeURIComponent('Check out my AI film!');
    var url = encodeURIComponent(videoUrl);
    RT.SHARE.forEach(function (s) {
      var link = s.url.replace('{text}', text).replace('{url}', url);
      var a = document.createElement('a');
      a.href = link;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'share-btn';
      a.textContent = s.icon + ' ' + s.label;
      container.appendChild(a);
    });
  };

})();