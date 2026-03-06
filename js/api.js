(function () {
  'use strict';

  function authHeaders() {
    var h = { 'Content-Type': 'application/json' };
    if (RT.token) h['Authorization'] = 'Bearer ' + RT.token;
    return h;
  }

  function apiFetch(method, path, body) {
    var opts = { method: method, headers: authHeaders() };
    if (body) opts.body = JSON.stringify(body);
    return fetch(RT.API + path, opts).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error(data.error || 'Request failed');
        return data;
      });
    });
  }

  // Auth
  RT.signup = function (email, password, language, ref) {
    return apiFetch('POST', '/auth/signup', { email: email, password: password, language: language, ref: ref }).then(function (d) {
      if (d.token) RT.saveAuth(d.token, d.email);
      return d;
    });
  };

  RT.login = function (email, password) {
    return apiFetch('POST', '/auth/login', { email: email, password: password }).then(function (d) {
      if (d.token) RT.saveAuth(d.token, d.email);
      RT.credits = d.credits || 0;
      RT.hasVoice = d.hasVoice || false;
      RT.hasUsedPreview = d.hasUsedPreview || false;
      return d;
    });
  };

  RT.forgotPassword = function (email) {
    return apiFetch('POST', '/auth/forgot', { email: email });
  };

  RT.resetPassword = function (email, code, password) {
    return apiFetch('POST', '/auth/reset', { email: email, code: code, password: password });
  };

  RT.logout = function () {
    RT.clearAuth();
  };

  // Profile
  RT.getProfile = function () {
    return apiFetch('GET', '/profile').then(function (d) {
      RT.credits = d.credits || 0;
      RT.hasVoice = d.hasVoice || false;
      RT.hasUsedPreview = d.hasUsedPreview || false;
      RT.updateCredits(d.credits);
      return d;
    });
  };

  // Voice
  RT.uploadVoice = function (audioBase64) {
    return apiFetch('POST', '/profile/voice', { audio: audioBase64 });
  };

  // Credits
  RT.getCredits = function () {
    return apiFetch('GET', '/credits').then(function (d) {
      RT.credits = d.credits || 0;
      RT.updateCredits(d.credits);
      return d;
    });
  };

  RT.addCredits = function (amount) {
    return apiFetch('POST', '/credits/add', { amount: amount });
  };

  // Preview
  RT.generatePreview = function (brief, mood, language, tier) {
    return apiFetch('POST', '/story', { brief: brief, mood: mood, language: language, tier: tier });
  };

  // Films
  RT.createFilm = function (brief, mood, language, tier) {
    return apiFetch('POST', '/film/create', { brief: brief, mood: mood, language: language, tier: tier });
  };

  RT.getFilmStatus = function (filmId) {
    return apiFetch('GET', '/film/' + filmId + '/status');
  };

  RT.getFilms = function () {
    return apiFetch('GET', '/films');
  };

})();