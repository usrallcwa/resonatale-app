(function () {
  'use strict';

  var mood = '';
  var tier = 'short';
  var tsToken = '';
  var tsWidgetId = null;
  var generating = false;
  var currentScenes = null;
  var currentFilmId = null;
  var photos = [];
  var voiceBlob = null;
  var mediaRecorder = null;
  var recordChunks = [];
  var recordTimer = null;
  var recordStart = 0;
  var isRecording = false;
  var creditAmount = 50;
  var TIERS_MAP = {};

  RT.TIERS.forEach(function (t) { TIERS_MAP[t.id] = t.scenes; });

  var $ = function (id) { return document.getElementById(id); };

  // ── Navigation ──

  $('btn-start').addEventListener('click', function () {
    if (RT.isLoggedIn()) {
      RT.getProfile().then(function () {
        if (RT.hasPhotos && RT.hasVoice) {
          RT.showScreen('create');
          mountTurnstile();
        } else {
          RT.showScreen('setup');
        }
      }).catch(function () { RT.showScreen('setup'); });
    } else {
      RT.showScreen('setup');
    }
  });

  $('back-to-landing').addEventListener('click', function () { RT.showScreen('landing'); });

  // ── Photos ──

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
      var total = Math.min(files.length, 10 - photos.length);
      var loaded = 0;
      for (var i = 0; i < total; i++) {
        var file = files[i];
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 10 * 1024 * 1024) { RT.toast('Max 10MB per photo.'); continue; }
        (function (f) {
          var reader = new FileReader();
          reader.onload = function (e) {
            photos.push(e.target.result);
            loaded++;
            if (loaded >= total) renderPhotos();
          };
          reader.readAsDataURL(f);
        })(file);
      }
      $photoInput.value = '';
    });
  }

  function renderPhotos() {
    if (photos.length > 0) {
      if ($photoZone) $photoZone.style.display = 'none';
      if ($photoGrid) $photoGrid.style.display = 'flex';
    } else {
      if ($photoZone) $photoZone.style.display = '';
      if ($photoGrid) $photoGrid.style.display = 'none';
    }
    RT.renderPhotoGrid($photoGrid, photos, function (i) {
      photos.splice(i, 1);
      renderPhotos();
    });
    updateSetupProgress();
  }

  renderPhotos();

  // ── Voice ──

  function showVoiceState(id) {
    ['voice-idle', 'voice-recording', 'voice-done'].forEach(function (s) {
      var el = $(s);
      if (el) el.classList.add('hide');
    });
    var target = $(id);
    if (target) target.classList.remove('hide');
  }

  if ($('btn-record')) {
    $('btn-record').addEventListener('mousedown', startRec);
    $('btn-record').addEventListener('touchstart', function (e) { e.preventDefault(); startRec(); });
  }
  document.addEventListener('mouseup', stopRec);
  document.addEventListener('touchend', stopRec);

  function startRec() {
    if (isRecording) return;
    if (!navigator.mediaDevices) { RT.toast('Microphone not supported.'); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      isRecording = true;
      recordChunks = [];
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = function (e) { if (e.data.size > 0) recordChunks.push(e.data); };
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
        var s = Math.floor((Date.now() - recordStart) / 1000);
        $('rec-time').textContent = Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
      }, 200);
    }).catch(function () { RT.toast('Microphone access denied.'); });
  }

  function stopRec() {
    if (!isRecording || !mediaRecorder) return;
    isRecording = false;
    if (mediaRecorder.state === 'recording') mediaRecorder.stop();
  }

  if ($('btn-re-record')) {
    $('btn-re-record').addEventListener('click', function () {
      voiceBlob = null;
      showVoiceState('voice-idle');
      if ($('rec-time')) $('rec-time').textContent = '0:00';
      updateSetupProgress();
    });
  }

  if ($('voice-input')) {
    $('voice-input').addEventListener('change', function () {
      var f = $('voice-input').files[0];
      if (!f || !f.type.startsWith('audio/')) { RT.toast('Upload an audio file.'); return; }
      voiceBlob = f;
      showVoiceState('voice-done');
      updateSetupProgress();
    });
  }

  // ── Setup Progress ──

  function updateSetupProgress() {
    var hasP = photos.length >= 1;
    var hasV = !!voiceBlob;
    var btn = $('btn-save-setup');
    if (btn) btn.disabled = !(hasP && hasV);
    var c = $('photo-count');
    if (c) c.textContent = photos.length + '/10 photos';
    var st = $('setup-status');
    if (st) {
      if (hasP && hasV) st.textContent = 'Ready to continue!';
      else if (hasP) st.textContent = 'Now record your voice.';
      else st.textContent = 'Upload at least 1 photo.';
    }
  }

  // ── Save Setup ──

  if ($('btn-save-setup')) {
    $('btn-save-setup').addEventListener('click', function () {
      if (photos.length === 0) { RT.toast('Upload at least 1 photo.'); return; }
      if (!voiceBlob) { RT.toast('Record your voice.'); return; }
      if (!RT.isLoggedIn()) { RT.showScreen('auth'); showAuthForm('signup'); return; }
      uploadAssets();
    });
  }

  function uploadAssets() {
    RT.loading(true, 'Uploading your photos...');
    RT.uploadPhotos(photos).then(function () {
      RT.loading(true, 'Cloning your voice...');
      return new Promise(function (resolve) {
        var reader = new FileReader();
        reader.onload = function (e) { resolve(e.target.result); };
        reader.readAsDataURL(voiceBlob);
      });
    }).then(function (b64) {
      return RT.uploadVoice(b64);
    }).then(function (data) {
      RT.loading(false);
      RT.hasPhotos = true;
      RT.hasVoice = data.cloned;
      RT.toast(data.cloned ? 'Setup complete!' : 'Photos saved. Voice processing.', true);
      RT.showScreen('create');
      mountTurnstile();
    }).catch(function (err) {
      RT.loading(false);
      RT.toast(err.message || 'Upload failed.');
    });
  }

  // ── Language ──

  var $langSel = $('lang-sel');
  if ($langSel) {
    if (RT.language) $langSel.value = RT.language;
    $langSel.addEventListener('change', function () { RT.setLanguage($langSel.value); });
  }

  // ── Mood Chips ──

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
        for (var i = 0; i < all.length; i++) all[i].classList.toggle('on', all[i].getAttribute('data-v') === m);
      });
      $moodChips.appendChild(btn);
    });
  }

  // ── Tier Selection ──

  var $tierCards = $('tier-cards');
  function renderTierSelection() {
    RT.renderTiers($tierCards, tier, function (sel) { tier = sel; renderTierSelection(); });
  }
  if ($tierCards) renderTierSelection();

  // ── Turnstile ──

  function mountTurnstile() {
    var t = $('ts-target');
    if (!t) return;
    if (!window.turnstile) { setTimeout(mountTurnstile, 300); return; }
    if (tsWidgetId !== null) try { window.turnstile.remove(tsWidgetId); } catch (e) {}
    tsToken = '';
    tsWidgetId = window.turnstile.render(t, {
      sitekey: RT.TURNSTILE_KEY, theme: 'dark', size: 'normal',
      callback: function (tk) { tsToken = tk; },
      'expired-callback': function () { tsToken = ''; },
      'error-callback': function () { tsToken = ''; }
    });
  }

  function resetTurnstile() {
    if (tsWidgetId !== null && window.turnstile) try { window.turnstile.reset(tsWidgetId); } catch (e) {}
    tsToken = '';
  }

  // ── Generate Preview ──

  if ($('btn-generate')) {
    $('btn-generate').addEventListener('click', function () {
      if (generating) return;
      var brief = $('brief') ? $('brief').value.trim() : '';
      if (!mood) { RT.toast('Select a mood.'); return; }
      if (!brief || brief.length < 10) { RT.toast('Write a longer story description.'); return; }
      if (!tsToken) { RT.toast('Complete the verification.'); return; }

      generating = true;
      RT.loading(true, 'Writing your screenplay...');
      RT.generatePreview(brief, mood, RT.language, tier).then(function (data) {
        generating = false;
        RT.loading(false);
        if (!data.scenes || !data.scenes.length) { RT.toast('No scenes returned.'); resetTurnstile(); return; }
        currentScenes = data.scenes;
        RT.renderScenes(data.scenes);
        var info = $('preview-tier-info');
        if (info) {
          var t = RT.TIERS.find(function (x) { return x.id === tier; });
          if (t) info.textContent = t.label + ' · ' + t.minutes + ' min · ' + t.scenes + ' scenes · ' + t.price;
        }
        RT.showScreen('preview');
        RT.toast('Script ready!', true);
        resetTurnstile();
      }).catch(function (err) {
        generating = false;
        RT.loading(false);
        RT.toast(err.message || 'Generation failed.');
        resetTurnstile();
      });
    });
  }

  // ── Free Preview Clip ──

  if ($('btn-preview-clip')) {
    $('btn-preview-clip').addEventListener('click', function () {
      if (!RT.isLoggedIn()) { RT.showScreen('auth'); showAuthForm('signup'); return; }
      if (RT.hasUsedPreview) { RT.toast('Free preview already used. Add credits.'); return; }
      if (!currentScenes || !currentScenes.length) { RT.toast('Generate a script first.'); return; }
      if (!RT.hasPhotos) { RT.toast('Upload photos first.'); RT.showScreen('setup'); return; }

      var scene = currentScenes[0];
      RT.loading(true, 'Creating your 10-second preview...');
      RT.generatePreviewClip(scene.direction || scene.description, scene.voiceover).then(function (data) {
        RT.loading(false);
        RT.hasUsedPreview = true;
        RT.toast('Preview clip ready!', true);
        var v = $('preview-video');
        if (v && data.clipUrl) { v.src = data.clipUrl; v.style.display = 'block'; v.play().catch(function () {}); }
      }).catch(function (err) {
        RT.loading(false);
        RT.toast(err.message || 'Preview failed.');
      });
    });
  }

  // ── Preview Actions ──

  if ($('btn-get-film')) {
    $('btn-get-film').addEventListener('click', function () {
      if (!RT.isLoggedIn()) { RT.showScreen('auth'); showAuthForm('signup'); return; }
      var t = RT.TIERS.find(function (x) { return x.id === tier; });
      if (!t) return;
      if (RT.credits >= t.credits) startFilm();
      else { RT.showScreen('credits'); renderCreditsScreen(); RT.toast('Need ' + t.credits + ' credits.'); }
    });
  }

  if ($('btn-retry')) {
    $('btn-retry').addEventListener('click', function () { RT.showScreen('create'); mountTurnstile(); });
  }

  // ── Film Creation ──

  function startFilm() {
    var brief = $('brief') ? $('brief').value.trim() : '';
    if (!brief || !mood) { RT.toast('Missing story details.'); return; }
    RT.loading(true, 'Starting your film...');
    RT.createFilm(brief, mood, RT.language, tier).then(function (data) {
      RT.loading(false);
      currentFilmId = data.filmId;
      RT.showScreen('rendering');
      startPolling(data.filmId);
    }).catch(function (err) {
      RT.loading(false);
      if (err.message.indexOf('Not enough credits') !== -1) {
        RT.showScreen('credits');
        renderCreditsScreen();
      } else RT.toast(err.message || 'Failed.');
    });
  }

  // ── Polling ──

  function startPolling(filmId) {
    updateRenderStep('writing');
    var msgs = {
      writing: 'Writing screenplay...', filming: 'Generating video scenes...',
      voiceover: 'Recording narration...', stitching: 'Assembling film...', composing: 'Final touches...'
    };
    RT.pollFilm(filmId, function (data) {
      updateRenderStep(data.status);
      var s = $('render-status');
      if (s) s.textContent = msgs[data.status] || data.status;
    }, function (data) {
      updateRenderStep('done');
      var v = $('film-video');
      if (v && data.videoUrl) v.src = data.videoUrl;
      var dl = $('btn-download');
      if (dl && data.videoUrl) dl.href = data.videoUrl;
      RT.renderShareButtons($('share-buttons'), data.videoUrl);
      RT.showScreen('player');
      RT.toast('Your film is ready!', true);
    }, function (err) {
      updateRenderStep('failed');
      RT.toast(err.message || 'Failed. Credits refunded.');
    });
  }

  function updateRenderStep(status) {
    var steps = { writing: 1, filming: 2, voiceover: 3, stitching: 4, composing: 4, done: 5, failed: 0 };
    var active = steps[status] || 0;
    for (var i = 1; i <= 5; i++) {
      var el = $('rs-' + i);
      if (!el) continue;
      el.classList.remove('active', 'done');
      if (active > 0 && i < active) el.classList.add('done');
      else if (i === active) el.classList.add('active');
    }
  }

  // ── Auth Forms ──

  function showAuthForm(form) {
    ['auth-login', 'auth-signup', 'auth-forgot', 'auth-reset'].forEach(function (f) {
      var el = $(f);
      if (el) el.classList.toggle('hide', f !== 'auth-' + form);
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
      RT.login(email, pass).then(function () {
        RT.loading(false);
        RT.toast('Welcome back!', true);
        afterAuth();
      }).catch(function (err) { RT.loading(false); RT.toast(err.message); });
    });
  }

  if ($('btn-signup')) {
    $('btn-signup').addEventListener('click', function () {
      var email = $('signup-email').value.trim();
      var pass = $('signup-pass').value;
      if (!email || !pass) { RT.toast('Fill in all fields.'); return; }
      if (pass.length < 6) { RT.toast('Password must be 6+ characters.'); return; }
      RT.loading(true, 'Creating account...');
      RT.signup(email, pass, RT.language).then(function () {
        RT.loading(false);
        RT.toast('Account created!', true);
        afterAuth();
      }).catch(function (err) { RT.loading(false); RT.toast(err.message); });
    });
  }

  if ($('btn-forgot')) {
    $('btn-forgot').addEventListener('click', function () {
      var email = $('forgot-email').value.trim();
      if (!email) { RT.toast('Enter your email.'); return; }
      RT.loading(true, 'Sending code...');
      RT.forgotPassword(email).then(function () {
        RT.loading(false);
        RT.toast('Check your email.', true);
        showAuthForm('reset');
      }).catch(function (err) { RT.loading(false); RT.toast(err.message); });
    });
  }

  if ($('btn-reset')) {
    $('btn-reset').addEventListener('click', function () {
      var email = $('forgot-email').value.trim();
      var code = $('reset-code').value.trim();
      var pass = $('reset-pass').value;
      if (!code || !pass) { RT.toast('Fill in all fields.'); return; }
      RT.loading(true, 'Resetting...');
      RT.resetPassword(email, code, pass).then(function () {
        RT.loading(false);
        RT.toast('Password reset! Log in.', true);
        showAuthForm('login');
      }).catch(function (err) { RT.loading(false); RT.toast(err.message); });
    });
  }

  function afterAuth() {
    if (photos.length > 0 && voiceBlob) uploadAssets();
    else if (RT.hasPhotos && RT.hasVoice) { RT.showScreen('create'); mountTurnstile(); }
    else RT.showScreen('setup');
  }

  // ── Credits ──

  function renderCreditsScreen() {
    var $amount = $('credit-amount');
    var $slider = $('credit-slider');
    RT.getCredits().catch(function () {});
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
      RT.addCredits(creditAmount).then(function (data) {
        RT.loading(false);
        if (data.url) window.location.href = data.url;
        else RT.toast('Payment setup failed.');
      }).catch(function (err) { RT.loading(false); RT.toast(err.message); });
    });
  }

  // ── Player ──

  if ($('btn-new-film')) {
    $('btn-new-film').addEventListener('click', function () { resetForm(); RT.showScreen('create'); mountTurnstile(); });
  }

  if ($('btn-dashboard')) {
    $('btn-dashboard').addEventListener('click', function () { RT.showScreen('dash'); loadDash(); });
  }

  // ── Dashboard ──

  function loadDash() {
    RT.getCredits().catch(function () {});
    RT.getFilms().then(function (data) {
      var list = $('dash-films');
      var empty = $('dash-empty');
      if (!list) return;
      list.innerHTML = '';
      var films = data.films || [];
      if (films.length === 0) { if (empty) empty.classList.remove('hide'); return; }
      if (empty) empty.classList.add('hide');
      films.forEach(function (film) {
        var card = RT.renderFilmCard(film);
        card.addEventListener('click', function () {
          if (film.status === 'done' && film.video_url) {
            var v = $('film-video'); if (v) v.src = film.video_url;
            var dl = $('btn-download'); if (dl) dl.href = film.video_url;
            RT.renderShareButtons($('share-buttons'), film.video_url);
            RT.showScreen('player');
          } else if (film.status === 'failed') {
            RT.toast('Failed. Credits refunded.');
          } else {
            currentFilmId = film.id;
            RT.showScreen('rendering');
            startPolling(film.id);
          }
        });
        list.appendChild(card);
      });
    }).catch(function (err) { RT.toast(err.message); });
  }

  if ($('btn-dash-new')) {
    $('btn-dash-new').addEventListener('click', function () { resetForm(); RT.showScreen('create'); mountTurnstile(); });
  }

  if ($('btn-dash-credits')) {
    $('btn-dash-credits').addEventListener('click', function () { RT.showScreen('credits'); renderCreditsScreen(); });
  }

  if ($('btn-logout')) {
    $('btn-logout').addEventListener('click', function () { RT.logout(); RT.toast('Logged out.', true); RT.showScreen('landing'); });
  }

  // ── Reset Form ──

  function resetForm() {
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

  // ── Payment Return ──

  (function () {
    var p = new URLSearchParams(window.location.search);
    if (p.get('payment') === 'success') {
      RT.toast('Payment successful! Credits added.', true);
      window.history.replaceState({}, '', '/');
      if (RT.isLoggedIn()) RT.getCredits().then(function () { RT.showScreen('create'); mountTurnstile(); });
    } else if (p.get('payment') === 'cancel') {
      RT.toast('Payment cancelled.');
      window.history.replaceState({}, '', '/');
    }
  })();

  // ── Auto-load ──

  if (RT.isLoggedIn()) {
    RT.getProfile().then(function () { RT.updateCredits(RT.credits); }).catch(function () { RT.clearAuth(); });
  }

})();
