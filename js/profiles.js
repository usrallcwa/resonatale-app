(function () {
  'use strict';

  RT.loadProfile = function () {
    RT.getProfile().then(function (d) {
      var el = RT.$('profile-email');
      if (el) el.textContent = d.email;

      var photos = RT.$('profile-photo-count');
      if (photos) photos.textContent = d.photoCount + ' photos uploaded';

      var voice = RT.$('profile-voice-status');
      if (voice) voice.textContent = d.hasVoice ? 'Voice cloned ✓' : 'Not recorded';
      if (voice) voice.className = d.hasVoice ? 'profile-status ok' : 'profile-status pending';

      var lang = RT.$('profile-lang');
      if (lang) {
        var l = RT.LANGUAGES.find(function (x) { return x.code === d.language; });
        if (l) lang.textContent = l.flag + ' ' + l.name;
      }

      var since = RT.$('profile-since');
      if (since && d.createdAt) since.textContent = 'Member since ' + d.createdAt.split('T')[0];
    }).catch(function () {
      RT.toast('Failed to load profile.');
    });
  };

  var updatePhotosBtn = RT.$('btn-update-photos');
  if (updatePhotosBtn) {
    updatePhotosBtn.addEventListener('click', function () {
      RT.showScreen('setup');
    });
  }

  var rerecordBtn = RT.$('btn-rerecord');
  if (rerecordBtn) {
    rerecordBtn.addEventListener('click', function () {
      RT.showScreen('setup');
    });
  }

})();
