(function () {
  'use strict';

  var recorder = null;
  var chunks = [];
  var timer = null;
  var recording = false;
  var startTime = 0;

  function showState(id) {
    ['voice-idle', 'voice-recording', 'voice-done'].forEach(function (s) {
      var el = RT.$(s);
      if (el) el.classList.add('hide');
    });
    var target = RT.$(id);
    if (target) target.classList.remove('hide');
  }

  function startRec() {
    if (recording) return;
    if (!navigator.mediaDevices) { RT.toast('Microphone not supported.'); return; }

    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      recording = true;
      chunks = [];
      recorder = new MediaRecorder(stream);

      recorder.ondataavailable = function (e) {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = function () {
        RT.voiceBlob = new Blob(chunks, { type: 'audio/webm' });
        stream.getTracks().forEach(function (t) { t.stop(); });
        showState('voice-done');
        clearInterval(timer);
        RT.checkSetup();
      };

      recorder.start();
      showState('voice-recording');
      startTime = Date.now();

      timer = setInterval(function () {
        var s = Math.floor((Date.now() - startTime) / 1000);
        var el = RT.$('rec-time');
        if (el) el.textContent = Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
      }, 200);

    }).catch(function () {
      RT.toast('Microphone access denied.');
    });
  }

  function stopRec() {
    if (!recording || !recorder) return;
    recording = false;
    if (recorder.state === 'recording') recorder.stop();
  }

  // Hold to record
  var btn = RT.$('btn-record');
  if (btn) {
    btn.addEventListener('mousedown', startRec);
    btn.addEventListener('touchstart', function (e) { e.preventDefault(); startRec(); });
  }
  document.addEventListener('mouseup', stopRec);
  document.addEventListener('touchend', stopRec);

  // Re-record
  var reBtn = RT.$('btn-re-record');
  if (reBtn) {
    reBtn.addEventListener('click', function () {
      RT.voiceBlob = null;
      showState('voice-idle');
      var t = RT.$('rec-time');
      if (t) t.textContent = '0:00';
      RT.checkSetup();
    });
  }

  // Upload file
  var fileInput = RT.$('voice-input');
  if (fileInput) {
    fileInput.addEventListener('change', function () {
      var f = fileInput.files[0];
      if (!f || !f.type.startsWith('audio/')) { RT.toast('Upload an audio file.'); return; }
      RT.voiceBlob = f;
      showState('voice-done');
      RT.checkSetup();
    });
  }

})();
