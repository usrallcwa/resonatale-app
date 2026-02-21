// render.js – optional screen wiring for preview extras

document.addEventListener('DOMContentLoaded', () => {
  wirePreviewScreen();
});

// ============================================
// PREVIEW SCREEN
// ============================================
function wirePreviewScreen() {
  const mediaEl = document.getElementById('previewVideo'); // <audio> in your HTML
  const statusBtn = document.getElementById('previewStatusBtn');
  const restartBtn = document.getElementById('previewRestartBtn');

  if (mediaEl) {
    mediaEl.addEventListener('error', () => {
      if (typeof showToast === 'function') {
        showToast('Unable to load preview media.', 'error');
      }
    });
  }

  // Optional: restart button if you add it in HTML
  if (restartBtn && mediaEl) {
    restartBtn.addEventListener('click', () => {
      if (!window.appState || !window.appState.previewVideoUrl) return;
      mediaEl.currentTime = 0;
      mediaEl.play().catch(() => {});
    });
  }

  // Optional: "check status" button using /api/render/status/:id
  if (statusBtn) {
    statusBtn.addEventListener('click', () => {
      const previewIdEl = document.getElementById('previewId');
      const previewId = previewIdEl ? previewId.textContent.trim() : '';
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
// ============================================
async function checkRenderStatus(renderId) {
  if (!window.API_BASE) return;

  try {
    const res = await fetch(`${window.API_BASE}/api/render/status/${encodeURIComponent(renderId)}`);
    if (!res.ok) {
      throw new Error('Failed to check status');
    }

    const data = await res.json();

    const statusTextEl = document.getElementById('previewStatusText');
    if (statusTextEl) {
      const progress = data.progress ?? 0;
      statusTextEl.textContent = `${data.status || 'unknown'} (${progress}%)`;
    }

    if (data.url) {
      const mediaEl = document.getElementById('previewVideo');
      if (mediaEl) {
        mediaEl.src = data.url;
        if (window.appState) window.appState.previewVideoUrl = data.url;
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

// Expose if needed
window.checkRenderStatus = checkRenderStatus;
