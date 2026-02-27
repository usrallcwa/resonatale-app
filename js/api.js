(function () {
  'use strict';

  // ── Generate scenes from API ──
  function generateScenes(payload, onSuccess, onError) {
    fetch(RT.API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function (r) {
      if (!r.ok) {
        return r.text().then(function (txt) {
          var errMsg = 'Generation failed (HTTP ' + r.status + ')';
          try {
            var p = JSON.parse(txt);
            errMsg = p.detail || p.error || errMsg;
          } catch (e) {
            if (txt && txt.length < 300) errMsg = txt;
          }
          throw new Error(errMsg);
        });
      }
      return r.json();
    })
    .then(function (data) {
      if (!data.scenes || !data.scenes.length) {
        throw new Error('No scenes returned. Try again.');
      }
      onSuccess(data.scenes);
    })
    .catch(function (err) {
      onError(err.message || 'Something went wrong.');
    });
  }

  // Export
  window.RT = window.RT || {};
  RT.generateScenes = generateScenes;
})();
