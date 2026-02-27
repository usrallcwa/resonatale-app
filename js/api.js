(function () {
  'use strict';

  window.RT = window.RT || {};

  var BASE = RT.API_BASE || '';

  // ── Helper ──
  function apiCall(method, path, body) {
    var opts = {
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    var token = RT.authToken;
    if (token) {
      opts.headers['Authorization'] = 'Bearer ' + token;
    }

    if (body) {
      opts.body = JSON.stringify(body);
    }

    return fetch(BASE + path, opts).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (txt) {
          var errMsg = 'Request failed (HTTP ' + r.status + ')';
          try {
            var p = JSON.parse(txt);
            errMsg = p.detail || p.error || errMsg;
          } catch (e) {
            if (txt && txt.length < 300) errMsg = txt;
          }
          throw new Error(errMsg);
        });
      }
      return r.json();
    });
  }

  // ── Health Check ──
  RT.healthCheck = function () {
    return apiCall('GET', '/health');
  };

  // ── Story Generation ──
  RT.generateScenes = function (payload) {
    return apiCall('POST', '/story', payload);
  };

  // ── Auth ──
  RT.authToken = localStorage.getItem('rt_token') || '';
  RT.userEmail = localStorage.getItem('rt_email') || '';

  RT.signup = function (email, password) {
    return apiCall('POST', '/auth/signup', { email: email, password: password }).then(function (data) {
      RT.authToken = data.token;
      RT.userEmail = email;
      localStorage.setItem('rt_token', data.token);
      localStorage.setItem('rt_email', email);
      return data;
    });
  };

  RT.login = function (email, password) {
    return apiCall('POST', '/auth/login', { email: email, password: password }).then(function (data) {
      RT.authToken = data.token;
      RT.userEmail = email;
      localStorage.setItem('rt_token', data.token);
      localStorage.setItem('rt_email', email);
      return data;
    });
  };

  RT.forgotPassword = function (email) {
    return apiCall('POST', '/auth/forgot', { email: email });
  };

  RT.resetPassword = function (email, code, newPassword) {
    return apiCall('POST', '/auth/reset', { email: email, code: code, password: newPassword });
  };

  RT.logout = function () {
    RT.authToken = '';
    RT.userEmail = '';
    localStorage.removeItem('rt_token');
    localStorage.removeItem('rt_email');
  };

  RT.isLoggedIn = function () {
    return !!RT.authToken;
  };

  // ── Credits ──
  RT.getBalance = function () {
    return apiCall('GET', '/credits/balance');
  };

  // ── Checkout ──
  RT.createCheckout = function (packageId) {
    return apiCall('POST', '/checkout', { packageId: packageId });
  };

  // ── Films ──
  RT.getFilms = function () {
    return apiCall('GET', '/films');
  };

  RT.getFilm = function (filmId) {
    return apiCall('GET', '/films/' + filmId);
  };

  RT.renderFilm = function (filmId) {
    return apiCall('POST', '/films/' + filmId + '/render');
  };

  RT.pollFilm = function (filmId) {
    return apiCall('GET', '/films/' + filmId + '/status');
  };

})();
