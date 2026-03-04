(function () {
  'use strict';

  RT.loadInvite = function () {
    if (!RT.isLoggedIn()) { RT.showScreen('auth'); RT.showAuthForm('login'); return; }

    var code = RT.refCode || RT.email.split('@')[0] + Math.random().toString(36).slice(2, 6);
    var link = 'https://resonatale.com?ref=' + code;

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

    // Render all share platforms
    var container = RT.$('invite-share-buttons');
    if (container) {
      container.innerHTML = '';
      var msg = encodeURIComponent('Create AI films starring YOU! Your face, your voice, your movie. Try it: ' + link);
      var url = encodeURIComponent(link);

      var platforms = [
        { label: 'WhatsApp', icon: '💬', href: 'https://api.whatsapp.com/send?text=' + msg },
        { label: 'X / Twitter', icon: '𝕏', href: 'https://twitter.com/intent/tweet?text=' + msg },
        { label: 'Facebook', icon: 'f', href: 'https://www.facebook.com/sharer/sharer.php?u=' + url + '&quote=' + msg },
        { label: 'Telegram', icon: '✈', href: 'https://t.me/share/url?url=' + url + '&text=' + msg },
        { label: 'LinkedIn', icon: 'in', href: 'https://www.linkedin.com/sharing/share-offsite/?url=' + url },
        { label: 'Reddit', icon: '🔴', href: 'https://www.reddit.com/submit?url=' + url + '&title=' + msg },
        { label: 'Email', icon: '✉️', href: 'mailto:?subject=' + encodeURIComponent('Check out ResonaTale!') + '&body=' + msg },
        { label: 'SMS', icon: '💬', href: 'sms:?body=' + msg },
      ];

      platforms.forEach(function (p) {
        var a = document.createElement('a');
        a.className = 'share-btn';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.href = p.href;
        a.innerHTML = '<span class="share-icon">' + p.icon + '</span><span class="share-label">' + p.label + '</span>';
        container.appendChild(a);
      });
    }
  };

})();