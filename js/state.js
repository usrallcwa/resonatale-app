(function () {
  'use strict';

  window.RT = window.RT || {};

  // ── Global State ──

  RT.mood           = '';
  RT.style          = 'cinematic';
  RT.tier           = '';
  RT.tsToken        = '';
  RT.tsWidgetId     = null;
  RT.generating     = false;
  RT.currentScenes  = null;
  RT.currentFilmId  = null;
  RT.currentBrief   = '';
  RT.voiceBlob      = null;
  RT.hasVoice       = false;
  RT.hasUsedPreview = false;
  RT.credits        = 0;
  RT.selectedVoice  = 'clone';
  RT.language       = '';
  RT.creditAmount   = 50;

  // ── DOM helper ──

  RT.$ = function (id) { return document.getElementById(id); };

  // ── checkSetup — voice only ──

  RT.checkSetup = function () {
    var btn = RT.$('btn-setup-done');
    if (btn) btn.disabled = !RT.voiceBlob;

    var st = RT.$('setup-status');
    if (st) {
      st.textContent = RT.voiceBlob
        ? 'Voice recorded ✓  Click Continue.'
        : 'Record your voice to get started.';
    }
  };

})();
