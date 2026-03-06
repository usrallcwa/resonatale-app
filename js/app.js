(function () {
  'use strict';

  RT.checkSetup = function () {
    var hasP = RT.photos.length >= 1;
    var hasV = !!RT.voiceBlob;
    var btn = RT.$('btn-save-setup');
    if (btn) btn.disabled = !(hasP && hasV);
    var st = RT.$('setup-status');
    if (st) {
      if (hasP && hasV) st.textContent = 'Ready to continue!';
      else if (hasP) st.textContent = 'Now record your voice.';
      else st.textContent = 'Upload at least 1 photo.';
    }
  };

  function uploadAssets() {
    RT.loading(true, 'Uploading your photos...');
    RT.uploadPhotos(RT.photos).then(function () {
      RT.loading(true, 'Cloning your voice...');
      return new Promise(function (resolve) {
        var reader = new FileReader();
        reader.onload = function (e) { resolve(e.target.result); };
        reader.readAsDataURL(RT.voiceBlob);
      });
    }).then(function (b64) {
      return RT.uploadVoice(b64);
    }).then(function (data) {
      RT.loading(false);
      RT.hasPhotos = true;
      RT.hasVoice = data.cloned;
      RT.toast(data.cloned ? 'Setup complete!' : 'Photos saved. Voice processing.', true);
      RT.showScreen('create');
      RT.mountTurnstile();
    }).catch(function (err) {
      RT.loading(false);
      RT.toast(err.message || 'Upload failed.');
    });
  }

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

  var saveBtn = RT.$('btn-save-setup');
  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      if (RT.photos.length === 0) { RT.toast('Upload at least 1 photo.'); return; }
      if (!RT.voiceBlob) { RT.toast('Record your voice.'); return; }
      if (!RT.isLoggedIn()) { RT.showScreen('auth'); RT.showAuthForm('signup'); return; }
      uploadAssets();
    });
  }

  var startBtn = RT.$('btn-start');
  if (startBtn) {
    startBtn.addEventListener('click', function () {
      if (RT.isLoggedIn()) {
        RT.getProfile().then(function () {
          if (RT.hasPhotos && RT.hasVoice) {
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

  var backBtn = RT.$('back-to-landing');
  if (backBtn) {
    backBtn.addEventListener('click', function () {
      RT.showScreen('landing');
    });
  }

  if (RT.isLoggedIn()) {
    RT.getProfile().then(function () {
      RT.updateCredits(RT.credits);
    }).catch(function () {
      RT.clearAuth();
    });
  }

})();