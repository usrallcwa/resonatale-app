(function () {
  'use strict';

  // ── Free Preview Clip ──

  var clipBtn = RT.$('btn-preview-clip');
  if (clipBtn) {
    clipBtn.addEventListener('click', function () {
      if (!RT.isLoggedIn()) { RT.showScreen('auth'); RT.showAuthForm('signup'); return; }
      if (RT.hasUsedPreview) { RT.toast('Free preview already used. Add credits.'); return; }
      if (!RT.currentScenes || !RT.currentScenes.length) { RT.toast('Generate a script first.'); return; }
      if (!RT.hasPhotos) { RT.toast('Upload photos first.'); RT.showScreen('setup'); return; }

      var scene = RT.currentScenes[0];
      RT.loading(true, 'Creating your 10-second preview...');

      RT.generatePreviewClip(scene.direction || scene.description, scene.voiceover).then(function (data) {
        RT.loading(false);
        RT.hasUsedPreview = true;
        RT.toast('Preview clip ready!', true);
        var v = RT.$('preview-video');
        if (v && data.clipUrl) {
          v.src = data.clipUrl;
          v.style.display = 'block';
          v.play().catch(function () {});
        }
      }).catch(function (err) {
        RT.loading(false);
        RT.toast(err.message || 'Preview failed.');
      });
    });
  }

  // ── Create Full Film ──

  var filmBtn = RT.$('btn-get-film');
  if (filmBtn) {
    filmBtn.addEventListener('click', function () {
      if (!RT.isLoggedIn()) { RT.showScreen('auth'); RT.showAuthForm('signup'); return; }
      var t = RT.TIERS.find(function (x) { return x.id === RT.tier; });
      if (!t) return;

      if (RT.credits >= t.credits) {
        startFilm();
      } else {
        RT.showScreen('credits');
        RT.renderCredits();
        RT.toast('You need ' + t.credits + ' credits.');
      }
    });
  }

  // ── Edit Story ──

  var retryBtn = RT.$('btn-retry');
  if (retryBtn) {
    retryBtn.addEventListener('click', function () {
      RT.showScreen('create');
      RT.mountTurnstile();
    });
  }

  // ── Start Film Pipeline ──

  function startFilm() {
    var brief = RT.$('brief') ? RT.$('brief').value.trim() : '';
    if (!brief || !RT.mood) { RT.toast('Missing story details.'); return; }

    RT.loading(true, 'Starting your film...');

    RT.createFilm(brief, RT.mood, RT.language, RT.tier).then(function (data) {
      RT.loading(false);
      RT.currentFilmId = data.filmId;
      RT.showScreen('rendering');
      pollFilm(data.filmId);
    }).catch(function (err) {
      RT.loading(false);
      if (err.message.indexOf('Not enough credits') !== -1) {
        RT.showScreen('credits');
        RT.renderCredits();
      } else {
        RT.toast(err.message || 'Failed to start film.');
      }
    });
  }

  // ── Poll Film Status ──

  function pollFilm(filmId) {
    setStep('writing');

    var msgs = {
      writing: 'Writing your screenplay...',
      filming: 'Generating video scenes with your face...',
      voiceover: 'Recording narration in your voice...',
      stitching: 'Assembling your final film...',
      composing: 'Final touches...'
    };

    RT.pollFilm(filmId,
      function (data) {
        setStep(data.status);
        var el = RT.$('render-status');
        if (el) el.textContent = msgs[data.status] || data.status;
      },
      function (data) {
        setStep('done');
        var v = RT.$('film-video');
        if (v && data.videoUrl) v.src = data.videoUrl;
        var dl = RT.$('btn-download');
        if (dl && data.videoUrl) dl.href = data.videoUrl;
        RT.renderShareButtons(RT.$('share-buttons'), data.videoUrl);
        RT.showScreen('player');
        RT.toast('Your film is ready!', true);
      },
      function (err) {
        setStep('failed');
        RT.toast(err.message || 'Failed. Credits refunded.');
      }
    );
  }

  // ── Render Step Indicator ──

  function setStep(status) {
    var map = { writing: 1, filming: 2, voiceover: 3, stitching: 4, composing: 4, done: 5, failed: 0 };
    var active = map[status] || 0;

    for (var i = 1; i <= 5; i++) {
      var el = RT.$('rs-' + i);
      if (!el) continue;
      el.classList.remove('active', 'done');
      if (active > 0 && i < active) el.classList.add('done');
      else if (i === active) el.classList.add('active');
    }
  }

  // Expose for dashboard reuse
  RT.pollFilmStatus = pollFilm;

})();
