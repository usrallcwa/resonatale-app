(function () {
  'use strict';

  function getInviteUrl() {
    var ref = RT.refCode || (RT.email ? RT.email.split('@')[0] : 'friend');
    return 'https://resonatale.com?ref=' + encodeURIComponent(ref);
  }

  RT.loadInvite = function () {
    var url        = getInviteUrl();
    var link       = RT.$('invite-link');
    if (link) link.textContent = url;

    var msg        = encodeURIComponent('Create AI films narrated in your own voice! Try ResonaTale: ' + url);
    var encodedUrl = encodeURIComponent(url);

    var links = {
      'btn-invite-whatsapp':  'https://api.whatsapp.com/send?text=' + msg,
      'btn-invite-x':         'https://twitter.com/intent/tweet?text=' + msg,
      'btn-invite-facebook':  'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl,
      'btn-invite-telegram':  'https://t.me/share/url?url=' + encodedUrl + '&text=' + msg,
      'btn-invite-instagram': 'https://www.instagram.com/',
      'btn-invite-tiktok':    'https://www.tiktok.com/',
      'btn-invite-youtube':   'https://www.youtube.com/',
      'btn-invite-email':     'mailto:?subject=' + encodeURIComponent('Check out ResonaTale') + '&body=' + msg,
    };

    Object.keys(links).forEach(function (id) {
      var el = RT.$(id);
      if (el) el.href = links[id];
    });
  };

  // ── Copy invite link ──

  var copyBtn = RT.$('btn-copy-invite');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var url = getInviteUrl();

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
          .then(function ()  { RT.toast('Link copied! ✓', true); })
          .catch(function () { fallbackCopy(url); });
      } else {
        fallbackCopy(url);
      }
    });
  }

  function fallbackCopy(url) {
    var ta        = document.createElement('textarea');
    ta.value      = url;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      RT.toast('Link copied! ✓', true);
    } catch (e) {
      RT.toast('Copy failed — select the link manually.');
    }
    document.body.removeChild(ta);
  }

})();
