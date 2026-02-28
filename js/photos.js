(function () {
  'use strict';

  var grid = RT.$('photo-grid');
  var input = RT.$('photo-input');
  var zone = RT.$('photo-zone');

  if (zone) {
    zone.addEventListener('click', function () {
      if (RT.photos.length < 10) input.click();
    });
  }

  if (input) {
    input.addEventListener('change', function () {
      var files = input.files;
      if (!files || !files.length) return;
      var count = Math.min(files.length, 10 - RT.photos.length);
      var done = 0;

      for (var i = 0; i < count; i++) {
        var f = files[i];
        if (!f.type.startsWith('image/')) continue;
        if (f.size > 10 * 1024 * 1024) { RT.toast('Max 10MB per photo.'); continue; }
        (function (file) {
          var r = new FileReader();
          r.onload = function (e) {
            RT.photos.push(e.target.result);
            done++;
            if (done >= count) RT.refreshPhotos();
          };
          r.readAsDataURL(file);
        })(f);
      }
      input.value = '';
    });
  }

  RT.refreshPhotos = function () {
    if (RT.photos.length > 0) {
      if (zone) zone.style.display = 'none';
      if (grid) grid.style.display = 'flex';
    } else {
      if (zone) zone.style.display = '';
      if (grid) grid.style.display = 'none';
    }

    RT.renderPhotoGrid(grid, RT.photos, function (i) {
      RT.photos.splice(i, 1);
      RT.refreshPhotos();
    });

    var c = RT.$('photo-count');
    if (c) c.textContent = RT.photos.length + '/10 photos';

    RT.checkSetup();
  };

  RT.refreshPhotos();

})();
