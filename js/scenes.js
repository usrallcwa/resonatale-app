(function () {
  'use strict';

  var $scenesList = document.getElementById('scenes-list');
  var $results = document.getElementById('results');

  // ── Render scene cards ──
  function renderScenes(scenes) {
    $scenesList.innerHTML = '';

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
      $scenesList.appendChild(card);
    }

    $results.classList.add('show');
    $results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Save to journal ──
  function saveToJournal(mood, language, brief, duration, scenes) {
    try {
      var journal = JSON.parse(localStorage.getItem('rt_journal') || '[]');
      journal.unshift({
        id: Date.now().toString(36),
        mood: mood,
        language: language,
        brief: brief,
        duration: duration,
        scenes: scenes,
        createdAt: new Date().toISOString()
      });
      if (journal.length > 50) journal = journal.slice(0, 50);
      localStorage.setItem('rt_journal', JSON.stringify(journal));
    } catch (e) {}
  }

  // Export
  window.RT = window.RT || {};
  RT.renderScenes = renderScenes;
  RT.saveToJournal = saveToJournal;
})();
