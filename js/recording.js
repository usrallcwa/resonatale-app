// recording.js

// ============================================
// VOICE RECORDING (Step 2 - part 1)
// ============================================

let wakeLock = null;

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator && !wakeLock) {
      // @ts-ignore
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
      });
    }
  } catch (e) {
    console.warn('Wake Lock not available or failed:', e);
  }
}

async function releaseWakeLock() {
  try {
    if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch (e) {
    console.warn('Wake Lock release failed:', e);
  }
}

function pickBestAudioMimeType() {
  if (!window.MediaRecorder || typeof MediaRecorder.isTypeSupported !== 'function') return null;

  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg'
  ];

  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return null;
}

async function toggleRecording() {
  const appState = window.appState;
  if (!appState) return;

  const btn = document.getElementById('recordBtn');
  if (!btn) return;

  if (typeof window.requireConsentOrBlock === 'function') {
    if (!window.requireConsentOrBlock()) return;
  }
  if (typeof window.requireTurnstileOrBlock === 'function') {
    if (!window.requireTurnstileOrBlock()) return;
  }

  if (!window.MediaRecorder) {
    if (typeof window.showToast === 'function') {
      window.showToast('Recording not supported on this browser', 'error');
    }
    return;
  }

  const icon = btn.querySelector('.record-icon');
  const text = btn.querySelector('.record-text');

  if (!appState.mediaRecorder || appState.mediaRecorder.state === 'inactive') {
    // START recording
    try {
      await requestWakeLock();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      appState.audioStream = stream;

      const mimeType = pickBestAudioMimeType();
      appState.voiceMimeType = mimeType || undefined;

      appState.mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      const audioChunks = [];

      appState.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) audioChunks.push(event.data);
      };

      appState.mediaRecorder.onstop = () => {
        const type =
          appState.voiceMimeType || (audioChunks[0] && audioChunks[0].type) || 'audio/webm';
        const audioBlob = new Blob(audioChunks, { type });
        appState.voiceBlob = audioBlob;

        showAudioPreview(audioBlob);
        stopAllStreams();
        releaseWakeLock();
      };

      appState.mediaRecorder.start();
      appState.recordingStartTime = Date.now();

      btn.classList.add('recording');
      if (icon) icon.textContent = '⏹';
      if (text) text.textContent = 'Stop Recording';

      startRecordingTimer();

      setTimeout(() => {
        if (appState.mediaRecorder && appState.mediaRecorder.state === 'recording') {
          stopRecording();
        }
      }, 30000);
    } catch (error) {
      console.error('Microphone access error:', error);
      if (typeof window.showToast === 'function') {
        window.showToast('Microphone access denied', 'error');
      }
      releaseWakeLock();
    }
  } else {
    // STOP recording
    stopRecording();
    releaseWakeLock();
  }
}

function stopRecording() {
  const appState = window.appState;
  if (!appState) return;

  if (appState.mediaRecorder && appState.mediaRecorder.state === 'recording') {
    appState.mediaRecorder.stop();

    const btn = document.getElementById('recordBtn');
    if (!btn) return;

    const icon = btn.querySelector('.record-icon');
    const text = btn.querySelector('.record-text');

    btn.classList.remove('recording');
    if (icon) icon.textContent = '⏺';
    if (text) text.textContent = 'Start Recording';
  }
}

function startRecordingTimer() {
  const appState = window.appState;
  if (!appState) return;

  const timerEl = document.getElementById('recordTimer');
  if (!timerEl) return;

  const interval = setInterval(() => {
    if (
      !appState.recordingStartTime ||
      !appState.mediaRecorder ||
      appState.mediaRecorder.state !== 'recording'
    ) {
      clearInterval(interval);
      timerEl.textContent = '0:00 / 0:30';
      return;
    }

    const elapsed = Math.floor((Date.now() - appState.recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')} / 0:30`;
  }, 100);
}

function showAudioPreview(blob) {
  const appState = window.appState;
  if (!appState) return;

  const preview = document.getElementById('audioPreview');
  const audio = document.getElementById('audioPlayback');
  if (!preview || !audio) return;

  if (appState.audioObjectUrl) URL.revokeObjectURL(appState.audioObjectUrl);
  appState.audioObjectUrl = URL.createObjectURL(blob);

  audio.src = appState.audioObjectUrl;
  preview.classList.remove('hidden');

  const hint = document.getElementById('recordingHint');
  if (hint) hint.style.display = 'none';

  const btn = document.getElementById('voiceContinueBtn');
  if (btn) btn.disabled = false;
}

function reRecord() {
  const appState = window.appState;
  if (!appState) return;

  const preview = document.getElementById('audioPreview');
  if (preview) preview.classList.add('hidden');

  const hint = document.getElementById('recordingHint');
  if (hint) hint.style.display = 'block';

  const btn = document.getElementById('voiceContinueBtn');
  if (btn) btn.disabled = true;

  appState.voiceBlob = null;

  if (appState.audioObjectUrl) URL.revokeObjectURL(appState.audioObjectUrl);
  appState.audioObjectUrl = null;

  const audio = document.getElementById('audioPlayback');
  if (audio) audio.src = '';
}

function stopAllStreams() {
  const appState = window.appState;
  if (!appState) return;

  if (appState.audioStream) {
    appState.audioStream.getTracks().forEach((track) => track.stop());
    appState.audioStream = null;
  }
}

function goToStory() {
  const appState = window.appState;
  if (!appState) return;

  if (!appState.voiceBlob) {
    if (typeof window.showToast === 'function') {
      window.showToast('Please record your voice first', 'error');
    }
    return;
  }

  if (appState.currentScreen === 'scriptScreen' && document.getElementById('voiceScreen')) {
    if (typeof window.navigateToScreen === 'function') {
      window.navigateToScreen('voiceScreen');
    }
  }
}

// Expose globally for HTML/app.js
window.toggleRecording = toggleRecording;
window.stopRecording = stopRecording;
window.startRecordingTimer = startRecordingTimer;
window.showAudioPreview = showAudioPreview;
window.reRecord = reRecord;
window.stopAllStreams = stopAllStreams;
window.goToStory = goToStory;

