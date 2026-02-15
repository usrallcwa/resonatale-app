// render.js - Full Film Rendering

async function startFullRender() {
  // Require auth + credits
  if (!appState.authToken) {
    if (typeof showToast === 'function') {
      showToast('Please log in to render a full film.', 'error');
    }
    if (typeof showLogin === 'function') showLogin();
    return;
  }

  // Basic credit check (adjust threshold as needed)
  if (appState.userBalance < 19.99) {
    if (typeof showAddCredits === 'function') showAddCredits();
    if (typeof showToast === 'function') {
      showToast('Insufficient credits', 'error');
    }
    return;
  }

  // Compliance + verification
  if (!hasConsent()) {
    if (typeof showConsentModal === 'function') showConsentModal();
    if (typeof showToast === 'function') {
      showToast('Please confirm you are 18+ before rendering.', 'error');
    }
    return;
  }
  if (!appState.turnstileToken) {
    if (typeof showToast === 'function') {
      showToast('Please complete the verification check.', 'error');
    }
    return;
  }

  if (!appState.photos.length) {
    if (typeof showToast === 'function') {
      showToast('Please upload photos first.', 'error');
    }
    return;
  }
  if (!appState.voiceId) {
    if (typeof showToast === 'function') {
      showToast('Missing voice clone. Generate a preview first.', 'error');
    }
    return;
  }

  if (typeof showLoading === 'function') showLoading('Uploading photos...');

  try {
    // Upload photos
    const formData = new FormData();
    appState.photos.forEach((photo, i) => {
      formData.append('photos', photo.file, `photo_${i}.jpg`);
    });
    formData.append('turnstileToken', appState.turnstileToken);

    const uploadRes = await fetch(`${API_BASE}/api/render/upload-photos`, {
      method: 'POST',
      headers: appState.authToken
        ? { Authorization: `Bearer ${appState.authToken}` }
        : undefined,
      body: formData
    });

    if (!uploadRes.ok) throw new Error('Photo upload failed');
    const uploadData = await uploadRes.json();

    // Start render job
    if (typeof showLoading === 'function') showLoading('Starting render...');
    const briefDescEl = document.getElementById('briefDesc');
    const briefDesc = briefDescEl ? briefDescEl.value : '';

    const renderRes = await fetch(`${API_BASE}/api/render/full`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(appState.authToken
          ? { Authorization: `Bearer ${appState.authToken}` }
          : {})
      },
      body: JSON.stringify({
        photoUrls: uploadData.photoUrls,
        voiceId: appState.voiceId,
        prompt: briefDesc,
        language: document.getElementById('languageSelect')?.value || 'en',
        mood: document.getElementById('moodSelect')?.value || 'default',
        genre: document.getElementById('genreSelect')?.value || 'default',
        orientation:
          document.getElementById('orientationSelect')?.value || 'landscape',
        turnstileToken: appState.turnstileToken
      })
    });

    if (!renderRes.ok) throw new Error('Render failed');
    const renderData = await renderRes.json();

    await pollRenderStatus(renderData.jobId);
  } catch (e) {
    console.error('Full render error:', e);
    if (typeof hideLoading === 'function') hideLoading();
    if (typeof showToast === 'function') {
      showToast(e.message || 'Full render failed', 'error');
    }
  }
}

async function pollRenderStatus(jobId) {
  if (typeof showLoading === 'function') {
    showLoading('Rendering your film... (1–3 min)');
  }

  const interval = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/render/status/${jobId}`, {
        headers: appState.authToken
          ? { Authorization: `Bearer ${appState.authToken}` }
          : undefined
      });

      if (!res.ok) {
        clearInterval(interval);
        throw new Error('Status check failed');
      }

      const data = await res.json();

      if (data.status === 'completed') {
        clearInterval(interval);
        if (typeof hideLoading === 'function') hideLoading();
        showCompletedFilm(data.videoUrl);
        if (typeof initAuthenticatedApp === 'function') {
          initAuthenticatedApp(); // refresh balance
        }
      } else if (data.status === 'failed') {
        clearInterval(interval);
        if (typeof hideLoading === 'function') hideLoading();
        if (typeof showToast === 'function') {
          showToast('Render failed. Credits refunded.', 'error');
        }
        if (typeof initAuthenticatedApp === 'function') {
          initAuthenticatedApp();
        }
      } else {
        const progress = data.progress || 0;
        const loadingText = document.getElementById('loadingText');
        if (loadingText) loadingText.textContent = `Rendering... ${progress}%`;
      }
    } catch (e) {
      console.error('Polling error:', e);
      clearInterval(interval);
      if (typeof hideLoading === 'function') hideLoading();
      if (typeof showToast === 'function') {
        showToast(e.message || 'Render status check failed', 'error');
      }
    }
  }, 5000);
}

function showCompletedFilm(videoUrl) {
  const root = document.querySelector('.app-root');
  if (!root) return;

  const existing = document.getElementById('completionScreen');
  if (existing) existing.remove();

  const completionHTML = `
    <div class="screen active" id="completionScreen">
      <div class="screen-header">
        <h2 class="screen-title">Your Film is Ready!</h2>
      </div>
      <div class="screen-content">
        <div class="video-container">
          <video controls playsinline src="${videoUrl}"></video>
        </div>
        <div class="preview-info">
          <p class="preview-title">🎉 Film Complete!</p>
          <p class="preview-desc">Download or share your masterpiece</p>
        </div>
      </div>
      <div class="screen-footer">
        <button class="btn" type="button" onclick="downloadFilm('${videoUrl}')">⬇️ Download</button>
        <button
          class="btn"
          type="button"
          style="margin-top:1rem;background:transparent;border:1px solid rgba(255,255,255,0.2);"
          onclick="createAnother()"
        >
          Create Another
        </button>
      </div>
    </div>
  `;

  root.insertAdjacentHTML('beforeend', completionHTML);
  if (typeof navigateToScreen === 'function') navigateToScreen('completionScreen');
  if (typeof showToast === 'function') showToast('Film ready!', 'success');
}

function downloadFilm(url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = 'resonatale_film.mp4';
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (typeof showToast === 'function') showToast('Download started', 'success');
}

function createAnother() {
  appState.photos = [];
  appState.voiceBlob = null;
  appState.voiceId = null;

  const screen = document.getElementById('completionScreen');
  if (screen) screen.remove();

  if (typeof navigateToScreen === 'function') navigateToScreen('uploadScreen');
  if (typeof updatePhotoGrid === 'function') updatePhotoGrid();
  if (typeof showToast === 'function') showToast('Ready for new film', 'success');
}
