// fullVideo.js

// ============================================
// FULL VIDEO GENERATION (paid, after wallet)
// ============================================

// Start a full-length paid render for the given brief description
async function generateFullVideo(briefDesc) {
  if (!window.appState || !window.API_BASE) {
    throw new Error('App not initialized');
  }

  const { appState } = window;
  const API_BASE = window.API_BASE;

  if (!appState.authToken) {
    throw new Error('Please log in before generating full video');
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${appState.authToken}`
  };

  const res = await fetch(`${API_BASE}/api/render/video`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: briefDesc,
      photoCount: appState.photos.length || 6,
      language: appState.voiceLanguage,
      mood: appState.voiceMood
    })
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.success === false) {
    throw new Error(data.error || data.message || 'Failed to start full render');
  }

  // Backend returns { success, videoId, newBalance, charged, message }
  return data.videoId;
}

// Click handler for "Get full video" / "Make Full Film" button
async function onGetFullVideoClicked() {
  const briefDescEl = document.getElementById('briefDesc');
  const briefDesc = briefDescEl ? briefDescEl.value.trim() : '';

  if (!briefDesc) {
    if (typeof window.showToast === 'function') {
      window.showToast('Please enter a brief description first.', 'error');
    }
    return;
  }

  try {
    if (typeof window.showLoading === 'function') {
      window.showLoading('Starting full video render...');
    }

    const videoId = await generateFullVideo(briefDesc);

    if (typeof window.showToast === 'function') {
      window.showToast('Full video render started. We’ll notify you when it’s ready.', 'success');
    }

    const API_BASE = window.API_BASE;

    const poll = async () => {
      const res = await fetch(`${API_BASE}/api/render/status/${videoId}`);
      const data = await res.json().catch(() => ({}));

      if (data.status === 'done' && data.url) {
        if (typeof window.hideLoading === 'function') window.hideLoading();

        const mediaEl = document.getElementById('previewVideo');
        if (mediaEl) {
          mediaEl.src = data.url;
        }

        if (typeof window.showToast === 'function') {
          window.showToast('Your full video is ready!', 'success');
        }
      } else {
        setTimeout(poll, 4000);
      }
    };

    poll();
  } catch (err) {
    console.error('Get full video error:', err);
    if (typeof window.hideLoading === 'function') window.hideLoading();
    if (typeof window.showToast === 'function') {
      window.showToast(err.message || 'Failed to start full video', 'error');
    } else {
      alert(err.message || 'Failed to start full video');
    }
  }
}

// Expose to global for app.js / HTML wiring
window.generateFullVideo = generateFullVideo;
window.onGetFullVideoClicked = onGetFullVideoClicked;

