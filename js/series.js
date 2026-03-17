(function () {
  'use strict';

  // ── Dashboard Tabs ──
  RT.showDashTab = function (tab) {
    var films = RT.$('dash-films');
    var series = RT.$('dash-series');
    var tabFilms = RT.$('tab-films');
    var tabSeries = RT.$('tab-series');
    
    if (tab === 'films') {
      if (films) films.classList.remove('hide');
      if (series) series.classList.add('hide');
      if (tabFilms) tabFilms.classList.add('active');
      if (tabSeries) tabSeries.classList.remove('active');
    } else {
      if (films) films.classList.add('hide');
      if (series) series.classList.remove('hide');
      if (tabFilms) tabFilms.classList.remove('active');
      if (tabSeries) tabSeries.classList.add('active');
      RT.loadSeriesList();
    }
  };

  RT.loadSeriesList = function () {
    var container = RT.$('dash-series');
    if (!container) return;
    container.innerHTML = '<p style="color:#636366;text-align:center;">Loading...</p>';
    
    RT.getSeries().then(function (data) {
      container.innerHTML = '';
      var list = data.series || [];
      if (list.length === 0) {
        container.innerHTML = '<div class="dash-empty"><p>No series yet.</p></div>';
        return;
      }
      list.forEach(function (s) {
        var card = document.createElement('div');
        card.className = 'dash-card';
        card.innerHTML = '<div class="dash-card-title">📺 ' + (s.title || 'Untitled') + '</div>' +
          '<div class="dash-card-meta">' + (s.style || 'cinematic') + ' · ' + (s.episode_count || 0) + ' episodes</div>';
        card.addEventListener('click', function () {
          RT.currentSeriesId = s.id;
          RT.showScreen('series-detail');
          RT.loadSeriesDetail(s.id);
        });
        container.appendChild(card);
      });
    }).catch(function () {
      container.innerHTML = '<p style="color:#ff453a;">Failed to load series.</p>';
    });
  };

  var currentSeriesId = null;
  var currentSeries = null;
  var seriesStyle = 'cartoon';
  var seriesMood = 'comedy';

  // ── Render Style Chips for Series ──
  var ssChips = RT.$('series-style-chips');
  if (ssChips) {
    var styles = [
      { id: 'cinematic', icon: '🎬', label: 'Cinematic' },
      { id: 'anime', icon: '🌸', label: 'Anime' },
      { id: 'cartoon', icon: '🎨', label: 'Cartoon' },
      { id: 'comic', icon: '💥', label: 'Comic Book' },
      { id: 'noir', icon: '🖤', label: 'Film Noir' },
      { id: 'watercolor', icon: '🎭', label: 'Watercolor' },
      { id: 'retro', icon: '📼', label: 'Retro VHS' },
      { id: 'fantasy', icon: '🐉', label: 'Fantasy' },
    ];
    styles.forEach(function (s) {
      var btn = document.createElement('button');
      btn.className = 'chip' + (s.id === 'cartoon' ? ' on' : '');
      btn.type = 'button';
      btn.setAttribute('data-v', s.id);
      btn.textContent = s.icon + ' ' + s.label;
      btn.addEventListener('click', function () {
        seriesStyle = s.id;
        var all = ssChips.querySelectorAll('.chip');
        for (var i = 0; i < all.length; i++) all[i].classList.toggle('on', all[i].getAttribute('data-v') === s.id);
      });
      ssChips.appendChild(btn);
    });
  }

  // ── Render Mood Chips for Series ──
  var smChips = RT.$('series-mood-chips');
  if (smChips) {
    var moodIcons = { calm: '🌊', cozy: '☕', adventure: '🔥', romantic: '❤️', suspense: '🌑', motivational: '💪', heartwarming: '💖', dramatic: '🎭', thriller: '🔪', action: '💥', spiritual: '🕊', comedy: '😂', horror: '👻', mystery: '🔍', inspirational: '⭐' };
    RT.MOODS.forEach(function (m) {
      var btn = document.createElement('button');
      btn.className = 'chip' + (m === 'comedy' ? ' on' : '');
      btn.type = 'button';
      btn.setAttribute('data-v', m);
      btn.textContent = (moodIcons[m] || '') + ' ' + m.charAt(0).toUpperCase() + m.slice(1);
      btn.addEventListener('click', function () {
        seriesMood = m;
        var all = smChips.querySelectorAll('.chip');
        for (var i = 0; i < all.length; i++) all[i].classList.toggle('on', all[i].getAttribute('data-v') === m);
      });
      smChips.appendChild(btn);
    });
  }
  var seriesMood = 'comedy';

  // ── API Functions ──

  RT.createSeries = function (data) {
    return RT.apiFetch ? RT.apiFetch('POST', '/series', data) : fetch(RT.API + '/series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + RT.token },
      body: JSON.stringify(data)
    }).then(function (r) { return r.json(); });
  };

  RT.getSeries = function () {
    return fetch(RT.API + '/series', {
      headers: { 'Authorization': 'Bearer ' + RT.token }
    }).then(function (r) { return r.json(); });
  };

  RT.getSeriesEpisodes = function (seriesId) {
    return fetch(RT.API + '/series/' + seriesId + '/episodes', {
      headers: { 'Authorization': 'Bearer ' + RT.token }
    }).then(function (r) { return r.json(); });
  };

  // ── Load Series List ──

  RT.loadSeries = function () {
    var list = RT.$('series-list');
    if (!list) return;
    list.innerHTML = '<p style="color:#636366;">Loading...</p>';

    RT.getSeries().then(function (data) {
      var series = data.series || [];
      if (series.length === 0) {
        list.innerHTML = '<p style="color:#636366;">No series yet. Create your first one!</p>';
        return;
      }
      list.innerHTML = '';
      series.forEach(function (s) {
        var card = document.createElement('div');
        card.className = 'dash-card';
        card.innerHTML =
          '<div class="dash-card-title">' + s.title + '</div>' +
          '<div class="dash-card-meta">' + (s.episode_count || 0) + ' episodes · ' + (s.style || 'cinematic') + '</div>';
        card.addEventListener('click', function () {
          currentSeriesId = s.id;
          currentSeries = s;
          RT.loadSeriesDetail(s.id);
        });
        list.appendChild(card);
      });
    }).catch(function () {
      list.innerHTML = '<p style="color:#ff453a;">Failed to load series.</p>';
    });
  };

  // ── Load Series Detail ──

  RT.loadSeriesDetail = function (seriesId) {
    RT.showScreen('series-detail');
    var titleEl = RT.$('series-detail-title');
    var descEl = RT.$('series-detail-desc');
    var charsEl = RT.$('series-detail-chars');
    var episodeList = RT.$('episode-list');

    if (titleEl) titleEl.textContent = currentSeries ? currentSeries.title : 'Series';
    if (descEl) descEl.textContent = currentSeries ? currentSeries.description : '';
    if (charsEl) charsEl.textContent = currentSeries ? 'Characters: ' + currentSeries.characters : '';
    if (episodeList) episodeList.innerHTML = '<p style="color:#636366;">Loading episodes...</p>';

    RT.getSeriesEpisodes(seriesId).then(function (data) {
      var episodes = data.episodes || [];
      if (episodes.length === 0) {
        episodeList.innerHTML = '<p style="color:#636366;">No episodes yet. Create the first one!</p>';
        return;
      }
      episodeList.innerHTML = '';
      episodes.forEach(function (ep) {
        var card = document.createElement('div');
        card.className = 'dash-card';
        card.innerHTML =
          '<div class="dash-card-num">Episode ' + ep.episode_number + '</div>' +
          '<div class="dash-card-title">' + (ep.title || ep.brief || 'Untitled').slice(0, 40) + '</div>' +
          '<div class="dash-card-meta">' + ep.status + '</div>';
        card.addEventListener('click', function () {
          if (ep.status === 'done' && ep.video_url) {
            var v = RT.$('film-video');
            if (v) v.src = ep.video_url;
            var dl = RT.$('btn-download');
            if (dl) dl.href = ep.video_url;
            RT.showScreen('player');
          }
        });
        episodeList.appendChild(card);
      });
    }).catch(function () {
      episodeList.innerHTML = '<p style="color:#ff453a;">Failed to load episodes.</p>';
    });
  };

  // ── Create Series Button ──

  var newSeriesBtn = RT.$('btn-new-series');
  if (newSeriesBtn) {
    newSeriesBtn.addEventListener('click', function () {
      RT.showScreen('create-series');
    });
  }

  // ── Save Series ──

  var saveSeriesBtn = RT.$('btn-save-series');
  if (saveSeriesBtn) {
    saveSeriesBtn.addEventListener('click', function () {
      var title = RT.$('series-title') ? RT.$('series-title').value.trim() : '';
      var characters = RT.$('series-characters') ? RT.$('series-characters').value.trim() : '';
      var desc = RT.$('series-desc') ? RT.$('series-desc').value.trim() : '';

      if (!title) { RT.toast('Enter a series title.'); return; }
      if (!characters) { RT.toast('Describe your characters.'); return; }

      RT.loading(true, 'Creating series...');
      RT.createSeries({
        title: title,
        characters: characters,
        style: seriesStyle,
        mood: seriesMood,
        description: desc
      }).then(function (data) {
        RT.loading(false);
        RT.toast('Series created!', true);
        currentSeriesId = data.seriesId;
        RT.showScreen('series');
        RT.loadSeries();
      }).catch(function (err) {
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
      if (titleEl && currentSeries) titleEl.textContent = currentSeries.title;
      RT.showScreen('new-episode');
    });
  }

  // ── Create Episode ──

  var createEpBtn = RT.$('btn-create-episode');
  if (createEpBtn) {
    createEpBtn.addEventListener('click', function () {
      var title = RT.$('episode-title') ? RT.$('episode-title').value.trim() : '';
      var brief = RT.$('episode-brief') ? RT.$('episode-brief').value.trim() : '';
      var slider = RT.$('episode-duration');
      var tierIdx = slider ? parseInt(slider.value) : 0;
      var tier = RT.TIERS[tierIdx] || RT.TIERS[0];

      if (!brief) { RT.toast('Describe what happens in this episode.'); return; }

      var t = RT.TIERS.find(function (x) { return x.id === tier.id; });
      if (t && RT.credits < t.credits) {
        RT.showScreen('credits');
        RT.renderCredits();
        RT.toast('You need ' + t.credits + ' credits.');
        return;
      }

      RT.loading(true, 'Creating episode...');

      fetch(RT.API + '/film/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + RT.token },
        body: JSON.stringify({
          title: title,
          brief: brief,
          mood: currentSeries ? currentSeries.mood : 'comedy',
          language: RT.language,
          tier: tier.id,
          style: currentSeries ? currentSeries.style : 'cartoon',
          series_id: currentSeriesId
        })
      }).then(function (r) { return r.json(); }).then(function (data) {
        RT.loading(false);
        if (data.filmId) {
          RT.currentFilmId = data.filmId;
          RT.showScreen('rendering');
          RT.pollFilmStatus(data.filmId);
          RT.toast('Episode started!', true);
        } else {
          RT.toast(data.error || 'Failed to create episode.');
        }
      }).catch(function (err) {
        RT.loading(false);
        RT.toast(err.message || 'Failed.');
      });
    });
  }

  // ── Episode Duration Slider ──

  var epSlider = RT.$('episode-duration');
  if (epSlider) {
    epSlider.addEventListener('input', function () {
      var idx = parseInt(epSlider.value);
      var tier = RT.TIERS[idx] || RT.TIERS[0];
      var label = RT.$('episode-duration-label');
      if (label) label.textContent = tier.label + ' · ' + tier.desc + ' · ' + tier.scenes + ' scenes';
    });
  }

})();