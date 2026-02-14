// render.js - Full Film Rendering

async function startFullRender() {
    if (state.balance < 19.99) {
        showAddCredits();
        showToast('Insufficient credits', 'error');
        return;
    }
    
    showLoading('Uploading photos...');
    
    try {
        // Upload photos
        const formData = new FormData();
        state.photos.forEach((photo, i) => {
            formData.append('photos', photo.file, `photo_${i}.jpg`);
        });
        
        const uploadRes = await fetch(`${API_BASE}/api/render/upload-photos`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${state.authToken}` },
            body: formData
        });
        
        if (!uploadRes.ok) throw new Error('Photo upload failed');
        const uploadData = await uploadRes.json();
        
        // Start render job
        showLoading('Starting render...');
        const renderRes = await fetch(`${API_BASE}/api/render/full`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.authToken}`
            },
            body: JSON.stringify({
                photoUrls: uploadData.photoUrls,
                voiceId: state.voiceId,
                prompt: document.getElementById('briefDesc').value,
                language: document.getElementById('languageSelect').value,
                mood: document.getElementById('moodSelect').value,
                genre: document.getElementById('genreSelect').value,
                orientation: document.getElementById('orientationSelect').value
            })
        });
        
        if (!renderRes.ok) throw new Error('Render failed');
        const renderData = await renderRes.json();
        
        // Poll for completion
        pollRenderStatus(renderData.jobId);
        
    } catch (e) {
        hideLoading();
        showToast(e.message, 'error');
    }
}

async function pollRenderStatus(jobId) {
    showLoading('Rendering your film... (1-3 min)');
    
    const interval = setInterval(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/render/status/${jobId}`, {
                headers: { 'Authorization': `Bearer ${state.authToken}` }
            });
            
            if (!res.ok) {
                clearInterval(interval);
                throw new Error('Status check failed');
            }
            
            const data = await res.json();
            
            if (data.status === 'completed') {
                clearInterval(interval);
                hideLoading();
                showCompletedFilm(data.videoUrl);
                refreshBalance();
            } else if (data.status === 'failed') {
                clearInterval(interval);
                hideLoading();
                showToast('Render failed. Credits refunded.', 'error');
                refreshBalance();
            } else {
                // Update progress
                const progress = data.progress || 0;
                document.getElementById('loadingText').textContent = 
                    `Rendering... ${progress}%`;
            }
            
        } catch (e) {
            clearInterval(interval);
            hideLoading();
            showToast(e.message, 'error');
        }
    }, 5000); // Poll every 5 seconds
}

function showCompletedFilm(videoUrl) {
    // Create completion screen
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
                <button class="btn" onclick="downloadFilm('${videoUrl}')">⬇️ Download</button>
                <button class="btn" style="margin-top:1rem;background:transparent;border:1px solid var(--border)" onclick="createAnother()">Create Another</button>
            </div>
        </div>
    `;
    
    document.getElementById('app').insertAdjacentHTML('beforeend', completionHTML);
    navigateTo('completionScreen');
    showToast('Film ready!', 'success');
}

function downloadFilm(url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resonatale_film.mp4';
    a.click();
    showToast('Download started', 'success');
}

function createAnother() {
    // Reset state
    state.photos = [];
    state.voiceBlob = null;
    state.voiceId = null;
    
    // Remove completion screen
    document.getElementById('completionScreen')?.remove();
    
    // Go back to start
    navigateTo('uploadScreen');
    updatePhotoGrid();
    showToast('Ready for new film', 'success');
}
