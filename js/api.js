(function () {
  'use strict';

  // Helper to send JSON and handle errors
  function jsonFetch(path, payload) {
    return fetch(RT.API + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok) {
          throw new Error(body.error || body.message || 'Request failed');
        }
        return body;
      });
    });
  }

  RT.signup = function (email, password, language) {
    return jsonFetch('/auth/signup', {
      email: email,
      password: password,
      language: language
    }).then(function (body) {
      if (body.token && body.email) {
        RT.saveAuth(body.token, body.email);
      }
      return body;
    });
  };

  RT.login = function (email, password) {
    return jsonFetch('/auth/login', {
      email: email,
      password: password
    }).then(function (body) {
      if (body.token && body.email) {
        RT.saveAuth(body.token, body.email);
      }
      return body;
    });
  };

  RT.forgotPassword = function (email) {
    return jsonFetch('/auth/forgot', { email: email });
  };

  RT.resetPassword = function (email, code, password) {
    return jsonFetch('/auth/reset', {
      email: email,
      code: code,
      password: password
    });
  };

})();
