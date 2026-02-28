(function () {
  'use strict';

  function showForm(name) {
    ['auth-login', 'auth-signup', 'auth-forgot', 'auth-reset'].forEach(function (id) {
      var el = RT.$(id);
      if (el) el.classList.toggle('hide', id !== 'auth-' + name);
    });
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
    if (el) el.addEventListener('click', function (e) { e.preventDefault(); showForm(links[id]); });
  });

  // Signup
  var signupBtn = RT.$('btn-signup');
  if (signupBtn) {
    signupBtn.addEventListener('click', function () {
      var email = RT.$('signup-email').value.trim();
      var pass = RT.$('signup-pass').value;
      if (!email || !pass) { RT.toast('Fill in all fields.'); return; }
      if (pass.length < 6) { RT.toast('Password must be 6+ characters.'); return; }

      RT.loading(true, 'Creating account...');
      RT.signup(email, pass, RT.language).then(function () {
        RT.loading(false);
        RT.toast('Account created!', true);
        RT.afterAuth();
      }).catch(function (err) {
        RT.loading(false);
        RT.toast(err.message);
      });
    });
  }

  // Login
  var loginBtn = RT.$('btn-login');
  if (loginBtn) {
    loginBtn.addEventListener('click', function () {
      var email = RT.$('login-email').value.trim();
      var pass = RT.$('login-pass').value;
      if (!email || !pass) { RT.toast('Fill in all fields.'); return; }

      RT.loading(true, 'Logging in...');
      RT.login(email, pass).then(function () {
        RT.loading(false);
        RT.toast('Welcome back!', true);
        RT.afterAuth();
      }).catch(function (err) {
        RT.loading(false);
        RT.toast(err.message);
      });
    });
  }

  // Forgot
  var forgotBtn = RT.$('btn-forgot');
  if (forgotBtn) {
    forgotBtn.addEventListener('click', function () {
      var email = RT.$('forgot-email').value.trim();
      if (!email) { RT.toast('Enter your email.'); return; }

      RT.loading(true, 'Sending code...');
      RT.forgotPassword(email).then(function () {
        RT.loading(false);
        RT.toast('Check your email for the code.', true);
        showForm('reset');
      }).catch(function (err) {
        RT.loading(false);
        RT.toast(err.message);
      });
    });
  }

  // Reset
  var resetBtn = RT.$('btn-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      var email = RT.$('forgot-email').value.trim();
      var code = RT.$('reset-code').value.trim();
      var pass = RT.$('reset-pass').value;
      if (!code || !pass) { RT.toast('Fill in all fields.'); return; }

      RT.loading(true, 'Resetting...');
      RT.resetPassword(email, code, pass).then(function () {
        RT.loading(false);
        RT.toast('Password reset! Log in.', true);
        showForm('login');
      }).catch(function (err) {
        RT.loading(false);
        RT.toast(err.message);
      });
    });
  }

  // Expose for other files
  RT.showAuthForm = showForm;

})();
