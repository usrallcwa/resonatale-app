(function () {
  'use strict';

  var currentSeriesId = null;
  var currentSeries   = null;
  var seriesStyle     = 'cinematic';
  var seriesMood      = 'comedy';

  // ── Helpers ──

  function apiFetch(method, path, body) {
    var opts = {
      method:  method,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + RT.token },
    };
    if (body) opts.body = JSON.stringify(body);
    return fetch(RT.API + path, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) throw new Error(data.error || 'Request failed');
        return data;
      });
    });
  }

  function esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Dashboard Tabs ──

  RT.showDashTab = function (tab) {
    var films    = RT.$('dash-films');
    var series   = RT.$('dash-series');
    var tabFilms = RT.$('tab-films');
    var tabSer   = RT.$('tab-series');

    var showFilms = tab === 'films';
    if (films)    films.classList.toggle('hide',  !showFilms);
    if (series)   series.classList.toggle('hide',  showFilms);
    if (tabFilms) tabFilms.classList.toggle('active',  showFilms);
    if (tabSer)   tabSer.classList.toggle('active',   !showFilms);

    if (!showFilms) RT.loadSeriesList();
  };

  // ── Series List (dashboard tab) ──

  RT.loadSeriesList = function () {
    var container = RT.$('dash-series');
    if (!container) return;
    container.innerHTML = '<p class="dash-empty">Loading...</p>';

    apiFetch('GET', '/series')
      .then(function (data) {
        container.innerHTML = '';
        var list = data.series || [];
        if (list.length === 0) {
          container.innerHTML = '<div class="dash-empty"><p>No series yet. Create your first one!</p></div>';
          return;
        }
        list.forEach(function (s) {
          var card       = document.createElement('div');
          card.className = 'dash-card';
          card.innerHTML =
            '<div class="dash-card-title">'  + esc(s.title || 'Untitled') + '</div>' +
            '<div class="dash-card-meta">'   + esc(s.style || 'cinematic') + ' · ' + (s.episode_count || 0) + ' episodes</div>';
          card.addEventListener('click', function () {
            currentSeriesId = s.id;
            currentSeries   = s;
            RT.loadSeriesDetail(s.id);
          });
          container.appendChild(card);
        });
      })
      .catch(function () {
        container.innerHTML = '<p class="dash-error">Failed to load series. Try again.</p>';
      });
  };

  // ── Style Chips (create series screen) ──

  var SERIES_STYLES = [
    { id: 'cinematic',  icon: '🎬', label: 'Cinematic'  },
    { id: 'anime',      icon: '🌸', label: 'Anime'      },
    { id: 'cartoon',    icon: '🎨', label: 'Cartoon'    },
    { id: 'comic',      icon: '💥', label: 'Comic Book' },
    { id: 'noir',       icon: '🖤', label: 'Film Noir'  },
    { id: 'watercolor', icon: '🎭', label: 'Watercolor' },
    { id: 'retro',      icon: '📼', label: 'Retro VHS'  },
    { id: 'fantasy',    icon: '🐉', label: 'Fantasy'    },
  ];

  var MOOD_ICONS = {
    calm: '🌊', cozy: '☕', adventure: '🔥', romantic: '❤️',
    suspense: '🌑', motivational: '💪', heartwarming: '💖', dramatic: '🎭',
    thriller: '🔪', action: '💥', spiritual: '🕊', comedy: '😂',
    horror: '👻', mystery: '🔍', inspirational: '⭐',
  };

  var ssChips = RT.$('series-style-chips');
  if (ssChips) {
    SERIES_STYLES.forEach(function (s) {
      var btn       = document.createElement('button');
      btn.className = 'chip' + (s.id === seriesStyle ? ' on' : '');
      btn.type      = 'button';
      btn.setAttribute('data-v', s.id);
      btn.textContent = s.icon + ' ' + s.label;
      ssChips.appendChild(btn);
    });
    ssChips.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      seriesStyle = chip.getAttribute('data-v') || seriesStyle;
      ssChips.querySelectorAll('.chip').forEach(function (c) {
        c.classList.toggle('on', c === chip);
      });
    });
  }

  var smChips = RT.$('series-mood-chips');
  if (smChips && RT.MOODS) {
    RT.MOODS.forEach(function (m) {
      var btn       = document.createElement('button');
      btn.className = 'chip' + (m === seriesMood ? ' on' : '');
      btn.type      = 'button';
      btn.setAttribute('data-v', m);
      btn.textContent = (MOOD_ICONS[m] || '') + ' ' + m.charAt(0).toUpperCase() + m.slice(1);
      smChips.appendChild(btn);
    });
    smChips.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      seriesMood = chip.getAttribute('data-v') || seriesMood;
      smChips.querySelectorAll('.chip').forEach(function (c) {
        c.classList.toggle('on', c === chip);
      });
    });
  }

  // ── Series Detail ──

  RT.loadSeriesDetail = function (seriesId) {
    RT.showScreen('series-detail');

    var titleEl   = RT.$('series-detail-title');
    var descEl    = RT.$('series-detail-desc');
    var charsEl   = RT.$('series-detail-chars');
    var epList    = RT.$('episode-list');

    if (titleEl) titleEl.textContent = currentSeries ? esc(currentSeries.title) : 'Series';
    if (descEl)  descEl.textContent  = currentSeries ? esc(currentSeries.description || '') : '';
    if (charsEl) charsEl.textContent = currentSeries && currentSeries.characters
      ? 'Characters: ' + esc(currentSeries.characters) : '';
    if (epList)  epList.innerHTML    = '<p class="dash-empty">Loading episodes...</p>';

    apiFetch('GET', '/series/' + seriesId + '/episodes')
      .then(function (data) {
        if (!epList) return;
        var episodes = data.episodes || [];
        if (episodes.length === 0) {
          epList.innerHTML = '<p class="dash-empty">No episodes yet. Create the first one!</p>';
          return;
        }
        epList.innerHTML = '';
        episodes.forEach(function (ep) {
          var card       = document.createElement('div');
          card.className = 'dash-card' + (ep.status === 'done' ? ' clickable' : '');
          card.innerHTML =
            '<div class="dash-card-num">Episode ' + (ep.episode_number || '') + '</div>' +
            '<div class="dash-card-title">' + esc((ep.title || ep.brief || 'Untitled').slice(0, 50)) + '</div>' +
            '<div class="dash-card-meta dash-status-' + esc(ep.status) + '">' + esc(ep.status) + '</div>';

          if (ep.status === 'done' && ep.video_url) {
            card.addEventListener('click', function () {
              var v  = RT.$('film-video');
              var dl = RT.$('btn-download');
              if (v)  { v.src = ep.video_url; v.load(); }
              if (dl) dl.href = ep.video_url;
              RT.currentFilmId = ep.id;
              RT.showScreen('player');
            });
          }
          epList.appendChild(card);
        });
      })
      .catch(function () {
        if (epList) epList.innerHTML = '<p class="dash-error">Failed to load episodes.</p>';
      });
  };

  // ── New Series Button ──

  var newSeriesBtn = RT.$('btn-new-series');
  if (newSeriesBtn) {
    newSeriesBtn.addEventListener('click', function () { RT.showScreen('create-series'); });
  }

  // ── Save Series ──

  var saveSeriesBtn = RT.$('btn-save-series');
  if (saveSeriesBtn) {
    saveSeriesBtn.addEventListener('click', function () {
      var title      = RT.$('series-title')      ? RT.$('series-title').value.trim()      : '';
      var characters = RT.$('series-characters') ? RT.$('series-characters').value.trim() : '';
      var desc       = RT.$('series-desc')       ? RT.$('series-desc').value.trim()       : '';

      if (!title)      { RT.toast('Enter a series title.');        return; }
      if (!characters) { RT.toast('Describe your characters.');    return; }

      RT.loading(true, 'Creating series...');

      apiFetch('POST', '/series', {
        title: title, characters: characters,
        style: seriesStyle, mood: seriesMood, description: desc,
      })
        .then(function (data) {
          RT.loading(false);
          RT.toast('Series created!', true);
          currentSeriesId = data.seriesId;
          RT.showScreen('series-detail');
          RT.loadSeriesDetail(data.seriesId);
        })
        .catch(function (err) {
          RT.loading(false);
          RT.toast(err.message || 'Failed to create series.');
        });
    });
  }

  // ── New Episode Button ──

  var newEpBtn = RT.$('btn-new-episode');
  if (newEpBtn) {
    newEpBtn.addEventListener('click', function () {
      var titleEl = RT.$('episode-series-title');
      if (titleEl && currentSeries) titleEl.textContent = esc(currentSeries.title);
      RT.showScreen('new-episode');
    });
  }

  // ── Episode Duration Slider ──

  var epSlider = RT.$('episode-duration');
  if (epSlider) {
    epSlider.addEventListener('input', function () {
      var tier  = RT.TIERS[parseInt(epSlider.value)] || RT.TIERS[0];
      var label = RT.$('episode-duration-label');
      if (label) label.textContent = tier.label + ' · ' + tier.desc + ' · ' + tier.scenes + ' scenes';
    });
  }

  // ── Create Episode ──

  var createEpBtn = RT.$('btn-create-episode');
  if (createEpBtn) {
    createEpBtn.addEventListener('click', function () {
      var title   = RT.$('episode-title') ? RT.$('episode-title').value.trim() : '';
      var brief   = RT.$('episode-brief') ? RT.$('episode-brief').value.trim() : '';
      var tierIdx = epSlider ? parseInt(epSlider.value) : 0;
      var tier    = RT.TIERS[tierIdx] || RT.TIERS[0];

      if (!brief) { RT.toast('Describe what happens in this episode.'); return; }

      RT.getProfile()
        .then(function () {
          if (RT.credits < tier.credits) {
            RT.showScreen('credits');
            RT.renderCredits();
            RT.toast('You need ' + tier.credits + ' credits. You have ' + RT.credits + '.');
            return;
          }

          RT.loading(true, 'Creating episode...');

          apiFetch('POST', '/film/create', {
            title:     title,
            brief:     brief,
            mood:      currentSeries ? currentSeries.mood  : seriesMood,
            language:  RT.language   || 'en',
            tier:      tier.id,
            style:     currentSeries ? currentSeries.style : seriesStyle,
            series_id: currentSeriesId,
          })
            .then(function (data) {
              RT.loading(false);
              RT.currentFilmId = data.filmId;
              RT.showScreen('rendering');
              RT.pollFilmStatus(data.filmId);
              RT.toast('Episode started!', true);
            })
            .catch(function (err) {
              RT.loading(false);
              RT.toast(err.message || 'Failed to create episode.');
            });
        })
        .catch(function () {
          RT.toast('Could not verify credits. Please try again.');
        });
    });
  }

})();
