(function () {
  'use strict';

  var feedPage = 1;

  // ── Menu handler ──
  var menuFeed = RT.$('menu-feed');
  if (menuFeed) {
    menuFeed.addEventListener('click', function () {
      RT.showScreen('feed');
      loadFeed(1);
      var overlay = RT.$('menu-overlay');
      if (overlay) overlay.classList.remove('open');
    });
  }

  // ── Load Feed ──
  function loadFeed(page) {
    feedPage = page;
    var list = RT.$('feed-list');
    if (!list) return;
    if (page === 1) list.innerHTML = '<p style="color:#636366;text-align:center;">Loading...</p>';

    fetch(RT.API + '/feed?page=' + page).then(function (r) { return r.json(); }).then(function (data) {
      if (page === 1) list.innerHTML = '';
      var films = data.films || [];

      if (films.length === 0 && page === 1) {
        list.innerHTML = '<p style="color:#636366;text-align:center;">No films shared yet. Be the first!</p>';
        return;
      }

      films.forEach(function (f) {
        var card = document.createElement('div');
        card.className = 'feed-card';
        card.innerHTML =
          '<div class="feed-video-wrap">' +
            '<video class="feed-video" src="' + f.videoUrl + '" preload="metadata" playsinline></video>' +
            '<div class="feed-play-btn">▶</div>' +
          '</div>' +
          '<div class="feed-info">' +
            '<div class="feed-title">' + (f.title || 'Untitled') + '</div>' +
            '<div class="feed-meta">' +
              '<span class="feed-author">@' + f.author + '</span>' +
              '<span class="feed-badges">' + (f.style || '') + ' · ' + (f.mood || '') + '</span>' +
            '</div>' +
            '<div class="feed-actions">' +
              '<button class="feed-like-btn" data-film="' + f.filmId + '">❤️ ' + (f.likes || 0) + '</button>' +
              '<button class="feed-comment-btn" data-film="' + f.filmId + '">💬 Comment</button>' +
              '<span class="feed-views">👁 ' + (f.views || 0) + '</span>' +
            '</div>' +
          '</div>';

        // Play/pause video on click
        var video = card.querySelector('.feed-video');
        var playBtn = card.querySelector('.feed-play-btn');
        card.querySelector('.feed-video-wrap').addEventListener('click', function () {
          if (video.paused) {
            // Pause all other videos
            document.querySelectorAll('.feed-video').forEach(function (v) { v.pause(); });
            document.querySelectorAll('.feed-play-btn').forEach(function (b) { b.style.display = 'flex'; });
            video.play();
            playBtn.style.display = 'none';
          } else {
            video.pause();
            playBtn.style.display = 'flex';
          }
        });

        // Like button
        card.querySelector('.feed-like-btn').addEventListener('click', function () {
          var btn = this;
          if (!RT.isLoggedIn()) { RT.toast('Login to like films.'); return; }
          fetch(RT.API + '/film/like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + RT.token },
            body: JSON.stringify({ filmId: f.filmId })
          }).then(function (r) { return r.json(); }).then(function (d) {
            var count = parseInt(btn.textContent.replace(/[^0-9]/g, '')) || 0;
            btn.textContent = '❤️ ' + (d.liked ? count + 1 : Math.max(0, count - 1));
          });
        });

        // Comment button
        card.querySelector('.feed-comment-btn').addEventListener('click', function () {
          if (!RT.isLoggedIn()) { RT.toast('Login to comment.'); return; }
          var comment = prompt('Write a comment:');
          if (!comment || !comment.trim()) return;
          fetch(RT.API + '/film/comment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + RT.token },
            body: JSON.stringify({ filmId: f.filmId, comment: comment.trim() })
          }).then(function () { RT.toast('Comment posted!', true); });
        });

        list.appendChild(card);
      });

      var moreBtn = RT.$('btn-feed-more');
      if (moreBtn) {
        moreBtn.style.display = films.length >= 20 ? 'block' : 'none';
      }
    }).catch(function () {
      if (page === 1) list.innerHTML = '<p style="color:#ff453a;text-align:center;">Failed to load feed.</p>';
    });
  }

  // Load more
  var moreBtn = RT.$('btn-feed-more');
  if (moreBtn) {
    moreBtn.addEventListener('click', function () {
      loadFeed(feedPage + 1);
    });
  }

  // ── Publish Button ──
  var publishBtn = RT.$('btn-publish');
  if (publishBtn) {
    publishBtn.addEventListener('click', function () {
      if (!RT.isLoggedIn()) { RT.toast('Login to publish.'); return; }
      if (!RT.currentFilmId) { RT.toast('No film to publish.'); return; }

      RT.loading(true, 'Publishing...');
      fetch(RT.API + '/film/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + RT.token },
        body: JSON.stringify({ filmId: RT.currentFilmId })
      }).then(function (r) { return r.json(); }).then(function (d) {
        RT.loading(false);
        if (d.success) {
          RT.toast('Published to community! 🎉', true);
          publishBtn.textContent = '✅ Published';
          publishBtn.disabled = true;
        } else {
          RT.toast(d.error || 'Failed to publish.');
        }
      }).catch(function (e) {
        RT.loading(false);
        RT.toast(e.message || 'Failed.');
      });
    });
  }

})();