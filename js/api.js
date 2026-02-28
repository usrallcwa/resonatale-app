(function () {
  'use strict';

  window.RT = window.RT || {};

  // ══════════════════════════════════════
  // FETCH WRAPPER
  // ══════════════════════════════════════

  function api(method, path, body) {
    var opts = {
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (RT.token) {
      opts.headers['Authorization'] = 'Bearer ' + RT.token;
    }

    if (body) {
      opts.body = JSON.stringify(body);
    }

    return fetch(RT.API + path, opts).then(function (r) {
      return r.text().then(function (txt) {
        var data;
        try { data = JSON.parse(txt); } catch (e) { data = { error: txt }; }

        if (!r.ok) {
          // Handle expired token
          if (r.status === 401) {
            RT.clearAuth();
          }
          var errMsg = data.detail || data.error || 'Request failed (HTTP ' + r.status + ')';
          throw new Error(errMsg);
        }

        return data;
      });
    });
  }

  // ══════════════════════════════════════
  // HEALTH
  // ══════════════════════════════════════

  RT.healthCheck = function () {
    return api('GET', '/health');
  };

  // ══════════════════════════════════════
  // AUTH
  // ══════════════════════════════════════

  RT.signup = function (email, password, language) {
    return api('POST', '/auth/signup', {
      email: email,
      password: password,
      language: language || RT.language
    }).then(function (data) {
      RT.saveAuth(data.token, data.email);
      RT.credits = data.credits || 0;
      RT.hasPhotos = data.hasPhotos || false;
      RT.hasVoice = data.hasVoice || false;
      RT.hasUsedPreview = data.hasUsedPreview || false;
      return data;
    });
  };

  RT.login = function (email, password) {
    return api('POST', '/auth/login', {
      email: email,
      password: password
    }).then(function (data) {
      RT.saveAuth(data.token, data.email);
      RT.credits = data.credits || 0;
      RT.hasPhotos = data.hasPhotos || false;
      RT.hasVoice = data.hasVoice || false;
      RT.hasUsedPreview = data.hasUsedPreview || false;
      if (data.language) RT.setLanguage(data.language);
      return data;
    });
  };

  RT.forgotPassword = function (email) {
    return api('POST', '/auth/forgot', { email: email });
  };

  RT.resetPassword = function (email, code, password) {
    return api('POST', '/auth/reset', {
      email: email,
      code: code,
      password: password
    });
  };

  RT.logout = function () {
    RT.clearAuth();
  };

  // ══════════════════════════════════════
  // PROFILE
  // ══════════════════════════════════════

  RT.getProfile = function () {
    return api('GET', '/profile').then(function (data) {
      RT.credits = data.credits || 0;
      RT.hasPhotos = data.hasPhotos || false;
      RT.hasVoice = data.hasVoice || false;
      RT.hasUsedPreview = data.hasUsedPreview || false;
      if (data.language) RT.setLanguage(data.language);
      RT.updateCredits(data.credits);
      return data;
    });
  };

  RT.uploadPhotos = function (photosBase64Array) {
    return api('POST', '/profile/photos', {
      photos: photosBase64Array
    }).then(function (data) {
      RT.hasPhotos = true;
      return data;
    });
  };

  RT.uploadVoice = function (audioBase64) {
    return api('POST', '/profile/voice', {
      audio: audioBase64
    }).then(function (data) {
      if (data.cloned) RT.hasVoice = true;
      return data;
    });
  };

  // ══════════════════════════════════════
  // STORY PREVIEW (free, no auth needed)
  // ══════════════════════════════════════

  RT.generatePreview = function (brief, mood, language, tier) {
    return api('POST', '/story', {
      brief: brief,
      mood: mood,
      language: language,
      tier: tier
    });
  };

  // ══════════════════════════════════════
  // FREE PREVIEW CLIP (1x per account)
  // ══════════════════════════════════════

  RT.generatePreviewClip = function (sceneDescription, voiceoverText) {
    return api('POST', '/preview/clip', {
      sceneDescription: sceneDescription,
      voiceoverText: voiceoverText
    });
  };

  // ══════════════════════════════════════
  // CREDITS
  // ══════════════════════════════════════

  RT.getCredits = function () {
    return api('GET', '/credits').then(function (data) {
      RT.credits = data.credits || 0;
      RT.updateCredits(data.credits);
      return data;
    });
  };

  RT.addCredits = function (amount) {
    return api('POST', '/credits/add', { amount: amount });
  };

  // ══════════════════════════════════════
  // FILM PIPELINE
  // ══════════════════════════════════════

  RT.createFilm = function (brief, mood, language, tier) {
    return api('POST', '/film/create', {
      brief: brief,
      mood: mood,
      language: language,
      tier: tier
    }).then(function (data) {
      RT.credits = data.creditsRemaining;
      RT.updateCredits(data.creditsRemaining);
      return data;
    });
  };

  RT.getFilmStatus = function (filmId) {
    return api('GET', '/film/' + filmId + '/status');
  };

  RT.getFilms = function () {
    return api('GET', '/films');
  };

  // ══════════════════════════════════════
  // POLLING HELPER
  // ══════════════════════════════════════

  RT.pollFilm = function (filmId, onUpdate, onDone, onError) {
    var attempts = 0;
    var maxAttempts = 120; // 10 minutes at 5 sec intervals
    var interval = 5000;

    function check() {
      attempts++;
      if (attempts > maxAttempts) {
        if (onError) onError(new Error('Polling timed out'));
        return;
      }

      RT.getFilmStatus(filmId)
        .then(function (data) {
          if (onUpdate) onUpdate(data);

          if (data.status === 'done') {
            if (onDone) onDone(data);
            return;
          }

          if (data.status === 'failed') {
            if (onError) onError(new Error(data.error || 'Film creation failed'));
            return;
          }

          // Still processing — poll again
          setTimeout(check, interval);
        })
        .catch(function (err) {
          // Network error — retry
          if (attempts < maxAttempts) {
            setTimeout(check, interval * 2);
          } else {
            if (onError) onError(err);
          }
        });
    }

    // Start polling
    setTimeout(check, interval);
  };

})();
