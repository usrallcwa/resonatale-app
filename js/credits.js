(function () {
  'use strict';

  var MIN_CREDITS = 10;
  var MAX_CREDITS = 1000;

  // ── Render Credits Screen ──

  RT.renderCredits = function () {
    var display = RT.$('credit-amount');
    var slider  = RT.$('credit-slider');

    RT.getCredits().catch(function () {});

    if (slider) {
      slider.value  = RT.creditAmount;
      slider.oninput = function () {
        RT.creditAmount = parseInt(slider.value) || MIN_CREDITS;
        if (display) display.textContent = '$' + RT.creditAmount;
      };
    }
    if (display) display.textContent = '$' + RT.creditAmount;
  };

  // ── Add Credits Button ──

  var addBtn = RT.$('btn-add-credits');
  if (addBtn) {
    addBtn.addEventListener('click', function () {
      if (!RT.isLoggedIn()) { RT.showScreen('auth'); RT.showAuthForm('login'); return; }
      if (RT.creditAmount < MIN_CREDITS) { RT.toast('Minimum $' + MIN_CREDITS + '.'); return; }
      if (RT.creditAmount > MAX_CREDITS) { RT.toast('Maximum $' + MAX_CREDITS + '.'); return; }

      RT.loading(true, 'Setting up payment...');

      RT.addCredits(RT.creditAmount)
        .then(function (data) {
          RT.loading(false);
          if (data.url) {
            window.location.href = data.url;
          } else {
            RT.toast(data.error || 'Payment setup failed. Please try again.');
          }
        })
        .catch(function (err) {
          RT.loading(false);
          RT.toast(err.message || 'Payment failed. Please try again.');
        });
    });
  }

  // ── Handle Stripe Return ──

  (function () {
    var p = new URLSearchParams(window.location.search);

    if (p.get('payment') === 'success') {
      window.history.replaceState({}, '', '/');
      if (RT.isLoggedIn()) {
        RT.getCredits()
          .then(function () {
            RT.toast('Payment successful! Credits added. ✓', true);
            RT.showScreen('create');
            RT.mountTurnstile();
          })
          .catch(function () {
            RT.toast('Payment received — refresh to see your balance.', true);
          });
      } else {
        RT.toast('Payment successful! Log in to see your credits.', true);
      }

    } else if (p.get('payment') === 'cancel') {
      window.history.replaceState({}, '', '/');
      RT.toast('Payment cancelled.');
    }
  })();

})();
