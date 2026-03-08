(function () {
  'use strict';

  RT.loadInvite = function () {
    var link = RT.$('invite-link');
    var ref = RT.refCode || RT.email.split('@')[0];
    var url = 'https://resonatale.com?ref=' + ref;
    if (link) link.textContent = url;

    var msg = encodeURIComponent('Create AI films narrated in your own voice! Try ResonaTale: ' + url);
    var encodedUrl = encodeURIComponent(url);

    var links = {
      'btn-invite-whatsapp': 'https://api.whatsapp.com/send?text=' + msg,
      'btn-invite-x': 'https://twitter.com/intent/tweet?text=' + msg,
      'btn-invite-facebook': 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl,
      'btn-invite-telegram': 'https://t.me/share/url?url=' + encodedUrl + '&text=' + msg,
      'btn-invite-instagram': 'https://www.instagram.com/',
      'btn-invite-tiktok': 'https://www.tiktok.com/',
      'btn-invite-youtube': 'https://www.youtube.com/',
      'btn-invite-email': 'mailto:?subject=' + encodeURIComponent('Check out ResonaTale') + '&body=' + msg,
    };

    Object.keys(links).forEach(function (id) {
      var el = RT.$(id);
      if (el) el.href = links[id];
    });
  };

  var copyBtn = RT.$('btn-copy-invite');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var ref = RT.refCode || RT.email.split('@')[0];
      var url = 'https://resonatale.com?ref=' + ref;
      navigator.clipboard.writeText(url).then(function () {
        RT.toast('Link copied!', true);
      }).catch(function () {
        RT.toast('Copy failed. Select the link manually.');
      });
    });
  }

})();