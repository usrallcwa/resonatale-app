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

    // Replace node to prevent stacked listeners on repeat clicks
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

})();
