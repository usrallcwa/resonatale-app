(function () {
  'use strict';

  var feedPage = 1;

  // ── Helper: authenticated fetch ──

  function apiFetch(path, method, body) {
    var opts = {
      method:  method || 'GET',
      headers: { 'Content-Type': 'application/json' },
    };
    if (RT.token) opts.headers['Authorization'] = 'Bearer ' + RT.token;
    if (body)     opts.body = JSON.stringify(body);
    return fetch(RT.API + path, opts).then(function (r) { return r.json(); });
  }

  // ── Escape HTML — prevent XSS from author/comment text ──

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Menu entry ──

  var menuFeed = RT.$('menu-feed');
  if (menuFeed) {
    menuFeed.addEventListener('click', function () {
      RT.closeMenu();
      RT.showScreen('feed');
      loadFeed(1);
    });
  }

  // ── Load feed ──

  function loadFeed(page) {
    feedPage   = page;
    var list   = RT.$('feed-list');
    if (!list) return;

    if (page === 1) list.innerHTML = '<p class="feed-empty">Loading...</p>';

    apiFetch('/feed?page=' + page)
      .then(function (data) {
        if (page === 1) list.innerHTML = '';
        var films = data.films || [];

        if (films.length === 0 && page === 1) {
          list.innerHTML = '<p class="feed-empty">No films shared yet. Be the first!</p>';
          return;
        }

        films.forEach(function (f) { list.appendChild(buildCard(f)); });

        var moreBtn = RT.$('btn-feed-more');
        if (moreBtn) moreBtn.style.display = data.hasMore ? 'block' : 'none';
      })
      .catch(function () {
        if (page === 1) list.innerHTML = '<p class="feed-empty feed-error">Failed to load feed. Try again.</p>';
      });
  }

  // ── Build feed card ──

  function buildCard(f) {
    var card       = document.createElement('div');
    card.className = 'feed-card';

    var isOwner = RT.isLoggedIn() && f.author === (RT.email || '').split('@')[0];

    card.innerHTML =
      '<div class="feed-video-wrap">' +
        '<video class="feed-video" src="' + esc(f.videoUrl) + '" preload="metadata" playsinline></video>' +
        '<div class="feed-play-btn">▶</div>' +
      '</div>' +
      '<div class="feed-info">' +
        '<div class="feed-title">' + esc(f.title || 'Untitled') + '</div>' +
        '<div class="feed-meta">' +
          '<span class="feed-author">@' + esc(f.author) + '</span>' +
          '<span class="feed-badges">' + esc(f.style || '') + (f.style && f.mood ? ' · ' : '') + esc(f.mood || '') + '</span>' +
        '</div>' +
        '<div class="feed-actions">' +
          '<button class="feed-like-btn" aria-label="Like">❤️ <span class="like-count">' + (f.likes || 0) + '</span></button>' +
          '<button class="feed-comment-btn" aria-label="Comment">💬 Comment</button>' +
          '<span class="feed-views">👁 ' + (f.views || 0) + '</span>' +
          (isOwner ? '<button class="feed-delete-btn" aria-label="Remove from feed">🗑</button>' : '') +
        '</div>' +
        '<div class="feed-comments" id="comments-' + esc(f.filmId) + '"></div>' +
        '<div class="feed-comment-form hide" id="form-' + esc(f.filmId) + '">' +
          '<input type="text" class="feed-comment-input" placeholder="Write a comment..." maxlength="500" autocomplete="off">' +
          '<button class="feed-send-btn">Send</button>' +
        '</div>' +
      '</div>';

    wireCard(card, f, isOwner);
    loadComments(f.filmId, card);
    return card;
  }

  // ── Wire card interactions ──

  function wireCard(card, f, isOwner) {
    var video   = card.querySelector('.feed-video');
    var playBtn = card.querySelector('.feed-play-btn');
    var viewed  = false;

    // Play / pause
    card.querySelector('.feed-video-wrap').addEventListener('click', function () {
      if (video.paused) {
        // Pause all other videos
        document.querySelectorAll('.feed-video').forEach(function (v) { v.pause(); });
        document.querySelectorAll('.feed-play-btn').forEach(function (b) { b.style.display = 'flex'; });
        video.play();
        playBtn.style.display = 'none';

        // Count view once per card
        if (!viewed) {
          viewed = true;
          apiFetch('/film/' + f.filmId + '/view', 'POST').catch(function () {});
          var viewEl = card.querySelector('.feed-views');
          if (viewEl) viewEl.textContent = '👁 ' + ((f.views || 0) + 1);
        }
      } else {
        video.pause();
        playBtn.style.display = 'flex';
      }
    });

    // Show play btn again when video ends
    video.addEventListener('ended', function () {
      playBtn.style.display = 'flex';
    });

    // Like toggle
    card.querySelector('.feed-like-btn').addEventListener('click', function () {
      if (!RT.isLoggedIn()) { RT.showScreen('auth')

; RT.showAuthForm('login'); return; }
      var countEl = card.querySelector('.like-count');
      var current = parseInt(countEl.textContent) || 0;

      apiFetch('/film/like', 'POST', { filmId: f.filmId })
        .then(function (d) {
          countEl.textContent = d.liked ? current + 1 : Math.max(0, current - 1);
        })
        .catch(function () { RT.toast('Failed to like. Try again.'); });
    });

    // Toggle comment form
    card.querySelector('.feed-comment-btn').addEventListener('click', function () {
      if (!RT.isLoggedIn()) { RT.showScreen('auth')

; RT.showAuthForm('login'); return; }
      var form = card.querySelector('.feed-comment-form');
      form.classList.toggle('hide');
      if (!form.classList.contains('hide')) {
        card.querySelector('.feed-comment-input').focus();
        loadComments(f.filmId, card);
      }
    });

    // Submit comment — button
    card.querySelector('.feed-send-btn').addEventListener('click', function () {
      submitComment(f.filmId, card);
    });

    // Submit comment — Enter key
    card.querySelector('.feed-comment-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submitComment(f.filmId, card);
    });

    // Delete (owner only)
    if (isOwner) {
      var delBtn = card.querySelector('.feed-delete-btn');
      if (delBtn) {
        delBtn.addEventListener('click', function () {
          if (!confirm('Remove this film from the community feed?')) return;
          apiFetch('/film/unpublish', 'POST', { filmId: f.filmId })
            .then(function (d) {
              if (d.success) { card.remove(); RT.toast('Removed from feed.', true); }
              else RT.toast(d.error || 'Failed to remove.');
            })
            .catch(function () { RT.toast('Failed to remove.'); });
        });
      }
    }
  }

  // ── Submit comment ──

  function submitComment(filmId, card) {
    var input = card.querySelector('.feed-comment-input');
    var text  = input.value.trim();
    if (!text) return;

    var btn = card.querySelector('.feed-send-btn');
    btn.disabled    = true;
    btn.textContent = 'Posting...';

    apiFetch('/film/comment', 'POST', { filmId: filmId, comment: text })
      .then(function (d) {
        btn.disabled    = false;
        btn.textContent = 'Send';
        if (d.success) {
          input.value = '';
          loadComments(filmId, card);
          RT.toast('Comment posted!', true);
        } else {
          RT.toast(d.error || 'Failed to post comment.');
        }
      })
      .catch(function () {
        btn.disabled    = false;
        btn.textContent = 'Send';
        RT.toast('Failed to post comment.');
      });
  }

  // ── Load comments ──

  function loadComments(filmId, card) {
    var container = card.querySelector('#comments-' + filmId);
    if (!container) return;

    apiFetch('/film/' + filmId + '/comments')
      .then(function (data) {
        var comments = data.comments || [];
        container.innerHTML = '';
        if (comments.length === 0) return;

        comments.forEach(function (c) {
          var isOwner = RT.isLoggedIn() && c.author === (RT.email || '').split('@')[0];
          var div     = document.createElement('div');
          div.className = 'feed-comment';
          div.innerHTML =
            '<span class="feed-comment-author">@' + esc(c.author) + '</span> ' +
            '<span class="feed-comment-text">'   + esc(c.comment) + '</span>' +
            (isOwner ? '<button class="feed-comment-delete" aria-label="Delete comment">✕</button>' : '');

          if (isOwner) {
            div.querySelector('.feed-comment-delete').addEventListener('click', function () {
              apiFetch('/film/comment/delete', 'POST', { commentId: c.id })
                .then(function (d) {
                  if (d.success) { div.remove(); RT.toast('Comment deleted.', true); }
                  else RT.toast(d.error || 'Failed to delete.');
                })
                .catch(function () { RT.toast('Failed to delete.'); });
            });
          }

          container.appendChild(div);
        });
      })
      .catch(function () {});
  }

  // ── Load more ──

  var moreBtn = RT.$('btn-feed-more');
  if (moreBtn) {
    moreBtn.addEventListener('click', function () { loadFeed(feedPage + 1); });
  }

  // ── Publish from player ──

  var publishBtn = RT.$('btn-publish');
  if (publishBtn) {
    publishBtn.addEventListener('click', function () {
      if (!RT.isLoggedIn()) { RT.showScreen('auth')

; RT.showAuthForm('login'); return; }
      if (!RT.currentFilmId) { RT.toast('No film to publish.'); return; }

      RT.loading(true, 'Publishing to community...');

      apiFetch('/film/publish', 'POST', { filmId: RT.currentFilmId })
        .then(function (d) {
          RT.loading(false);
          if (d.success) {
            RT.toast('Published to the community! 🎉', true);
            publishBtn.textContent = '✅ Published';
            publishBtn.disabled    = true;
          } else {
            RT.toast(d.error || 'Failed to publish.');
          }
        })
        .catch(function (e) {
          RT.loading(false);
          RT.toast(e.message || 'Failed to publish.');
        });
    });
  }

})();
