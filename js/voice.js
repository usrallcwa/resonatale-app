(function () {
  'use strict';

  var recorder      = null;
  var chunks        = [];
  var timerInterval = null;
  var seconds       = 0;
  var MAX_SECONDS   = 120; // 2 min — enough for ElevenLabs voice clone

  var btn      = RT.$('btn-record');
  var timer    = RT.$('voice-timer');
  var playback = RT.$('voice-playback');
  var status   = RT.$('voice-status');

  if (!btn) return;

  function updateTimer() {
    seconds++;
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    if (timer) timer.textContent = m + ':' + (s < 10 ? '0' : '') + s;

    // Auto-stop at max length
    if (seconds >= MAX_SECONDS) stopRecording();
  }

  function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      // Pick best supported format
      var mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      recorder = new MediaRecorder(stream, { mimeType: mimeType });
      chunks  = [];
      seconds = 0;

      recorder.ondataavailable = function (e) {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        clearInterval(timerInterval);

        RT.voiceBlob = new Blob(chunks, { type: mimeType });

        if (playback) {
          playback.src = URL.createObjectURL(RT.voiceBlob);
          playback.classList.remove('hide');
        }

        btn.textContent  = 'Record Again';
        btn.classList.remove('recording');
        if (timer)  timer.classList.add('hide');
        if (status) status.textContent = 'Voice recorded ✓  Click Continue.';

        if (RT.checkSetup) RT.checkSetup();
      };

      recorder.onerror = function (e) {
        clearInterval(timerInterval);
        btn.textContent = 'Record Voice';
        btn.classList.remove('recording');
        if (timer)  timer.classList.add('hide');
        if (status) status.textContent = '';
        RT.toast('Recording error. Please try again.');
        console.error('[voice]', e);
      };

      recorder.start(250); // collect data every 250ms — safer than one big chunk
      btn.textContent = 'Stop Recording';
      btn.classList.add('recording');
      if (timer)  { timer.classList.remove('hide'); timer.textContent = '0:00'; }
      if (status) status.textContent = 'Recording... (max 2 min)';
      timerInterval = setInterval(updateTimer, 1000);

    }).catch(function (err) {
      RT.toast('Microphone access denied. Please allow microphone and try again.');
      console.error('[voice]', err);
    });
  }

  function stopRecording() {
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
    }
  }

  btn.addEventListener('click', function () {
    if (recorder && recorder.state === 'recording') {
      stopRecording();
    } else {
      startRecording();
    }
  });

})();
