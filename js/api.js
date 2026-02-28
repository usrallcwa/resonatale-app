(function () {
  'use strict';

  // ══════════════════════════════════════
  // STATE
  // ══════════════════════════════════════

  var mood = '';
  var tier = 'short';
  var tsToken = '';
  var tsWidgetId = null;
  var generating = false;
  var currentScenes = null;
  var currentFilmId = null;
  var photos = []; // array of base64 strings
  var voiceBlob = null;
  var mediaRecorder = null;
  var recordChunks = [];
  var recordTimer = null;
  var recordStart = 0;
  var isRecording = false;
  var creditAmount = 50;

  // ══════════════════════════════════════
  // DOM HELPER
  // ══════════════════════════════════════

  var $ = function (id) { return document.getElementById(id); };

  // ══════════════════════════════════════
  // NAVIGATION
  // ══════════════════════════════════════

  $('btn-start').addEventListener('click', function () {
    if (RT.isLoggedIn()) {
      RT.getProfile().then(function () {
        if (RT.hasPhotos && RT.hasVoice) {
          RT.showScreen('create');
          mountTurnstile();
        } else {
          RT.showScreen('setup');
        }
      }).catch(function () {
        RT.showScreen('setup');
      });
    } else {
      RT.showScreen('setup');
    }
  });

  $('back-to-landing').addEventListener('click', function () {
    RT.showScreen('landing');
  });

  // ══════════════════════════════════════
  // PHOTO UPLOAD (multi-photo)
  // ══════════════════════════════════════

  var $photoGrid = $('photo-grid');
  var $photoInput = $('photo-input');
  var $photoZone = $('photo-zone');

  if ($photoZone) {
    $photoZone.addEventListener('click', function () {
      if (photos.length < 10) $photoInput.click();
    });
  }

  if ($photoInput) {
    $photoInput.addEventListener('change', function () {
      var files = $photoInput.files;
      if (!files || files.length === 0) return;

      for (var i = 0; i < files.length; i++) {
        if (photos.length >= 10) break;
        var file = files[i];
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 10 * 1024 * 1024) {
          RT.toast('Photo too large. Max 10MB each.');
          continue;
        }
        (function (f) {
          var reader = new FileReader();
          reader.onload = function (e) {
            photos.push(e.target.result);
            renderPhotos();
          };
          reader.readAsDataURL(f);
        })(file);
      }

      // Reset input so same file can be selected again
      $photoInput.value = '';
    });
  }

  function renderPhotos() {
    RT.renderPhotoGrid($photoGrid, photos, function (index) {
      photos.splice(index, 1);
      renderPhotos();
    });
    updateSetupProgress();
  }

  // ══════════════════════════════════════
  // VOICE RECORDING
  // ══════════════════════════════════════

  function showVoiceState(state) {
    $('voice-idle').classList.add('hide');
    $('voice-recording').classList.add('hide');
    $('voice-done').classList.add('hide');
    $(state).classList.remove('hide');
  }

  if ($('btn-record')) {
    $('btn-record').addEventListener('mousedown', startRecording);
    $('btn-record').addEventListener('touchstart', function (e) {
      e.preventDefault();
      startRecording();
    });
  }

  document.addEventListener('mouseup', stopRecording);
  document.addEventListener('touchend', stopRecording);

  function startRecording() {
    if (isRecording) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      RT.toast('Microphone not supported.');
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function (stream) {
        isRecording = true;
        recordChunks = [];
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = function (e) {
          if (e.data.size > 0) recordChunks.push(e.data);
        };

        mediaRecorder.onstop = function () {
          voiceBlob = new Blob(recordChunks, { type: 'audio/webm' });
          stream.getTracks().forEach(function (t) { t.stop(); });
          showVoiceState('voice-done');
          clearInterval(recordTimer);
          updateSetupProgress();
        };

        mediaRecorder.start();
        showVoiceState('voice-recording');

        recordStart = Date.now();
        recordTimer = setInterval(function () {
          var elapsed = Math.floor((Date.now() - recordStart) / 1000);
          var m = Math.floor(elapsed / 60);
          var s = elapsed % 60;
          $('rec-time').textContent = m + ':' + (s < 10 ? '0' : '') + s;
        }, 200);
      })
      .catch(function () {
        RT.toast('Microphone access denied.');
      });
  }

  function stopRecording() {
    if (!isRecording || !mediaRecorder) return;
    isRecording = false;
    if (mediaRecorder.state === 'recording') mediaRecorder.stop();
  }

  if ($('btn-re-record')) {
    $('btn-re-record').addEventListener('click', function () {
      voiceBlob = null;
      showVoiceState('voice-idle');
      $('rec-time').textContent = '0:00';
      updateSetupProgress();
    });
  }

  if ($('voice-input')) {
    $('voice-input').addEventListener('change', function () {
      var file = $('voice-input').files[0];
      if (!file) return;
      if (!file.type.startsWith('audio/')) {
        RT.toast('Upload an audio file.');
        return;
      }
      voiceBlob = file;
      showVoiceState('voice-done');
      updateSetupProgress();
    });
  }

  // ══════════════════════════════════════
  // SETUP PROGRESS
  // ══════════════════════════════════════

  function updateSetupProgress() {
    var $btn = $('btn-save-setup');
    if (!$btn) return;
    var hasP = photos.length >= 1;
    var hasV = !!voiceBlob;
    $btn.disabled = !(hasP && hasV);

    var $count = $('photo-count');
    if ($count) $count.textContent = photos.length + '/10 photos';

    var $status = $('setup-status');
    if ($status) {
      if (hasP && hasV) $status.textContent = 'Ready to continue!';
      else if (hasP) $status.textContent = 'Now record your voice.';
      else $status.textContent = 'Upload at least 1 photo.';
    }
  }

  // ══════════════════════════════════════
  // SAVE SETUP (upload photos + voice)
  // ══════════════════════════════════════

  if ($('btn-save-setup')) {
    $('btn-save-setup').addEventListener('click', function () {
      if (photos.length === 0) { RT.toast('Upload at least 1 photo.'); return; }
      if (!voiceBlob) { RT.toast('Record your voice.'); return; }

      // Need auth first
      if (!RT.isLoggedIn()) {
        RT.showScreen('auth');
        showAuthForm('signup');
        return;
      }

      uploadAssets();
    });
  }

  function uploadAssets() {
    RT.loading(true, 'Uploading your photos...', ['This may take a moment']);

    // Upload photos
    RT.uploadPhotos(photos)
      .then(function () {
        RT.loading(true, 'Cloning your voice...');

        // Convert voice blob to base64
        return new Promise(function (resolve) {
          var reader = new FileReader();
          reader.onload = function (e) { resolve(e.target.result); };
          reader.readAsDataURL(voiceBlob);
        });
      })
      .then(function (audioB64) {
        return RT.uploadVoice(audioB64);
      })
      .then(function (data) {
        RT.loading(false);
        RT.hasPhotos = true;
        RT.hasVoice = data.cloned;

        if (data.cloned) {
          RT.toast('Setup complete! Voice cloned.', true);
        } else {
          RT.toast('Photos saved. Voice will be processed.', true);
        }

        RT.showScreen('create');
        mountTurnstile();
      })
      .catch(function (err) {
        RT.loading(false);
        RT.toast(err.message || 'Upload failed.');
      });
  }

  // ══════════════════════════════════════
  // LANGUAGE
  // ══════════════════════════════════════

  var $langSel = $('lang-sel');
  if ($langSel) {
    // Restore saved language
    if (RT.language) $langSel.value = RT.language;
    $langSel.addEventListener('change', function () {
      RT.setLanguage($langSel.value);
    });
  }

  // ══════════════════════════════════════
  // MOOD CHIPS
  // ══════════════════════════════════════

  var $moodChips = $('mood-chips');
  if ($moodChips) {
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
  }

  // ══════════════════════════════════════
  // TIER SELECTION
  // ══════════════════════════════════════

  var $tierCards = $('tier-cards');
  function renderTierSelection() {
    RT.renderTiers($tierCards, tier, function (selected) {
      tier = selected;
      renderTierSelection();
    });
  }
  if ($tierCards) renderTierSelection();

  // ══════════════════════════════════════
  // TURNSTILE
  // ══════════════════════════════════════

  function mountTurnstile() {
    var target = $('ts-target');
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

 // ══════════════════════════════════════
  // GENERATE PREVIEW (free script)
  // ══════════════════════════════════════

  if ($('btn-generate')) {
    $('btn-generate').addEventListener('click', function () {
      if (generating) return;
      var brief = $('brief') ? $('brief').value.trim() : '';
      if (!mood) { RT.toast('Select a mood.'); return; }
      if (!brief) { RT.toast('Write your story.'); return; }
      if (brief.length < 10) { RT.toast('Story is too short. Add more detail.'); return; }
      if (!tsToken) { RT.toast('Complete the verification.'); return; }

      generating = true;
      RT.loading(true, 'Writing your screenplay...', [
        'Analyzing your story...',
        'Crafting ' + (TIERS_MAP[tier] || 3) + ' cinematic scenes...'
      ]);

      RT.generatePreview(brief, mood, RT.language, tier)
        .then(function (data) {
          generating = false;
          RT.loading(false);

          if (!data.scenes || !data.scenes.length) {
            RT.toast('No scenes returned. Try again.');
            resetTurnstile();
            return;
          }

          currentScenes = data.scenes;
          RT.renderScenes(data.scenes);

          // Show tier info on preview
          var $tierInfo = $('preview-tier-info');
          if ($tierInfo) {
            var t = RT.TIERS.find(function (x) { return x.id === tier; });
            if (t) {
              $tierInfo.textContent = t.label + ' · ' + t.minutes + ' min · ' + t.scenes + ' scenes · ' + t.price;
            }
          }

          RT.showScreen('preview');
          RT.toast('Script ready!', true);
          resetTurnstile();
        })
        .catch(function (err) {
          generating = false;
          RT.loading(false);
          RT.toast(err.message || 'Generation failed.');
          resetTurnstile();
        });
    });
  }

  // Quick lookup for scene counts
  var TIERS_MAP = {};
  RT.TIERS.forEach(function (t) { TIERS_MAP[t.id] = t.scenes; });

  // ══════════════════════════════════════
  // FREE PREVIEW CLIP (1x per account)
  // ══════════════════════════════════════

  if ($('btn-preview-clip')) {
    $('btn-preview-clip').addEventListener('click', function () {
      if (!RT.isLoggedIn()) {
        RT.showScreen('auth');
        showAuthForm('signup');
        return;
      }

      if (RT.hasUsedPreview) {
        RT.toast('Free preview already used. Add credits to create films.');
        return;
      }

      if (!currentScenes || !currentScenes.length) {
        RT.toast('Generate a script first.');
        return;
      }

      if (!RT.hasPhotos) {
        RT.toast('Upload your photos first.');
        RT.showScreen('setup');
        return;
      }

      var scene = currentScenes[0];
      RT.loading(true, 'Creating your 10-second preview...', [
        'Generating video with your face...',
        'Recording voiceover in your voice...',
        'This takes about 2-3 minutes'
      ]);

      RT.generatePreviewClip(scene.direction || scene.description, scene.voiceover)
        .then(function (data) {
          RT.loading(false);
          RT.hasUsedPreview = true;
          RT.toast('Preview clip ready!', true);

          // Show clip if URL available
          var $video = $('preview-video');
          if ($video && data.clipUrl) {
            $video.src = data.clipUrl;
            $video.style.display = 'block';
            $video.play().catch(function () {});
          }
        })
        .catch(function (err) {
          RT.loading(false);
          RT.toast(err.message || 'Preview failed.');
        });
    });
  }

  // ══════════════════════════════════════
  // PREVIEW ACTIONS
  // ══════════════════════════════════════

  if ($('btn-get-film')) {
    $('btn-get-film').addEventListener('click', function () {
      if (!RT.isLoggedIn()) {
        RT.showScreen('auth');
        showAuthForm('signup');
        return;
      }

      var t = RT.TIERS.find(function (x) { return x.id === tier; });
      if (!t) return;

      if (RT.credits >= t.credits) {
        startFilmCreation();
      } else {
        RT.showScreen('credits');
        renderCreditsScreen();
        RT.toast('You need ' + t.credits + ' credits. Add funds to continue.');
      }
    });
  }

  if ($('btn-retry')) {
    $('btn-retry').addEventListener('click', function () {
      RT.showScreen('create');
      mountTurnstile();
    });
  }

  // ══════════════════════════════════════
  // FILM CREATION (paid)
  // ══════════════════════════════════════

  function startFilmCreation() {
    var brief = $('brief') ? $('brief').value.trim() : '';
    if (!brief || !mood) {
      RT.toast('Missing story details.');
      return;
    }

    RT.loading(true, 'Starting your film...');

    RT.createFilm(brief, mood, RT.language, tier)
      .then(function (data) {
        RT.loading(false);
        currentFilmId = data.filmId;
        RT.showScreen('rendering');
        startPolling(data.filmId);
      })
      .catch(function (err) {
        RT.loading(false);
        if (err.message.indexOf('Not enough credits') !== -1) {
          RT.showScreen('credits');
          renderCreditsScreen();
          RT.toast('Not enough credits. Add funds.');
        } else {
          RT.toast(err.message || 'Failed to start film.');
        }
      });
  }

  // ══════════════════════════════════════
  // RENDERING — POLL STATUS
  // ══════════════════════════════════════

  function startPolling(filmId) {
    updateRenderStep('writing');

    RT.pollFilm(filmId,
      // onUpdate
      function (data) {
        updateRenderStep(data.status);
        var $status = $('render-status');
        if ($status) {
          var msgs = {
            writing: 'Writing your screenplay...',
            filming: 'Generating video scenes with your face...',
            voiceover: 'Recording narration in your voice...',
            stitching: 'Assembling your final film...',
            composing: 'Final touches...'
          };
          $status.textContent = msgs[data.status] || data.status;
        }
      },
      // onDone
      function (data) {
        updateRenderStep('done');

        // Show player
        var $video = $('film-video');
        if ($video && data.videoUrl) {
          $video.src = data.videoUrl;
        }

        var $download = $('btn-download');
        if ($download && data.videoUrl) {
          $download.href = data.videoUrl;
        }

        // Render share buttons
        RT.renderShareButtons($('share-buttons'), data.videoUrl);

        RT.showScreen('player');
        RT.toast('Your film is ready!', true);
      },
      // onError
      function (err) {
        updateRenderStep('failed');
        RT.toast(err.message || 'Film creation failed. Credits refunded.');
        var $status = $('render-status');
        if ($status) $status.textContent = 'Failed: ' + (err.message || 'Unknown error');
      }
    );
  }

  function updateRenderStep(status) {
    var steps = {
      writing: 1,
      filming: 2,
      voiceover: 3,
      stitching: 4,
      composing: 4,
      done: 5,
      failed: 0
    };
    var active = steps[status] || 0;

    for (var i = 1; i <= 5; i++) {
      var el = $('rs-' + i);
      if (!el) continue;
      el.classList.remove('active', 'done');
      if (active > 0 && i < active) el.classList.add('done');
      else if (i === active) el.classList.add('active');
    }
  }

  // ══════════════════════════════════════
  // AUTH SCREENS
  // ══════════════════════════════════════

  function showAuthForm(form) {
    var forms = ['auth-login', 'auth-signup', 'auth-forgot', 'auth-reset'];
    forms.forEach(function (f) {
      var el = $(f);
      if (el) {
        if (f === 'auth-' + form) el.classList.remove('hide');
        else el.classList.add('hide');
      }
    });
  }

  if ($('show-signup')) $('show-signup').addEventListener('click', function () { showAuthForm('signup'); });
  if ($('show-login')) $('show-login').addEventListener('click', function () { showAuthForm('login'); });
  if ($('show-forgot')) $('show-forgot').addEventListener('click', function () { showAuthForm('forgot'); });
  if ($('show-login2')) $('show-login2').addEventListener('click', function () { showAuthForm('login'); });

  if ($('btn-login')) {
    $('btn-login').addEventListener('click', function () {
      var email = $('login-email').value.trim();
      var pass = $('login-pass').value;
      if (!email || !pass) { RT.toast('Fill in all fields.'); return; }

      RT.loading(true, 'Logging in...');
      RT.login(email, pass)
        .then(function () {
          RT.loading(false);
          RT.toast('Welcome back!', true);
          afterAuth();
        })
        .catch(function (err) {
          RT.loading(false);
          RT.toast(err.message || 'Login failed.');
        });
    });
  }

  if ($('btn-signup')) {
    $('btn-signup').addEventListener('click', function () {
      var email = $('signup-email').value.trim();
      var pass = $('signup-pass').value;
      if (!email || !pass) { RT.toast('Fill in all fields.'); return; }
      if (pass.length < 6) { RT.toast('Password must be 6+ characters.'); return; }

      RT.loading(true, 'Creating account...');
      RT.signup(email, pass, RT.language)
        .then(function () {
          RT.loading(false);
          RT.toast('Account created!', true);
          afterAuth();
        })
        .catch(function (err) {
          RT.loading(false);
          RT.toast(err.message || 'Signup failed.');
        });
    });
  }

  if ($('btn-forgot')) {
    $('btn-forgot').addEventListener('click', function () {
      var email = $('forgot-email').value.trim();
      if (!email) { RT.toast('Enter your email.'); return; }

      RT.loading(true, 'Sending reset code...');
      RT.forgotPassword(email)
        .then(function () {
          RT.loading(false);
          RT.toast('Check your email for the code.', true);
          showAuthForm('reset');
        })
        .catch(function (err) {
          RT.loading(false);
          RT.toast(err.message || 'Failed.');
        });
    });
  }

  if ($('btn-reset')) {
    $('btn-reset').addEventListener('click', function () {
      var email = $('forgot-email').value.trim();
      var code = $('reset-code').value.trim();
      var pass = $('reset-pass').value;
      if (!code || !pass) { RT.toast('Fill in all fields.'); return; }

      RT.loading(true, 'Resetting password...');
      RT.resetPassword(email, code, pass)
        .then(function () {
          RT.loading(false);
          RT.toast('Password reset! Log in.', true);
          showAuthForm('login');
        })
        .catch(function (err) {
          RT.loading(false);
          RT.toast(err.message || 'Reset failed.');
        });
    });
  }

  function afterAuth() {
    if (photos.length > 0 && voiceBlob) {
      uploadAssets();
    } else if (RT.hasPhotos && RT.hasVoice) {
      RT.showScreen('create');
      mountTurnstile();
    } else {
      RT.showScreen('setup');
    }
  }

  // ══════════════════════════════════════
  // CREDITS SCREEN
  // ══════════════════════════════════════

  function renderCreditsScreen() {
    var $amount = $('credit-amount');
    var $slider = $('credit-slider');
    var $balance = $('credit-balance');

    if ($balance) {
      RT.getCredits().catch(function () {});
    }

    if ($slider) {
      $slider.value = creditAmount;
      $slider.addEventListener('input', function () {
        creditAmount = parseInt($slider.value);
        if ($amount) $amount.textContent = '$' + creditAmount;
      });
    }
    if ($amount) $amount.textContent = '$' + creditAmount;
  }

  if ($('btn-add-credits')) {
    $('btn-add-credits').addEventListener('click', function () {
      if (creditAmount < 20) { RT.toast('Minimum $20.'); return; }
      if (creditAmount > 1000) { RT.toast('Maximum $1,000.'); return; }

      RT.loading(true, 'Setting up payment...');
      RT.addCredits(creditAmount)
        .then(function (data) {
          RT.loading(false);
          if (data.url) {
            window.location.href = data.url;
          } else {
            RT.toast('Payment setup failed.');
          }
        })
        .catch(function (err) {
          RT.loading(false);
          RT.toast(err.message || 'Payment failed.');
        });
    });
  }

  // ══════════════════════════════════════
  // PLAYER ACTIONS
  // ══════════════════════════════════════

  if ($('btn-new-film')) {
    $('btn-new-film').addEventListener('click', function () {
      resetCreateForm();
      RT.showScreen('create');
      mountTurnstile();
    });
  }

  if ($('btn-dashboard')) {
    $('btn-dashboard').addEventListener('click', function () {
      RT.showScreen('dash');
      loadDashboard();
    });
  }

  // ══════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════

  function loadDashboard() {
    RT.getCredits().catch(function () {});

    RT.getFilms()
      .then(function (data) {
        var $list = $('dash-films');
        var $empty = $('dash-empty');
        if (!$list) return;

        $list.innerHTML = '';
        var films = data.films || [];

        if (films.length === 0) {
          if ($empty) $empty.classList.remove('hide');
          return;
        }

        if ($empty) $empty.classList.add('hide');

        films.forEach(function (film) {
          var card = RT.renderFilmCard(film);
          card.addEventListener('click', function () {
            if (film.status === 'done' && film.video_url) {
              var $video = $('film-video');
              if ($video) $video.src = film.video_url;
              var $dl = $('btn-download');
              if ($dl) $dl.href = film.video_url;
              RT.renderShareButtons($('share-buttons'), film.video_url);
              RT.showScreen('player');
            } else if (film.status === 'failed') {
              RT.toast('This film failed. Credits were refunded.');
            } else {
              currentFilmId = film.id;
              RT.showScreen('rendering');
              startPolling(film.id);
            }
          });
          $list.appendChild(card);
        });
      })
      .catch(function (err) {
        RT.toast(err.message || 'Failed to load films.');
      });
  }

  if ($('btn-dash-new')) {
    $('btn-dash-new').addEventListener('click', function () {
      resetCreateForm();
      RT.showScreen('create');
      mountTurnstile();
    });
  }

  if ($('btn-dash-credits')) {
    $('btn-dash-credits').addEventListener('click', function () {
      RT.showScreen('credits');
      renderCreditsScreen();
    });
  }

  if ($('btn-logout')) {
    $('btn-logout').addEventListener('click', function () {
      RT.logout();
      RT.toast('Logged out.', true);
      RT.showScreen('landing');
    });
  }

  // ══════════════════════════════════════
  // RESET CREATE FORM
  // ══════════════════════════════════════

  function resetCreateForm() {
    mood = '';
    tier = 'short';
    currentScenes = null;
    currentFilmId = null;
    if ($('brief')) $('brief').value = '';
    if ($moodChips) {
      var all = $moodChips.querySelectorAll('.chip');
      for (var i = 0; i < all.length; i++) all[i].classList.remove('on');
    }
    if ($tierCards) renderTierSelection();
    resetTurnstile();
  }

  // ══════════════════════════════════════
  // HANDLE PAYMENT RETURN
  // ══════════════════════════════════════

  (function () {
    var params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      RT.toast('Payment successful! Credits added.', true);
      window.history.replaceState({}, '', '/');
      if (RT.isLoggedIn()) {
        RT.getCredits().then(function () {
          RT.showScreen('create');
          mountTurnstile();
        });
      }
    } else if (params.get('payment') === 'cancel') {
      RT.toast('Payment cancelled.');
      window.history.replaceState({}, '', '/');
    }
  })();

  // ══════════════════════════════════════
  // AUTO-LOAD PROFILE ON START
  // ══════════════════════════════════════

  if (RT.isLoggedIn()) {
    RT.getProfile().then(function () {
      RT.updateCredits(RT.credits);
    }).catch(function () {
      // Token expired
      RT.clearAuth();
    });
  }

  // ══════════════════════════════════════
  // GLOBAL ERROR HANDLERS
  // ══════════════════════════════════════

  window.addEventListener('error', function () {
    if (!generating) RT.toast('Something went wrong.');
  });

  window.addEventListener('unhandledrejection', function (e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!generating) RT.toast('Network error. Check connection.');
  });

})();
