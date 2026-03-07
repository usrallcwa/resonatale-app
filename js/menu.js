(function () {
  'use strict';

  var menu = RT.$('menu-overlay');

  RT.openMenu = function () {
    if (menu) { menu.classList.add('open'); document.body.style.overflow = 'hidden'; }
  };

  RT.closeMenu = function () {
    if (menu) { menu.classList.remove('open'); document.body.style.overflow = ''; }
  };

  var menuBtn = RT.$('btn-menu');
  if (menuBtn) menuBtn.addEventListener('click', RT.openMenu);

  var closeBtn = RT.$('btn-menu-close');
  if (closeBtn) closeBtn.addEventListener('click', RT.closeMenu);

  if (menu) {
    menu.addEventListener('click', function (e) {
      if (e.target === menu) RT.closeMenu();
    });
  }

  var items = {
    'menu-home': function () { RT.closeMenu(); RT.showScreen('landing'); },
    'menu-create': function () { RT.closeMenu(); RT.showScreen('create'); RT.mountTurnstile(); },
    'menu-films': function () { RT.closeMenu(); RT.showScreen('dash'); },
    'menu-credits': function () { RT.closeMenu(); RT.showScreen('credits'); RT.renderCredits(); },
    'menu-profile': function () { RT.closeMenu(); RT.showScreen('profile'); RT.loadProfile(); },
    'menu-invite': function () { RT.closeMenu(); RT.showScreen('invite'); RT.loadInvite(); },
    'menu-how': function () { RT.closeMenu(); RT.showScreen('how'); },
    'menu-logout': function () { RT.closeMenu(); RT.clearAuth(); RT.toast('Logged out.', true); RT.showScreen('landing'); }
  };

  Object.keys(items).forEach(function (id) {
    var el = RT.$(id);
    if (el) el.addEventListener('click', items[id]);
  });

  RT.updateMenuCredits = function () {
    var els = document.querySelectorAll('.js-credits');
    els.forEach(function (el) { el.textContent = RT.credits || 0; });
  };

  var navCredits = RT.$('nav-credits');
  if (navCredits) {
    navCredits.addEventListener('click', function () {
      if (!RT.isLoggedIn()) { RT.showScreen('auth'); RT.showAuthForm('signup'); return; }
      RT.showScreen('credits');
      RT.renderCredits();
    });
  }

  var navLogo = RT.$('nav-logo');
  if (navLogo) {
    navLogo.addEventListener('click', function () { RT.showScreen('landing'); });
  }

  var originalShowScreen = RT.showScreen;
  RT.showScreen = function (id) {
    originalShowScreen(id);
    var nav = RT.$('nav-bar');
    if (nav) {
      if (id === 'landing') { nav.classList.add('hide'); }
      else { nav.classList.remove('hide'); RT.updateMenuCredits(); }
    }
  };

})();