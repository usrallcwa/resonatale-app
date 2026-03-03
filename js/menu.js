(function () {
  'use strict';

  var menu = RT.$('menu-overlay');
  var nav = RT.$('nav-bar');

  // Open menu
  RT.openMenu = function () {
    if (menu) {
      menu.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  };

  // Close menu
  RT.closeMenu = function () {
    if (menu) {
      menu.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  // Menu button
  var menuBtn = RT.$('btn-menu');
  if (menuBtn) menuBtn.addEventListener('click', RT.openMenu);

  // Close button
  var closeBtn = RT.$('btn-menu-close');
  if (closeBtn) closeBtn.addEventListener('click', RT.closeMenu);

  // Close on overlay click
  if (menu) {
    menu.addEventListener('click', function (e) {
      if (e.target === menu) RT.closeMenu();
    });
  }

  // Menu navigation items
  var actions = {
    'menu-credits': function () { RT.closeMenu(); RT.showScreen('credits'); RT.renderCredits(); },
    'menu-create': function () { RT.closeMenu(); RT.resetForm(); RT.showScreen('create'); RT.mountTurnstile(); },
    'menu-films': function () { RT.closeMenu(); RT.showScreen('dash'); },
    'menu-profile': function () { RT.closeMenu(); RT.showScreen('profile'); if (RT.loadProfile) RT.loadProfile(); },
    'menu-invite': function () { RT.closeMenu(); RT.showScreen('invite'); if (RT.loadInvite) RT.loadInvite(); },
    'menu-logout': function () { RT.closeMenu(); RT.logout(); RT.toast('Logged out.', true); RT.showScreen('landing'); }
  };

  Object.keys(actions).forEach(function (id) {
    var el = RT.$(id);
    if (el) el.addEventListener('click', actions[id]);
  });

  // Nav credit button — tap to add credits
  var navCredits = RT.$('nav-credits');
  if (navCredits) {
    navCredits.addEventListener('click', function () {
      if (!RT.isLoggedIn()) { RT.showScreen('auth'); RT.showAuthForm('signup'); return; }
      RT.showScreen('credits');
      RT.renderCredits();
    });
  }

  // Nav logo — tap to go home
  var navLogo = RT.$('nav-logo');
  if (navLogo) {
    navLogo.addEventListener('click', function () {
      RT.showScreen('landing');
    });
  }

  // Show/hide nav bar based on screen
  var originalShowScreen = RT.showScreen;
  RT.showScreen = function (id) {
    originalShowScreen(id);
    if (nav) {
      if (id === 'landing') {
        nav.classList.add('hide');
      } else {
        nav.classList.remove('hide');
        RT.updateMenuCredits();
      }
    }
  };

  // Update credit displays in nav and menu
  RT.updateMenuCredits = function () {
    var menuCount = RT.$('menu-credit-count');
    if (menuCount) menuCount.textContent = RT.credits || 0;
    var navEls = document.querySelectorAll('.js-credits');
    for (var i = 0; i < navEls.length; i++) navEls[i].textContent = RT.credits || 0;
  };

})();