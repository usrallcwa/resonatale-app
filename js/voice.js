(function () {
  'use strict';

  var recorder = null;
  var chunks = [];
  var timerInterval = null;
  var seconds = 0;

  var btn = RT.$('btn-record');
  var timer = RT.$('voice-timer');
  var playback = RT.$('voice-playback');
  var status = RT.$('voice-status');

  if (!btn) return;

  function updateTimer() {
    seconds++;
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    if (timer) timer.textContent = m + ':' + (s < 10 ? '0' : '') + s;
  }

  function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      recorder = new MediaRecorder(stream);
      chunks = [];
      seconds = 0;

      recorder.ondataavailable = function (e) { chunks.push(e.data); };

      recorder.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        clearInterval(timerInterval);

        RT.voiceBlob = new Blob(chunks, { type: 'audio/webm' });

        if (playback) {
          playback.src = URL.createObjectURL(RT.voiceBlob);
          playback.classList.remove('hide');
        }

        btn.textContent = 'Record Again';
        btn.classList.remove('recording');
        if (timer) timer.classList.add('hide');
        if (status) status.textContent = 'Voice recorded! Click Continue.';

        if (RT.checkSetup) RT.checkSetup();
      };

      recorder.start();
      btn.textContent = 'Stop Recording';
      btn.classList.add('recording');
      if (timer) { timer.classList.remove('hide'); timer.textContent = '0:00'; }
      if (status) status.textContent = 'Recording...';
      timerInterval = setInterval(updateTimer, 1000);

    }).catch(function (err) {
      RT.toast('Microphone access denied.');
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