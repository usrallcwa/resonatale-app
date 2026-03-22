(function () {
  'use strict';

  // ── Clock ── (defined first so DOMContentLoaded can call it)
  function drawClock() {
    var c = document.getElementById('clock');
    if (!c) return;
    var ctx = c.getContext('2d');
    var w = c.width, h = c.height, cx = w / 2, cy = h / 2, r = 62;
    var animId = null;

    function frame() {
      ctx.clearRect(0, 0, w, h);
      var now = new Date();
      var sec = now.getSeconds() + now.getMilliseconds() / 1000;
      var min = now.getMinutes() + sec / 60;
      var hr  = (now.getHours() % 12) + min / 60;

      // Outer glow ring
      var grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0,   '#6eb6ff');
      grad.addColorStop(0.5, '#bf5af2');
      grad.addColorStop(1,   '#ff375f');
      ctx.beginPath();
      ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
      ctx.strokeStyle = grad;
      ctx.lineWidth   = 2;
      ctx.shadowColor = '#6eb6ff';
      ctx.shadowBlur  = 20;
      ctx.stroke();
      ctx.shadowBlur  = 0;

      // Face
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fill();

      // Hour markers
      for (var i = 0; i < 12; i++) {
        var a  = (i * Math.PI) / 6;
        var x1 = cx + Math.cos(a) * (r - 10);
        var y1 = cy + Math.sin(a) * (r - 10);
        var x2 = cx + Math.cos(a) * (r - 4);
        var y2 = cy + Math.sin(a) * (r - 4);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth   = 1.5;
        ctx.stroke();
      }

      // 12, 3, 6, 9 labels
      var labels = { 0: '12', 3: '3', 6: '6', 9: '9' };
      ctx.font      = '600 10px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (var idx in labels) {
        var angle = (parseInt(idx) * Math.PI) / 6 - Math.PI / 2;
        var lx = cx + Math.cos(angle) * (r - 18);
        var ly = cy + Math.sin(angle) * (r - 18);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(labels[idx], lx, ly);
      }

      // Hour hand
      var ha = (hr * Math.PI / 6) - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ha) * 30, cy + Math.sin(ha) * 30);
      ctx.strokeStyle = '#f5f5f7';
      ctx.lineWidth   = 3;
      ctx.lineCap     = 'round';
      ctx.stroke();

      // Minute hand
      var ma = (min * Math.PI / 30) - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ma) * 44, cy + Math.sin(ma) * 44);
      ctx.strokeStyle = '#f5f5f7';
      ctx.lineWidth   = 2;
      ctx.lineCap     = 'round';
      ctx.stroke();

      // Second hand
      var sa = (sec * Math.PI / 30) - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(sa) * 10, cy - Math.sin(sa) * 10);
      ctx.lineTo(cx + Math.cos(sa) * 48, cy + Math.sin(sa) * 48);
      ctx.strokeStyle = '#6eb6ff';
      ctx.lineWidth   = 1;
      ctx.lineCap     = 'round';
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#6eb6ff';
      ctx.fill();

      // RT watermark
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font      = '600 11px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('R T', cx, cy + 20);

      animId = requestAnimationFrame(frame);
    }

    frame();

    // Pause clock when tab is hidden — saves CPU
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
      } else {
        if (!animId) frame();
      }
    });
  }


  // ── Everything else after DOM is ready ──
  document.addEventListener('DOMContentLoaded', function () {

    RT.loading(false);

    // Auto-detect language on first visit
    if (!RT.language) {
      var browserLang = (navigator.language || 'en').slice(0, 2).toLowerCase();
      var supported   = ['en','es','fr','ja','de','it','pt','ko','zh','hi','ar','ru'];
      RT.language     = supported.indexOf(browserLang) !== -1 ? browserLang : 'en';
    }

    drawClock();

    // ── Setup Check (voice only) ──
    RT.checkSetup = function () {
      var btn = RT.$('btn-setup-done');
      if (btn) btn.disabled = !RT.voiceBlob;
    };

    // ── Upload Voice ──
    function uploadVoice() {
      RT.loading(true, 'Cloning your voice...');
      new Promise(function (resolve, reject) {
        var reader     = new FileReader();
        reader.onload  = function (e) { resolve(e.target.result); };
        reader.onerror = function () { reject(new Error('Failed to read voice file.')); };
        reader.readAsDataURL(RT.voiceBlob);
      }).then(function (b64) {
        return RT.uploadVoice(b64);
      }).then(function (data) {
        RT.loading(false);
        RT.hasVoice = data.cloned;
        RT.toast(data.cloned ? 'Voice cloned! ✓' : 'Voice saved. Processing...', true);
        RT.showScreen('create');
        RT.mountTurnstile();
      }).catch(function (err) {
        RT.loading(false);
        RT.toast(err.message || 'Voice upload failed. Please try again.');
      });
    }

    // ── After Auth ──
    RT.afterAuth = function () {
      if (RT.voiceBlob) {
        uploadVoice();
      } else if (RT.hasVoice) {
        RT.showScreen('create');
        RT.mountTurnstile();
      } else {
        RT.showScreen('setup');
      }
    };

    // ── Setup Done Button ──
    var setupBtn = RT.$('btn-setup-done');
    if (setupBtn) {
      setupBtn.addEventListener('click', function () {
        if (!RT.voiceBlob)    { RT.toast('Record your voice first.'); return; }
        if (!RT.isLoggedIn()) { RT.showScreen('auth'); RT.showAuthForm('signup'); return; }
        uploadVoice();
      });
    }

    // ── Start / CTA Buttons ──
    function handleStart() {
      if (RT.isLoggedIn()) {
        RT.getProfile()
          .then(function () {
            if (RT.hasVoice) {
              RT.showScreen('create');
              RT.mountTurnstile();
            } else {
              RT.showScreen('setup');
            }
          })
          .catch(function () {
            RT.showScreen('setup');
          });
      } else {
        RT.showScreen('setup');
      }
    }

    ['btn-start', 'btn-start-2'].forEach(function (id) {
      var btn = RT.$(id);
      if (btn) btn.addEventListener('click', handleStart);
    });

    // ── New Film Button ──
    var newFilmBtn = RT.$('btn-new-film');
    if (newFilmBtn) {
      newFilmBtn.addEventListener('click', function () {
        RT.showScreen('create');
        RT.mountTurnstile();
      });
    }

    // ── Auto-load Profile ──
    if (RT.isLoggedIn()) {
      RT.getProfile()
        .then(function () { RT.updateCredits(RT.credits); })
        .catch(function () { RT.clearAuth(); });
    }

    // ── Share Buttons ──
    function getFilmUrl() {
      var v = RT.$('film-video');
      return (v && v.src) ? v.src : window.location.href;
    }

    var shareHandlers = {
      'share-youtube': function () {
        window.open('https://www.youtube.com/upload', '_blank');
      },
      'share-tiktok': function () {
        window.open('https://www.tiktok.com/upload', '_blank');
      },
      'share-x': function () {
        window.open(
          'https://twitter.com/intent/tweet' +
          '?text=' + encodeURIComponent('Check out my AI film! Made with ResonaTale 🎬') +
          '&url='  + encodeURIComponent(getFilmUrl()),
          '_blank'
        );
      },
      'share-facebook': function () {
        window.open(
          'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(getFilmUrl()),
          '_blank'
        );
      },
      'share-whatsapp': function () {
        window.open(
          'https://api.whatsapp.com/send?text=' +
          encodeURIComponent('Check out my AI film made with ResonaTale 🎬 ' + getFilmUrl()),
          '_blank'
        );
      },
      'share-copy': function () {
        var url = getFilmUrl();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url)
            .then(function () { RT.toast('Link copied! ✓', true); })
            .catch(function () { RT.toast('Copy failed. Try manually.'); });
        } else {
          var ta = document.createElement('textarea');
          ta.value = url;
          ta.style.position = 'fixed';
          ta.style.opacity  = '0';
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); RT.toast('Link copied! ✓', true); }
          catch (e) { RT.toast('Copy: ' + url); }
          document.body.removeChild(ta);
        }
      }
    };

    Object.keys(shareHandlers).forEach(function (id) {
      var btn = RT.$(id);
      if (btn) btn.addEventListener('click', shareHandlers[id]);
    });

  }); // end DOMContentLoaded

})();
