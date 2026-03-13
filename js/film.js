(function () {
  'use strict';

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
    if (!RT.mood) { RT.toast('Select a mood.'); return; }
    if (RT.createMode !== 'photo' && (!brief || brief.length < 10)) { RT.toast('Describe your story in more detail.'); return; }
    if (RT.createMode === 'photo' && (!RT.photos || RT.photos.length < 3)) { RT.toast('Upload at least 3 photos.'); return; }

    RT.loading(true, 'Starting your film...');

    RT.createFilm(brief, RT.mood, RT.language, RT.tier).then(function (data) {
      RT.loading(false);
      RT.currentFilmId = data.filmId;
      RT.showScreen('rendering');
      RT.toast('Film started! You can navigate away — we\'ll keep working.', true);
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

  var pollTimer = null;

  function pollFilm(filmId) {
    setStep('writing');
    if (pollTimer) clearInterval(pollTimer);

    var msgs = {
      writing: 'Writing your screenplay...',
      filming: 'Filming cinematic scenes...',
      stitching: 'Assembling your final film...',
      done: 'Your film is ready!',
      failed: 'Something went wrong.'
    };

    pollTimer = setInterval(function () {
      RT.getFilmStatus(filmId).then(function (data) {

        setStep(data.status);
        var el = RT.$('render-status');
        if (el) el.textContent = msgs[data.status] || data.status;

        if (data.status === 'done') {
          clearInterval(pollTimer);
          pollTimer = null;
          var v = RT.$('film-video');
          if (v && data.videoUrl) v.src = data.videoUrl;
          var dl = RT.$('btn-download');
          if (dl && data.videoUrl) dl.href = data.videoUrl;
          RT.renderShareButtons(RT.$('share-buttons'), data.videoUrl);
          RT.showScreen('player');
          RT.toast('Your film is ready!', true);
        }

        if (data.status === 'failed') {
          clearInterval(pollTimer);
          pollTimer = null;
          RT.toast(data.error || 'Failed. Credits refunded.');
        }

      }).catch(function () {});
    }, 15000);
  }

  // ── Render Step Indicator ──

  function setStep(status) {
    var map = { writing: 1, filming: 2, stitching: 3, done: 4, failed: 0 };
    var active = map[status] || 0;

    for (var i = 1; i <= 4; i++) {
      var el = RT.$('rs-' + i);
      if (!el) continue;
      el.classList.remove('active', 'done');
      if (active > 0 && i < active) el.classList.add('done');
      else if (i === active) el.classList.add('active');
    }
  }

  RT.pollFilmStatus = pollFilm;

})();