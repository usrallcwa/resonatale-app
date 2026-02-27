(function () {
  'use strict';

  window.RT = window.RT || {};

  // ── Render scene cards ──
  RT.renderScenes = function (scenes, container) {
    var $el = container || document.getElementById('preview-scenes');
    if (!$el) return;

    $el.innerHTML = '';

    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i];
      var card = document.createElement('div');
      card.className = 'scene-card';

      var html =
        '<div class="scene-num">Scene ' + (i + 1) + ' of ' + scenes.length + '</div>' +
        '<div class="scene-title">' + RT.esc(s.title || 'Untitled') + '</div>' +
        '<div class="scene-block">' +
          '<div class="scene-block-label">Visual Direction</div>' +
          '<div class="scene-block-text">' + RT.esc(s.description || '') + '</div>' +
        '</div>' +
        '<div class="scene-block">' +
          '<div class="scene-block-label">Voiceover</div>' +
          '<div class="scene-block-text voiceover-text">' + RT.esc(s.voiceover || '') + '</div>' +
        '</div>';

      if (s.imagePrompt) {
        html +=
          '<div class="scene-block">' +
            '<div class="scene-block-label">Image Prompt</div>' +
            '<div class="scene-block-text img-prompt">' + RT.esc(s.imagePrompt) + '</div>' +
          '</div>';
      }

      card.innerHTML = html;
      $el.appendChild(card);
    }
  };

  // ── Save to journal ──
  RT.saveToJournal = function (data) {
    try {
      var journal = JSON.parse(localStorage.getItem('rt_journal') || '[]');
      journal.unshift({
        id: Date.now().toString(36),
        mood: data.mood || '',
        language: data.language || '',
        brief: data.brief || '',
        duration: data.duration || '',
        scenes: data.scenes || [],
        createdAt: new Date().toISOString()
      });
      if (journal.length > 50) journal = journal.slice(0, 50);
      localStorage.setItem('rt_journal', JSON.stringify(journal));
    } catch (e) {}
  };

})();
