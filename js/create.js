(function () {
  'use strict';

  // ── Language Dropdown ──

  var langSel = RT.$('lang-sel');
  if (langSel) {
    RT.LANGUAGES.forEach(function (l) {
      var opt = document.createElement('option');
      opt.value = l.code;
      opt.textContent = l.flag + ' ' + l.name;
      if (l.code === RT.language) opt.selected = true;
      langSel.appendChild(opt);
    });
    langSel.addEventListener('change', function () { RT.setLanguage(langSel.value); });
  }

  // ── Mood Chips ──

  var chips = RT.$('mood-chips');
  if (chips) {
    RT.MOODS.forEach(function (m) {
      var btn = document.createElement('button');
      btn.className = 'chip';
      btn.type = 'button';
      btn.setAttribute('data-v', m);
      btn.textContent = m.charAt(0).toUpperCase() + m.slice(1);
      btn.addEventListener('click', function () {
        RT.mood = m;
        var all = chips.querySelectorAll('.chip');
        for (var i = 0; i < all.length; i++) all[i].classList.toggle('on', all[i].getAttribute('data-v') === m);
      });
      chips.appendChild(btn);
    });
  }

  // ── Tier Cards ──

  var tierContainer = RT.$('tier-cards');

  RT.refreshTiers = function () {
    RT.renderTiers(tierContainer, RT.tier, function (id) {
      RT.tier = id;
      RT.refreshTiers();
    });
  };

  if (tierContainer) RT.refreshTiers();

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
          var t = RT.TIERS.find(function (x) { return x.id === RT.tier; });
          if (t) info.textContent = t.label + ' · ' + t.minutes + ' min · ' + t.scenes + ' scenes · ' + t.price;
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

  // ── Reset Create Form ──

  RT.resetForm = function () {
    RT.mood = '';
    RT.tier = 'short';
    RT.currentScenes = null;
    RT.currentFilmId = null;
    if (RT.$('brief')) RT.$('brief').value = '';
    if (chips) {
      var all = chips.querySelectorAll('.chip');
      for (var i = 0; i < all.length; i++) all[i].classList.remove('on');
    }
    RT.refreshTiers();
    RT.resetTurnstile();
  };

})();
