document.addEventListener('DOMContentLoaded', function () {
  (function () {
    'use strict';

    // ── Helpers ──

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

    function disable(el, state) {
      if (el) el.disabled = !!state;
    }

    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function handleError(err, fallback) {
      RT.toast((err && err.message) || fallback || 'Something went wrong. Please try again.');
    }

    function onEnter(id, fn) {
      var el = RT.$(id);
      if (el) el.addEventListener('keydown', function (e) { if (e.key === 'Enter') fn(); });
    }

    // ── Form Switcher Links ──

    var links = {
      'show-signup':  'signup',
      'show-login':   'login',
      'show-forgot':  'forgot',
      'show-login2':  'login',
    };

    Object.keys(links).forEach(function (id) {
      var el = RT.$(id);
      if (el) el.addEventListener('click', function (e) {
        e.preventDefault();
        showForm(links[id]);
      });
    });

    // ── Sign Up ──

    function doSignup() {
      var email = getValue('signup-email').trim();
      var pass  = getValue('signup-pass');

      if (!email || !pass)          { RT.toast('Fill in all fields.');                        return; }
      if (!isValidEmail(email))     { RT.toast('Enter a valid email address.');               return; }
      if (pass.length < 8)          { RT.toast('Password must be at least 8 characters.');    return; }

      var btn = RT.$('btn-signup');
      RT.loading(true, 'Creating account...');
      disable(btn, true);

      RT.signup(email, pass, RT.language, RT.refCode || null)
        .then(function () {
          RT.loading(false);
          disable(btn, false);
          RT.toast('Account created! ✓', true);
          RT.afterAuth();
        })
        .catch(function (err) {
          RT.loading(false);
          disable(btn, false);
          handleError(err, 'Could not create account.');
        });
    }

    var signupBtn = RT.$('btn-signup');
    if (signupBtn) signupBtn.addEventListener('click', doSignup);
    onEnter('signup-pass', doSignup);

    // ── Log In ──

    function doLogin() {
      var email = getValue('login-email').trim();
      var pass  = getValue('login-pass');

      if (!email || !pass)      { RT.toast('Fill in all fields.');           return; }
      if (!isValidEmail(email)) { RT.toast('Enter a valid email address.');  return; }

      var btn = RT.$('btn-login');
      RT.loading(true, 'Logging in...');
      disable(btn, true);

      RT.login(email, pass)
        .then(function () {
          RT.loading(false);
          disable(btn, false);
          RT.toast('Welcome back! ✓', true);
          RT.afterAuth();
        })
        .catch(function (err) {
          RT.loading(false);
          disable(btn, false);
          handleError(err, 'Incorrect email or password.');
        });
    }

    var loginBtn = RT.$('btn-login');
    if (loginBtn) loginBtn.addEventListener('click', doLogin);
    onEnter('login-pass', doLogin);

    // ── Forgot Password ──

    function doForgot() {
      var email = getValue('forgot-email').trim();

      if (!email)               { RT.toast('Enter your email.');            return; }
      if (!isValidEmail(email)) { RT.toast('Enter a valid email address.'); return; }

      var btn = RT.$('btn-forgot');
      RT.loading(true, 'Sending code...');
      disable(btn, true);

      RT.forgotPassword(email)
        .then(function () {
          RT.loading(false);
          disable(btn, false);
          RT.toast('Code sent — check your email. ✓', true);
          // Pre-fill email in reset form so user doesn't have to retype
          var resetEmail = RT.$('reset-email');
          if (resetEmail) resetEmail.value = email;
          showForm('reset');
        })
        .catch(function (err) {
          RT.loading(false);
          disable(btn, false);
          handleError(err, 'Could not send reset code.');
        });
    }

    var forgotBtn = RT.$('btn-forgot');
    if (forgotBtn) forgotBtn.addEventListener('click', doForgot);
    onEnter('forgot-email', doForgot);

    // ── Reset Password ──

    function doReset() {
      var email = (getValue('reset-email') || getValue('forgot-email')).trim();
      var code  = getValue('reset-code').trim();
      var pass  = getValue('reset-pass');

      if (!email || !isValidEmail(email)) { RT.toast('Enter a valid email address.');          return; }
      if (!code)                          { RT.toast('Enter the code from your email.');       return; }
      if (!pass)                          { RT.toast('Enter a new password.');                 return; }
      if (pass.length < 8)                { RT.toast('Password must be at least 8 characters.'); return; }

      var btn = RT.$('btn-reset');
      RT.loading(true, 'Resetting password...');
      disable(btn, true);

      RT.resetPassword(email, code, pass)
        .then(function () {
          RT.loading(false);
          disable(btn, false);
          RT.toast('Password reset! Please log in. ✓', true);
          showForm('login');
        })
        .catch(function (err) {
          RT.loading(false);
          disable(btn, false);
          handleError(err, 'Could not reset password. Check your code.');
        });
    }

    var resetBtn = RT.$('btn-reset');
    if (resetBtn) resetBtn.addEventListener('click', doReset);
    onEnter('reset-pass', doReset);

    // ── Expose ──

    RT.showAuthForm = showForm;

  })();
});
