(function () {
  'use strict';

  RT.loadProfile = function () {
    if (!RT.isLoggedIn()) { RT.showScreen('auth'); RT.showAuthForm('login'); return; }

    RT.getProfile().then(function (d) {
      var el = RT.$('profile-email');
      if (el) el.textContent = d.email;

      var credits = RT.$('profile-credits');
      if (credits) credits.textContent = d.credits;

      var photoStatus = RT.$('profile-photo-status');
      if (photoStatus) {
        photoStatus.textContent = d.hasPhotos ? d.photoCount + ' photos uploaded' : 'No photos yet';
        photoStatus.className = d.hasPhotos ? 'profile-status ok' : 'profile-status';
      }

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
    }).catch(function (err) {
      RT.toast(err.message);
    });
  };

  // Update photos button
  var updatePhotos = RT.$('btn-update-photos');
  if (updatePhotos) {
    updatePhotos.addEventListener('click', function () {
      RT.photos = [];
      RT.refreshPhotos();
      RT.showScreen('setup');
    });
  }

  // Re-record voice button
  var updateVoice = RT.$('btn-update-voice');
  if (updateVoice) {
    updateVoice.addEventListener('click', function () {
      RT.voiceBlob = null;
      RT.showScreen('setup');
    });
  }

})();
