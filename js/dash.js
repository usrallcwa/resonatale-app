(function () {
  'use strict';

  // ── Render Film Card ──

  RT.renderFilmCard = function (film) {
    var card = document.createElement('div');
    card.className = 'dash-card';

    var statusClass = 'processing';
    if (film.status === 'done') statusClass = 'done';
    if (film.status === 'failed') statusClass = 'failed';

    var date = film.created_at ? new Date(film.created_at).toLocaleDateString() : '';

    card.innerHTML =
      '<div class="dash-card-top">' +
        '<div class="dash-card-title">' + (film.title || film.brief || 'Untitled').slice(0, 40) + '</div>' +
        '<div class="dash-card-status ' + statusClass + '">' + film.status + '</div>' +
      '</div>' +
      '<div class="dash-card-meta">' +
        '<span>' + (film.mood || '') + '</span>' +
        '<span>' + (film.duration_min || 0) + ' min</span>' +
        '<span>' + date + '</span>' +
      '</div>';

    return card;
  };

  // ── Load Dashboard ──

  RT.loadDash = function () {
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

      films.filter(function (f) { return f.status !== 'failed'; }).forEach(function (film) {
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
            if (confirm('This film failed. Credits were refunded.\n\nRetry with the same story?')) {
              RT.mood = film.mood || '';
              RT.tier = film.tier || 'trailer';
              RT.showScreen('create');
              RT.mountTurnstile();
            }
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
  };

  // ── Auto-load when screen shows ──

  var origShow = RT.showScreen;
  var wrapped = false;
  if (!wrapped) {
    wrapped = true;
    var prevShowScreen = RT.showScreen;
    RT.showScreen = function (id) {
      prevShowScreen(id);
      if (id === 'dash' && RT.isLoggedIn()) RT.loadDash();
    };
  }

})();