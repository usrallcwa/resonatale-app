(function () {
  'use strict';

  // ── Render Film Card ──
  RT.renderFilmCard = function (film) {
    var card       = document.createElement('div');
    card.className = 'dash-card';

    var statusClass = film.status === 'done'   ? 'done'
                    : film.status === 'failed' ? 'failed'
                    : 'processing';

    var date = film.created_at
      ? new Date(film.created_at).toLocaleDateString(RT.language || 'en')
      : '';

    var title = RT._esc((film.title || film.brief || 'Untitled').slice(0, 50));

    card.innerHTML =
      '<div class="dash-card-top">' +
        '<div class="dash-card-title">' + title + '</div>' +
        '<div class="dash-card-status ' + statusClass + '">' + RT._esc(film.status) + '</div>' +
      '</div>' +
      '<div class="dash-card-meta">' +
        '<span>' + RT._esc(film.mood || '')          + '</span>' +
        '<span>' + (film.duration_min || 0) + ' min' + '</span>' +
        '<span>' + date                              + '</span>' +
      '</div>';

    return card;
  };

  // ── Load Films ──
  RT.loadDashFilms = function () {
    RT.getCredits().catch(function () {});

    var list  = RT.$('dash-films');
    var empty = RT.$('dash-empty');
    if (!list) return;

    list.innerHTML = '<p class="dash-empty">Loading...</p>';

    RT.getFilms()
      .then(function (data) {
        list.innerHTML = '';
        var films = (data.films || []).filter(function (f) { return f.status !== 'failed'; });

        if (films.length === 0) {
          if (empty) empty.classList.remove('hide');
          return;
        }
        if (empty) empty.classList.add('hide');

        films.forEach(function (film) {
          var card = RT.renderFilmCard(film);
          card.addEventListener('click', function () { handleFilmClick(film); });
          list.appendChild(card);
        });
      })
      .catch(function (err) {
        list.innerHTML = '<p class="dash-error">Failed to load films.</p>';
        RT.toast(err.message || 'Failed to load films.');
      });
  };

  // Keep loadDash as alias for compatibility
  RT.loadDash = RT.loadDashFilms;

  // ── Film Click Handler ──
  function handleFilmClick(film) {
    if (film.status === 'done' && film.video_url) {
      var v  = RT.$('film-video');
      var dl = RT.$('btn-download');
      if (v)  { v.src = film.video_url; v.load(); }
      if (dl) dl.href = film.video_url;
      RT.currentFilmId = film.id;
      RT.renderShareButtons(RT.$('share-buttons'), film.video_url);
      RT.showScreen('player');

    } else if (film.status === 'processing' || film.status === 'pending') {
      RT.currentFilmId = film.id;
      RT.showScreen('rendering');
      RT.pollFilmStatus(film.id);

    } else if (film.status === 'failed') {
      if (confirm('This film failed. Credits were refunded.\n\nRetry with the same story?')) {
        RT.mood = film.mood || '';
        RT.tier = film.tier || (RT.TIERS[0] ? RT.TIERS[0].id : 'shorts');
        RT.showScreen('s-create');
        RT.mountTurnstile();
      }
    }
  }

  // ── Tabs Setup ──
  function setupDashTabs() {
    var tabFilms    = RT.$('tab-films');
    var tabSeries   = RT.$('tab-series');
    var panelFilms  = RT.$('dash-films');
    var panelSeries = RT.$('dash-series');
    var empty       = RT.$('dash-empty');

    if (!tabFilms || !tabSeries || !panelFilms || !panelSeries) return;

    function activateFilms() {
      tabFilms.classList.add('active');
      tabSeries.classList.remove('active');
      tabFilms.setAttribute('aria-selected', 'true');
      tabSeries.setAttribute('aria-selected', 'false');
      panelFilms.classList.remove('hide');
      panelSeries.classList.add('hide');
      if (empty) empty.classList.add('hide');
      RT.loadDashFilms();
    }

    function activateSeries() {
      tabSeries.classList.add('active');
      tabFilms.classList.remove('active');
      tabSeries.setAttribute('aria-selected', 'true');
      tabFilms.setAttribute('aria-selected', 'false');
      panelSeries.classList.remove('hide');
      panelFilms.classList.add('hide');
      if (empty) empty.classList.add('hide');
      if (typeof RT.loadSeriesDash === 'function') RT.loadSeriesDash();
    }

    tabFilms.addEventListener('click', activateFilms);
    tabSeries.addEventListener('click', activateSeries);

    RT._activateDashFilms  = activateFilms;
    RT._activateDashSeries = activateSeries;
  }

  // ── Wrap showScreen ONCE ──
  var _showScreen = RT.showScreen;
  RT.showScreen = function (id) {
    _showScreen(id);
    if (id === 'dash' && RT.isLoggedIn()) {
      if (!RT._dashTabsSetup) {
        setupDashTabs();
        RT._dashTabsSetup = true;
      }
      if (typeof RT._activateDashFilms === 'function') {
        RT._activateDashFilms();
      } else {
        RT.loadDashFilms();
      }
    }
  };

})();
