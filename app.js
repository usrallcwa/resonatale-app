// CONFIG
const API_BASE = 'https://resonatale-worker.ayatemarketing.workers.dev';

// STATE
let state = {
    photos: [],
    voiceBlob: null,
    voiceId: null,
    recordingStart: null,
    mediaRecorder: null,
    audioStream: null,
    turnstileToken: null,
    authToken: localStorage.getItem('authToken'),
    userId: localStorage.getItem('userId'),
    balance: 0
};

// INIT
document.addEventListener('DOMContentLoaded', () => {
    if (state.authToken) checkAuth();
    
    const slider = document.getElementById('creditSlider');
    const display = document.getElementById('sliderValue');
    if (slider) slider.addEventListener('input', () => display.textContent = slider.value);
    
    const briefDesc = document.getElementById('briefDesc');
    if (briefDesc) briefDesc.addEventListener('input', (e) => {
        document.getElementById('briefCount').textContent = e.target.value.length;
    });
    
    const photoInput = document.getElementById('photoInput');
    if (photoInput) photoInput.addEventListener('change', handlePhotoSelect);
});

// AUTH CHECK
async function checkAuth() {
    try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${state.authToken}` }
        });
        if (res.ok) {
            const data = await res.json();
            state.balance = data.user.balance || 0;
            updateBalance();
            document.getElementById('appHeader').classList.remove('hidden');
            document.getElementById('menuEmail').textContent = data.user.email;
        } else {
            logout();
        }
    } catch (e) {
        console.error('Auth check failed:', e);
    }
}

function updateBalance() {
    document.querySelectorAll('#userBalance, #modalBalance, #menuBalance').forEach(el => {
        el.textContent = state.balance.toFixed(2);
    });
}

// NAVIGATION
function startApp() {
    navigateTo('uploadScreen');
}

function navigateTo(screenId) {
    document.querySelector('.screen.active')?.classList.remove('active');
    document.getElementById(screenId)?.classList.add('active');
}

function goBack(screenId) {
    navigateTo(screenId);
}

// PHOTO UPLOAD
function triggerFileInput() {
    document.getElementById('photoInput').click();
}

function handlePhotoSelect(e) {
    const files = Array.from(e.target.files);
    
    if (state.photos.length + files.length > 12) {
        showToast('Maximum 12 photos', 'error');
        return;
    }
    
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                state.photos.push({ file, dataUrl: evt.target.result });
                updatePhotoGrid();
            };
            reader.readAsDataURL(file);
        }
    });
}

function updatePhotoGrid() {
    const grid = document.getElementById('photoGrid');
    const count = document.getElementById('photoCount');
    
    count.textContent = state.photos.length;
    
    grid.innerHTML = state.photos.map((p, i) => `
        <div class="photo-item">
            <img src="${p.dataUrl}">
            <button class="photo-remove" onclick="removePhoto(${i})">×</button>
        </div>
    `).join('');
    
    document.getElementById('photoContinueBtn').disabled = state.photos.length < 6;
}

function removePhoto(i) {
    state.photos.splice(i, 1);
    updatePhotoGrid();
}

function goToVoice() {
    if (state.photos.length < 6) {
        showToast('Upload at least 6 photos', 'error');
        return;
    }
    navigateTo('voiceScreen');
}

// VOICE RECORDING
async function toggleRecording() {
    const btn = document.getElementById('recordBtn');
    const icon = btn.querySelector('.record-icon');
    const text = btn.querySelector('.record-text');
    
    if (!state.mediaRecorder || state.mediaRecorder.state === 'inactive') {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            state.audioStream = stream;
            state.mediaRecorder = new MediaRecorder(stream);
            
            const chunks = [];
            state.mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            state.mediaRecorder.onstop = () => {
                state.voiceBlob = new Blob(chunks, { type: 'audio/webm' });
                showAudioPreview();
                stopStreams();
            };
            
            state.mediaRecorder.start();
            state.recordingStart = Date.now();
            
            btn.classList.add('recording');
            icon.textContent = '⏹';
            text.textContent = 'Stop';
            
            startTimer();
            setTimeout(() => {
                if (state.mediaRecorder?.state === 'recording') stopRecording();
            }, 30000);
            
        } catch (e) {
            showToast('Microphone access denied', 'error');
        }
    } else {
        stopRecording();
    }
}

function stopRecording() {
    if (state.mediaRecorder?.state === 'recording') {
        state.mediaRecorder.stop();
        const btn = document.getElementById('recordBtn');
        btn.classList.remove('recording');
        btn.querySelector('.record-icon').textContent = '⏺';
        btn.querySelector('.record-text').textContent = 'Start';
    }
}

function startTimer() {
    const timer = document.getElementById('recordTimer');
    const interval = setInterval(() => {
        if (!state.recordingStart || state.mediaRecorder?.state !== 'recording') {
            clearInterval(interval);
            timer.textContent = '0:00 / 0:30';
            return;
        }
        const elapsed = Math.floor((Date.now() - state.recordingStart) / 1000);
        const min = Math.floor(elapsed / 60);
        const sec = elapsed % 60;
        timer.textContent = `${min}:${sec.toString().padStart(2, '0')} / 0:30`;
    }, 100);
}

function showAudioPreview() {
    const preview = document.getElementById('audioPreview');
    const audio = document.getElementById('audioPlayback');
    audio.src = URL.createObjectURL(state.voiceBlob);
    preview.classList.remove('hidden');
    document.getElementById('recordingHint').style.display = 'none';
    document.getElementById('voiceContinueBtn').disabled = false;
}

function reRecord() {
    document.getElementById('audioPreview').classList.add('hidden');
    document.getElementById('recordingHint').style.display = 'block';
    document.getElementById('voiceContinueBtn').disabled = true;
    state.voiceBlob = null;
}

function stopStreams() {
    state.audioStream?.getTracks().forEach(t => t.stop());
    state.audioStream = null;
}

function goToStory() {
    if (!state.voiceBlob) {
        showToast('Record your voice first', 'error');
        return;
    }
    navigateTo('storyScreen');
}

// PREVIEW GENERATION
async function generatePreview() {
    const brief = document.getElementById('briefDesc').value.trim();
    if (!brief) {
        showToast('Enter a description', 'error');
        return;
    }
    
    showLoading('Uploading photos...');
    
    try {
        // Upload voice
        showLoading('Cloning voice...');
        const formData = new FormData();
        formData.append('audio', state.voiceBlob, 'voice.webm');
        formData.append('name', 'User Voice');
        
        const voiceRes = await fetch(`${API_BASE}/api/voice/clone`, {
            method: 'POST',
            body: formData
        });
        
        if (!voiceRes.ok) throw new Error('Voice upload failed');
        const voiceData = await voiceRes.json();
        state.voiceId = voiceData.voiceId;
        
        // Generate preview
        showLoading('Creating preview...');
        const previewRes = await fetch(`${API_BASE}/api/render/preview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: brief,
                photoCount: state.photos.length,
                voiceId: state.voiceId,
                language: document.getElementById('languageSelect').value,
                mood: document.getElementById('moodSelect').value,
                genre: document.getElementById('genreSelect').value,
                orientation: document.getElementById('orientationSelect').value
            })
        });
        
        if (!previewRes.ok) throw new Error('Preview generation failed');
        const preview = await previewRes.json();
        
        document.getElementById('previewVideo').src = preview.audioUrl;
        navigateTo('previewScreen');
        hideLoading();
        showToast('Preview ready!', 'success');
        
    } catch (e) {
        hideLoading();
        showToast(e.message, 'error');
    }
}

// MODALS
function showSignup() {
    document.getElementById('signupModal').classList.add('active');
}

function closeSignup() {
    document.getElementById('signupModal').classList.remove('active');
}

function showAddCredits() {
    closeMenu();
    document.getElementById('creditsModal').classList.add('active');
    document.getElementById('modalBalance').textContent = state.balance.toFixed(2);
}

function closeCredits() {
    document.getElementById('creditsModal').classList.remove('active');
}

function showMenu() {
    document.getElementById('menuOverlay').classList.add('active');
}

function closeMenu() {
    document.getElementById('menuOverlay').classList.remove('active');
}

// TURNSTILE
window.onTurnstileSuccess = function(token) {
    state.turnstileToken = token;
    document.getElementById('signupBtn').disabled = false;
};

// PAYMENT
function processPayment() {
    const amount = parseInt(document.getElementById('creditSlider').value);
    if (amount < 20 || amount > 500) {
        showToast('Amount must be $20-$500', 'error');
        return;
    }
    console.log('Process payment:', amount);
    // Handled in wallet.js
}

// PAGES
function showPage(page) {
    if (page === 'contact') {
        window.location.href = 'mailto:admin@resonatale.com';
    } else {
        window.open(`${page}.html`, '_blank');
    }
}

// LOGOUT
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    state.authToken = null;
    state.userId = null;
    state.balance = 0;
    closeMenu();
    navigateTo('heroScreen');
    document.getElementById('appHeader').classList.add('hidden');
    showToast('Logged out', 'success');
}

// UI HELPERS
function showLoading(text = 'Processing...') {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    const colors = { error: '#EF4444', success: '#10B981', info: '#6366F1' };
    toast.style.cssText = `position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:${colors[type]};color:#FFF;padding:1rem 2rem;border-radius:12px;z-index:9999;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.3)`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
