(function () {
  'use strict';

  var menu = RT.$('menu-overlay');

  RT.openMenu = function () {
    if (menu) {
      menu.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  };

  RT.closeMenu = function () {
    if (menu) {
      menu.classList.remove('open');
      document.body.style.overflow = '';
    }
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
    'menu-home': function () {
      RT.closeMenu();
      RT.showScreen('s-landing');
    },
    'menu-create': function () {
      RT.closeMenu();
      if (!RT.isLoggedIn()) {
        RT.showScreen('s-auth');
        RT.showAuthForm('signup');
        return;
      }
      RT.showScreen('s-create');
      RT.mountTurnstile();
    },
    'menu-films': function () {
      RT.closeMenu();
      if (!RT.isLoggedIn()) {
        RT.showScreen('s-auth');
        RT.showAuthForm('login');
        return;
      }
      RT.showScreen('s-dash');
    },
    'menu-credits': function () {
      RT.closeMenu();
      if (!RT.isLoggedIn()) {
        RT.showScreen('s-auth');
        RT.showAuthForm('signup');
        return;
      }
      RT.showScreen('s-credits');
      RT.renderCredits();
    },
    'menu-profile': function () {
      RT.closeMenu();
      if (!RT.isLoggedIn()) {
        RT.showScreen('s-auth');
        RT.showAuthForm('login');
        return;
      }
      RT.showScreen('s-profile');
      RT.loadProfile();
    },
    'menu-invite': function () {
      RT.closeMenu();
      if (!RT.isLoggedIn()) {
        RT.showScreen('s-auth');
        RT.showAuthForm('login');
        return;
      }
      RT.showScreen('s-invite');
      RT.loadInvite();
    },
    'menu-series': function () {
      RT.closeMenu();
      if (!RT.isLoggedIn()) {
        RT.showScreen('s-auth');
        RT.showAuthForm('login');
        return;
      }
      RT.showScreen('s-series');
      RT.loadSeries();
    },
    'menu-how': function () {
      RT.closeMenu();
      RT.showScreen('s-how');
    },
    'menu-auth': function () {
      RT.closeMenu();
      RT.showScreen('s-auth');
      RT.showAuthForm('login');
    },
    'menu-logout': function () {
      RT.closeMenu();
      RT.clearAuth();
      RT.toast('Logged out.', true);
      RT.updateAuthButton();
      RT.showScreen('s-landing');
    }
  };

  RT.updateAuthButton = function () {
    var logoutBtn = RT.$('menu-logout');
    var authBtn   = RT.$('menu-auth');
    if (RT.isLoggedIn()) {
      if (logoutBtn) logoutBtn.style.display = 'block';
      if (authBtn)   authBtn.style.display   = 'none';
    } else {
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (authBtn)   authBtn.style.display   = 'block';
    }
  };

  Object.keys(items).forEach(function (id) {
    var el = RT.$(id);
    if (el) el.addEventListener('click', items[id]);
  });

  RT.updateMenuCredits = function () {
    var els = document.querySelectorAll('.js-credits');
    els.forEach(function (el) {
      el.textContent = RT.credits || 0;
    });
  };

  var navCredits = RT.$('nav-credits');
  if (navCredits) {
    navCredits.addEventListener('click', function () {
      if (!RT.isLoggedIn()) {
        RT.showScreen('s-auth');
        RT.showAuthForm('signup');
        return;
      }
      RT.showScreen('s-credits');
      RT.renderCredits();
    });
  }

  var navLogo = RT.$('nav-logo');
  if (navLogo) {
    navLogo.addEventListener('click', function () {
      RT.showScreen('s-landing');
    });
  }

  // Simple nav-back without history wrapper (since RT.showScreen already takes full ids)
  var backBtn = RT.$('nav-back');
  if (backBtn) {
    backBtn.addEventListener('click', function () {
      RT.showScreen('s-dash');
    });
  }

  RT.updateAuthButton();
})();
