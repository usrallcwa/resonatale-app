// auth.js - Authentication & Signup

function showLogin() {
    document.getElementById('loginModal').classList.add('active');
}

function closeLogin() {
    document.getElementById('loginModal').classList.remove('active');
}

function switchToSignup() {
    closeLogin();
    showSignup();
}

function switchToLogin() {
    closeSignup();
    showLogin();
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    await handleLogin(email, password);
    closeLogin();
}

async function handleLogin(email, password) {
    showLoading('Logging in...');
    
    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (!res.ok || !data.success) {
            throw new Error(data.error || 'Login failed');
        }
        
        // Store auth with correct response structure
        state.authToken = data.accessToken;
        state.userId = data.user.id;
        state.balance = data.user.balance || 0;
        
        localStorage.setItem('authToken', data.accessToken);
        localStorage.setItem('userId', data.user.id);
        
        updateBalance();
        document.getElementById('appHeader').classList.remove('hidden');
        document.getElementById('menuEmail').textContent = email;
        
        hideLoading();
        showToast('Logged in!', 'success');
        
        // Go to upload screen
        navigateTo('uploadScreen');
        
    } catch (e) {
        hideLoading();
        showToast(e.message, 'error');
    }
}

async function handleSignup(event) {
    event.preventDefault();
    
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const name = document.getElementById('signupName').value.trim();
    const consent = document.getElementById('consentCheck').checked;
    
    if (!consent) {
        showToast('Please accept terms', 'error');
        return;
    }
    
    if (!state.turnstileToken) {
        showToast('Please complete verification', 'error');
        return;
    }
    
    showLoading('Creating account...');
    
    try {
        const res = await fetch(`${API_BASE}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                name,
                consentAccepted: true,
                turnstileToken: state.turnstileToken
            })
        });
        
        const data = await res.json();
        
        if (!res.ok || !data.success) {
            throw new Error(data.error || 'Signup failed');
        }
        
        // Store auth with correct response structure
        state.authToken = data.accessToken;
        state.userId = data.user.id;
        state.balance = data.user.balance || 0;
        
        localStorage.setItem('authToken', data.accessToken);
        localStorage.setItem('userId', data.user.id);
        
        // Update UI
        updateBalance();
        document.getElementById('appHeader').classList.remove('hidden');
        document.getElementById('menuEmail').textContent = email;
        
        closeSignup();
        hideLoading();
        showToast('Account created!', 'success');
        
        // Start full render
        startFullRender();
        
    } catch (e) {
        hideLoading();
        showToast(e.message, 'error');
    }
}
