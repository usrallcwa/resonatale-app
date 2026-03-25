(function () {
  'use strict';

  // ── Create Full Film ──

  var filmBtn = RT.$('btn-get-film');
  if (filmBtn) {
    filmBtn.addEventListener('click', function () {
      if (!RT.isLoggedIn()) { RT.showScreen('auth'); RT.showAuthForm('signup'); return; }
      var t = RT.TIERS.find(function (x) { return x.id === RT.tier; });
      if (!t) { RT.toast('Select a film tier.'); return; }

      if (RT.credits >= t.credits) {
        startFilm();
      } else {
        RT.showScreen('credits');
        RT.renderCredits();
        RT.toast('You need ' + t.credits + ' credits to create this film.');
      }
    });
  }

  // ── Edit Story — back to create ──

  var retryBtn = RT.$('btn-retry');
  if (retryBtn) {
    retryBtn.addEventListener('click', function () {
      RT.showScreen('s-create');
      RT.mountTurnstile();
    });
  }

  // ── Start Film Pipeline ──

  function startFilm() {
    if (!RT.mood) { RT.toast('Select a mood first.'); return; }

    var brief = RT.currentBrief
      || (RT.$('brief') ? RT.$('brief').value.trim() : '')
      || '';

    if (brief.length < 10) { RT.toast('Describe your story in more detail.'); return; }

    // Pull edited scenes from DOM if user modified them
    var sceneCards = document.querySelectorAll('.scene-editable');
    if (sceneCards.length > 0 && RT.currentScenes) {
      var editedScenes = [];
      for (var s = 0; s < sceneCards.length; s++) {
        var card     = sceneCards[s];
        var origScene = RT.currentScenes[s] || {};
        editedScenes.push({
          title:     (card.querySelector('.scene-title-input')     || {}).value || origScene.title     || '',
          direction: (card.querySelector('.scene-direction-input') || {}).value || origScene.direction || '',
          voiceover: (card.querySelector('.scene-voiceover-input') || {}).value || origScene.voiceover || '',
        });
      }
      RT.currentScenes = editedScenes;
    }

    var title = RT.$('film-title') ? RT.$('film-title').value.trim() : '';

    RT.loading(true, 'Starting your film...');

    RT.createFilm(brief, RT.mood, RT.language, RT.tier, title)
      .then(function (data) {
        RT.loading(false);
        RT.currentFilmId = data.filmId;
        RT.showScreen('rendering');
        RT.toast('Film started! Hang tight while we create your masterpiece.', true);
        pollFilm(data.filmId);
      })
      .catch(function (err) {
        RT.loading(false);
        var msg = err.message || '';
        if (msg.indexOf('Not enough credits') !== -1) {
          RT.showScreen('credits');
          RT.renderCredits();
          RT.toast('Not enough credits for this film.');
        } else {
          RT.toast(msg || 'Failed to start film. Please try again.');
        }
      });
  }

  // ── Poll Film Status ──

  var pollTimer  = null;
  var factTimer  = null;

  function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (factTimer) { clearInterval(factTimer); factTimer = null; }
  }

  function pollFilm(filmId) {
    stopPolling();
    setStep('writing');

    var startTime = Date.now();
    var factIndex = 0;

    var msgs = {
      writing:   'Writing your screenplay...',
      filming:   'Filming cinematic scenes...',
      voiceover: 'Recording your voice narration...',
      stitching: 'Assembling your masterpiece...',
      done:      'Your film is ready!',
      failed:    'Something went wrong.',
    };

    var estimates = {
      writing:   'Estimated: ~4 minutes remaining',
      filming:   'Estimated: ~3 minutes remaining',
      voiceover: 'Estimated: ~1 minute remaining',
      stitching: 'Almost done...',
    };

    var funFacts = [
      'Your film uses the same AI technology as Hollywood studios.',
      'Each scene is generated with cinematic quality.',
      'Your unique voice makes this film one of a kind.',
      'Over 50 AI models work together to create your film.',
      'The average Hollywood film takes 2 years. Yours takes minutes.',
      'AI cinematographers are framing every shot perfectly.',
      'Sound engineers are mixing your voice with cinematic audio.',
      'Color grading is being applied to match your chosen mood.',
      'Final touches are being added to make your film shine.',
      'Your story is being brought to life, scene by scene.',
    ];

    // Rotating fun facts with fade
    var factEl = RT.$('render-fact');
    function rotateFact() {
      if (!factEl) return;
      factEl.style.opacity = '0';
      setTimeout(function () {
        factEl.textContent = funFacts[factIndex % funFacts.length];
        factEl.style.opacity = '1';
        factIndex++;
      }, 400);
    }
    rotateFact();
    factTimer = setInterval(rotateFact, 6000);

    pollTimer = setInterval(function () {
      RT.getFilmStatus(filmId).then(function (data) {
        setStep(data.status);

        var statusEl = RT.$('render-status');
        if (statusEl) statusEl.textContent = msgs[data.status] || data.status;

        var timeEl = RT.$('render-time');
        if (timeEl) {
          var elapsed = Math.round((Date.now() - startTime) / 1000);
          var mins    = Math.floor(elapsed / 60);
          var secs    = elapsed % 60;
          var elapsed_str = mins + ':' + (secs < 10 ? '0' : '') + secs;
          var est     = estimates[data.status] || '';
          timeEl.textContent = est ? est + '  (' + elapsed_str + ' elapsed)' : elapsed_str + ' elapsed';
        }

        if (data.status === 'done') {
          stopPolling();
          var v = RT.$('film-video');
          if (v && data.videoUrl) { v.src = data.videoUrl; v.load(); }
          var dl = RT.$('btn-download');
          if (dl && data.videoUrl) dl.href = data.videoUrl;
          // Track view on play
          if (v && RT.currentFilmId) {
            v.addEventListener('play', function onPlay() {
              v.removeEventListener('play', onPlay);
              RT.api('POST', '/film/' + RT.currentFilmId + '/view', {}).catch(function(){});
            });
          }
          RT.showScreen('player');
          RT.updateMenuCredits();
          RT.toast('Your film is ready!', true);
        }

        // ── Auto Thumbnail ──
function extractThumbnail(videoUrl, callback) {
  var video  = document.createElement('video');
  var canvas = document.createElement('canvas');
  var ctx    = canvas.getContext('2d');

  video.crossOrigin = 'anonymous';
  video.preload     = 'metadata';
  video.src         = videoUrl;
  video.muted       = true;

  video.addEventListener('loadedmetadata', function () {
    video.currentTime = Math.min(2, video.duration * 0.1);
  });

  video.addEventListener('seeked', function () {
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 360;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(function (blob) {
      callback(blob);
    }, 'image/jpeg', 0.85);
  });

  video.addEventListener('error', function () {
    callback(null); // silent fail
  });

  video.load();
}


        if (data.status === 'failed') {
          stopPolling();
          var statusEl2 = RT.$('render-status');
          if (statusEl2) statusEl2.textContent = 'Something went wrong.';
          RT.toast((data.error || 'Film generation failed.') + ' Your credits have been refunded.');
          var retryArea = RT.$('render-retry');
          if (retryArea) retryArea.classList.remove('hide');
        }

      }).catch(function (e) {
        console.warn('[poll] Status check failed:', e);
        // Silent — keep polling, transient network error
      });
    }, 10000);
  }

  // ── Render Step Indicator ──

  function setStep(status) {
    var map    = { writing: 1, filming: 2, stitching: 3, done: 4, failed: 0 };
    var active = map[status] !== undefined ? map[status] : 0;

    for (var i = 1; i <= 4; i++) {
      var el = RT.$('rs-' + i);
      if (!el) continue;
      el.classList.remove('active', 'done');
      if      (active > 0 && i < active) el.classList.add('done');
      else if (i === active)             el.classList.add('active');
    }
  }

  RT.pollFilmStatus = pollFilm;

})();
