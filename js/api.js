(function () {
  'use strict';

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
          if (r.status === 401) RT.clearAuth();
          throw new Error(data.detail || data.error || 'Request failed');
        }
        return data;
      });
    });
  }

  RT.healthCheck = function () { return api('GET', '/health'); };

  RT.signup = function (email, password, language) {
    return api('POST', '/auth/signup', { email: email, password: password, language: language || RT.language }).then(function (d) {
      RT.saveAuth(d.token, d.email);
      RT.credits = d.credits || 0;
      RT.hasPhotos = d.hasPhotos || false;
      RT.hasVoice = d.hasVoice || false;
      RT.hasUsedPreview = d.hasUsedPreview || false;
      return d;
    });
  };

  RT.login = function (email, password) {
    return api('POST', '/auth/login', { email: email, password: password }).then(function (d) {
      RT.saveAuth(d.token, d.email);
      RT.credits = d.credits || 0;
      RT.hasPhotos = d.hasPhotos || false;
      RT.hasVoice = d.hasVoice || false;
      RT.hasUsedPreview = d.hasUsedPreview || false;
      if (d.language) RT.setLanguage(d.language);
      return d;
    });
  };

  RT.forgotPassword = function (email) { return api('POST', '/auth/forgot', { email: email }); };

  RT.resetPassword = function (email, code, password) {
    return api('POST', '/auth/reset', { email: email, code: code, password: password });
  };

  RT.logout = function () { RT.clearAuth(); };

  RT.getProfile = function () {
    return api('GET', '/profile').then(function (d) {
      RT.credits = d.credits || 0;
      RT.hasPhotos = d.hasPhotos || false;
      RT.hasVoice = d.hasVoice || false;
      RT.hasUsedPreview = d.hasUsedPreview || false;
      if (d.language) RT.setLanguage(d.language);
      RT.updateCredits(d.credits);
      return d;
    });
  };

  RT.uploadPhotos = function (photos) {
    return api('POST', '/profile/photos', { photos: photos }).then(function (d) {
      RT.hasPhotos = true;
      return d;
    });
  };

  RT.uploadVoice = function (audio) {
    return api('POST', '/profile/voice', { audio: audio }).then(function (d) {
      if (d.cloned) RT.hasVoice = true;
      return d;
    });
  };

  RT.generatePreview = function (brief, mood, language, tier) {
    return api('POST', '/story', { brief: brief, mood: mood, language: language, tier: tier });
  };

  RT.generatePreviewClip = function (desc, text) {
    return api('POST', '/preview/clip', { sceneDescription: desc, voiceoverText: text });
  };

  RT.getCredits = function () {
    return api('GET', '/credits').then(function (d) {
      RT.credits = d.credits || 0;
      RT.updateCredits(d.credits);
      return d;
    });
  };

  RT.addCredits = function (amount) { return api('POST', '/credits/add', { amount: amount }); };

  RT.createFilm = function (brief, mood, language, tier) {
    return api('POST', '/film/create', { brief: brief, mood: mood, language: language, tier: tier }).then(function (d) {
      RT.credits = d.creditsRemaining;
      RT.updateCredits(d.creditsRemaining);
      return d;
    });
  };

  RT.getFilmStatus = function (id) { return api('GET', '/film/' + id + '/status'); };

  RT.getFilms = function () { return api('GET', '/films'); };

  RT.pollFilm = function (filmId, onUpdate, onDone, onError) {
    var attempts = 0;
    function check() {
      attempts++;
      if (attempts > 120) { if (onError) onError(new Error('Timed out')); return; }
      RT.getFilmStatus(filmId).then(function (d) {
        if (onUpdate) onUpdate(d);
        if (d.status === 'done') { if (onDone) onDone(d); return; }
        if (d.status === 'failed') { if (onError) onError(new Error(d.error || 'Failed')); return; }
        setTimeout(check, 5000);
      }).catch(function (e) {
        if (attempts < 120) setTimeout(check, 10000);
        else if (onError) onError(e);
      });
    }
    setTimeout(check, 5000);
  };

})();