(function () {
'use strict';

var TURNSTILE_KEY = '0x4AAAAAACLI9vyJZYGLg9lS';
var API = '/api';

/* ─── GLOBAL STATE ─────────────────────── */
var S = {
  bal: 0,
  hasVoice: false,
  hasAvatar: false,
  loggedIn: false,
  pendingTopUpAmount: null,
  mood: 'calm',
  lang: 'en',
  fmt: 'audio',
  busy: false,
  previewId: null,
  videoId: null,
  videoPoll: null,
  rec: null,
  recChunks: [],
  recBlob: null,
  recStart: 0,
  recTimer: null,
  recHardStop: null,
  avatarFile: null,
  tsWidgets: {},
  tsTokens: {},
  tsVoice: false,
  tsAvatar: false,
  tsGenerate: false,
  toastTimer: null,
  journal: []
};

/* ─── AUDIO PLAYER ─────────────────────── */
var audio = new Audio();

/* ─── SAFE STOP HELPERS ─────────────────── */
function stopAudio() {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

function stopVideoPoll() {
  if (S.videoPoll) {
    clearInterval(S.videoPoll);
    S.videoPoll = null;
  }
}

/* ─── HELPERS ──────────────────────────── */
function $(id) { return document.getElementById(id); }
function $$(sel, root) { return (root || document).querySelectorAll(sel); }
function on(el, ev, fn) { if (el) el.addEventListener(ev, fn); }
function setText(el, t) { if (el) el.textContent = t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function pad2(n) { return n < 10 ? '0' + n : '' + n; }

/* ─── TURNSTILE SAFE RESET AFTER SUCCESS ─── */
function consumeTurnstile(containerId) {
  resetTurnstile(containerId);
}

/* ─── NAVIGATION (FIXED) ─────────────────── */
function navigate(target) {
  if (S.busy) return;

  stopAudio();
  stopVideoPoll();

  $$('.layer').forEach(function (l) {
    l.classList.remove('active');
  });

  var el = $('layer-' + target);
  if (el) {
    el.classList.add('active');
    var sc = el.querySelector('.lscroll,.home-scroll');
    if (sc) sc.scrollTop = 0;
  }

  $$('.tab').forEach(function (t) {
    t.classList.toggle('active', t.getAttribute('data-tab') === target);
  });

  if (target === 'journal') {
    renderJournal();
  }
}

/* ─── FEATURE UI FIX (DOT SELECTOR FIXED) ─── */
function updateFeatureUI(type, isEnabled) {
  var dotId = type === 'voice' ? 'sdot-voice' : 'sdot-avatar';
  var dot = $(dotId);
  if (dot) dot.classList.toggle('on', isEnabled);
}

/* ─── API CALL ───────────────────────────── */
function apiCall(path, opts) {
  opts = opts || {};
  var headers = opts.headers || {};
  var isForm = opts.body instanceof FormData;

  if (!isForm) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(API + path, {
    method: opts.method || 'GET',
    headers: headers,
    body: opts.body || null
  }).then(async function (r) {
    let data = null;
    try { data = await r.json(); } catch (e) {}
    if (!r.ok) throw data || { error: 'Request failed' };
    return data;
  });
}

/* ─── VIDEO POLL HARDENED ───────────────── */
function startVideoPoll(videoId) {
  stopVideoPoll();

  var start = Date.now();
  var MAX = 120000;

  S.videoPoll = setInterval(function () {
    if (Date.now() - start > MAX) {
      stopVideoPoll();
      return;
    }

    apiCall('/video/status?videoId=' + encodeURIComponent(videoId))
      .then(function (d) {
        if (d.status === 'completed') {
          stopVideoPoll();
          syncUser();
        }
        if (d.status === 'failed') {
          stopVideoPoll();
          syncUser();
        }
      })
      .catch(function () {});
  }, 5000);
}

/* ─── GENERATE SAFE ─────────────────────── */
function generateStory() {
  if (S.busy) return;

  var prompt = ($('gen-prompt') ? $('gen-prompt').value : '').trim();
  if (!prompt) return;

  var tk = getTurnstileToken('ts-generate');
  if (!tk) return;

  S.busy = true;

  apiCall('/generate', {
    method: 'POST',
    headers: { 'X-Turnstile-Token': tk },
    body: JSON.stringify({
      prompt: prompt,
      mood: S.mood,
      language: S.lang,
      format: S.fmt
    })
  })
  .then(function (d) {
    consumeTurnstile('ts-generate');
    S.previewId = d.storyId || null;
    navigate('preview');
  })
  .catch(function () {
    resetTurnstile('ts-generate');
  })
  .finally(function () {
    S.busy = false;
  });
}

/* ─── INIT ─────────────────────────────── */
function init() {
  S.busy = false;
  stopAudio();
  stopVideoPoll();

  S.journal = (function () {
    try {
      return JSON.parse(localStorage.getItem('rt_journal')) || [];
    } catch (e) {
      localStorage.removeItem('rt_journal');
      return [];
    }
  })();

  navigate('home');
}

document.addEventListener('DOMContentLoaded', init);

})();
