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
              '<button class="feed-delete-btn hide" data-film="' + f.filmId + '" data-pub="' + f.id + '">🗑</button>' +
              '<span class="feed-views">👁 ' + (f.views || 0) + '</span>' +
            '</div>' +
            '<div class="feed-comments" id="comments-' + f.filmId + '"></div>' +
            '<div class="feed-comment-form hide" id="form-' + f.filmId + '">' +
              '<input type="text" class="feed-comment-input" placeholder="Write a comment..." maxlength="500">' +
              '<button class="feed-send-btn">Send</button>' +
            '</div>' +
          '</div>';

        // Show delete button if user owns this film
        if (RT.isLoggedIn() && f.author === (RT.email || '').split('@')[0]) {
          var delBtn = card.querySelector('.feed-delete-btn');
          if (delBtn) delBtn.classList.remove('hide');
        }

        // Play/pause video
        var video = card.querySelector('.feed-video');
        var playBtn = card.querySelector('.feed-play-btn');
        card.querySelector('.feed-video-wrap').addEventListener('click', function () {
          if (video.paused) {
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

        // Comment button — toggle form and load comments
        card.querySelector('.feed-comment-btn').addEventListener('click', function () {
          if (!RT.isLoggedIn()) { RT.toast('Login to comment.'); return; }
          var form = card.querySelector('.feed-comment-form');
          form.classList.toggle('hide');
          loadComments(f.filmId, card);
        });

        // Send comment
        var sendBtn = card.querySelector('.feed-send-btn');
        var input = card.querySelector('.feed-comment-input');
        sendBtn.addEventListener('click', function () {
          var text = input.value.trim();
          if (!text) return;
          fetch(RT.API + '/film/comment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + RT.token },
            body: JSON.stringify({ filmId: f.filmId, comment: text })
          }).then(function (r) { return r.json(); }).then(function () {
            input.value = '';
            loadComments(f.filmId, card);
            RT.toast('Comment posted!', true);
          });
        });

        // Delete button
        var deleteBtn = card.querySelector('.feed-delete-btn');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', function () {
            if (!confirm('Remove this film from the community feed?')) return;
            fetch(RT.API + '/film/unpublish', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + RT.token },
              body: JSON.stringify({ filmId: f.filmId })
            }).then(function (r) { return r.json(); }).then(function (d) {
              if (d.success) {
                card.remove();
                RT.toast('Removed from feed.', true);
              } else {
                RT.toast(d.error || 'Failed.');
              }
            });
          });
        }

        // Load comments on render
        loadComments(f.filmId, card);

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

  // ── Load Comments ──
  function loadComments(filmId, card) {
    var container = card.querySelector('#comments-' + filmId);
    if (!container) return;

    fetch(RT.API + '/film/' + filmId + '/comments').then(function (r) { return r.json(); }).then(function (data) {
      var comments = data.comments || [];
      if (comments.length === 0) {
        container.innerHTML = '';
        return;
      }
      container.innerHTML = comments.map(function (c) {
        var isOwner = RT.isLoggedIn() && c.author === (RT.email || '').split('@')[0];
        return '<div class="feed-comment">' +
          '<span class="feed-comment-author">@' + c.author + '</span> ' +
          '<span class="feed-comment-text">' + c.comment + '</span>' +
          (isOwner ? ' <button class="feed-comment-delete" data-film="' + filmId + '" data-comment="' + (c.id || '') + '">✕</button>' : '') +
        '</div>';
      }).join('');
    }).catch(function () {});
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