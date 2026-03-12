(function () {
  'use strict';

  RT.photos = RT.photos || [];
  RT.createMode = 'text'; // 'text' or 'photo'

  // ── Mode Toggle ──

  var modeText = RT.$('mode-text');
  var modePhoto = RT.$('mode-photo');
  var textSection = RT.$('text-section');
  var photoSection = RT.$('photo-section');
  var narrationSection = RT.$('narration-section');

  function setMode(mode) {
    RT.createMode = mode;
    if (modeText) modeText.classList.toggle('active', mode === 'text');
    if (modePhoto) modePhoto.classList.toggle('active', mode === 'photo');
    if (textSection) textSection.classList.toggle('hide', mode === 'photo');
    if (photoSection) photoSection.classList.toggle('hide', mode === 'text');
    if (narrationSection) narrationSection.classList.toggle('hide', mode === 'text');
  }

  if (modeText) modeText.addEventListener('click', function () { setMode('text'); });
  if (modePhoto) modePhoto.addEventListener('click', function () { setMode('photo'); });

  // ── Photo Upload ──

  var grid = RT.$('photo-grid');
  var input = RT.$('photo-input');
  var addBtn = RT.$('photo-add-btn');

  if (addBtn) {
    addBtn.addEventListener('click', function () {
      if (RT.photos.length >= 10) { RT.toast('Maximum 10 photos.'); return; }
      input.click();
    });
  }

  if (input) {
    input.addEventListener('change', function () {
      var files = input.files;
      if (!files || !files.length) return;
      var count = Math.min(files.length, 10 - RT.photos.length);
      var loaded = 0;

      for (var i = 0; i < count; i++) {
        var f = files[i];
        if (!f.type.startsWith('image/')) continue;
        if (f.size > 10 * 1024 * 1024) { RT.toast('Max 10MB per photo.'); continue; }
        (function (file) {
          var r = new FileReader();
          r.onload = function (e) {
            RT.photos.push({ data: e.target.result, name: file.name });
            loaded++;
            if (loaded >= count) renderPhotos();
          };
          r.readAsDataURL(file);
        })(f);
      }
      input.value = '';
    });
  }

  function renderPhotos() {
    if (!grid) return;
    // Remove old thumbs but keep the add button
    var old = grid.querySelectorAll('.photo-item');
    for (var i = 0; i < old.length; i++) old[i].remove();

    RT.photos.forEach(function (photo, idx) {
      var item = document.createElement('div');
      item.className = 'photo-item';
      var img = document.createElement('img');
      img.className = 'photo-thumb';
      img.src = photo.data;
      var btn = document.createElement('button');
      btn.className = 'photo-remove';
      btn.textContent = '✕';
      btn.addEventListener('click', function () {
        RT.photos.splice(idx, 1);
        renderPhotos();
      });
      item.appendChild(img);
      item.appendChild(btn);
      grid.insertBefore(item, addBtn);
    });

    var countEl = RT.$('photo-count');
    if (countEl) countEl.textContent = RT.photos.length + ' of 10 photos';

    // Hide add button if max reached
    if (addBtn) addBtn.style.display = RT.photos.length >= 10 ? 'none' : '';
  }

  RT.refreshPhotos = renderPhotos;

  // ── Upload Photos to R2 ──

  RT.uploadPhotos = function () {
    if (!RT.photos.length) return Promise.reject(new Error('No photos'));

    RT.loading(true, 'Uploading photos...');
    var uploads = RT.photos.map(function (photo, i) {
      return RT.uploadPhoto(photo.data, i);
    });

    return Promise.all(uploads).then(function (keys) {
      RT.loading(false);
      RT.photoKeys = keys;
      return keys;
    }).catch(function (err) {
      RT.loading(false);
      throw err;
    });
  };

})();