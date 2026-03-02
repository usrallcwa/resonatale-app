(function () {
  'use strict';

  var menu = RT.$('menu-overlay');
  var menuBtn = RT.$('btn-menu');
  var closeBtn = RT.$('btn-menu-close');

  // Open menu
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      if (menu) menu.classList.add('open');
    });
  }

  // Close menu
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      if (menu) menu.classList.remove('open');
    });
  }

  // Close on overlay click
  if (menu) {
    menu.addEventListener('click', function (e) {
      if (e.target === menu) menu.classList.remove('open');
    });
  }

  function closeMenu() {
    if (menu) menu.classList.remove('open');
  }

  // Menu items
  var actions = {
    'menu-create': function () { closeMenu(); RT.resetForm(); RT.showScreen('create'); RT.mountTurnstile(); },
    'menu-films': function () { closeMenu(); RT.showScreen('dash'); },
    'menu-credits': function () { closeMenu(); RT.showScreen('credits'); RT.renderCredits(); },
    'menu-profile': function () { closeMenu(); RT.showScreen('profile'); RT.loadProfile(); },
    'menu-invite': function () { closeMenu(); RT.showScreen('invite'); },
    'menu-logout': function () { closeMenu(); RT.logout(); RT.toast('Logged out.', true); RT.showScreen('landing'); }
  };

  Object.keys(actions).forEach(function (id) {
    var el = RT.$(id);
    if (el) el.addEventListener('click', actions[id]);
  });

  // Update menu credit display
  RT.updateMenuCredits = function () {
    var el = RT.$('menu-credit-count');
    if (el) el.textContent = RT.credits || 0;
    var nav = RT.$('nav-credits');
    if (nav) nav.textContent = RT.credits || 0;
  };

})();