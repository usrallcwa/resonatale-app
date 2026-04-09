(function () {
  'use strict';

  // ── Language Dropdown ──

  var langSel = RT.$('lang-sel');
  if (langSel) {
    RT.LANGUAGES.forEach(function (l) {
      var opt       = document.createElement('option');
      opt.value     = l.code;
      opt.textContent = l.flag + '  ' + l.name;
      if (l.code === RT.language) opt.selected = true;
      langSel.appendChild(opt);
    });
    langSel.addEventListener('change', function () {
      RT.setLanguage(langSel.value);
      var sel   = RT.LANGUAGES.find(function (l) { return l.code === langSel.value; });
      var flagEl = RT.$('lang-flag');
      if (flagEl && sel) flagEl.textContent = sel.flag;
    });
  }

  // ── Mood Dropdown ──

  RT.mood = RT.mood || 'dramatic';
  var moodSelect = RT.$('mood-select');
  if (moodSelect) {
    moodSelect.addEventListener('change', function () { RT.mood = moodSelect.value; });
  }

  // ── Mood Chips ──

  var moodChips = RT.$('mood-chips');
  if (moodChips) {
    moodChips.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      RT.mood = chip.getAttribute('data-v') || RT.mood;
      moodChips.querySelectorAll('.chip').forEach(function (c) {
        c.classList.toggle('on', c === chip);
      });
    });
  }

  // ── Voice Dropdown ──
  var voiceSelect = RT.$('voice-select');
  if (voiceSelect) {
    voiceSelect.addEventListener('change', function () { RT.selectedVoice = voiceSelect.value; });
  }

  // ══════════════════════════════════════
  // FACE SWAP TOGGLE — WITH SELFIE GATE
  // ══════════════════════════════════════

  RT.useFaceSwap = false;
  RT.selfieUrl = localStorage.getItem('rt_selfie') || null;

  var faceToggle = RT.$('faceswap-toggle');
  var faceHint   = RT.$('faceswap-hint');

  // Update the hint text based on selfie state
  function updateFaceSwapHint() {
    if (!faceHint) return;
    if (RT.selfieUrl) {
      faceHint.textContent = 'Selfie ready ✓ — Your face will appear in every scene.';
      faceHint.style.color = '#00FF94';
    } else {
      faceHint.textContent = 'Upload a selfie first to use Face Swap.';
      faceHint.style.color = '';
    }
  }

  // On page load, update hint
  updateFaceSwapHint();

  if (faceToggle) {
    faceToggle.addEventListener('change', function () {

      // ── GATE: If user is checking ON but has no selfie, block and show upload ──
      if (faceToggle.checked && !RT.selfieUrl) {
        // Uncheck immediately — they can't enable without a selfie
        faceToggle.checked = false;
        RT.useFaceSwap = false;

        // Show the selfie upload modal
        showSelfieModal();
        return;
      }

      // Normal toggle
      RT.useFaceSwap = faceToggle.checked;
    });
  }

  // ══════════════════════════════════════
  // SELFIE UPLOAD MODAL
  // ══════════════════════════════════════

  function showSelfieModal() {
    // Remove existing modal if any
    var existing = document.getElementById('selfie-modal');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'selfie-modal';
    overlay.className = 'selfie-modal-overlay';
    overlay.innerHTML =
      '<div class="selfie-modal-card">' +
        '<button type="button" class="selfie-modal-close" id="selfie-modal-close">&times;</button>' +

        '<div class="selfie-modal-icon">' +
          '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#6eb6ff" stroke-width="1.5">' +
            '<circle cx="12" cy="8" r="4"/>' +
            '<path d="M4 20c0-4 4-7 8-7s8 3 8 7"/>' +
          '</svg>' +
        '</div>' +

        '<h3 class="selfie-modal-title">Upload a Selfie</h3>' +
        '<p class="selfie-modal-desc">Face Swap needs a clear, front-facing photo of you. Your face will be placed into every scene of your film.</p>' +

        '<div class="selfie-drop-zone" id="selfie-drop-zone">' +
          '<input type="file" id="selfie-modal-file" accept="image/jpeg,image/png,image/webp" style="display:none">' +

          '<div class="selfie-drop-content" id="selfie-drop-content">' +
            '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.5">' +
              '<path d="M12 16V4m0 0l-4 4m4-4l4 4"/>' +
              '<path d="M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/>' +
            '</svg>' +
            '<p>Tap to select a photo</p>' +
            '<span class="selfie-formats">JPG, PNG, WebP — max 5MB</span>' +
          '</div>' +

          '<div class="selfie-preview-area" id="selfie-preview-area" style="display:none">' +
            '<img id="selfie-preview-img" src="" alt="Preview">' +
            '<button type="button" class="selfie-remove-btn" id="selfie-remove-btn">Remove</button>' +
          '</div>' +
        '</div>' +

        '<div class="selfie-uploading" id="selfie-uploading" style="display:none">' +
          '<div class="spin"></div>' +
          '<p>Uploading selfie...</p>' +
        '</div>' +

        '<div class="selfie-guidelines">' +
          '<p class="selfie-guideline-heading">For best results:</p>' +
          '<ul>' +
            '<li>Face clearly visible, no sunglasses</li>' +
            '<li>Good lighting, no heavy shadows</li>' +
            '<li>Front-facing, neutral expression</li>' +
            '<li>Only one person in the photo</li>' +
          '</ul>' +
        '</div>' +

        '<button type="button" class="btn-primary selfie-confirm-btn" id="selfie-confirm-btn" disabled>Upload &amp; Enable Face Swap</button>' +
      '</div>';

    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(function () {
      overlay.classList.add('selfie-modal-visible');
    });

    // ── Wire all modal events ──

    var fileInput   = document.getElementById('selfie-modal-file');
    var dropZone    = document.getElementById('selfie-drop-zone');
    var dropContent = document.getElementById('selfie-drop-content');
    var previewArea = document.getElementById('selfie-preview-area');
    var previewImg  = document.getElementById('selfie-preview-img');
    var removeBtn   = document.getElementById('selfie-remove-btn');
    var confirmBtn  = document.getElementById('selfie-confirm-btn');
    var closeBtn    = document.getElementById('selfie-modal-close');
    var uploading   = document.getElementById('selfie-uploading');
    var selectedFile = null;

    // Close modal
    function closeSelfieModal() {
      var modal = document.getElementById('selfie-modal');
      if (modal) {
        modal.classList.remove('selfie-modal-visible');
        setTimeout(function () { modal.remove(); }, 300);
      }
    }

    closeBtn.addEventListener('click', closeSelfieModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeSelfieModal();
    });

    // Click drop zone to open file picker
    dropZone.addEventListener('click', function (e) {
      if (e.target === removeBtn || e.target.closest('#selfie-remove-btn')) return;
      fileInput.click();
    });

    // Drag and drop
    dropZone.addEventListener('dragover', function (e) {
      e.preventDefault();
      dropZone.classList.add('selfie-drag-over');
    });
    dropZone.addEventListener('dragleave', function () {
      dropZone.classList.remove('selfie-drag-over');
    });
    dropZone.addEventListener('drop', function (e) {
      e.preventDefault();
      dropZone.classList.remove('selfie-drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    // File input change
    fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files[0]) {
        handleFile(fileInput.files[0]);
      }
    });

    // Remove selected file
    removeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      selectedFile = null;
      previewArea.style.display = 'none';
      dropContent.style.display = '';
      confirmBtn.disabled = true;
      fileInput.value = '';
    });

    // Confirm upload
    confirmBtn.addEventListener('click', function () {
      if (!selectedFile) return;
      doUpload(selectedFile);
    });

    // ── Validate and preview selected file ──
    function handleFile(file) {
      var validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (validTypes.indexOf(file.type) === -1) {
        RT.toast('Please select a JPG, PNG, or WebP image.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        RT.toast('Image too large. Max 5MB.');
        return;
      }

      selectedFile = file;

      var reader = new FileReader();
      reader.onload = function (e) {
        previewImg.src = e.target.result;
        previewArea.style.display = '';
        dropContent.style.display = 'none';
        confirmBtn.disabled = false;
      };
      reader.readAsDataURL(file);
    }

    // ── Upload selfie to server ──
    function doUpload(file) {
      confirmBtn.disabled = true;
      uploading.style.display = '';

      var reader = new FileReader();
      reader.onload = function (e) {
        var base64 = e.target.result.split(',')[1];

        fetch(RT.API + '/profile/selfie', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + RT.token
          },
          body: JSON.stringify({ image: base64 })
        })
        .then(function (res) {
          if (!res.ok) throw new Error('Upload failed (' + res.status + ')');
          return res.json();
        })
        .then(function (data) {
          uploading.style.display = 'none';

          if (data.success || data.selfie_url) {
            // Save selfie URL
            var url = data.selfie_url || data.url || '';
            RT.selfieUrl = url;
            localStorage.setItem('rt_selfie', url);

            // Auto-enable face swap
            RT.useFaceSwap = true;
            if (faceToggle) faceToggle.checked = true;
            updateFaceSwapHint();

            // Update profile screen too
            var profileStatus = RT.$('profile-selfie-status');
            if (profileStatus) {
              profileStatus.textContent = 'Uploaded ✓';
              profileStatus.className = 'profile-status ok';
            }

            RT.toast('Selfie uploaded! Face Swap enabled.', true);
            closeSelfieModal();
          } else {
            throw new Error(data.error || 'No URL returned');
          }
        })
        .catch(function (err) {
          uploading.style.display = 'none';
          confirmBtn.disabled = false;
          RT.toast(err.message || 'Upload failed. Try again.');
        });
      };
      reader.readAsDataURL(file);
    }
  }

  // Expose so other files can trigger it
  RT.showSelfieModal = showSelfieModal;

  // ── Style Dropdown ──

  RT.style = RT.style || 'cinematic';
  var styleSelect = RT.$('style-select');
  if (styleSelect) {
    styleSelect.addEventListener('change', function () { RT.style = styleSelect.value; });
  }

  // ── Voice Chips ──

  RT.selectedVoice = RT.selectedVoice || 'clone';
  var voiceChips = RT.$('voice-chips');
  if (voiceChips && RT.VOICES) {
    RT.VOICES.forEach(function (v) {
      var btn       = document.createElement('button');
      btn.className = 'chip' + (v.id === 'clone' ? ' on' : '');
      btn.type      = 'button';
      btn.setAttribute('data-v', v.id);
      btn.textContent = v.icon + ' ' + v.name;
      btn.title       = v.desc || '';
      voiceChips.appendChild(btn);
    });
    voiceChips.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      RT.selectedVoice = chip.getAttribute('data-v') || RT.selectedVoice;
      voiceChips.querySelectorAll('.chip').forEach(function (c) {
        c.classList.toggle('on', c === chip);
      });
    });
  }

  // ── Duration Slider ──

  var durationSlider = RT.$('duration-slider');
  var durationLabel  = RT.$('duration-label');
  var durationPrice  = RT.$('duration-price');
  var durationScenes = RT.$('duration-scenes');

  function updateDuration() {
    if (!durationSlider) return;
    var idx  = parseInt(durationSlider.value) || 0;
    var tier = RT.TIERS[idx] || RT.TIERS[0];
    RT.tier  = tier.id;
    if (durationLabel)  durationLabel.textContent  = tier.desc;
    if (durationPrice)  durationPrice.textContent  = tier.price;
    if (durationScenes) durationScenes.textContent = tier.scenes + ' scenes';
  }

  if (durationSlider) {
    durationSlider.addEventListener('input', updateDuration);
    updateDuration();
  }

  // ── Turnstile ──

  RT.mountTurnstile = function () {
    var target = RT.$('ts-target');
    if (!target) return;
    if (!window.turnstile) { setTimeout(RT.mountTurnstile, 300); return; }
    if (RT.tsWidgetId !== null && RT.tsWidgetId !== undefined) {
      try { window.turnstile.remove(RT.tsWidgetId); } catch (e) {}
    }
    RT.tsToken    = '';
    RT.tsWidgetId = window.turnstile.render(target, {
      sitekey:           RT.TURNSTILE_KEY,
      theme:             'dark',
      size:              'normal',
      callback:          function (tk) { RT.tsToken = tk; },
      'expired-callback': function ()  { RT.tsToken = ''; },
      'error-callback':   function ()  { RT.tsToken = ''; },
    });
  };

  RT.resetTurnstile = function () {
    if (RT.tsWidgetId !== null && RT.tsWidgetId !== undefined && window.turnstile) {
      try { window.turnstile.reset(RT.tsWidgetId); } catch (e) {}
    }
    RT.tsToken = '';
  };

  // ── Render Scenes ──

  RT.renderScenes = function (scenes) {
    var container = RT.$('preview-scenes');
    if (!container) return;
    container.innerHTML = '';

    scenes.forEach(function (s, i) {
      var div       = document.createElement('div');
      div.className = 'scene-card scene-editable';
      div.innerHTML =
        '<div class="scene-num">Scene ' + (i + 1) + '</div>' +
        '<input type="text" class="scene-title-input" data-scene="' + i + '" data-field="title"' +
          ' value="' + (s.title || '').replace(/"/g, '&quot;').replace(/</g, '&lt;') + '">' +
        '<label class="scene-label">Visual Direction</label>' +
        '<textarea class="scene-direction-input" data-scene="' + i + '" data-field="direction" rows="3">' +
          RT._esc(s.direction || '') + '</textarea>' +
        '<label class="scene-label">Voiceover</label>' +
        '<textarea class="scene-voiceover-input" data-scene="' + i + '" data-field="voiceover" rows="2">' +
          RT._esc(s.voiceover || '') + '</textarea>';

      div.querySelectorAll('input[data-field], textarea[data-field]').forEach(function (el) {
        el.addEventListener('input', function () {
          var sceneIdx = parseInt(el.getAttribute('data-scene'));
          var field    = el.getAttribute('data-field');
          if (RT.currentScenes && RT.currentScenes[sceneIdx]) {
            RT.currentScenes[sceneIdx][field] = el.value;
          }
        });
      });

      container.appendChild(div);
    });
  };

  RT._esc = function (str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  // ── Save Preview to localStorage ──

  function savePreview(scenes) {
    try {
      localStorage.setItem('rt_preview', JSON.stringify({
        scenes: scenes,
        tier:   RT.tier,
        mood:   RT.mood,
        brief:  RT.currentBrief || '',
      }));
    } catch (e) {}
  }

  // ── Update tier info label ──

  function updateTierInfo() {
    var info = RT.$('preview-tier-info');
    if (!info) return;
    var t = RT.TIERS.find(function (x) { return x.id === RT.tier; });
    if (t) info.textContent = t.label + ' · ' + t.desc + ' · ' + t.scenes + ' scenes · ' + t.price;
  }

  // ── Handle preview success ──

  function onPreviewSuccess(data, brief) {
    RT.generating = false;
    RT.loading(false);

    if (!data.scenes || !data.scenes.length) {
      RT.toast('No scenes returned. Please try again.');
      RT.resetTurnstile();
      return;
    }

    RT.currentScenes = data.scenes;
    RT.currentBrief  = brief;
    savePreview(data.scenes);
    RT.renderScenes(data.scenes);
    updateTierInfo();
    RT.showScreen('preview');
    RT.toast('Script ready!', true);
    RT.resetTurnstile();
  }

  // ── Handle preview error ──

  function onPreviewError(err) {
    RT.generating = false;
    RT.loading(false);
    RT.toast(err.message || 'Generation failed. Please try again.');
    RT.resetTurnstile();
  }

  // ── Generate Preview ──

  var genBtn = RT.$('btn-generate');
  if (genBtn) {
    genBtn.addEventListener('click', function () {
      if (RT.generating)  return;
      if (!RT.mood)       { RT.toast('Select a mood.'); return; }
      if (!RT.tsToken)    { RT.toast('Complete the security verification.'); return; }

      var brief = RT.$('brief') ? RT.$('brief').value.trim() : '';
      if (!brief || brief.length < 10) { RT.toast('Describe your story in more detail.'); return; }

      RT.generating = true;
      RT.loading(true, 'Writing your screenplay...');

      RT.generatePreview(brief, RT.mood, RT.language, RT.tier)
        .then(function (data) { onPreviewSuccess(data, brief); })
        .catch(onPreviewError);
    });
  }

  // ── Reset Form ──

  RT.resetForm = function () {
    RT.mood          = '';
    RT.tier          = RT.TIERS[0] ? RT.TIERS[0].id : 'shorts';
    RT.currentScenes = null;
    RT.currentFilmId = null;
    RT.currentBrief  = '';
    RT.useFaceSwap   = false;

    var briefEl = RT.$('brief');
    if (briefEl) briefEl.value = '';

    if (faceToggle) faceToggle.checked = false;
    updateFaceSwapHint();

    if (durationSlider) { durationSlider.value = 0; updateDuration(); }

    if (moodChips) {
      moodChips.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('on'); });
    }

    try { localStorage.removeItem('rt_preview'); } catch (e) {}
    RT.resetTurnstile();
  };

})();