(function () {
  'use strict';

  // ── Language Dropdown ──

  var langSel = RT.$('lang-sel');
  if (langSel) {
    RT.LANGUAGES.forEach(function (l) {
      var opt = document.createElement('option');
      opt.value = l.code;
      opt.textContent = l.name + ' ' + l.flag;
      if (l.code === RT.language) opt.selected = true;
      langSel.appendChild(opt);
    });
    langSel.addEventListener('change', function () { RT.setLanguage(langSel.value); });
  }

  // ── Mood Chips ──

  var moodChips = RT.$('mood-chips');
  if (moodChips) {
    var icons = { calm: '🌅', cozy: '☕', adventure: '🔥', romantic: '❤️', suspense: '🌙', motivational: '💪', heartwarming: '💛', dramatic: '🎭' };
    RT.MOODS.forEach(function (m) {
      var btn = document.createElement('button');
      btn.className = 'chip';
      btn.type = 'button';
      btn.setAttribute('data-v', m);
      btn.textContent = (icons[m] || '') + ' ' + m.charAt(0).toUpperCase() + m.slice(1);
      btn.addEventListener('click', function () {
        RT.mood = m;
        var all = moodChips.querySelectorAll('.chip');
        for (var i = 0; i < all.length; i++) all[i].classList.toggle('on', all[i].getAttribute('data-v') === m);
      });
      moodChips.appendChild(btn);
    });
  }

  // ── Duration Slider ──

  var durSlider = RT.$('dur-slider');
  var durLabel = RT.$('dur-label');
  var durCost = RT.$('dur-cost');

  // Slider stops: maps slider value (0-4) to tier
  var stops = [
    { value: 0, id: 'trailer',  label: '24 seconds', scenes: 3,   credits: 5,   price: '$5' },
    { value: 1, id: 'short',    label: '1 minute',   scenes: 8,   credits: 12,  price: '$12' },
    { value: 2, id: 'standard', label: '3 minutes',  scenes: 18,  credits: 30,  price: '$30' },
    { value: 3, id: 'feature',  label: '5 minutes',  scenes: 35,  credits: 50,  price: '$50' },
    { value: 4, id: 'epic',     label: '10 minutes',  scenes: 60,  credits: 90,  price: '$90' },
    { value: 5, id: 'cinema',   label: '20 minutes',  scenes: 150, credits: 199, price: '$199' }
  ];

  function updateDuration() {
    if (!durSlider) return;
    var idx = parseInt(durSlider.value);
    var stop = stops[idx];
    RT.tier = stop.id;
    if (durLabel) durLabel.textContent = stop.label;
    if (durCost) durCost.textContent = stop.credits + ' credits · ' + stop.price;
  }

  if (durSlider) {
    durSlider.addEventListener('input', updateDuration);
    // Set default
    durSlider.value = 0;
    updateDuration();
  }

  // ── Turnstile ──

  RT.mountTurnstile = function () {
    var target = RT.$('ts-target');
    if (!target) return;
    if (!window.turnstile) { setTimeout(RT.mountTurnstile, 300); return; }
    if (RT.tsWidgetId !== null) try { window.turnstile.remove(RT.tsWidgetId); } catch (e) {}
    RT.tsToken = '';
    RT.tsWidgetId = window.turnstile.render(target, {
      sitekey: RT.TURNSTILE_KEY,
      theme: 'dark',
      size: 'normal',
      callback: function (tk) { RT.tsToken = tk; },
      'expired-callback': function () { RT.tsToken = ''; },
      'error-callback': function () { RT.tsToken = ''; }
    });
  };

  RT.resetTurnstile = function () {
    if (RT.tsWidgetId !== null && window.turnstile) {
      try { window.turnstile.reset(RT.tsWidgetId); } catch (e) {}
    }
    RT.tsToken = '';
  };

  // ── Render Scenes ──

  RT.renderScenes = function (scenes) {
    var container = RT.$('preview-scenes');
    if (!container) return;
    container.innerHTML = '';
    scenes.forEach(function (s, i) {
      var div = document.createElement('div');
      div.className = 'scene-card';
      div.innerHTML =
        '<div class="scene-num">Scene ' + (i + 1) + '</div>' +
        '<h3 class="scene-title">' + (s.title || '') + '</h3>' +
        '<p class="scene-direction">' + (s.direction || '') + '</p>' +
        '<p class="scene-voiceover">"' + (s.voiceover || '') + '"</p>';
      container.appendChild(div);
    });
  };

  // ── Generate Preview ──

  var genBtn = RT.$('btn-generate');
  if (genBtn) {
    genBtn.addEventListener('click', function () {
      if (RT.generating) return;

      var brief = RT.$('brief') ? RT.$('brief').value.trim() : '';
      if (!RT.mood) { RT.toast('Select a mood.'); return; }
      if (!brief || brief.length < 10) { RT.toast('Describe your story in more detail.'); return; }
      if (!RT.tsToken) { RT.toast('Complete the verification.'); return; }

      RT.generating = true;
      RT.loading(true, 'Writing your screenplay...');

      RT.generatePreview(brief, RT.mood, RT.language, RT.tier).then(function (data) {
        RT.generating = false;
        RT.loading(false);

        if (!data.scenes || !data.scenes.length) {
          RT.toast('No scenes returned. Try again.');
          RT.resetTurnstile();
          return;
        }

        RT.currentScenes = data.scenes;
        RT.renderScenes(data.scenes);

        var info = RT.$('preview-tier-info');
        if (info) {
          var stop = stops.find(function (s) { return s.id === RT.tier; });
          if (stop) info.textContent = stop.label + ' · ' + stop.scenes + ' scenes · ' + stop.price;
        }

        RT.showScreen('preview');
        RT.toast('Script ready!', true);
        RT.resetTurnstile();

      }).catch(function (err) {
        RT.generating = false;
        RT.loading(false);
        RT.toast(err.message || 'Generation failed.');
        RT.resetTurnstile();
      });
    });
  }

  // ── Reset Form ──

  RT.resetForm = function () {
    RT.mood = '';
    RT.tier = 'trailer';
    RT.currentScenes = null;
    RT.currentFilmId = null;
    if (RT.$('brief')) RT.$('brief').value = '';
    if (moodChips) {
      var all = moodChips.querySelectorAll('.chip');
      for (var i = 0; i < all.length; i++) all[i].classList.remove('on');
    }
    if (durSlider) { durSlider.value = 0; updateDuration(); }
    RT.resetTurnstile();
  };

})();