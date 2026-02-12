'use strict';

/* ================================
   CONFIG
================================ */

const API = '/api';

/* ================================
   STATE
================================ */

const S = {
  screen: 'home',
  credits: 0,
  mood: '',
  language: 'en',
  prompt: '',
  preview: null,
  loading: false
};

/* ================================
   INIT
================================ */

document.addEventListener('DOMContentLoaded', () => {
  render();
  fetchBalance();
});

/* ================================
   API HELPER
================================ */

function api(endpoint, method='GET', body=null) {
  return fetch(API + endpoint, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body ? JSON.stringify(body) : null
  }).then(async r => {
    if (!r.ok) {
      const e = await r.json().catch(()=>({}));
      throw new Error(e.error || 'Request failed');
    }
    return r.json();
  });
}

/* ================================
   BALANCE
================================ */

function fetchBalance() {
  api('/balance')
    .then(d => {
      S.credits = d.credits || 0;
      render();
    })
    .catch(() => {
      S.credits = 0;
      render();
    });
}

/* ================================
   GENERATE
================================ */

function generatePreview() {
  if (!S.mood) return alert('Select mood.');
  if (!S.prompt.trim()) return alert('Enter prompt.');

  S.loading = true;
  render();

  api('/generate', 'POST', {
    mode:'preview',
    emotion:S.mood,
    language:S.language,
    prompt:S.prompt,
    duration:90
  })
  .then(data => {
    S.preview = data;
    S.screen = 'preview';
    S.loading = false;
    render();
  })
  .catch(err => {
    S.loading = false;
    alert(err.message);
    render();
  });
}

/* ================================
   UNLOCK
================================ */

function unlockStory() {
  if (S.credits < 20) {
    alert('Not enough credits.');
    return;
  }

  S.loading = true;
  render();

  api('/unlock','POST',{ storyId:S.preview.id })
  .then(data => {
    S.credits -= 20;
    S.preview = data;
    S.screen = 'player';
    S.loading = false;
    render();
  })
  .catch(err => {
    S.loading = false;
    alert(err.message);
    render();
  });
}

/* ================================
   RENDER
================================ */

function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  app.appendChild(renderNav());

  if (S.loading) {
    app.appendChild(createDiv('loading','Generating...'));
    return;
  }

  if (S.screen === 'home') app.appendChild(renderHome());
  if (S.screen === 'create') app.appendChild(renderCreate());
  if (S.screen === 'preview') app.appendChild(renderPreview());
  if (S.screen === 'player') app.appendChild(renderPlayer());
}

/* ================================
   NAV
================================ */

function renderNav() {
  const nav = createDiv('nav');
  nav.innerHTML = `
    <div class="logo">RESONATALE</div>
    <div class="credit-badge">${S.credits} Credits</div>
  `;
  return nav;
}

/* ================================
   HOME
================================ */

function renderHome() {
  const screen = createDiv('screen');
  screen.innerHTML = `
    <h1 style="margin-bottom:20px;">Your Voice. Your Story.</h1>
    <button class="btn-primary" onclick="goCreate()">Create Story</button>
  `;
  return screen;
}

function goCreate() {
  S.screen = 'create';
  render();
}

/* ================================
   CREATE
================================ */

function renderCreate() {
  const screen = createDiv('screen');

  screen.innerHTML = `
    <div class="section">
      <div class="label">Mood</div>
      <select onchange="S.mood=this.value">
        <option value="">Select Mood</option>
        <option value="calm">Calm</option>
        <option value="adventure">Adventure</option>
        <option value="romantic">Romantic</option>
      </select>
    </div>

    <div class="section">
      <div class="label">Prompt</div>
      <textarea oninput="S.prompt=this.value"></textarea>
    </div>

    <button class="btn-primary" onclick="generatePreview()">Generate Preview</button>
  `;

  return screen;
}

/* ================================
   PREVIEW
================================ */

function renderPreview() {
  const screen = createDiv('screen');
  screen.innerHTML = `
    <div class="card">
      <h3>Preview</h3>
      <p>${S.preview.text || ''}</p>
      <button class="btn-primary" onclick="unlockStory()">Unlock (20 credits)</button>
    </div>
  `;
  return screen;
}

/* ================================
   PLAYER
================================ */

function renderPlayer() {
  const screen = createDiv('screen');
  screen.innerHTML = `
    <div class="card">
      <h3>Full Story</h3>
      <p>${S.preview.text || ''}</p>
      ${S.preview.audioUrl ? `<audio class="audio-player" controls src="${S.preview.audioUrl}"></audio>`:''}
    </div>
  `;
  return screen;
}

/* ================================
   UTIL
================================ */

function createDiv(className,text='') {
  const d = document.createElement('div');
  if (className) d.className = className;
  if (text) d.textContent = text;
  return d;
}
