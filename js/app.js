(function () {
  'use strict';

  // ── State ──
  var mood = '';
  var duration = '1';
  var tsToken = '';
  var tsWidgetId = null;
  var generating = false;

  // ── DOM ──
  var $home       = document.getElementById('s-home');
  var $create     = document.getElementById('s-create');
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

  // ── Restore language ──
  var savedLang = localStorage.getItem('rt_lang');
  if (savedLang && $langSel.querySelector('option[value="' + savedLang + '"]')) {
    $langSel.value = savedLang;
  }
  $langSel.addEventListener('change', function () {
    localStorage.setItem('rt_lang', $langSel.value);
  });

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
  RT.MOODS.forEach(function (m) {
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
    RT.DURATIONS.forEach(function (d) {
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
      sitekey: RT.TURNSTILE_KEY,
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

  // ── Generate ──
  $genBtn.addEventListener('click', function () {
    if (generating) return;
    if (!mood) { RT.toast('Select a mood.'); return; }
    if (!$brief.value.trim()) { RT.toast('Enter a story brief.'); return; }
    if ($brief.value.trim().length < 5) { RT.toast('Brief is too short.'); return; }
    if (!tsToken) { RT.toast('Complete the verification.'); return; }

    generating = true;
    RT.loading(true, 'Writing your scenes...');
    $genBtn.disabled = true;

    var payload = {
      brief: $brief.value.trim(),
      mood: mood,
      language: $langSel.value,
      durationMinutes: parseFloat(duration)
    };

    RT.generateScenes(payload,
      function (scenes) {
        generating = false;
        RT.loading(false);
        $genBtn.disabled = false;
        RT.renderScenes(scenes);
        RT.saveToJournal(mood, $langSel.value, $brief.value.trim(), duration, scenes);
        RT.toast('Scenes ready!', true);
        resetTurnstile();
      },
      function (errMsg) {
        generating = false;
        RT.loading(false);
        $genBtn.disabled = false;
        RT.toast(errMsg);
        resetTurnstile();
      }
    );
  });

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

  // ── Global errors ──
  window.addEventListener('error', function () {
    if (!generating) RT.toast('Something went wrong.');
  });
  window.addEventListener('unhandledrejection', function (e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!generating) RT.toast('Network error. Check connection.');
  });

})();
