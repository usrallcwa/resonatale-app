(function () {
  'use strict';

  RT.loadInvite = function () {
    if (!RT.isLoggedIn()) { RT.showScreen('auth'); RT.showAuthForm('login'); return; }

    var code = RT.email ? RT.email.split('@')[0] + Math.random().toString(36).slice(2, 6) : '';
    var link = 'https://resonatale.com/ref/' + code;

    var linkEl = RT.$('invite-link');
    if (linkEl) linkEl.textContent = link;

    var copyBtn = RT.$('btn-copy-invite');
    if (copyBtn) {
      copyBtn.onclick = function () {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(link).then(function () {
            RT.toast('Link copied!', true);
          });
        }
      };
    }

    var waBtn = RT.$('btn-invite-whatsapp');
    if (waBtn) {
      waBtn.href = 'https://api.whatsapp.com/send?text=' + encodeURIComponent('Create AI films starring YOU! ' + link);
    }

    var xBtn = RT.$('btn-invite-x');
    if (xBtn) {
      xBtn.href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent('Create AI films starring YOU! ' + link);
    }
  };

<<<<<<< HEAD
})();
=======
})();
>>>>>>> 9da706a26b3c4c77ad464ac2413eaa1b6bbcdaa9
