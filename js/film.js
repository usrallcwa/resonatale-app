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
    var brief = RT.currentBrief || (RT.$('brief') ? RT.$('brief').value.trim() : '') || 'AI generated story';
    var hint = RT.$('narration-hint') ? RT.$('narration-hint').value.trim() : '';
    if (!RT.mood) { RT.toast('Select a mood.'); return; }
    if (RT.createMode !== 'photo' && (!brief || brief.length < 10)) { RT.toast('Describe your story in more detail.'); return; }
    if (RT.createMode === 'photo' && (!RT.photos || RT.photos.length < 1)) { RT.toast('Upload at least 1 photo.'); return; }

    if (RT.createMode === 'photo') {
      RT.loading(true, 'Uploading photos...');
      RT.uploadPhotos().then(function (keys) {
        RT.loading(true, 'Starting your film...');
        var photoBrief = 'Photo story with ' + keys.length + ' photos. ' + (hint || 'AI decides the narration.');
        return RT.createPhotoFilm(keys, RT.mood, RT.language, RT.tier, hint);
      }).then(function (data) {
        RT.loading(false);
        RT.currentFilmId = data.filmId;
        RT.showScreen('rendering');
        RT.toast('Film started! We\'ll email you when ready.', true);
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
      return;
    }

    RT.loading(true, 'Starting your film...');

    var title = RT.$('film-title') ? RT.$('film-title').value.trim() : '';
    RT.createFilm(brief, RT.mood, RT.language, RT.tier, title).then(function (data) {
      RT.loading(false);
      RT.currentFilmId = data.filmId;
      RT.showScreen('rendering');
      RT.toast('Film started! We\'ll email you when ready.', true);
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

    var startTime = Date.now();
    var factIndex = 0;

    var msgs = {
      writing: 'Writing your screenplay...',
      filming: 'Filming cinematic scenes...',
      voiceover: 'Recording your voice narration...',
      stitching: 'Assembling your masterpiece...',
      done: 'Your film is ready!',
      failed: 'Something went wrong.'
    };

    var funFacts = [
      'Your film uses the same AI technology as Hollywood studios.',
      'Each scene is generated with cinematic 8K quality.',
      'Your unique voice makes this film one of a kind.',
      'Over 50 AI models work together to create your film.',
      'The average Hollywood film takes 2 years. Yours takes minutes.',
      'Your film is being rendered in real-time, just for you.',
      'AI cinematographers are framing every shot perfectly.',
      'Sound engineers are mixing your voice with cinematic audio.',
      'Color grading is being applied to match your chosen mood.',
      'Final touches are being added to make your film shine.'
    ];

    var factEl = RT.$('render-fact');
    var factTimer = setInterval(function () {
      if (factEl) {
        factEl.style.opacity = '0';
        setTimeout(function () {
          factEl.textContent = funFacts[factIndex % funFacts.length];
          factEl.style.opacity = '1';
          factIndex++;
        }, 300);
      }
    }, 5000);

    pollTimer = setInterval(function () {
      RT.getFilmStatus(filmId).then(function (data) {

        setStep(data.status);
        var el = RT.$('render-status');
        if (el) el.textContent = msgs[data.status] || data.status;

        var timeEl = RT.$('render-time');
        if (timeEl) {
          var elapsed = Math.round((Date.now() - startTime) / 1000);
          var mins = Math.floor(elapsed / 60);
          var secs = elapsed % 60;
          var estimate = '';
          if (data.status === 'writing') estimate = 'Estimated: ~4 minutes remaining';
          else if (data.status === 'filming') estimate = 'Estimated: ~3 minutes remaining';
          else if (data.status === 'voiceover') estimate = 'Estimated: ~1 minute remaining';
          else if (data.status === 'stitching') estimate = 'Almost done...';
          timeEl.textContent = estimate + ' (' + mins + ':' + (secs < 10 ? '0' : '') + secs + ' elapsed)';
        }

        if (data.status === 'done') {
          clearInterval(pollTimer);
          clearInterval(factTimer);
          pollTimer = null;
          var v = RT.$('film-video');
          if (v && data.videoUrl) v.src = data.videoUrl;
          var dl = RT.$('btn-download');
          if (dl && data.videoUrl) dl.href = data.videoUrl;
          RT.showScreen('player');
          RT.toast('Your film is ready!', true);
        }

        if (data.status === 'failed') {
          clearInterval(pollTimer);
          clearInterval(factTimer);
          pollTimer = null;
          var statusEl = RT.$('render-status');
          if (statusEl) statusEl.textContent = 'Something went wrong.';
          var errorMsg = data.error || 'Film generation failed.';
          RT.toast(errorMsg + ' Credits refunded.');
          var retryArea = RT.$('render-retry');
          if (retryArea) retryArea.classList.remove('hide');
        }

      }).catch(function () {});
    }, 10000);
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