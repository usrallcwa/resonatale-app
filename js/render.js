// render.js – Screen wiring for upload, script, voice, preview

document.addEventListener('DOMContentLoaded', () => {
  wireUploadScreen();
  wireScriptScreen();
  wireVoiceScreen();
  wirePreviewScreen();
});

// ============================================
// UPLOAD SCREEN
// ============================================
function wireUploadScreen() {
  const continueBtn = document.getElementById('photoContinueBtn');
  const triggerBtn = document.getElementById('photoTriggerBtn');
  const backBtn = document.getElementById('uploadBackBtn');

  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      // Moves into scriptScreen or voiceScreen based on current flow
      goToVoice();
    });
  }

  if (triggerBtn) {
    triggerBtn.addEventListener('click', () => {
      triggerFileInput();
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      goBack('heroScreen');
    });
  }
}

// ============================================
// SCRIPT SCREEN
// ============================================
function wireScriptScreen() {
  const generateBtn = document.getElementById('generatePreviewBtn');
  const backBtn = document.getElementById('scriptBackBtn');

  // Dropdowns (language/mood/genre/orientation) are read directly
  // in generatePreviewRequest() inside app.js – no wiring needed
  // other than existing HTML IDs.

  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      // Calls Worker: POST /api/render/preview
      generatePreview();
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      goBack('uploadScreen');
    });
  }
}

// ============================================
// VOICE SCREEN
// ============================================
function wireVoiceScreen() {
  const recordBtn = document.getElementById('recordBtn');
  const continueBtn = document.getElementById('voiceContinueBtn');
  const backBtn = document.getElementById('voiceBackBtn');
  const reRecordBtn = document.getElementById('voiceReRecordBtn');

  if (recordBtn) {
    recordBtn.addEventListener('click', () => {
      // Handles MediaRecorder, Turnstile + consent checks
      toggleRecording();
    });
  }

  if (reRecordBtn) {
    reRecordBtn.addEventListener('click', () => {
      reRecord();
    });
  }

  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      // After recording, user goes to script to generate preview
      navigateToScreen('scriptScreen');
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      goBack('scriptScreen');
    });
  }
}

// ============================================
// PREVIEW SCREEN
// ============================================
function wirePreviewScreen() {
  const mediaEl = document.getElementById('previewVideo'); // may be <video> or <audio>
  const playBtn = document.getElementById('previewPlayBtn');
  const restartBtn = document.getElementById('previewRestartBtn');
  const backBtn = document.getElementById('previewBackBtn');
  const regenerateBtn = document.getElementById('previewRegenerateBtn');
  const statusBtn = document.getElementById('previewStatusBtn');

  if (mediaEl) {
    mediaEl.addEventListener('error', () => {
      if (typeof showToast === 'function') {
        showToast('Unable to load preview media.', 'error');
      }
    });
  }

  if (playBtn && mediaEl) {
    playBtn.addEventListener('click', () => {
      if (!appState.previewVideoUrl) {
        if (typeof showToast === 'function') {
          showToast('No preview available yet.', 'error');
        }
        return;
      }
      if (mediaEl.paused) {
        mediaEl.play().catch(() => {});
      } else {
        mediaEl.pause();
      }
    });
  }

  if (restartBtn && mediaEl) {
    restartBtn.addEventListener('click', () => {
      if (!appState.previewVideoUrl) return;
      mediaEl.currentTime = 0;
      mediaEl.play().catch(() => {});
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // Back to voice to re‑record or adjust
      goBack('voiceScreen');
    });
  }

  if (regenerateBtn) {
    regenerateBtn.addEventListener('click', () => {
      // Calls same /api/render/preview endpoint again
      generatePreview();
    });
  }

  // Optional: hook a “check status” button if you later
  // use /api/render/status/:id for long running renders.
  if (statusBtn) {
    statusBtn.addEventListener('click', () => {
      const previewIdEl = document.getElementById('previewId');
      const previewId = previewIdEl ? previewIdEl.textContent.trim() : '';
      if (!previewId) {
        if (typeof showToast === 'function') {
          showToast('No render ID available yet.', 'error');
        }
        return;
      }
      checkRenderStatus(previewId);
    });
  }
}

// ============================================
// OPTIONAL: Render status polling
// (uses GET /api/render/status/:id from Worker)
// ============================================
async function checkRenderStatus(renderId) {
  try {
    const res = await fetch(`${API_BASE}/api/render/status/${encodeURIComponent(renderId)}`);
    if (!res.ok) {
      throw new Error('Failed to check status');
    }
    const data = await res.json();

    const statusTextEl = document.getElementById('previewStatusText');
    if (statusTextEl) {
      statusTextEl.textContent = `${data.status || 'unknown'} (${data.progress ?? 0}%)`;
    }

    if (data.url) {
      // If Shotstack already finished and URL is available, swap to final URL
      const mediaEl = document.getElementById('previewVideo');
      if (mediaEl) {
        mediaEl.src = data.url;
        appState.previewVideoUrl = data.url;
      }
      if (typeof showToast === 'function') {
        showToast('Render complete!', 'success');
      }
    }
  } catch (err) {
    console.error('Status check error:', err);
    if (typeof showToast === 'function') {
      showToast('Unable to check render status.', 'error');
    }
  }
}
