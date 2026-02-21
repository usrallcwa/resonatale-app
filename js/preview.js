// preview.js

// ============================================
// GENERATE PREVIEW (Step 2 - part 2 → Step 3)
// ============================================

let isGeneratingPreview = false;

async function generatePreview() {
  const appState = window.appState;
  if (!appState) return;

  if (isGeneratingPreview) {
    // prevent double taps on mobile
    return;
  }

  const briefDescEl = document.getElementById('briefDesc');
  const briefDesc = briefDescEl ? briefDescEl.value.trim() : '';

  console.log('[ResonaTale] generatePreview clicked');
  console.log('  hasConsent:', typeof window.hasConsent === 'function' ? window.hasConsent() : null);
  console.log('  turnstileToken:', appState.turnstileToken);
  console.log('  photos:', appState.photos.length);
  console.log('  hasVoiceBlob:', !!appState.voiceBlob, 'voiceId:', appState.voiceId);
  console.log('  briefDesc length:', briefDesc.length);

  // 1) Consent guard
  if (typeof window.hasConsent === 'function' && !window.hasConsent()) {
    if (typeof window.showConsentModal === 'function') window.showConsentModal();
    if (typeof window.showToast === 'function') {
      window.showToast('Please confirm you are 18+ before generating a preview.', 'error');
    } else {
      alert('Please confirm you are 18+ before generating a preview.');
    }
    return;
  }

  // 2) Turnstile – optional for preview (backend will enforce limits if needed)
  const turnstileToken = appState.turnstileToken || null;
  console.log('[ResonaTale] turnstileToken for preview:', turnstileToken);

  // 3) Description guard
  if (!briefDesc) {
    if (typeof window.showToast === 'function') {
      window.showToast('Please enter a brief description of your story.', 'error');
    } else {
      alert('Please enter a brief description of your story.');
    }
    return;
  }

  // 4) Photos guard
  if (appState.photos.length < 6) {
    if (typeof window.showToast === 'function') {
      window.showToast('Please upload at least 6 photos.', 'error');
    } else {
      alert('Please upload at least 6 photos.');
    }
    return;
  }

  // 5) Voice guard
  if (!appState.voiceBlob && !appState.voiceId) {
    if (typeof window.showToast === 'function') {
      window.showToast('Please record your voice before generating a preview.', 'error');
    } else {
      alert('Please record your voice before generating a preview.');
    }
    return;
  }

  isGeneratingPreview = true;

  const generateBtn = document.getElementById('voiceContinueBtn');
  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
  }

  if (typeof window.showLoading === 'function') {
    window.showLoading('Uploading photos...');
  }

  try {
    // 6) Upload photos (stubbed for now)
    const photoUrls = await uploadPhotos();

    // 7) Upload voice if needed
    if (!appState.voiceId) {
      if (typeof window.showLoading === 'function') {
        window.showLoading('Cloning your voice...');
      }
      const voiceId = await uploadVoice();
      appState.voiceId = voiceId;
    }

    // 8) Call preview API
    if (typeof window.showLoading === 'function') {
      window.showLoading('Creating your preview film...');
    }
    const previewData = await generatePreviewRequest(
      photoUrls,
      appState.voiceId,
      briefDesc,
      turnstileToken
    );

    const audioUrl = previewData.audioUrl || null;
    const scriptText = previewData.script || '';

    appState.previewVideoUrl = audioUrl;
    // Save last brief so fullVideo.js can reuse it
    appState.lastBrief = briefDesc;

    if (typeof window.navigateToScreen === 'function') {
      window.navigateToScreen('previewScreen');
    }

    const mediaEl = document.getElementById('previewVideo');
    if (mediaEl && audioUrl) {
      mediaEl.src = audioUrl;
    }

    const scriptEl = document.getElementById('previewScript');
    if (scriptEl) {
      scriptEl.textContent = scriptText;
    }

    if (typeof window.hideLoading === 'function') window.hideLoading();
    if (typeof window.showToast === 'function') {
      window.showToast(previewData.message || 'Preview ready!', 'success');
    }
  } catch (error) {
    console.error('[ResonaTale] Preview generation error:', error);
    if (typeof window.hideLoading === 'function') window.hideLoading();
    if (typeof window.showToast === 'function') {
      window.showToast(error.message || 'Failed to generate preview. Please try again.', 'error');
    } else {
      alert(error.message || 'Failed to generate preview. Please try again.');
    }
  } finally {
    isGeneratingPreview = false;
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate preview';
    }
  }
}

// Stub: replace with real upload when backend is ready
async function uploadPhotos() {
  const appState = window.appState;
  if (!appState) return [];
  return appState.photos.map((photo, i) => `photo_${i}_${Date.now()}`);
}

async function uploadVoice() {
  const appState = window.appState;
  const API_BASE = window.API_BASE;
  if (!appState || !API_BASE) {
    throw new Error('App not initialized');
  }

  if (typeof window.hasConsent === 'function' && !window.hasConsent()) {
    if (typeof window.showConsentModal === 'function') window.showConsentModal();
    throw new Error('Consent required');
  }
  if (!appState.turnstileToken) {
    throw new Error('Verification required');
  }

  const formData = new FormData();
  formData.append('audio', appState.voiceBlob, 'voice.webm');
  formData.append('name', 'User Voice');
  formData.append('turnstileToken', appState.turnstileToken);

  const headers = {};
  if (appState.authToken) headers['Authorization'] = `Bearer ${appState.authToken}`;

  const response = await fetch(`${API_BASE}/apiuservoiceupload`, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!response.ok) {
    let msg = 'Voice upload failed';
    try {
      const err = await response.json();
      console.error('Voice upload error body:', err);
      if (err && (err.error || err.message)) msg = err.error || err.message;
    } catch (e) {
      console.error('Voice upload non-JSON error:', e);
    }
    throw new Error(msg);
  }

  const data = await response.json();
  return data.voiceId;
}

async function generatePreviewRequest(photoUrls, voiceId, briefDesc, turnstileToken) {
  const appState = window.appState;
  const API_BASE = window.API_BASE;
  if (!API_BASE || !appState) {
    throw new Error('App not initialized');
  }

  const headers = { 'Content-Type': 'application/json' };
  if (appState.authToken) headers['Authorization'] = `Bearer ${appState.authToken}`;

  const response = await fetch(`${API_BASE}/api/render/preview`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: briefDesc,
      photoUrls,
      voiceId,
      photoCount: photoUrls.length,
      language: appState.voiceLanguage,
      mood: appState.voiceMood,
      turnstileToken: turnstileToken || null
    })
  });

  if (!response.ok) {
    let error = {};
    try {
      error = await response.json();
    } catch (e) {
      console.error('Preview response non-JSON error:', e);
    }
    throw new Error(error.error || error.message || 'Preview generation failed');
  }

  return await response.json();
}

// Expose globally for HTML/app.js
window.generatePreview = generatePreview;
window.uploadPhotos = uploadPhotos;
window.uploadVoice = uploadVoice;
window.generatePreviewRequest = generatePreviewRequest;
