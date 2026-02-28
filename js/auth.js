document.addEventListener('DOMContentLoaded', function () {
  (function () {
    'use strict';

    function showForm(name) {
      ['auth-login', 'auth-signup', 'auth-forgot', 'auth-reset'].forEach(function (id) {
        var el = RT.$(id);
        if (el) el.classList.toggle('hide', id !== 'auth-' + name);
      });
    }

    function getValue(id) {
      var el = RT.$(id);
      return el && typeof el.value === 'string' ? el.value : '';
    }

    function disable(el, disabled) {
      if (!el) return;
      el.disabled = !!disabled;
    }

    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function handleError(err, fallbackMsg) {
      var msg = (err && err.message) || fallbackMsg || 'Something went wrong. Please try again.';
      RT.toast(msg);
    }

    // Switch links
    var links = {
      'show-signup': 'signup',
      'show-login': 'login',
      'show-forgot': 'forgot',
      'show-login2': 'login'
    };

    Object.keys(links).forEach(function (id) {
      var el = RT.$(id);
      if (el) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          showForm(links[id]);
        });
      }
    });

    // Signup
    var signupBtn = RT.$('btn-signup');
    if (signupBtn) {
      signupBtn.addEventListener('click', function () {
        var email = getValue('signup-email').trim();
        var pass = getValue('signup-pass');

        if (!email || !pass) {
          RT.toast('Fill in all fields.');
          return;
        }
        if (!isValidEmail(email)) {
          RT.toast('Enter a valid email.');
          return;
        }
        if (pass.length < 8) {
          RT.toast('Password must be at least 8 characters.');
          return;
        }

        RT.loading(true, 'Creating account...');
        disable(signupBtn, true);

        RT.signup(email, pass, RT.language).then(function () {
          RT.loading(false);
          disable(signupBtn, false);
          RT.toast('Account created!', true);
          RT.afterAuth();
        }).catch(function (err) {
          RT.loading(false);
          disable(signupBtn, false);
          handleError(err, 'Could not create account.');
        });
      });
    }

    // Login
    var loginBtn = RT.$('btn-login');
    if (loginBtn) {
      loginBtn.addEventListener('click', function () {
        var email = getValue('login-email').trim();
        var pass = getValue('login-pass');

        if (!email || !pass) {
          RT.toast('Fill in all fields.');
          return;
        }
        if (!isValidEmail(email)) {
          RT.toast('Enter a valid email.');
          return;
        }

        RT.loading(true, 'Logging in...');
        disable(loginBtn, true);

        RT.login(email, pass).then(function () {
          RT.loading(false);
          disable(loginBtn, false);
          RT.toast('Welcome back!', true);
          RT.afterAuth();
        }).catch(function (err) {
          RT.loading(false);
          disable(loginBtn, false);
          handleError(err, 'Could not log in.');
        });
      });
    }

    // Forgot
    var forgotBtn = RT.$('btn-forgot');
    if (forgotBtn) {
      forgotBtn.addEventListener('click', function () {
        var email = getValue('forgot-email').trim();
        if (!email) {
          RT.toast('Enter your email.');
          return;
        }
        if (!isValidEmail(email)) {
          RT.toast('Enter a valid email.');
          return;
        }

        RT.loading(true, 'Sending code...');
        disable(forgotBtn, true);

        RT.forgotPassword(email).then(function () {
          RT.loading(false);
          disable(forgotBtn, false);
          RT.toast('Check your email for the code.', true);
          showForm('reset');
        }).catch(function (err) {
          RT.loading(false);
          disable(forgotBtn, false);
          handleError(err, 'Could not send reset code.');
        });
      });
    }

    // Reset
    var resetBtn = RT.$('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var email = getValue('forgot-email').trim();
        var code = getValue('reset-code').trim();
        var pass = getValue('reset-pass');

        if (!code || !pass) {
          RT.toast('Fill in all fields.');
          return;
        }
        if (!email || !isValidEmail(email)) {
          RT.toast('Enter a valid email.');
          return;
        }
        if (pass.length < 8) {
          RT.toast('Password must be at least 8 characters.');
          return;
        }

        RT.loading(true, 'Resetting...');
        disable(resetBtn, true);

        RT.resetPassword(email, code, pass).then(function () {
          RT.loading(false);
          disable(resetBtn, false);
          RT.toast('Password reset! Log in.', true);
          showForm('login');
        }).catch(function (err) {
          RT.loading(false);
          disable(resetBtn, false);
          handleError(err, 'Could not reset password.');
        });
      });
    }

    // Expose for other files
    RT.showAuthForm = showForm;

  })();
});
