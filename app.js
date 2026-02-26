(function () {
  'use strict';

  // ── Config ──
  var TURNSTILE_KEY = '0x4AAAAAACLI9vyJZYGLg9lS';
  var API = '/api/story';
  var MOODS = ['calm', 'cozy', 'adventure', 'romantic', 'suspense', 'motivational', 'heartwarming'];
  var DURATIONS = [
    { value: '0.5', label: '30 sec' },
    { value: '1', label: '60 sec' },
    { value: '1.5', label: '90 sec' }
  ];

  // ── State ──
  var mood = '';
  var duration = '1';
  var tsToken = '';
  var tsWidgetId = null;
  var toastTimer = null;
  var generating = false;

  // ── DOM ──
  var $home       = document.getElementById('s-home');
  var $create     = document.getElementById('s-create');
  var $loader     = document.getElementById('loader');
  var $loaderMsg  = document.getElementById('loader-msg');
  var $toastEl    = document.getElementById('toast');
  var $moodChips  = document.getElementById('mood-chips');
  var $langSel    = document.getElementById('lang-sel');
  var $brief      = document.getElementById('brief');
  var $durRow     = document.getElementById('dur-row');
  var $genBtn     = document.getElementById('gen-btn');
  var $results    = document.getElementById('results');
  var $scenesList = document.getElementById('scenes-list');
  var $newBtn     = document.getElementById('new-btn');
  var $goCreate   = document.getElementById('go-create');
  var $logo       = document.getElementById('logo');

  // ── Restore saved language ──
  var savedLang = localStorage.getItem('rt_lang');
  if (savedLang && $langSel.querySelector('option[value="' + savedLang + '"]')) {
    $langSel.value = savedLang;
  }
  $langSel.addEventListener('change', function () {
    localStorage.setItem('rt_lang', $langSel.value);
  });

  // ── Live Clock ──
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

  // ── Navigation ──
  function showHome() {
    $home.classList.remove('hide');
    $create.classList.add('hide');
  }

  function showCreate() {
    $home.classList.add('hide');
    $create.classList.remove('hide');
    $results.classList.remove('show');
    mountTurnstile();
  }

  $goCreate.addEventListener('click', showCreate);
  $logo.addEventListener('click', showHome);

  // ── Mood Chips ──
  MOODS.forEach(function (m) {
    var btn = document.createElement('button');
    btn.className = 'chip';
    btn.type = 'button';
    btn.setAttribute('data-v', m);
    btn.textContent = m.charAt(0).toUpperCase() + m.slice(1);
    btn.addEventListener('click', function () {
      mood = m;
      var all = $moodChips.querySelectorAll('.chip');
      for (var i = 0; i < all.length; i++) {
        all[i].classList.toggle('on', all[i].getAttribute('data-v') === m);
      }
    });
    $moodChips.appendChild(btn);
  });

  // ── Duration Toggle ──
  function renderDuration() {
    $durRow.innerHTML = '';
    DURATIONS.forEach(function (d) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dur-opt' + (duration === d.value ? ' on' : '');
      btn.textContent = d.label;
      btn.addEventListener('click', function () {
        duration = d.value;
        renderDuration();
      });
      $durRow.appendChild(btn);
    });
  }
  renderDuration();

  // ── Turnstile ──
  function mountTurnstile() {
    var target = document.getElementById('ts-target');
    if (!target) return;
    if (!window.turnstile) { setTimeout(mountTurnstile, 300); return; }
    if (tsWidgetId !== null) {
      try { window.turnstile.remove(tsWidgetId); } catch (e) {}
    }
    tsToken = '';
    tsWidgetId = window.turnstile.render(target, {
      sitekey: TURNSTILE_KEY,
      theme: 'dark',
      size: 'normal',
      callback: function (token) { tsToken = token; },
      'expired-callback': function () { tsToken = ''; },
      'error-callback': function () { tsToken = ''; }
    });
  }

  function resetTurnstile() {
    if (tsWidgetId !== null && window.turnstile) {
      try { window.turnstile.reset(tsWidgetId); } catch (e) {}
    }
    tsToken = '';
  }

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

  // ── Generate ──
  $genBtn.addEventListener('click', function () {
    if (generating) return;
    if (!mood) { toast('Select a mood.'); return; }
    if (!$brief.value.trim()) { toast('Enter a story brief.'); return; }
    if ($brief.value.trim().length < 5) { toast('Brief is too short.'); return; }
    if (!tsToken) { toast('Complete the verification.'); return; }

    generating = true;
    loading(true, 'Crafting your scenes...');
    $genBtn.disabled = true;

    var payload = {
      brief: $brief.value.trim(),
      mood: mood,
      language: $langSel.value,
      durationMinutes: parseFloat(duration)
    };

    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function (r) {
      if (!r.ok) {
        return r.text().then(function (txt) {
          var errMsg = 'Generation failed (HTTP ' + r.status + ')';
          try {
            var p = JSON.parse(txt);
            errMsg = p.detail || p.error || errMsg;
          } catch (e) {
            if (txt && txt.length < 300) errMsg = txt;
          }
          throw new Error(errMsg);
        });
      }
      return r.json();
    })
    .then(function (data) {
      generating = false;
      loading(false);
      $genBtn.disabled = false;

      if (!data.scenes || !data.scenes.length) {
        toast('No scenes returned. Try again.');
        resetTurnstile();
        return;
      }

      renderScenes(data.scenes);
      toast('Scenes ready!', true);
      resetTurnstile();
    })
    .catch(function (err) {
      generating = false;
      loading(false);
      $genBtn.disabled = false;
      toast(err.message || 'Something went wrong.');
      resetTurnstile();
    });
  });

  // ── Render Scenes ──
  function renderScenes(scenes) {
    $scenesList.innerHTML = '';
    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i];
      var card = document.createElement('div');
      card.className = 'scene-card';
      card.innerHTML =
        '<div class="scene-num">Scene ' + (i + 1) + '</div>' +
        '<div class="scene-title">' + esc(s.title || 'Untitled') + '</div>' +
        '<div class="scene-block">' +
          '<div class="scene-block-label">Visual</div>' +
          '<div class="scene-block-text">' + esc(s.description || '') + '</div>' +
        '</div>' +
        '<div class="scene-block">' +
          '<div class="scene-block-label">Voiceover</div>' +
          '<div class="scene-block-text voiceover-text">' + esc(s.voiceover || '') + '</div>' +
        '</div>';
      $scenesList.appendChild(card);
    }
    $results.classList.add('show');

    try {
      var journal = JSON.parse(localStorage.getItem('rt_journal') || '[]');
      journal.unshift({
        id: Date.now().toString(36),
        mood: mood,
        language: $langSel.value,
        brief: $brief.value.trim(),
        duration: duration,
        scenes: scenes,
        createdAt: new Date().toISOString()
      });
      if (journal.length > 50) journal = journal.slice(0, 50);
      localStorage.setItem('rt_journal', JSON.stringify(journal));
    } catch (e) {}

    $results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function esc(str) {
    if (!str) return '';
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ── New Story ──
  $newBtn.addEventListener('click', function () {
    $results.classList.remove('show');
    $scenesList.innerHTML = '';
    $brief.value = '';
    mood = '';
    var all = $moodChips.querySelectorAll('.chip');
    for (var i = 0; i < all.length; i++) all[i].classList.remove('on');
    resetTurnstile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ── Global error handling ──
  window.addEventListener('error', function () {
    if (!generating) toast('Something went wrong.');
  });
  window.addEventListener('unhandledrejection', function (e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!generating) toast('Network error. Check connection.');
  });

})();
