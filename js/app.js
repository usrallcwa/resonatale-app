(function () {
  'use strict';

  // ── Setup Progress Check (voice only) ──

  RT.checkSetup = function () {
    var hasV = !!RT.voiceBlob;
    var btn = RT.$('btn-save-setup');
    if (btn) btn.disabled = !hasV;
    var st = RT.$('setup-status');
    if (st) {
      if (hasV) st.textContent = 'Ready to continue!';
      else st.textContent = 'Record your voice to get started.';
    }
  };

  // ── Upload Voice Only ──

  function uploadVoice() {
    RT.loading(true, 'Cloning your voice...');
    new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onload = function (e) { resolve(e.target.result); };
      reader.readAsDataURL(RT.voiceBlob);
    }).then(function (b64) {
      return RT.uploadVoice(b64);
    }).then(function (data) {
      RT.loading(false);
      RT.hasVoice = data.cloned;
      RT.toast(data.cloned ? 'Voice cloned!' : 'Voice saved. Processing...', true);
      RT.showScreen('create');
      RT.mountTurnstile();
    }).catch(function (err) {
      RT.loading(false);
      RT.toast(err.message || 'Voice upload failed.');
    });
  }

  // ── After Auth ──

  RT.afterAuth = function () {
    if (RT.voiceBlob) {
      uploadVoice();
    } else if (RT.hasVoice) {
      RT.showScreen('create');
      RT.mountTurnstile();
    } else {
      RT.showScreen('setup');
    }
  };

  // ── Save Setup Button (voice only) ──

  var saveBtn = RT.$('btn-save-setup');
  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      if (!RT.voiceBlob) { RT.toast('Record your voice first.'); return; }
      if (!RT.isLoggedIn()) { RT.showScreen('auth'); RT.showAuthForm('signup'); return; }
      uploadVoice();
    });
  }

  // ── Start Button ──

  var startBtn = RT.$('btn-start');
  if (startBtn) {
    startBtn.addEventListener('click', function () {
      if (RT.isLoggedIn()) {
        RT.getProfile().then(function () {
          if (RT.hasVoice) {
            RT.showScreen('create');
            RT.mountTurnstile();
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
  }

  // ── Back Button ──

  var backBtn = RT.$('back-to-landing');
  if (backBtn) {
    backBtn.addEventListener('click', function () {
      RT.showScreen('landing');
    });
  }

  // ── Auto-load Profile ──

  if (RT.isLoggedIn()) {
    RT.getProfile().then(function () {
      RT.updateCredits(RT.credits);
    }).catch(function () {
      RT.clearAuth();
    });
  }

})();