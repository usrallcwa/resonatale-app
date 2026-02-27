(function () {
  'use strict';

  // ── State ──
  var mood = '';
  var duration = '1';
  var tsToken = '';
  var tsWidgetId = null;
  var generating = false;

  // ── DOM ──
  var screens = {
    landing:   document.getElementById('s-landing'),
    setup:     document.getElementById('s-setup'),
    preview:   document.getElementById('s-preview'),
    auth:      document.getElementById('s-auth'),
    payment:   document.getElementById('s-payment'),
    rendering: document.getElementById('s-rendering'),
    player:    document.getElementById('s-player'),
    dash:      document.getElementById('s-dash')
  };

  var $moodChips  = document.getElementById('mood-chips');
  var $langSel    = document.getElementById('lang-sel');
  var $brief      = document.getElementById('brief');
  var $durRow     = document.getElementById('dur-row');
  var $durPrice   = document.getElementById('dur-price');
  var $previewScenes = document.getElementById('preview-scenes');

  // Buttons
  var $btnStart   = document.getElementById('btn-start');
  var $btnPreview = document.getElementById('btn-preview');
  var $btnGetFilm = document.getElementById('btn-get-film');
  var $btnRetry   = document.getElementById('btn-retry');
  var $btnNewFilm = document.getElementById('btn-new-film');
  var $btnDashNew = document.getElementById('btn-dash-new');

  // Photo
  var $photoZone       = document.getElementById('photo-zone');
  var $photoInput      = document.getElementById('photo-input');
  var $photoPreview    = document.getElementById('photo-preview');
  var $photoPlaceholder = document.getElementById('photo-placeholder');

  // Voice
  var $btnRecord    = document.getElementById('btn-record');
  var $btnReRecord  = document.getElementById('btn-re-record');
  var $voiceInput   = document.getElementById('voice-input');
  var $voiceIdle    = document.getElementById('voice-idle');
  var $voiceRecording = document.getElementById('voice-recording');
  var $voiceDone    = document.getElementById('voice-done');
  var $recTime      = document.getElementById('rec-time');

  // Auth
  var $btnLogin    = document.getElementById('btn-login');
  var $btnSignup   = document.getElementById('btn-signup');
  var $btnForgot   = document.getElementById('btn-forgot');
  var $btnReset    = document.getElementById('btn-reset');
  var $showSignup  = document.getElementById('show-signup');
  var $showLogin   = document.getElementById('show-login');
  var $showLogin2  = document.getElementById('show-login2');
  var $showForgot  = document.getElementById('show-forgot');
  var $btnLogout   = document.getElementById('btn-logout');
  var $btnAddCredits = document.getElementById('btn-add-credits');

  // Auth forms
  var $authLogin  = document.getElementById('auth-login');
  var $authSignup = document.getElementById('auth-signup');
  var $authForgot = document.getElementById('auth-forgot');
  var $authReset  = document.getElementById('auth-reset');

  // Voice recording state
  var mediaRecorder = null;
  var audioChunks = [];
  var voiceBlob = null;
  var photoFile = null;
  var recInterval = null;
  var recSeconds = 0;

  // ══════════════════════════════════════
  // NAVIGATION
  // ══════════════════════════════════════

  function goTo(screenId) {
    Object.keys(screens).forEach(function (key) {
      if (screens[key]) {
        screens[key].classList.remove('active');
      }
    });
    if (screens[screenId]) {
      screens[screenId].classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Back buttons
  document.querySelectorAll('.back-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = btn.getAttribute('data-to');
      if (target) goTo(target);
    });
  });

  // ══════════════════════════════════════
  // LANDING → SETUP
  // ══════════════════════════════════════

  if ($btnStart) {
    $btnStart.addEventListener('click', function () {
      goTo('setup');
      mountTurnstile();
    });
  }

  // ══════════════════════════════════════
  // PHOTO UPLOAD
  // ══════════════════════════════════════

  if ($photoZone && $photoInput) {
    $photoZone.addEventListener('click', function () {
      $photoInput.click();
    });

    $photoInput.addEventListener('change', function () {
      var file = $photoInput.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        RT.toast('Please upload an image file.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        RT.toast('Image must be under 10MB.');
        return;
      }
      photoFile = file;
      var reader = new FileReader();
      reader.onload = function (e) {
        $photoPreview.src = e.target.result;
        $photoPreview.classList.add('show');
        $photoPlaceholder.style.display = 'none';
      };
      reader.readAsDataURL(file);
    });
  }

  // ══════════════════════════════════════
  // VOICE RECORDING
  // ══════════════════════════════════════

  function showVoiceState(state) {
    $voiceIdle.classList.add('hide');
    $voiceRecording.classList.add('hide');
    $voiceDone.classList.add('hide');
    if (state === 'idle') $voiceIdle.classList.remove('hide');
    if (state === 'recording') $voiceRecording.classList.remove('hide');
    if (state === 'done') $voiceDone.classList.remove('hide');
  }

  if ($btnRecord) {
    $btnRecord.addEventListener('mousedown', startRecording);
    $btnRecord.addEventListener('touchstart', function (e) {
      e.preventDefault();
      startRecording();
    });
    $btnRecord.addEventListener('mouseup', stopRecording);
    $btnRecord.addEventListener('touchend', stopRecording);
    $btnRecord.addEventListener('mouseleave', stopRecording);
  }

  function startRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') return;

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function (stream) {
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = function (e) {
          audioChunks.push(e.data);
        };
        mediaRecorder.onstop = function () {
          stream.getTracks().forEach(function (t) { t.stop(); });
          voiceBlob = new Blob(audioChunks, { type: 'audio/webm' });
          showVoiceState('done');
          clearInterval(recInterval);
        };
        mediaRecorder.start();
        showVoiceState('recording');
        recSeconds = 0;
        $recTime.textContent = '0:00';
        recInterval = setInterval(function () {
          recSeconds++;
          var m = Math.floor(recSeconds / 60);
          var s = recSeconds % 60;
          $recTime.textContent = m + ':' + (s < 10 ? '0' : '') + s;
        }, 1000);
      })
      .catch(function () {
        RT.toast('Microphone access denied.');
      });
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  }

  if ($btnReRecord) {
    $btnReRecord.addEventListener('click', function () {
      voiceBlob = null;
      showVoiceState('idle');
    });
  }

  if ($voiceInput) {
    $voiceInput.addEventListener('change', function () {
      var file = $voiceInput.files[0];
      if (!file) return;
      voiceBlob = file;
      showVoiceState('done');
    });
  }

  // ══════════════════════════════════════
  // LANGUAGE
  // ══════════════════════════════════════

  var savedLang = localStorage.getItem('rt_lang');
  if (savedLang && $langSel.querySelector('option[value="' + savedLang + '"]')) {
    $langSel.value = savedLang;
  }
  $langSel.addEventListener('change', function () {
    localStorage.setItem('rt_lang', $langSel.value);
  });

  // ══════════════════════════════════════
  // MOOD CHIPS
  // ══════════════════════════════════════

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

  // ══════════════════════════════════════
  // DURATION
  // ══════════════════════════════════════

  var DURATION_PRICES = {
    '1': 'Free preview included',
    '5': '50 credits',
    '10': '100 credits'
  };

  function renderDuration() {
    $durRow.innerHTML = '';
    RT.DURATIONS.forEach(function (d) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dur-opt' + (duration === d.value ? ' on' : '');
      btn.textContent = d.label;
      btn.addEventListener('click', function () {
        duration = d.value;
        renderDuration();
        if ($durPrice) $durPrice.textContent = DURATION_PRICES[d.value] || '';
      });
      $durRow.appendChild(btn);
    });
  }
  renderDuration();

  // ══════════════════════════════════════
  // TURNSTILE
  // ══════════════════════════════════════

  function mountTurnstile() {
    var target = document.getElementById('ts-target');
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
  // GENERATE PREVIEW
  // ══════════════════════════════════════

  if ($btnPreview) {
    $btnPreview.addEventListener('click', function () {
      if (generating) return;
      if (!mood) { RT.toast('Select a mood.'); return; }
      if (!$brief.value.trim()) { RT.toast('Describe your story.'); return; }
      if ($brief.value.trim().length < 10) { RT.toast('Story is too short. Add more detail.'); return; }
      if (!tsToken) { RT.toast('Complete the verification.'); return; }

      generating = true;
      RT.loading(true, 'Writing your screenplay...');
      $btnPreview.disabled = true;

      var payload = {
        brief: $brief.value.trim(),
        mood: mood,
        language: $langSel.value,
        durationMinutes: parseFloat(duration)
      };

      RT.generateScenes(payload,
        function (scenes) {
          generating = false;
          RT.loading(false);
          $btnPreview.disabled = false;

          // Render scenes in preview screen
          renderPreviewScenes(scenes);

          // Store for later
          window._lastScenes = scenes;
          window._lastPayload = payload;

          // Save to journal
          RT.saveToJournal(mood, $langSel.value, $brief.value.trim(), duration, scenes);

          RT.toast('Preview ready!', true);
          resetTurnstile();
          goTo('preview');
        },
        function (errMsg) {
          generating = false;
          RT.loading(false);
          $btnPreview.disabled = false;
          RT.toast(errMsg);
          resetTurnstile();
        }
      );
    });
  }

  // ══════════════════════════════════════
  // RENDER PREVIEW SCENES
  // ══════════════════════════════════════

  function renderPreviewScenes(scenes) {
    if (!$previewScenes) return;
    $previewScenes.innerHTML = '';

    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i];
      var card = document.createElement('div');
      card.className = 'scene-card';

      var html =
        '<div class="scene-num">Scene ' + (i + 1) + ' of ' + scenes.length + '</div>' +
        '<div class="scene-title">' + RT.esc(s.title || 'Untitled') + '</div>' +
        '<div class="scene-block">' +
          '<div class="scene-block-label">Visual Direction</div>' +
          '<div class="scene-block-text">' + RT.esc(s.description || '') + '</div>' +
        '</div>' +
        '<div class="scene-block">' +
          '<div class="scene-block-label">Voiceover</div>' +
          '<div class="scene-block-text voiceover-text">' + RT.esc(s.voiceover || '') + '</div>' +
        '</div>';

      if (s.imagePrompt) {
        html +=
          '<div class="scene-block">' +
            '<div class="scene-block-label">Image Prompt</div>' +
            '<div class="scene-block-text img-prompt">' + RT.esc(s.imagePrompt) + '</div>' +
          '</div>';
      }

      card.innerHTML = html;
      $previewScenes.appendChild(card);
    }
  }

  // ══════════════════════════════════════
  // PREVIEW ACTIONS
  // ══════════════════════════════════════

  if ($btnGetFilm) {
    $btnGetFilm.addEventListener('click', function () {
      // For now, go to auth — later check if logged in
      goTo('auth');
    });
  }

  if ($btnRetry) {
    $btnRetry.addEventListener('click', function () {
      goTo('setup');
      mountTurnstile();
    });
  }

  // ══════════════════════════════════════
  // AUTH FORM SWITCHING
  // ══════════════════════════════════════

  function showAuthForm(form) {
    $authLogin.classList.add('hide');
    $authSignup.classList.add('hide');
    $authForgot.classList.add('hide');
    $authReset.classList.add('hide');
    form.classList.remove('hide');
  }

  if ($showSignup) $showSignup.addEventListener('click', function () { showAuthForm($authSignup); });
  if ($showLogin) $showLogin.addEventListener('click', function () { showAuthForm($authLogin); });
  if ($showLogin2) $showLogin2.addEventListener('click', function () { showAuthForm($authLogin); });
  if ($showForgot) $showForgot.addEventListener('click', function () { showAuthForm($authForgot); });

  // Auth buttons — placeholder actions
  if ($btnLogin) {
    $btnLogin.addEventListener('click', function () {
      var email = document.getElementById('login-email').value.trim();
      var pass = document.getElementById('login-pass').value;
      if (!email || !pass) { RT.toast('Fill in all fields.'); return; }
      RT.toast('Login coming soon — proceeding to payment.', true);
      goTo('payment');
    });
  }

  if ($btnSignup) {
    $btnSignup.addEventListener('click', function () {
      var email = document.getElementById('signup-email').value.trim();
      var pass = document.getElementById('signup-pass').value;
      if (!email || !pass) { RT.toast('Fill in all fields.'); return; }
      if (pass.length < 6) { RT.toast('Password must be 6+ characters.'); return; }
      RT.toast('Signup coming soon — proceeding to payment.', true);
      goTo('payment');
    });
  }

  if ($btnForgot) {
    $btnForgot.addEventListener('click', function () {
      var email = document.getElementById('forgot-email').value.trim();
      if (!email) { RT.toast('Enter your email.'); return; }
      RT.toast('Reset code sent (coming soon).', true);
      showAuthForm($authReset);
    });
  }

  if ($btnReset) {
    $btnReset.addEventListener('click', function () {
      RT.toast('Password reset coming soon.', true);
      showAuthForm($authLogin);
    });
  }

  if ($btnLogout) {
    $btnLogout.addEventListener('click', function () {
      RT.toast('Logged out.', true);
      goTo('landing');
    });
  }

  // ══════════════════════════════════════
  // DASHBOARD / PLAYER / NEW FILM
  // ══════════════════════════════════════

  if ($btnNewFilm) {
    $btnNewFilm.addEventListener('click', function () {
      goTo('setup');
      resetForm();
    });
  }

  if ($btnDashNew) {
    $btnDashNew.addEventListener('click', function () {
      goTo('setup');
      resetForm();
    });
  }

  if ($btnAddCredits) {
    $btnAddCredits.addEventListener('click', function () {
      goTo('payment');
    });
  }

  // ══════════════════════════════════════
  // RESET FORM
  // ══════════════════════════════════════

  function resetForm() {
    $brief.value = '';
    mood = '';
    photoFile = null;
    voiceBlob = null;

    // Reset photo
    if ($photoPreview) {
      $photoPreview.classList.remove('show');
      $photoPreview.src = '';
    }
    if ($photoPlaceholder) $photoPlaceholder.style.display = '';
    if ($photoInput) $photoInput.value = '';

    // Reset voice
    showVoiceState('idle');

    // Reset chips
    var all = $moodChips.querySelectorAll('.chip');
    for (var i = 0; i < all.length; i++) all[i].classList.remove('on');

    // Reset turnstile
    resetTurnstile();
    mountTurnstile();
  }

  // ══════════════════════════════════════
  // GLOBAL ERROR HANDLING
  // ══════════════════════════════════════

  window.addEventListener('error', function () {
    if (!generating) RT.toast('Something went wrong.');
  });

  window.addEventListener('unhandledrejection', function (e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!generating) RT.toast('Network error. Check connection.');
  });

})();
