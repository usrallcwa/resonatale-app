(function () {
  'use strict';

  // ── Load Dashboard ──

  function loadDash() {
    RT.getCredits().catch(function () {});

    RT.getFilms().then(function (data) {
      var list = RT.$('dash-films');
      var empty = RT.$('dash-empty');
      if (!list) return;

      list.innerHTML = '';
      var films = data.films || [];

      if (films.length === 0) {
        if (empty) empty.classList.remove('hide');
        return;
      }

      if (empty) empty.classList.add('hide');

      films.forEach(function (film) {
        var card = RT.renderFilmCard(film);

        card.addEventListener('click', function () {
          if (film.status === 'done' && film.video_url) {
            var v = RT.$('film-video');
            if (v) v.src = film.video_url;
            var dl = RT.$('btn-download');
            if (dl) dl.href = film.video_url;
            RT.renderShareButtons(RT.$('share-buttons'), film.video_url);
            RT.showScreen('player');
          } else if (film.status === 'failed') {
            RT.toast('This film failed. Credits were refunded.');
          } else {
            RT.currentFilmId = film.id;
            RT.showScreen('rendering');
            RT.pollFilmStatus(film.id);
          }
        });

        list.appendChild(card);
      });
    }).catch(function (err) {
      RT.toast(err.message || 'Failed to load films.');
    });
  }

  // ── Dashboard Button ──

  var dashBtn = RT.$('btn-dashboard');
  if (dashBtn) {
    dashBtn.addEventListener('click', function () {
      RT.showScreen('dash');
      loadDash();
    });
  }

  // ── New Film ──

  var newBtn = RT.$('btn-dash-new');
  if (newBtn) {
    newBtn.addEventListener('click', function () {
      RT.resetForm();
      RT.showScreen('create');
      RT.mountTurnstile();
    });
  }

  // ── Add Credits from Dash ──

  var credBtn = RT.$('btn-dash-credits');
  if (credBtn) {
    credBtn.addEventListener('click', function () {
      RT.showScreen('credits');
      RT.renderCredits();
    });
  }

  // ── Logout ──

  var logoutBtn = RT.$('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      RT.logout();
      RT.toast('Logged out.', true);
      RT.showScreen('landing');
    });
  }

})();
