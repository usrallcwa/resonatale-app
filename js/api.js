(function () {
  'use strict';

  var toastTimer = null;

  // ── Toast ──

  RT.toast = function (msg, ok) {
    var el = RT.$('toast');
    if (toastTimer) clearTimeout(toastTimer);
    el.textContent = msg;
    el.className = 'toast show' + (ok ? ' ok' : '');
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 4500);
  };

  // ── Loader ──

  RT.loading = function (show, msg) {
    var el = RT.$('loader');
    var m = RT.$('loader-msg');
    if (m) m.textContent = msg || 'Preparing...';
    if (show) el.classList.add('show');
    else el.classList.remove('show');
  };

  // ── Screen Nav ──

  RT.showScreen = function (id) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove('active');
    var target = RT.$('s-' + id);
    if (target) { target.classList.add('active'); window.scrollTo(0, 0); }
  };

  // ── Escape HTML ──

  RT.esc = function (str) {
    if (!str) return '';
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  };

  // ── Update Credits Display ──

  RT.updateCredits = function (n) {
    RT.credits = n;
    var els = document.querySelectorAll('.js-credits');
    for (var i = 0; i < els.length; i++) els[i].textContent = String(n || 0);
  };

  // ── Render Scenes ──

  RT.renderScenes = function (scenes) {
    var el = RT.$('preview-scenes');
    if (!el) return;
    el.innerHTML = '';
    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i];
      var card = document.createElement('div');
      card.className = 'scene-card';
      card.innerHTML =
        '<div class="scene-num">Scene ' + (i + 1) + ' of ' + scenes.length + '</div>' +
        '<div class="scene-title">' + RT.esc(s.title) + '</div>' +
        '<div class="scene-block"><div class="scene-block-label">Direction</div>' +
        '<div class="scene-block-text">' + RT.esc(s.direction || s.description) + '</div></div>' +
        '<div class="scene-block"><div class="scene-block-label">Voiceover</div>' +
        '<div class="scene-block-text voiceover-text">' + RT.esc(s.voiceover) + '</div></div>';
      el.appendChild(card);
    }
  };

  // ── Render Tier Cards ──

  RT.renderTiers = function (container, selected, onSelect) {
    if (!container) return;
    container.innerHTML = '';
    RT.TIERS.forEach(function (t) {
      var card = document.createElement('div');
      card.className = 'tier-card' + (selected === t.id ? ' selected' : '');
      card.innerHTML =
        '<div class="tier-left"><div class="tier-name">' + RT.esc(t.label) + '</div>' +
        '<div class="tier-desc">' + RT.esc(t.desc) + ' · ' + t.minutes + ' min · ' + t.scenes + ' scenes</div></div>' +
        '<div class="tier-right"><div class="tier-price">' + RT.esc(t.price) + '</div>' +
        '<div class="tier-credits">' + t.credits + ' credits</div></div>';
      card.addEventListener('click', function () { if (onSelect) onSelect(t.id); });
      container.appendChild(card);
    });
  };

  // ── Render Photo Grid ──

  RT.renderPhotoGrid = function (container, photos, onRemove) {
    if (!container) return;
    container.innerHTML = '';
    for (var i = 0; i < photos.length; i++) {
      (function (idx) {
        var wrap = document.createElement('div');
        wrap.className = 'photo-thumb';
        var img = document.createElement('img');
        img.src = photos[idx];
        var btn = document.createElement('button');
        btn.className = 'photo-remove';
        btn.textContent = '×';
        btn.addEventListener('click', function (e) { e.stopPropagation(); if (onRemove) onRemove(idx); });
        wrap.appendChild(img);
        wrap.appendChild(btn);
        container.appendChild(wrap);
      })(i);
    }
    if (photos.length < 10) {
      var add = document.createElement('div');
      add.className = 'photo-thumb photo-add';
      add.innerHTML = '<span>+</span>';
      add.addEventListener('click', function () { var inp = RT.$('photo-input'); if (inp) inp.click(); });
      container.appendChild(add);
    }
  };

  // ── Render Share Buttons ──

  RT.renderShareButtons = function (container, videoUrl) {
    if (!container) return;
    container.innerHTML = '';
    var text = encodeURIComponent('Check out my AI film made with ResonaTale!');
    var url = encodeURIComponent(videoUrl || 'https://resonatale.com');

    RT.SHARE.forEach(function (p) {
      var a = document.createElement('a');
      a.className = 'share-btn';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.href = p.url.replace('{text}', text).replace('{url}', url);
      a.innerHTML = '<span class="share-icon">' + p.icon + '</span><span class="share-label">' + RT.esc(p.label) + '</span>';
      container.appendChild(a);
    });

    var copy = document.createElement('button');
    copy.className = 'share-btn';
    copy.innerHTML = '<span class="share-icon">🔗</span><span class="share-label">Copy Link</span>';
    copy.addEventListener('click', function () {
      if (navigator.clipboard && videoUrl) navigator.clipboard.writeText(videoUrl).then(function () { RT.toast('Copied!', true); });
    });
    container.appendChild(copy);
  };

  // ── Render Film Card ──

  RT.renderFilmCard = function (film) {
    var card = document.createElement('div');
    card.className = 'film-card';
    var sc = film.status === 'done' ? ' status-done' : film.status === 'failed' ? ' status-failed' : ' status-progress';
    card.innerHTML =
      '<div class="film-card-top"><div class="film-card-mood chip on">' + RT.esc(film.mood) + '</div>' +
      '<div class="film-card-status' + sc + '">' + RT.esc(film.status) + '</div></div>' +
      '<div class="film-card-brief">' + RT.esc(film.brief || film.prompt) + '</div>' +
      '<div class="film-card-meta"><span>' + (film.duration_min || film.minutes) + ' min</span>' +
      '<span>' + RT.esc(film.language) + '</span></div>';
    return card;
  };

  // ── Clock ──

  function tick() {
    var now = new Date();
    var s = now.getSeconds() + now.getMilliseconds() / 1000;
    var m = now.getMinutes() + s / 60;
    var h = (now.getHours() % 12) + m / 60;
    var $h = document.getElementById('c-h');
    var $m = document.getElementById('c-m');
    var $s = document.getElementById('c-s');
    if ($h) $h.setAttribute('transform', 'rotate(' + (h * 30) + ' 100 100)');
    if ($m) $m.setAttribute('transform', 'rotate(' + (m * 6) + ' 100 100)');
    if ($s) $s.setAttribute('transform', 'rotate(' + (s * 6) + ' 100 100)');
  }

  tick();
  setInterval(tick, 50);

})();
