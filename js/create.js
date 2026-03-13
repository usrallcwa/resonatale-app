(function () {
  'use strict';

  // ── Language Dropdown ──

  var langSel = RT.$('lang-sel');
  if (langSel) {
    RT.LANGUAGES.forEach(function (l) {
      var opt = document.createElement('option');
      opt.value = l.code;
      opt.textContent = l.flag + '  ' + l.name;
      if (l.code === RT.language) opt.selected = true;
      langSel.appendChild(opt);
    });
    langSel.addEventListener('change', function () {
      RT.setLanguage(langSel.value);
      var sel = RT.LANGUAGES.find(function (l) { return l.code === langSel.value; });
      var flagEl = RT.$('lang-flag');
      if (flagEl && sel) flagEl.textContent = sel.flag;
      if (RT.applyLanguage) RT.applyLanguage();
    });
  }

  // ── Mood Chips ──

  var moodChips = RT.$('mood-chips');
  if (moodChips) {
    var moodIcons = { calm: '🌅', cozy: '☕', adventure: '🔥', romantic: '❤️', suspense: '🌙', motivational: '💪', heartwarming: '💛', dramatic: '🎭', thriller: '🔪', action: '💥', spiritual: '🕊', comedy: '😂', horror: '👻', mystery: '🔍', inspirational: '⭐' };
    RT.MOODS.forEach(function (m) {
      var btn = document.createElement('button');
      btn.className = 'chip';
      btn.type = 'button';
      btn.setAttribute('data-v', m);
      btn.textContent = (moodIcons[m] || '') + ' ' + m.charAt(0).toUpperCase() + m.slice(1);
      btn.addEventListener('click', function () {
        RT.mood = m;
        var all = moodChips.querySelectorAll('.chip');
        for (var i = 0; i < all.length; i++) all[i].classList.toggle('on', all[i].getAttribute('data-v') === m);
      });
      moodChips.appendChild(btn);
    });
  }
// ── Duration Slider ──

  var durationSlider = RT.$('duration-slider');
  var durationLabel = RT.$('duration-label');
  var durationPrice = RT.$('duration-price');
  var durationScenes = RT.$('duration-scenes');

  function updateDuration() {
    if (!durationSlider) return;
    var idx = parseInt(durationSlider.value);
    var tier = RT.TIERS[idx] || RT.TIERS[0];
    RT.tier = tier.id;

    if (durationLabel) durationLabel.textContent = tier.desc;
    if (durationPrice) durationPrice.textContent = tier.price;
    if (durationScenes) durationScenes.textContent = tier.scenes + ' scenes';
  }

  if (durationSlider) {
    durationSlider.addEventListener('input', updateDuration);
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
      if (!RT.mood) { RT.toast('Select a mood.'); return; }
      if (!RT.tsToken) { RT.toast('Complete the verification.'); return; }

      // Photo mode
      if (RT.createMode === 'photo') {
        if (!RT.photos || RT.photos.length < 3) { RT.toast('Upload at least 3 photos.'); return; }

        RT.generating = true;
        RT.loading(true, 'Uploading photos...');

        RT.uploadPhotos().then(function (keys) {
          RT.loading(true, 'Writing your screenplay...');
          var hint = RT.$('narration-hint') ? RT.$('narration-hint').value.trim() : '';
          var brief = 'Photo story with ' + keys.length + ' photos. ' + (hint || 'AI decides the narration.');
          return RT.generatePreview(brief, RT.mood, RT.language, RT.tier);
        }).then(function (data) {
          RT.generating = false;
          RT.loading(false);

          if (!data.scenes || !data.scenes.length) {
            RT.toast('No scenes returned. Try again.');
            RT.resetTurnstile();
            return;
          }

          RT.currentScenes = data.scenes;
          RT.currentBrief = 'Photo story with ' + RT.photoKeys.length + ' photos.';
          localStorage.setItem('rt_preview', JSON.stringify({ scenes: data.scenes, tier: RT.tier, mood: RT.mood, mode: RT.createMode }));
          RT.renderScenes(data.scenes);

          var info = RT.$('preview-tier-info');
          if (info) {
            var t = RT.TIERS.find(function (x) { return x.id === RT.tier; });
            if (t) info.textContent = t.label + ' · ' + t.desc + ' · ' + t.scenes + ' scenes · ' + t.price;
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
        return;
      }

      // Text mode
      var brief = RT.$('brief') ? RT.$('brief').value.trim() : '';
      if (!brief || brief.length < 10) { RT.toast('Describe your story in more detail.'); return; }

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
        RT.currentBrief = brief;
        localStorage.setItem('rt_preview', JSON.stringify({ scenes: data.scenes, tier: RT.tier, mood: RT.mood, mode: RT.createMode }));
        RT.renderScenes(data.scenes);

        var info = RT.$('preview-tier-info');
        if (info) {
          var t = RT.TIERS.find(function (x) { return x.id === RT.tier; });
          if (t) info.textContent = t.label + ' · ' + t.desc + ' · ' + t.scenes + ' scenes · ' + t.price;
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
    if (durationSlider) { durationSlider.value = 0; updateDuration(); }
    if (moodChips) {
      var all = moodChips.querySelectorAll('.chip');
      for (var i = 0; i < all.length; i++) all[i].classList.remove('on');
    }
    RT.resetTurnstile();
  };

})();