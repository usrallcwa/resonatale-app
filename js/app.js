// ============================================
// GLOBAL STATE & CONFIGURATION
// ============================================
const API_BASE = 'https://api.resonatale.com';

let appState = {
    currentScreen: 'heroScreen',
    previousScreen: null,
    photos: [],
    voiceBlob: null,
    voiceId: null,
    recordingStartTime: null,
    mediaRecorder: null,
    audioStream: null,
    turnstileToken: null,
    authToken: localStorage.getItem('authToken'),
    userId: localStorage.getItem('userId'),
    userBalance: 0,
    previewVideoUrl: null
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎬 ResonaTale App Initialized');
    
    // Check if user is logged in
    if (appState.authToken) {
        initAuthenticatedApp();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Start film counter animation
    animateFilmCounter();
});

function setupEventListeners() {
    // Photo input
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.addEventListener('change', handlePhotoSelection);
    }
    
    // Brief description character counter
    const briefDesc = document.getElementById('briefDesc');
    if (briefDesc) {
        briefDesc.addEventListener('input', function(e) {
            const count = e.target.value.length;
            document.getElementById('briefCount').textContent = count;
        });
    }
    
    // Prevent pull-to-refresh on mobile
    document.body.addEventListener('touchmove', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
}

// ============================================
// NAVIGATION
// ============================================
function startApp() {
    navigateToScreen('uploadScreen');
}

function navigateToScreen(screenId) {
    const currentScreen = document.querySelector('.screen.active');
    const nextScreen = document.getElementById(screenId);
    
    if (!nextScreen) return;
    
    // Update state
    appState.previousScreen = appState.currentScreen;
    appState.currentScreen = screenId;
    
    // Animate transition
    if (currentScreen) {
        currentScreen.classList.remove('active');
        currentScreen.classList.add('exiting');
        setTimeout(() => {
            currentScreen.classList.remove('exiting');
        }, 300);
    }
    
    nextScreen.classList.add('active');
    
    // Show/hide header based on screen
    const header = document.getElementById('appHeader');
    if (screenId === 'heroScreen') {
        header.classList.add('hidden');
    } else if (appState.authToken) {
        header.classList.remove('hidden');
    }
}

function goBack(screenId) {
    navigateToScreen(screenId);
}

// ============================================
// PHOTO UPLOAD
// ============================================
function triggerFileInput() {
    document.getElementById('photoInput').click();
}

function handlePhotoSelection(event) {
    const files = Array.from(event.target.files);
    
    if (appState.photos.length + files.length > 12) {
        showToast('Maximum 12 photos allowed', 'error');
        return;
    }
    
    if (appState.photos.length + files.length < 6 && files.length > 0) {
        // Allow selection but don't enable continue yet
    }
    
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                appState.photos.push({
                    file: file,
                    dataUrl: e.target.result
                });
                updatePhotoGrid();
                updatePhotoContinueButton();
            };
            reader.readAsDataURL(file);
        }
    });
}

function updatePhotoGrid() {
    const grid = document.getElementById('photoGrid');
    const count = document.getElementById('photoCount');
    
    count.textContent = appState.photos.length;
    
    grid.innerHTML = appState.photos.map((photo, index) => `
        <div class="photo-item">
            <img src="${photo.dataUrl}" alt="Photo ${index + 1}">
            <button class="photo-remove" onclick="removePhoto(${index})">×</button>
        </div>
    `).join('');
}

function removePhoto(index) {
    appState.photos.splice(index, 1);
    updatePhotoGrid();
    updatePhotoContinueButton();
}

function updatePhotoContinueButton() {
    const btn = document.getElementById('photoContinueBtn');
    btn.disabled = appState.photos.length < 6;
}

function goToVoice() {
    if (appState.photos.length < 6) {
        showToast('Please upload at least 6 photos', 'error');
        return;
    }
    navigateToScreen('voiceScreen');
}

// ============================================
// VOICE RECORDING
// ============================================
async function toggleRecording() {
    const btn = document.getElementById('recordBtn');
    const icon = btn.querySelector('.record-icon');
    const text = btn.querySelector('.record-text');
    
    if (!appState.mediaRecorder || appState.mediaRecorder.state === 'inactive') {
        // Start recording
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            appState.audioStream = stream;
            appState.mediaRecorder = new MediaRecorder(stream);
            
            const audioChunks = [];
            
            appState.mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            appState.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                appState.voiceBlob = audioBlob;
                showAudioPreview(audioBlob);
                stopAllStreams();
            };
            
            appState.mediaRecorder.start();
            appState.recordingStartTime = Date.now();
            
            btn.classList.add('recording');
            icon.textContent = '⏹';
            text.textContent = 'Stop Recording';
            
            // Start timer
            startRecordingTimer();
            
            // Auto-stop after 30 seconds
            setTimeout(() => {
                if (appState.mediaRecorder && appState.mediaRecorder.state === 'recording') {
                    stopRecording();
                }
            }, 30000);
            
        } catch (error) {
            console.error('Microphone access error:', error);
            showToast('Microphone access denied', 'error');
        }
    } else {
        // Stop recording
        stopRecording();
    }
}

function stopRecording() {
    if (appState.mediaRecorder && appState.mediaRecorder.state === 'recording') {
        appState.mediaRecorder.stop();
        const btn = document.getElementById('recordBtn');
        const icon = btn.querySelector('.record-icon');
        const text = btn.querySelector('.record-text');
        
        btn.classList.remove('recording');
        icon.textContent = '⏺';
        text.textContent = 'Start Recording';
    }
}

function startRecordingTimer() {
    const timerEl = document.getElementById('recordTimer');
    const interval = setInterval(() => {
        if (!appState.recordingStartTime || !appState.mediaRecorder || appState.mediaRecorder.state !== 'recording') {
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
    const preview = document.getElementById('audioPreview');
    const audio = document.getElementById('audioPlayback');
    
    audio.src = URL.createObjectURL(blob);
    preview.classList.remove('hidden');
    
    document.getElementById('recordingHint').style.display = 'none';
    document.getElementById('voiceContinueBtn').disabled = false;
}

function reRecord() {
    document.getElementById('audioPreview').classList.add('hidden');
    document.getElementById('recordingHint').style.display = 'block';
    document.getElementById('voiceContinueBtn').disabled = true;
    appState.voiceBlob = null;
    
    const audio = document.getElementById('audioPlayback');
    audio.src = '';
}

function stopAllStreams() {
    if (appState.audioStream) {
        appState.audioStream.getTracks().forEach(track => track.stop());
        appState.audioStream = null;
    }
}

function goToStory() {
    if (!appState.voiceBlob) {
        showToast('Please record your voice first', 'error');
        return;
    }
    navigateToScreen('storyScreen');
}

// ============================================
// GENERATE PREVIEW
// ============================================
async function generatePreview() {
    const briefDesc = document.getElementById('briefDesc').value.trim();
    
    if (!briefDesc) {
        showToast('Please enter a brief description', 'error');
        return;
    }
    
    if (appState.photos.length < 6) {
        showToast('Please upload at least 6 photos', 'error');
        return;
    }
    
    if (!appState.voiceBlob) {
        showToast('Please record your voice', 'error');
        return;
    }
    
    showLoading('Uploading photos...');
    
    try {
        // Step 1: Upload photos
        const photoUrls = await uploadPhotos();
        
        // Step 2: Upload voice and get voice ID
        showLoading('Cloning your voice...');
        const voiceId = await uploadVoice();
        appState.voiceId = voiceId;
        
        // Step 3: Generate preview
        showLoading('Creating your preview film...');
        const previewData = await generatePreviewRequest(photoUrls, voiceId, briefDesc);
        
        // Step 4: Show preview
        appState.previewVideoUrl = previewData.audioUrl; // Temporary until video is ready
        navigateToScreen('previewScreen');
        
        // Set preview video
        const video = document.getElementById('previewVideo');
        video.src = previewData.audioUrl; // Replace with actual video URL when available
        
        hideLoading();
        showToast('Preview ready!', 'success');
        
    } catch (error) {
        console.error('Preview generation error:', error);
        hideLoading();
        showToast(error.message || 'Failed to generate preview', 'error');
    }
}

async function uploadPhotos() {
    // For now, return placeholder URLs
    // In production, upload to your storage (Cloudflare R2, S3, etc.)
    return appState.photos.map((photo, i) => `photo_${i}_${Date.now()}`);
}

async function uploadVoice() {
    const formData = new FormData();
    formData.append('audio', appState.voiceBlob, 'voice.webm');
    formData.append('name', 'User Voice');
    
    const response = await fetch(`${API_BASE}/api/voice/clone`, {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) {
        throw new Error('Voice upload failed');
    }
    
    const data = await response.json();
    return data.voiceId;
}

async function generatePreviewRequest(photoUrls, voiceId, briefDesc) {
    const language = document.getElementById('languageSelect').value;
    const mood = document.getElementById('moodSelect').value;
    const genre = document.getElementById('genreSelect').value;
    const orientation = document.getElementById('orientationSelect').value;
    
    const response = await fetch(`${API_BASE}/api/render/preview`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt: briefDesc,
            photoUrls: photoUrls,
            voiceId: voiceId,
            photoCount: photoUrls.length,
            language: language,
            mood: mood,
            genre: genre,
            orientation: orientation
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Preview generation failed');
    }
    
    return await response.json();
}

// ============================================
// SIGNUP/AUTH
// ============================================
function showSignup() {
    const modal = document.getElementById('signupModal');
    modal.classList.add('active');
}

function closeSignup() {
    const modal = document.getElementById('signupModal');
    modal.classList.remove('active');
}

// Turnstile callbacks
window.onTurnstileSuccess = function(token) {
    console.log('✅ Turnstile verified');
    appState.turnstileToken = token;
    document.getElementById('signupBtn').disabled = false;
};

window.onTurnstileError = function() {
    console.error('❌ Turnstile failed');
    showToast('Security verification failed', 'error');
    appState.turnstileToken = null;
    document.getElementById('signupBtn').disabled = true;
};

// Signup form will be handled in auth.js

// ============================================
// AUTHENTICATED APP
// ============================================
async function initAuthenticatedApp() {
    try {
        // Verify token and get user data
        const response = await fetch(`${API_BASE}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${appState.authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            appState.userBalance = data.user.balance || 0;
            updateBalanceDisplay();
            
            const header = document.getElementById('appHeader');
            if (appState.currentScreen !== 'heroScreen') {
                header.classList.remove('hidden');
            }
            
            // Update menu with user info
            document.getElementById('menuEmail').textContent = data.user.email;
            document.getElementById('menuBalance').textContent = data.user.balance?.toFixed(2) || '0.00';
        } else {
            // Token invalid, logout
            logout();
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
}

function updateBalanceDisplay() {
    const balanceEls = document.querySelectorAll('#userBalance, #modalBalance, #menuBalance');
    balanceEls.forEach(el => {
        el.textContent = appState.userBalance.toFixed(2);
    });
}

// ============================================
// MENU
// ============================================
function showMenu() {
    const menu = document.getElementById('menuOverlay');
    menu.classList.add('active');
}

function closeMenu() {
    const menu = document.getElementById('menuOverlay');
    menu.classList.remove('active');
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    appState.authToken = null;
    appState.userId = null;
    appState.userBalance = 0;
    
    closeMenu();
    navigateToScreen('heroScreen');
    
    const header = document.getElementById('appHeader');
    header.classList.add('hidden');
    
    showToast('Logged out successfully', 'success');
}

// ============================================
// CREDITS/WALLET
// ============================================
function showAddCredits() {
    closeMenu();
    const modal = document.getElementById('creditsModal');
    modal.classList.add('active');
    document.getElementById('modalBalance').textContent = appState.userBalance.toFixed(2);
}

function closeCredits() {
    const modal = document.getElementById('creditsModal');
    modal.classList.remove('active');
}

function setAmount(amount) {
    document.getElementById('creditAmount').value = amount;
}

// Payment processing will be in wallet.js

// ============================================
// PAGES (Terms, Privacy, Contact)
// ============================================
function showPage(page) {
    if (page === 'contact') {
        window.location.href = 'mailto:admin@resonatale.com';
    } else if (page === 'terms') {
        window.open('terms.html', '_blank');
    } else if (page === 'privacy') {
        window.open('privacy.html', '_blank');
    }
}

// ============================================
// UI HELPERS
// ============================================
function showLoading(text = 'Processing...') {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    loadingText.textContent = text;
    overlay.classList.add('active');
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.remove('active');
}

function showToast(message, type = 'info') {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#EF4444' : type === 'success' ? '#10B981' : '#6366F1'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 12px;
        z-index: 9999;
        font-weight: 600;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// SOCIAL PROOF COUNTER
// ============================================
function animateFilmCounter() {
    const counter = document.getElementById('filmCounter');
    if (!counter) return;
    
    let count = 47329;
    setInterval(() => {
        count += Math.floor(Math.random() * 3) + 1;
        counter.textContent = count.toLocaleString();
    }, 5000);
}

// ============================================
// ERROR HANDLING
// ============================================
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showToast('Something went wrong. Please try again.', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showToast('Network error. Please check your connection.', 'error');
});
