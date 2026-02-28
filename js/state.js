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
