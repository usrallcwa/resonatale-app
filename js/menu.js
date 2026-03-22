(function () {
  'use strict';

  var menu          = RT.$('menu-overlay');
  var screenHistory = ['landing'];
  var originalShowScreen = RT.showScreen;

  // ── Menu open / close ──

  RT.openMenu = function () {
    if (!menu) return;
    menu.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  RT.closeMenu = function () {
    if (!menu) return;
    menu.classList.remove('open');
    document.body.style.overflow = '';
  };

  var menuBtn = RT.$('btn-menu');
  if (menuBtn) menuBtn.addEventListener('click', RT.openMenu);

  var closeBtn = RT.$('btn-menu-close');
  if (closeBtn) closeBtn.addEventListener('click', RT.closeMenu);

  // Close on backdrop tap
  if (menu) {
    menu.addEventListener('click', function (e) {
      if (e.target === menu) RT.closeMenu();
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') RT.closeMenu();
  });

  // ── Auth gate helper ──

  function requireAuth(mode, cb) {
    if (!RT.isLoggedIn()) {
      RT.closeMenu();
      RT.showScreen('auth');
      RT.showAuthForm(mode);
      return;
    }
    cb();
  }

  // ── Menu items ──

  var items = {
    'menu-home': function () {
      RT.closeMenu(); RT.showScreen('landing');
    },
    'menu-create': function () {
      requireAuth('signup', function () {
        RT.closeMenu(); RT.showScreen('create'); RT.mountTurnstile();
      });
    },
    'menu-films': function () {
      requireAuth('login', function () {
        RT.closeMenu(); RT.showScreen('dash');
      });
    },
    'menu-credits': function () {
      requireAuth('signup', function () {
        RT.closeMenu(); RT.showScreen('credits'); RT.renderCredits();
      });
    },
    'menu-profile': function () {
      requireAuth('login', function () {
        RT.closeMenu(); RT.showScreen('profile'); RT.loadProfile();
      });
    },
    'menu-invite': function () {
      requireAuth('login', function () {
        RT.closeMenu(); RT.showScreen('invite'); RT.loadInvite();
      });
    },
    'menu-socials': function () {
      requireAuth('login', function () {
        RT.closeMenu(); RT.showScreen('socials'); RT.loadSocials();
      });
    },
    'menu-how': function () {
      RT.closeMenu(); RT.showScreen('how');
    },
    'menu-auth': function () {
      RT.closeMenu(); RT.showScreen('auth'); RT.showAuthForm('login');
    },
    'menu-logout': function () {
      RT.closeMenu();
      RT.clearAuth();
      screenHistory = ['landing'];
      RT.toast('Logged out.', true);
      updateAuthButtons();
      RT.showScreen('landing');
    },
  };

  Object.keys(items).forEach(function (id) {
    var el = RT.$(id);
    if (el) el.addEventListener('click', items[id]);
  });

  // ── Auth button toggle ──

  function updateAuthButtons() {
    var logoutBtn = RT.$('menu-logout');
    var authBtn   = RT.$('menu-auth');
    var loggedIn  = RT.isLoggedIn();
    if (logoutBtn) logoutBtn.style.display = loggedIn ? 'block' : 'none';
    if (authBtn)   authBtn.style.display   = loggedIn ? 'none'  : 'block';
  }

  // ── Credits badge ──

  RT.updateMenuCredits = function () {
    document.querySelectorAll('.js-credits').forEach(function (el) {
      el.textContent = RT.credits || 0;
    });
  };

  // ── Nav: credits badge click ──

  var navCredits = RT.$('nav-credits');
  if (navCredits) {
    navCredits.addEventListener('click', function () {
      requireAuth('signup', function () {
        RT.showScreen('credits'); RT.renderCredits();
      });
    });
  }

  // ── Nav: logo click ──

  var navLogo = RT.$('nav-logo');
  if (navLogo) {
    navLogo.addEventListener('click', function () { RT.showScreen('landing'); });
  }

  // ── Screen history + nav bar ──

  RT.showScreen = function (id) {
    var prev = screenHistory[screenHistory.length - 1];
    if (prev !== id) screenHistory.push(id);

    originalShowScreen(id);

    // Always show nav
    var nav = RT.$('nav-bar');
    if (nav) {
      nav.classList.remove('hide');
      RT.updateMenuCredits();
      updateAuthButtons();
    }

    // Back button — hide on landing, show everywhere else
    var back = RT.$('nav-back');
    if (back) back.classList.toggle('show', id !== 'landing');
  };

  // ── Back button ──

  var backBtn = RT.$('nav-back');
  if (backBtn) {
    backBtn.addEventListener('click', function () {
      if (screenHistory.length > 1) {
        screenHistory.pop();
        var prev = screenHistory[screenHistory.length - 1];
        originalShowScreen(prev);
        var back = RT.$('nav-back');
        if (back) back.classList.toggle('show', prev !== 'landing');
        RT.updateMenuCredits();
        updateAuthButtons();
      }
    });
  }

  // ── Init ──

  updateAuthButtons();

})();
