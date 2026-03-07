(function () {
  'use strict';

  window.RT = window.RT || {};

  RT.mood = '';
  RT.genre = '';
  RT.tier = 'trailer';
  RT.tsToken = '';
  RT.tsWidgetId = null;
  RT.generating = false;
  RT.currentScenes = null;
  RT.currentFilmId = null;
  RT.photos = [];
  RT.voiceBlob = null;
  RT.creditAmount = 50;

  RT.$ = function (id) { return document.getElementById(id); };

  RT.checkSetup = function () {
    var hasV = !!RT.voiceBlob;
    var btn = RT.$('btn-save-setup');
    if (btn) btn.disabled = !hasV;

    var st = RT.$('setup-status');
    if (st) {
      if (hasV) st.textContent = 'Ready to continue!';
      else st.textContent = 'Record your voice to get started.';
    }
  };

})();