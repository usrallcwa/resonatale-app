(function () {
  'use strict';

  // ── Profile ──

  RT.loadProfile = function () {
    if (!RT.isLoggedIn()) { RT.showScreen('auth'); RT.showAuthForm('login'); return; }

    RT.getProfile().then(function (d) {
      var el = RT.$('profile-email');
      if (el) el.textContent = d.email;

      var credits = RT.$('profile-credits');
      if (credits) credits.textContent = d.credits;

      var voiceStatus = RT.$('profile-voice-status');
      if (voiceStatus) {
        voiceStatus.textContent = d.hasVoice ? 'Voice cloned ✓' : 'Not recorded yet';
        voiceStatus.className = d.hasVoice ? 'profile-status ok' : 'profile-status';
      }

      var langStatus = RT.$('profile-lang');
      if (langStatus) {
        var lang = RT.LANGUAGES.find(function (l) { return l.code === d.language; });
        langStatus.textContent = lang ? lang.flag + ' ' + lang.name : d.language;
      }

      var since = RT.$('profile-since');
      if (since && d.createdAt) since.textContent = d.createdAt.split('T')[0];

      var refCode = RT.$('profile-ref-code');
      if (refCode) refCode.textContent = d.refCode || '—';

      // ── Update selfie status from server ──
      var selfieStatus = RT.$('profile-selfie-status');
      if (selfieStatus) {
        if (d.selfie_url || d.selfieUrl) {
          selfieStatus.textContent = 'Uploaded ✓';
          selfieStatus.className = 'profile-status ok';
          // Sync to local state so create screen knows
          RT.selfieUrl = d.selfie_url || d.selfieUrl;
          localStorage.setItem('rt_selfie', RT.selfieUrl);
        } else {
          selfieStatus.textContent = 'Not uploaded';
          selfieStatus.className = 'profile-status';
        }
      }

    }).catch(function (err) {
      RT.toast(err.message || 'Failed to load profile.');
    });
  };

  // ── Re-record voice ──

  var updateVoice = RT.$('btn-update-voice');
  if (updateVoice) {
    updateVoice.addEventListener('click', function () {
      RT.voiceBlob = null;
      RT.showScreen('setup');
    });
  }

  // ── Intro / Outro Upload ──

  function uploadVideo(type) {
    var inputId = type + '-upload';
    var input = RT.$(inputId);
    if (!input) return;

    var fresh = input.cloneNode(true);
    input.parentNode.replaceChild(fresh, input);

    fresh.click();
    fresh.addEventListener('change', function () {
      var file = fresh.files[0];
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) { RT.toast('Video must be under 20MB.'); return; }
      if (!file.type.includes('mp4'))    { RT.toast('Only MP4 files allowed.'); return; }

      RT.loading(true, 'Uploading ' + type + '...');

      var reader = new FileReader();
      reader.onload = function () {
        var base64 = reader.result.split(',')[1];
        RT.uploadIntroOutro(type, base64).then(function () {
          RT.loading(false);
          var status = RT.$('profile-' + type + '-status');
          if (status) {
            status.textContent = type.charAt(0).toUpperCase() + type.slice(1) + ' uploaded ✓';
            status.className = 'profile-status ok';
          }
          RT.toast(type.charAt(0).toUpperCase() + type.slice(1) + ' uploaded!', true);
        }).catch(function (e) {
          RT.loading(false);
          RT.toast(e.message || 'Upload failed.');
        });
      };
      reader.onerror = function () {
        RT.loading(false);
        RT.toast('Failed to read file.');
      };
      reader.readAsDataURL(file);
    });
  }

  var introBtn = RT.$('btn-upload-intro');
  if (introBtn) introBtn.addEventListener('click', function () { uploadVideo('intro'); });

  var outroBtn = RT.$('btn-upload-outro');
  if (outroBtn) outroBtn.addEventListener('click', function () { uploadVideo('outro'); });

  // ── Selfie Upload (Profile screen button) ──

  var selfieBtn   = RT.$('btn-upload-selfie');
  var selfieInput = RT.$('selfie-upload');

  if (selfieBtn && selfieInput) {
    selfieBtn.addEventListener('click', function () {
      // If the selfie modal from create.js is available, use it for consistency
      if (typeof RT.showSelfieModal === 'function') {
        RT.showSelfieModal();
        return;
      }
      // Fallback: use the file input directly
      selfieInput.click();
    });

    selfieInput.addEventListener('change', function () {
      var file = selfieInput.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { RT.toast('Image too large (max 5MB)'); return; }

      RT.loading(true, 'Uploading selfie...');

      var reader = new FileReader();
      reader.onload = function (e) {
        var base64 = e.target.result.split(',')[1];

        fetch(RT.API + '/profile/selfie', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + RT.token
          },
          body: JSON.stringify({ image: base64 })
        })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          RT.loading(false);
          if (d.success || d.selfie_url) {
            var url = d.selfie_url || d.url || '';
            RT.selfieUrl = url;
            localStorage.setItem('rt_selfie', url);

            RT.toast('Selfie uploaded! Your face will appear in films.', true);

            var status = RT.$('profile-selfie-status');
            if (status) {
              status.textContent = 'Uploaded ✓';
              status.className = 'profile-status ok';
            }
          } else {
            RT.toast(d.error || 'Upload failed.');
          }
        })
        .catch(function (err) {
          RT.loading(false);
          RT.toast(err.message || 'Upload failed.');
        });
      };
      reader.readAsDataURL(file);
    });
  }

})();