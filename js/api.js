(function () {
  'use strict';

  // ── Restore Preview on Refresh ──

  (function () {
    var saved = localStorage.getItem('rt_preview');
    if (saved && RT.isLoggedIn()) {
      try {
        var data = JSON.parse(saved);
        if (data.scenes && data.scenes.length) {
          RT.currentScenes = data.scenes;
          RT.tier          = data.tier  || 'shorts';
          RT.mood          = data.mood  || '';
          RT.currentBrief  = data.brief || '';
        }
      } catch (e) {}
    }
  })();

  // ── Core fetch helper ──

  function apiFetch(method, path, body) {
    var opts = {
      method:  method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (RT.token) opts.headers['Authorization'] = 'Bearer ' + RT.token;
    if (body)     opts.body = JSON.stringify(body);

    return fetch(RT.API + path, opts).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error(data.error || 'Request failed');
        return data;
      });
    });
  }

  // Expose for use in other modules (feed.js, etc.)
  RT.api = apiFetch;

  // ── Auth ──

  RT.signup = function (email, password, language, ref) {
    return apiFetch('POST', '/auth/signup', { email: email, password: password, language: language || RT.language || 'en', ref: ref || null })
      .then(function (d) {
        if (d.token) RT.saveAuth(d.token, d.email);
        RT.credits        = d.credits        || 0;
        RT.hasVoice       = d.hasVoice       || false;
        RT.hasUsedPreview = d.hasUsedPreview  || false;
        RT.updateCredits(RT.credits);
        return d;
      });
  };

  RT.login = function (email, password) {
    return apiFetch('POST', '/auth/login', { email: email, password: password })
      .then(function (d) {
        if (d.token) RT.saveAuth(d.token, d.email);
        RT.credits        = d.credits        || 0;
        RT.hasVoice       = d.hasVoice       || false;
        RT.hasUsedPreview = d.hasUsedPreview  || false;
        RT.updateCredits(RT.credits);
        return d;
      });
  };

  RT.forgotPassword = function (email) {
    return apiFetch('POST', '/auth/forgot', { email: email });
  };

  RT.resetPassword = function (email, code, password) {
    return apiFetch('POST', '/auth/reset', { email: email, code: code, password: password });
  };

  // ── Profile ──

  RT.getProfile = function () {
    return apiFetch('GET', '/profile').then(function (d) {
      RT.credits        = d.credits        || 0;
      RT.hasVoice       = d.hasVoice       || false;
      RT.hasUsedPreview = d.hasUsedPreview  || false;
      RT.updateCredits(d.credits);
      return d;
    });
  };

  RT.uploadVoice = function (audioBase64) {
    return apiFetch('POST', '/profile/voice', { audio: audioBase64 });
  };

  RT.uploadIntroOutro = function (type, base64) {
    return apiFetch('POST', '/profile/' + type, { video: base64 });
  };

  // ── Credits ──

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

  // ── Preview ──

  RT.generatePreview = function (brief, mood, language, tier) {
    return apiFetch('POST', '/story', {
      brief:    brief,
      mood:     mood,
      language: language || RT.language || 'en',
      tier:     tier,
      style:    RT.style || 'cinematic',
    });
  };

  // ── Films ──

  RT.createFilm = function (brief, mood, language, tier, title) {
    return apiFetch('POST', '/film/create', {
      brief:    brief,
      mood:     mood,
      language: language || RT.language || 'en',
      tier:     tier,
      title:    title  || '',
      style:    RT.style || 'cinematic',
      voice:    RT.selectedVoice || 'clone',
    });
  };

  RT.getFilmStatus = function (filmId) {
    return apiFetch('GET', '/film/' + filmId + '/status');
  };

  RT.getFilms = function () {
    return apiFetch('GET', '/films');
  };

  // ── Social feed ──

  RT.publishFilm = function (filmId) {
    return apiFetch('POST', '/film/publish', { filmId: filmId });
  };

  RT.unpublishFilm = function (filmId) {
    return apiFetch('POST', '/film/unpublish', { filmId: filmId });
  };

  RT.likeFilm = function (filmId) {
    return apiFetch('POST', '/film/like', { filmId: filmId });
  };

  RT.postComment = function (filmId, comment) {
    return apiFetch('POST', '/film/comment', { filmId: filmId, comment: comment });
  };

  RT.deleteComment = function (commentId) {
    return apiFetch('POST', '/film/comment/delete', { commentId: commentId });
  };

  // ── Auto-post / social accounts ──

  RT.getSocialAccounts = function () {
    return apiFetch('GET', '/social/accounts');
  };

  RT.connectSocial = function (platform, accessToken, refreshToken, expiresAt, platformUserId, platformUsername) {
    return apiFetch('POST', '/social/connect', {
      platform:         platform,
      accessToken:      accessToken,
      refreshToken:     refreshToken      || null,
      expiresAt:        expiresAt         || null,
      platformUserId:   platformUserId    || null,
      platformUsername: platformUsername  || null,
    });
  };

  RT.disconnectSocial = function (platform) {
    return apiFetch('POST', '/social/disconnect', { platform: platform });
  };

  RT.schedulePost = function (filmId, platforms, scheduledAt) {
    return apiFetch('POST', '/social/schedule', {
      filmId:      filmId,
      platforms:   platforms,
      scheduledAt: scheduledAt || null,
    });
  };

  RT.cancelPost = function (postId) {
    return apiFetch('POST', '/social/schedule/cancel', { postId: postId });
  };

  RT.getScheduledPosts = function () {
    return apiFetch('GET', '/social/scheduled');
  };

})();
