(function () {
  'use strict';

  // ══════════════════════════════════════
  // STATE
  // ══════════════════════════════════════

  var mood = '';
  var duration = '1';
  var tsToken = '';
  var tsWidgetId = null;
  var generating = false;
  var currentScenes = null;
  var photoFile = null;
  var voiceBlob = null;
  var mediaRecorder = null;
  var recordChunks = [];
  var recordTimer = null;
  var recordStart = 0;
  var selectedPackage = 'creator';

  // ══════════════════════════════════════
  // DOM REFS
  // ══════════════════════════════════════

  var $ = function (id) { return document.getElementById(id); };

  var $langSel    = $('lang-sel');
  var $brief      = $('brief');
  var $durRow     = $('dur-row');
  var $durPrice   = $('dur-price');
  var $moodChips  = $('mood-chips');
  var $genBtn     = $('btn-preview');
  var $photoZone  = $('photo-zone');
  var $photoInput = $('photo-input');
  var $photoPreview = $('photo-preview');
  var $photoPlaceholder = $('photo-placeholder');
  var $voiceInput = $('voice-input');
  var $btnRecord  = $('btn-record');
  var $recTime    = $('rec-time');
  var $packages   = $('packages');

  // ══════════════════════════════════════
  // INIT
  // ══════════════════════════════════════

  // Restore language
  var savedLang = localStorage.getItem('rt_lang');
  if (savedLang && $langSel.querySelector('option[value="' + savedLang + '"]')) {
    $langSel.value = savedLang;
  }
  $langSel.addEventListener('change', function () {
    localStorage.setItem('rt_lang', $langSel.value);
  });

  // ══════════════════════════════════════
  // NAVIGATION
  // ══════════════════════════════════════

  $('btn-start').addEventListener('click', function () {
    RT.showScreen('setup');
    mountTurnstile();
  });

  // Back buttons
  document.getElementById('back-to-landing').addEventListener('click', function () {
    RT.showScreen('landing');
  });

  // ══════════════════════════════════════
  // PHOTO UPLOAD
  // ══════════════════════════════════════

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

  // ══════════════════════════════════════
  // VOICE RECORDING
  // ══════════════════════════════════════

  function showVoiceState(state) {
    $('voice-idle').classList.add('hide');
    $('voice-recording').classList.add('hide');
    $('voice-done').classList.add('hide');
    $(state).classList.remove('hide');
  }

  // Hold-to-record
  var isRecording = false;

  $btnRecord.addEventListener('mousedown', startRecording);
  $btnRecord.addEventListener('touchstart', function (e) {
    e.preventDefault();
    startRecording();
  });

  document.addEventListener('mouseup', stopRecording);
  document.addEventListener('touchend', stopRecording);

  function startRecording() {
    if (isRecording) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      RT.toast('Microphone not supported in this browser.');
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
        };

        mediaRecorder.start();
        showVoiceState('voice-recording');

        recordStart = Date.now();
        recordTimer = setInterval(function () {
          var elapsed = Math.floor((Date.now() - recordStart) / 1000);
          var m = Math.floor(elapsed / 60);
          var s = elapsed % 60;
          $recTime.textContent = m + ':' + (s < 10 ? '0' : '') + s;
        }, 200);
      })
      .catch(function () {
        RT.toast('Microphone access denied.');
      });
  }

  function stopRecording() {
    if (!isRecording || !mediaRecorder) return;
    isRecording = false;
    if (mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  }

  // Re-record
  $('btn-re-record').addEventListener('click', function () {
    voiceBlob = null;
    showVoiceState('voice-idle');
    $recTime.textContent = '0:00';
  });

  // Upload audio file
  $voiceInput.addEventListener('change', function () {
    var file = $voiceInput.files[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      RT.toast('Please upload an audio file.');
      return;
    }
    voiceBlob = file;
    showVoiceState('voice-done');
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
  // DURATION TOGGLE
  // ══════════════════════════════════════

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
        if ($durPrice) $durPrice.textContent = d.price;
      });
      $durRow.appendChild(btn);
    });
  }
  renderDuration();

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
  // GENERATE PREVIEW
  // ══════════════════════════════════════

  $genBtn.addEventListener('click', function () {
    if (generating) return;
    if (!mood) { RT.toast('Select a mood.'); return; }
    if (!$brief.value.trim()) { RT.toast('Enter your story.'); return; }
    if ($brief.value.trim().length < 10) { RT.toast('Story is too short. Add more detail.'); return; }
    if (!tsToken) { RT.toast('Complete the verification.'); return; }

    generating = true;
    RT.loading(true, 'Writing your screenplay...', [
      'Analyzing your story brief...',
      'Crafting cinematic scenes...',
      'Generating image prompts...'
    ]);
    $genBtn.disabled = true;

    var payload = {
      brief: $brief.value.trim(),
      mood: mood,
      language: $langSel.value,
      durationMinutes: parseFloat(duration)
    };

    RT.generateScenes(payload)
      .then(function (data) {
        generating = false;
        RT.loading(false);
        $genBtn.disabled = false;

        if (!data.scenes || !data.scenes.length) {
          RT.toast('No scenes returned. Try again.');
          resetTurnstile();
          return;
        }

        currentScenes = data.scenes;

        // Save to journal
        RT.saveToJournal({
          mood: mood,
          language: $langSel.value,
          brief: $brief.value.trim(),
          duration: duration,
          scenes: data.scenes
        });

        // Render scenes on preview screen
        RT.renderScenes(data.scenes);

        // Show preview screen
        RT.showScreen('preview');
        RT.toast('Preview ready!', true);
        resetTurnstile();
      })
      .catch(function (err) {
        generating = false;
        RT.loading(false);
        $genBtn.disabled = false;
        RT.toast(err.message || 'Something went wrong.');
        resetTurnstile();
      });
  });

  // ══════════════════════════════════════
  // PREVIEW ACTIONS
  // ══════════════════════════════════════

  $('btn-get-film').addEventListener('click', function () {
    if (RT.isLoggedIn()) {
      RT.showScreen('payment');
      renderPackages();
      loadBalance();
    } else {
      RT.showScreen('auth');
      showAuthForm('login');
    }
  });

  $('btn-retry').addEventListener('click', function () {
    RT.showScreen('setup');
    mountTurnstile();
  });

  // ══════════════════════════════════════
  // AUTH
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

  $('show-signup').addEventListener('click', function () { showAuthForm('signup'); });
  $('show-login').addEventListener('click', function () { showAuthForm('login'); });
  $('show-forgot').addEventListener('click', function () { showAuthForm('forgot'); });
  $('show-login2').addEventListener('click', function () { showAuthForm('login'); });

  // Login
  $('btn-login').addEventListener('click', function () {
    var email = $('login-email').value.trim();
    var pass = $('login-pass').value;
    if (!email || !pass) { RT.toast('Fill in all fields.'); return; }

    RT.loading(true, 'Logging in...');
    RT.login(email, pass)
      .then(function () {
        RT.loading(false);
        RT.toast('Welcome back!', true);
        RT.showScreen('payment');
        renderPackages();
        loadBalance();
      })
      .catch(function (err) {
        RT.loading(false);
        RT.toast(err.message || 'Login failed.');
      });
  });

  // Signup
  $('btn-signup').addEventListener('click', function () {
    var email = $('signup-email').value.trim();
    var pass = $('signup-pass').value;
    if (!email || !pass) { RT.toast('Fill in all fields.'); return; }
    if (pass.length < 6) { RT.toast('Password must be 6+ characters.'); return; }

    RT.loading(true, 'Creating account...');
    RT.signup(email, pass)
      .then(function () {
        RT.loading(false);
        RT.toast('Account created!', true);
        RT.showScreen('payment');
        renderPackages();
        loadBalance();
      })
      .catch(function (err) {
        RT.loading(false);
        RT.toast(err.message || 'Signup failed.');
      });
  });

  // Forgot password
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
        RT.toast(err.message || 'Failed to send code.');
      });
  });

  // Reset password
  $('btn-reset').addEventListener('click', function () {
    var code = $('reset-code').value.trim();
    var pass = $('reset-pass').value;
    var email = $('forgot-email').value.trim();
    if (!code || !pass) { RT.toast('Fill in all fields.'); return; }

    RT.loading(true, 'Resetting password...');
    RT.resetPassword(email, code, pass)
      .then(function () {
        RT.loading(false);
        RT.toast('Password reset! Log in now.', true);
        showAuthForm('login');
      })
      .catch(function (err) {
        RT.loading(false);
        RT.toast(err.message || 'Reset failed.');
      });
  });

  // ══════════════════════════════════════
  // PAYMENT
  // ══════════════════════════════════════

  function renderPackages() {
    if (!$packages) return;
    $packages.innerHTML = '';

    RT.PACKAGES.forEach(function (pkg) {
      var card = document.createElement('div');
      card.className = 'pkg-card' + (selectedPackage === pkg.id ? ' selected' : '') + (pkg.popular ? ' popular' : '');
      card.innerHTML =
        (pkg.popular ? '<div class="pkg-badge">Most Popular</div>' : '') +
        '<div class="pkg-top">' +
          '<div class="pkg-label">' + RT.esc(pkg.label) + '</div>' +
          '<div class="pkg-desc">' + RT.esc(pkg.desc) + '</div>' +
        '</div>' +
        '<div class="pkg-price">$' + (pkg.price / 100).toFixed(2) + '</div>';

      card.addEventListener('click', function () {
        selectedPackage = pkg.id;
        renderPackages();
      });
      $packages.appendChild(card);
    });

    // Buy button
    var buyBtn = document.createElement('button');
    buyBtn.className = 'btn-primary';
    buyBtn.textContent = 'Purchase Credits';
    buyBtn.style.marginTop = '16px';
    buyBtn.addEventListener('click', handleCheckout);
    $packages.appendChild(buyBtn);
  }

  function handleCheckout() {
    RT.loading(true, 'Creating checkout...');
    RT.createCheckout(selectedPackage)
      .then(function (data) {
        RT.loading(false);
        if (data.url) {
          window.location.href = data.url;
        } else {
          RT.toast('Checkout created.', true);
          startRender();
        }
      })
      .catch(function (err) {
        RT.loading(false);
        RT.toast(err.message || 'Checkout failed.');
      });
  }

  function loadBalance() {
    RT.getBalance()
      .then(function (data) {
        var credits = data.credits || 0;
        var $payBal = $('pay-balance');
        var $dashCredits = $('dash-credits');
        if ($payBal) $payBal.textContent = credits;
        if ($dashCredits) $dashCredits.textContent = credits;
      })
      .catch(function () {});
  }

  // ══════════════════════════════════════
  // RENDERING
  // ══════════════════════════════════════

  function startRender() {
    RT.showScreen('rendering');
    updateRenderStep(1);

    // Simulate progress (replace with real polling later)
    var steps = [
      { step: 1, delay: 0, msg: 'Writing screenplay...' },
      { step: 2, delay: 3000, msg: 'Painting scenes...' },
      { step: 3, delay: 8000, msg: 'Recording voiceover...' },
      { step: 4, delay: 14000, msg: 'Bringing art to life...' },
      { step: 5, delay: 20000, msg: 'Composing final film...' }
    ];

    steps.forEach(function (s) {
      setTimeout(function () {
        updateRenderStep(s.step);
        $('render-status').textContent = s.msg;
      }, s.delay);
    });
  }

  function updateRenderStep(activeStep) {
    for (var i = 1; i <= 5; i++) {
      var el = $('rs-' + i);
      if (!el) continue;
      el.classList.remove('active', 'done');
      if (i < activeStep) el.classList.add('done');
      else if (i === activeStep) el.classList.add('active');
    }
  }

  // ══════════════════════════════════════
  // PLAYER
  // ══════════════════════════════════════

  $('btn-new-film').addEventListener('click', function () {
    resetForm();
    RT.showScreen('landing');
  });

  // ══════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════

  $('btn-dash-new').addEventListener('click', function () {
    resetForm();
    RT.showScreen('setup');
    mountTurnstile();
  });

  $('btn-add-credits').addEventListener('click', function () {
    RT.showScreen('payment');
    renderPackages();
    loadBalance();
  });

  $('btn-logout').addEventListener('click', function () {
    RT.logout();
    RT.toast('Logged out.', true);
    RT.showScreen('landing');
  });

  // ══════════════════════════════════════
  // RESET FORM
  // ══════════════════════════════════════

  function resetForm() {
    mood = '';
    duration = '1';
    currentScenes = null;
    photoFile = null;
    voiceBlob = null;
    $brief.value = '';
    $photoPreview.classList.remove('show');
    $photoPreview.src = '';
    $photoPlaceholder.style.display = '';
    showVoiceState('voice-idle');
    $recTime.textContent = '0:00';
    renderDuration();
    var all = $moodChips.querySelectorAll('.chip');
    for (var i = 0; i < all.length; i++) all[i].classList.remove('on');
    resetTurnstile();
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

  // ══════════════════════════════════════
  // AUTO-CHECK AUTH ON LOAD
  // ══════════════════════════════════════

  if (RT.isLoggedIn()) {
    // Could auto-redirect to dashboard
    // RT.showScreen('dash');
  }

  // ══════════════════════════════════════
  // RETURNING USER — LOAD PROFILE
  // ══════════════════════════════════════

  function loadProfile() {
    if (!RT.isLoggedIn()) return;

    fetch(RT.API_BASE + '/profile', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + RT.authToken
      }
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.error) return;

      // Update credits everywhere
      var $payBal = document.getElementById('pay-balance');
      var $dashCredits = document.getElementById('dash-credits');
      if ($payBal) $payBal.textContent = data.credits || 0;
      if ($dashCredits) $dashCredits.textContent = data.credits || 0;

      // If they already have photo + voice, skip upload sections
      if (data.hasPhoto && data.hasVoice) {
        var photoSection = $photoZone ? $photoZone.closest('.section') : null;
        var voiceSection = document.getElementById('voice-zone') ? document.getElementById('voice-zone').closest('.section') : null;

        if (photoSection) {
          photoSection.innerHTML =
            '<label class="label">Your Photo</label>' +
            '<div class="returning-asset">' +
              '<span class="voice-check">✓</span>' +
              '<span>Photo on file</span>' +
              '<button type="button" class="btn-text" id="btn-change-photo">Change</button>' +
            '</div>';

          var changePhotoBtn = document.getElementById('btn-change-photo');
          if (changePhotoBtn) {
            changePhotoBtn.addEventListener('click', function () {
              // Rebuild photo upload
              location.reload();
            });
          }
        }

        if (voiceSection) {
          voiceSection.innerHTML =
            '<label class="label">Your Voice</label>' +
            '<div class="returning-asset">' +
              '<span class="voice-check">✓</span>' +
              '<span>Voice clone ready</span>' +
              '<button type="button" class="btn-text" id="btn-change-voice">Change</button>' +
            '</div>';

          var changeVoiceBtn = document.getElementById('btn-change-voice');
          if (changeVoiceBtn) {
            changeVoiceBtn.addEventListener('click', function () {
              location.reload();
            });
          }
        }
      }
    })
    .catch(function () {});
  }

  // ══════════════════════════════════════
  // UPLOAD ASSETS TO SERVER AFTER GENERATE
  // ══════════════════════════════════════

  function uploadAssetsIfNeeded() {
    if (!RT.isLoggedIn()) return Promise.resolve();

    var promises = [];

    // Upload photo
    if (photoFile) {
      var photoPromise = new Promise(function (resolve) {
        var reader = new FileReader();
        reader.onload = function (e) {
          fetch(RT.API_BASE + '/profile/photo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + RT.authToken
            },
            body: JSON.stringify({ photo: e.target.result })
          }).then(function () { resolve(); }).catch(function () { resolve(); });
        };
        reader.readAsDataURL(photoFile);
      });
      promises.push(photoPromise);
    }

    // Upload voice
    if (voiceBlob) {
      var voicePromise = new Promise(function (resolve) {
        var reader = new FileReader();
        reader.onload = function (e) {
          fetch(RT.API_BASE + '/profile/voice', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + RT.authToken
            },
            body: JSON.stringify({ audio: e.target.result })
          }).then(function () { resolve(); }).catch(function () { resolve(); });
        };
        reader.readAsDataURL(voiceBlob);
      });
      promises.push(voicePromise);
    }

    return Promise.all(promises);
  }

  // Load profile on startup if logged in
  if (RT.isLoggedIn()) {
    loadProfile();
  }
  
})();
