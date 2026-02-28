(function () {
  'use strict';

  window.RT = window.RT || {};

  var toastTimer = null;
  var $toast = document.getElementById('toast');
  var $loader = document.getElementById('loader');
  var $loaderMsg = document.getElementById('loader-msg');
  var $loaderSteps = document.getElementById('loader-steps');

  // ══════════════════════════════════════
  // TOAST
  // ══════════════════════════════════════

  RT.toast = function (msg, ok) {
    if (toastTimer) clearTimeout(toastTimer);
    $toast.textContent = msg;
    $toast.className = 'toast show' + (ok ? ' ok' : '');
    toastTimer = setTimeout(function () {
      $toast.classList.remove('show');
    }, 4500);
  };

  // ══════════════════════════════════════
  // LOADER
  // ══════════════════════════════════════

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

  // ══════════════════════════════════════
  // ESCAPE HTML
  // ══════════════════════════════════════

  RT.esc = function (str) {
    if (!str) return '';
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  };

  // ══════════════════════════════════════
  // SCREEN NAVIGATION
  // ══════════════════════════════════════

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

  // ══════════════════════════════════════
  // LIVE CLOCK
  // ══════════════════════════════════════

  function tickClock() {
    var now = new Date();
    var h = now.getHours() % 12;
    var m = now.getMinutes();
    var s = now.getSeconds();
    var ms = now.getMilliseconds();

    var secAngle = (s * 6) + (ms * 0.006);
    var minAngle = (m * 6) + (s * 0.1);
    var hourAngle = (h * 30) + (m * 0.5);

    var $h = document.getElementById('c-h');
    var $m = document.getElementById('c-m');
    var $s = document.getElementById('c-s');

    if ($h) $h.setAttribute('transform', 'rotate(' + hourAngle + ' 100 100)');
    if ($m) $m.setAttribute('transform', 'rotate(' + minAngle + ' 100 100)');
    if ($s) $s.setAttribute('transform', 'rotate(' + secAngle + ' 100 100)');
  }

  tickClock();
  setInterval(tickClock, 50);

  // ══════════════════════════════════════
  // FORMAT CREDITS
  // ══════════════════════════════════════

  RT.formatCredits = function (n) {
    if (n === undefined || n === null) return '0';
    return String(n);
  };

  // ══════════════════════════════════════
  // UPDATE CREDIT DISPLAYS
  // ══════════════════════════════════════

  RT.updateCredits = function (amount) {
    RT.credits = amount;
    var els = document.querySelectorAll('.js-credits');
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = RT.formatCredits(amount);
    }
  };

  // ══════════════════════════════════════
  // RENDER TIER CARDS
  // ══════════════════════════════════════

  RT.renderTiers = function (container, selected, onSelect) {
    if (!container) return;
    container.innerHTML = '';

    RT.TIERS.forEach(function (tier) {
      var card = document.createElement('div');
      card.className = 'tier-card' + (selected === tier.id ? ' selected' : '');

      card.innerHTML =
        '<div class="tier-left">' +
          '<div class="tier-name">' + RT.esc(tier.label) + '</div>' +
          '<div class="tier-desc">' + RT.esc(tier.desc) + ' · ' + tier.minutes + ' min · ' + tier.scenes + ' scenes</div>' +
        '</div>' +
        '<div class="tier-right">' +
          '<div class="tier-price">' + RT.esc(tier.price) + '</div>' +
          '<div class="tier-credits">' + tier.credits + ' credits</div>' +
        '</div>';

      card.addEventListener('click', function () {
        if (onSelect) onSelect(tier.id);
      });

      container.appendChild(card);
    });
  };

  // ══════════════════════════════════════
  // RENDER SHARE BUTTONS
  // ══════════════════════════════════════

  RT.renderShareButtons = function (container, videoUrl) {
    if (!container) return;
    container.innerHTML = '';

    var shareText = encodeURIComponent('Check out my AI film made with ResonaTale!');
    var shareUrl = encodeURIComponent(videoUrl || 'https://resonatale.com');

    RT.SHARE.forEach(function (platform) {
      var btn = document.createElement('a');
      btn.className = 'share-btn';
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
      btn.title = platform.label;

      var url = platform.url
        .replace('{text}', shareText)
        .replace('{url}', shareUrl);
      btn.href = url;

      btn.innerHTML =
        '<span class="share-icon">' + platform.icon + '</span>' +
        '<span class="share-label">' + RT.esc(platform.label) + '</span>';

      container.appendChild(btn);
    });

    // Copy link button
    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'share-btn share-copy';
    copyBtn.innerHTML = '<span class="share-icon">🔗</span><span class="share-label">Copy Link</span>';
    copyBtn.addEventListener('click', function () {
      if (navigator.clipboard && videoUrl) {
        navigator.clipboard.writeText(videoUrl).then(function () {
          RT.toast('Link copied!', true);
        });
      } else {
        RT.toast('Cannot copy link');
      }
    });
    container.appendChild(copyBtn);

    // Download button
    if (videoUrl) {
      var dlBtn = document.createElement('a');
      dlBtn.className = 'share-btn share-download';
      dlBtn.href = videoUrl;
      dlBtn.download = 'resonatale-film.mp4';
      dlBtn.innerHTML = '<span class="share-icon">⬇</span><span class="share-label">Download</span>';
      container.appendChild(dlBtn);
    }
  };

  // ══════════════════════════════════════
  // RENDER FILM CARD (for dashboard)
  // ══════════════════════════════════════

  RT.renderFilmCard = function (film) {
    var card = document.createElement('div');
    card.className = 'film-card';

    var statusClass = '';
    if (film.status === 'done') statusClass = ' status-done';
    else if (film.status === 'failed') statusClass = ' status-failed';
    else statusClass = ' status-progress';

    card.innerHTML =
      '<div class="film-card-top">' +
        '<div class="film-card-mood chip on" data-v="' + RT.esc(film.mood) + '">' + RT.esc(film.mood) + '</div>' +
        '<div class="film-card-status' + statusClass + '">' + RT.esc(film.status) + '</div>' +
      '</div>' +
      '<div class="film-card-brief">' + RT.esc(film.brief || film.prompt) + '</div>' +
      '<div class="film-card-meta">' +
        '<span>' + (film.duration_min || film.minutes) + ' min</span>' +
        '<span>' + RT.esc(film.language) + '</span>' +
        '<span>' + RT.esc(film.created_at ? film.created_at.split('T')[0] : '') + '</span>' +
      '</div>';

    return card;
  };

  // ══════════════════════════════════════
  // RENDER SCENE CARDS
  // ══════════════════════════════════════

  RT.renderScenes = function (scenes, container) {
    var $el = container || document.getElementById('preview-scenes');
    if (!$el) return;
    $el.innerHTML = '';

    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i];
      var card = document.createElement('div');
      card.className = 'scene-card';

      card.innerHTML =
        '<div class="scene-num">Scene ' + (i + 1) + ' of ' + scenes.length + '</div>' +
        '<div class="scene-title">' + RT.esc(s.title) + '</div>' +
        '<div class="scene-block">' +
          '<div class="scene-block-label">Direction</div>' +
          '<div class="scene-block-text">' + RT.esc(s.direction || s.description) + '</div>' +
        '</div>' +
        '<div class="scene-block">' +
          '<div class="scene-block-label">Voiceover</div>' +
          '<div class="scene-block-text voiceover-text">' + RT.esc(s.voiceover) + '</div>' +
        '</div>';

      $el.appendChild(card);
    }
  };

  // ══════════════════════════════════════
  // RENDER PHOTO GRID
  // ══════════════════════════════════════

  RT.renderPhotoGrid = function (container, photos, onRemove) {
    if (!container) return;
    container.innerHTML = '';

    for (var i = 0; i < photos.length; i++) {
      (function (index) {
        var wrap = document.createElement('div');
        wrap.className = 'photo-thumb';

        var img = document.createElement('img');
        img.src = photos[index];
        img.alt = 'Photo ' + (index + 1);

        var removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'photo-remove';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (onRemove) onRemove(index);
        });

        wrap.appendChild(img);
        wrap.appendChild(removeBtn);
        container.appendChild(wrap);
      })(i);
    }

    // Add button if under limit
    if (photos.length < 10) {
      var addBtn = document.createElement('div');
      addBtn.className = 'photo-thumb photo-add';
      addBtn.innerHTML = '<span>+</span>';
      addBtn.addEventListener('click', function () {
        var input = document.getElementById('photo-input');
        if (input) input.click();
      });
      container.appendChild(addBtn);
    }
  };

})();
