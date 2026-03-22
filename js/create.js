(function () {
  'use strict';

  // ── Language Dropdown ──

  var langSel = RT.$('lang-sel');
  if (langSel) {
    RT.LANGUAGES.forEach(function (l) {
      var opt       = document.createElement('option');
      opt.value     = l.code;
      opt.textContent = l.flag + '  ' + l.name;
      if (l.code === RT.language) opt.selected = true;
      langSel.appendChild(opt);
    });
    langSel.addEventListener('change', function () {
      RT.setLanguage(langSel.value);
      var sel   = RT.LANGUAGES.find(function (l) { return l.code === langSel.value; });
      var flagEl = RT.$('lang-flag');
      if (flagEl && sel) flagEl.textContent = sel.flag;
    });
  }

  // ── Mood Dropdown ──

  RT.mood = RT.mood || 'dramatic';
  var moodSelect = RT.$('mood-select');
  if (moodSelect) {
    moodSelect.addEventListener('change', function () { RT.mood = moodSelect.value; });
  }

  // ── Mood Chips ──

  var moodChips = RT.$('mood-chips');
  if (moodChips) {
    moodChips.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      RT.mood = chip.getAttribute('data-v') || RT.mood;
      moodChips.querySelectorAll('.chip').forEach(function (c) {
        c.classList.toggle('on', c === chip);
      });
    });
  }

  // ── Style Dropdown ──

  RT.style = RT.style || 'cinematic';
  var styleSelect = RT.$('style-select');
  if (styleSelect) {
    styleSelect.addEventListener('change', function () { RT.style = styleSelect.value; });
  }

  // ── Voice Chips ──

  RT.selectedVoice = RT.selectedVoice || 'clone';
  var voiceChips = RT.$('voice-chips');
  if (voiceChips && RT.VOICES) {
    RT.VOICES.forEach(function (v) {
      var btn       = document.createElement('button');
      btn.className = 'chip' + (v.id === 'clone' ? ' on' : '');
      btn.type      = 'button';
      btn.setAttribute('data-v', v.id);
      btn.textContent = v.icon + ' ' + v.name;
      btn.title       = v.desc || '';
      voiceChips.appendChild(btn);
    });
    voiceChips.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      RT.selectedVoice = chip.getAttribute('data-v') || RT.selectedVoice;
      voiceChips.querySelectorAll('.chip').forEach(function (c) {
        c.classList.toggle('on', c === chip);
      });
    });
  }

  // ── Duration Slider ──

  var durationSlider = RT.$('duration-slider');
  var durationLabel  = RT.$('duration-label');
  var durationPrice  = RT.$('duration-price');
  var durationScenes = RT.$('duration-scenes');

  function updateDuration() {
    if (!durationSlider) return;
    var idx  = parseInt(durationSlider.value) || 0;
    var tier = RT.TIERS[idx] || RT.TIERS[0];
    RT.tier  = tier.id;
    if (durationLabel)  durationLabel.textContent  = tier.desc;
    if (durationPrice)  durationPrice.textContent  = tier.price;
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
    if (RT.tsWidgetId !== null && RT.tsWidgetId !== undefined) {
      try { window.turnstile.remove(RT.tsWidgetId); } catch (e) {}
    }
    RT.tsToken    = '';
    RT.tsWidgetId = window.turnstile.render(target, {
      sitekey:           RT.TURNSTILE_KEY,
      theme:             'dark',
      size:              'normal',
      callback:          function (tk) { RT.tsToken = tk; },
      'expired-callback': function ()  { RT.tsToken = ''; },
      'error-callback':   function ()  { RT.tsToken = ''; },
    });
  };

  RT.resetTurnstile = function () {
    if (RT.tsWidgetId !== null && RT.tsWidgetId !== undefined && window.turnstile) {
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
      var div       = document.createElement('div');
      div.className = 'scene-card scene-editable';
      div.innerHTML =
        '<div class="scene-num">Scene ' + (i + 1) + '</div>' +
        '<input type="text" class="scene-title-input" data-scene="' + i + '" data-field="title"' +
          ' value="' + (s.title || '').replace(/"/g, '&quot;').replace(/</g, '&lt;') + '">' +
        '<label class="scene-label">Visual Direction</label>' +
        '<textarea class="scene-direction-input" data-scene="' + i + '" data-field="direction" rows="3">' +
          RT._esc(s.direction || '') + '</textarea>' +
        '<label class="scene-label">Voiceover</label>' +
        '<textarea class="scene-voiceover-input" data-scene="' + i + '" data-field="voiceover" rows="2">' +
          RT._esc(s.voiceover || '') + '</textarea>';

      // Live-sync edits into RT.currentScenes
      div.querySelectorAll('input[data-field], textarea[data-field]').forEach(function (el) {
        el.addEventListener('input', function () {
          var sceneIdx = parseInt(el.getAttribute('data-scene'));
          var field    = el.getAttribute('data-field');
          if (RT.currentScenes && RT.currentScenes[sceneIdx]) {
            RT.currentScenes[sceneIdx][field] = el.value;
          }
        });
      });

      container.appendChild(div);
    });
  };

  // Simple escape helper used by renderScenes
  RT._esc = function (str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  // ── Save Preview to localStorage ──

  function savePreview(scenes) {
    try {
      localStorage.setItem('rt_preview', JSON.stringify({
        scenes: scenes,
        tier:   RT.tier,
        mood:   RT.mood,
        brief:  RT.currentBrief || '',
      }));
    } catch (e) {}
  }

  // ── Update tier info label ──

  function updateTierInfo() {
    var info = RT.$('preview-tier-info');
    if (!info) return;
    var t = RT.TIERS.find(function (x) { return x.id === RT.tier; });
    if (t) info.textContent = t.label + ' · ' + t.desc + ' · ' + t.scenes + ' scenes · ' + t.price;
  }

  // ── Handle preview success ──

  function onPreviewSuccess(data, brief) {
    RT.generating = false;
    RT.loading(false);

    if (!data.scenes || !data.scenes.length) {
      RT.toast('No scenes returned. Please try again.');
      RT.resetTurnstile();
      return;
    }

    RT.currentScenes = data.scenes;
    RT.currentBrief  = brief;
    savePreview(data.scenes);
    RT.renderScenes(data.scenes);
    updateTierInfo();
    RT.showScreen('preview');
    RT.toast('Script ready!', true);
    RT.resetTurnstile();
  }

  // ── Handle preview error ──

  function onPreviewError(err) {
    RT.generating = false;
    RT.loading(false);
    RT.toast(err.message || 'Generation failed. Please try again.');
    RT.resetTurnstile();
  }

  // ── Generate Preview ──

  var genBtn = RT.$('btn-generate');
  if (genBtn) {
    genBtn.addEventListener('click', function () {
      if (RT.generating)  return;
      if (!RT.mood)       { RT.toast('Select a mood.'); return; }
      if (!RT.tsToken)    { RT.toast('Complete the security verification.'); return; }

      var brief = RT.$('brief') ? RT.$('brief').value.trim() : '';
      if (!brief || brief.length < 10) { RT.toast('Describe your story in more detail.'); return; }

      RT.generating = true;
      RT.loading(true, 'Writing your screenplay...');

      RT.generatePreview(brief, RT.mood, RT.language, RT.tier)
        .then(function (data) { onPreviewSuccess(data, brief); })
        .catch(onPreviewError);
    });
  }

  // ── Reset Form ──

  RT.resetForm = function () {
    RT.mood          = '';
    RT.tier          = RT.TIERS[0] ? RT.TIERS[0].id : 'shorts';
    RT.currentScenes = null;
    RT.currentFilmId = null;
    RT.currentBrief  = '';

    var briefEl = RT.$('brief');
    if (briefEl) briefEl.value = '';

    if (durationSlider) { durationSlider.value = 0; updateDuration(); }

    if (moodChips) {
      moodChips.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('on'); });
    }

    try { localStorage.removeItem('rt_preview'); } catch (e) {}
    RT.resetTurnstile();
  };

})();
