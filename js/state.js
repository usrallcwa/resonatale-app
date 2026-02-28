(function () {
  'use strict';

  window.RT = window.RT || {};

  // ── Shared State ──
  RT.mood = '';
  RT.tier = 'short';
  RT.tsToken = '';
  RT.tsWidgetId = null;
  RT.generating = false;
  RT.currentScenes = null;
  RT.currentFilmId = null;
  RT.photos = [];
  RT.voiceBlob = null;
  RT.creditAmount = 50;

  // ── DOM Helper ──
  RT.$ = function (id) { return document.getElementById(id); };

})();

(function () {
  'use strict';

  window.RT = window.RT || {};

  // ── Shared State ──
  RT.mood = '';
  RT.tier = 'short';
  RT.tsToken = '';
  RT.tsWidgetId = null;
  RT.generating = false;
  RT.currentScenes = null;
  RT.currentFilmId = null;
  RT.photos = [];
  RT.voiceBlob = null;
  RT.creditAmount = 50;

  // ── DOM Helper ──
  RT.$ = function (id) { return document.getElementById(id); };

  // ── Setup Progress Check ──
  RT.checkSetup = function () {
    var hasP = RT.photos.length >= 1;
    var hasV = !!RT.voiceBlob;
    var btn = RT.$('btn-save-setup');
    if (btn) btn.disabled = !(hasP && hasV);

    var st = RT.$('setup-status');
    if (st) {
      if (hasP && hasV) st.textContent = 'Ready to continue!';
      else if (hasP) st.textContent = 'Now record your voice.';
      else st.textContent = 'Upload at least 1 photo.';
    }
  };

})();
