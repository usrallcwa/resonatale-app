// auth.js - Authentication & Signup

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
                turnstileToken: state.turnstileToken
            })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || 'Signup failed');
        }
        
        // Store auth
        state.authToken = data.token;
        state.userId = data.userId;
        state.balance = data.balance || 0;
        
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.userId);
        
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

async function handleLogin(email, password) {
    showLoading('Logging in...');
    
    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        state.authToken = data.token;
        state.userId = data.userId;
        state.balance = data.balance || 0;
        
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.userId);
        
        updateBalance();
        document.getElementById('appHeader').classList.remove('hidden');
        document.getElementById('menuEmail').textContent = email;
        
        hideLoading();
        showToast('Logged in!', 'success');
        
    } catch (e) {
        hideLoading();
        showToast(e.message, 'error');
    }
}
