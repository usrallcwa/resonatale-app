(function () {
  'use strict';

  // ── Render Credits Screen ──

  RT.renderCredits = function () {
    var display = RT.$('credit-amount');
    var slider = RT.$('credit-slider');

    RT.getCredits().catch(function () {});

    if (slider) {
      slider.value = RT.creditAmount;
      slider.oninput = function () {
        RT.creditAmount = parseInt(slider.value);
        if (display) display.textContent = '$' + RT.creditAmount;
      };
    }
    if (display) display.textContent = '$' + RT.creditAmount;
  };

  // ── Add Credits Button ──

  var addBtn = RT.$('btn-add-credits');
  if (addBtn) {
    addBtn.addEventListener('click', function () {
      if (RT.creditAmount < 20) { RT.toast('Minimum $20.'); return; }
      if (RT.creditAmount > 1000) { RT.toast('Maximum $1,000.'); return; }

      RT.loading(true, 'Setting up payment...');

      RT.addCredits(RT.creditAmount).then(function (data) {
        RT.loading(false);
        if (data.url) {
          window.location.href = data.url;
        } else {
          RT.toast('Payment setup failed.');
        }
      }).catch(function (err) {
        RT.loading(false);
        RT.toast(err.message || 'Payment failed.');
      });
    });
  }

  // ── Handle Payment Return ──

  (function () {
    var p = new URLSearchParams(window.location.search);

    if (p.get('payment') === 'success') {
      RT.toast('Payment successful! Credits added.', true);
      window.history.replaceState({}, '', '/');
      if (RT.isLoggedIn()) {
        RT.getCredits().then(function () {
          RT.showScreen('create');
          RT.mountTurnstile();
        });
      }
    } else if (p.get('payment') === 'cancel') {
      RT.toast('Payment cancelled.');
      window.history.replaceState({}, '', '/');
    }
  })();

})();
