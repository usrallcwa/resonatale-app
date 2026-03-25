(function () {
  'use strict';

  // ── New Film from Player ──

  var newBtn = RT.$('btn-new-film');
  if (newBtn) {
    newBtn.addEventListener('click', function () {
      RT.resetForm();
      RT.showScreen('s-create');
      RT.mountTurnstile();
    });
  }

})();
