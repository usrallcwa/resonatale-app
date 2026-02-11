(function () {
'use strict';

var TURNSTILE_KEY = '0x4AAAAAACLI9vyJZYGLg9lS';
var API = '/api';   // ✅ fixed

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
/* ─── HELPERS ──────────────────────────── */
function $(id) { return document.getElementById(id); }
function $$(sel, root) { return (root || document).querySelectorAll(sel); }
function on(el, ev, fn) { if (el) el.addEventListener(ev, fn); }
function setText(el, t) { if (el) el.textContent = t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function delegate(root, ev, sel, fn) {
  if (!root) return;
  root.addEventListener(ev, function (e) {
    var t = e.target.closest(sel);
    if (t && root.contains(t)) fn.call(t, e);
  });
}
/* ─── MOOD UI ──────────────────────────── */
function initMoodChips() {
  var chips = $$('.mood-chip');
  chips.forEach(function (chip) {
    on(chip, 'click', function () {
      // update global state
      S.mood = chip.dataset.mood;
      // remove active from all
      chips.forEach(function (c) {
        c.classList.remove('active');
      });
      // activate clicked chip
      chip.classList.add('active');
    });
  });
}
/* ─── BUTTON LOADER ─────────────────────── */
function btnLoad(id, on) {
  var btn = $(id); if (!btn) return;
  var t = btn.querySelector('.bm-text');
  var l = btn.querySelector('.bm-spin');
  if (on) {
    if (t) t.hidden = true;
    if (l) l.hidden = false;
    btn.disabled = true;
  } else {
    if (t) t.hidden = false;
    if (l) l.hidden = true;
    btn.disabled = false;
  }
}
/* ─── GENERIC FORM SUBMIT WRAPPER ──────── */
function submitFormWithTurnstile(config) {
  // config: { data, tsId, errId, btnId, endpoint, onSuccess, defaultErr }
  if (S.busy || !config.data) return;
  var tk = getTurnstileToken(config.tsId);
  if (!tk) {
    showErr(config.errId, 'Complete the verification');
    return;
  }
  S.busy = true;
  hideErr(config.errId);
  btnLoad(config.btnId, true);
  apiCall(config.endpoint, {
    method: 'POST',
    headers: { 'X-Turnstile-Token': tk },
    body: config.data
  })
    .then(config.onSuccess)
    .catch(function (e) {
      showErr(config.errId, e.error || config.defaultErr);
      resetTurnstile(config.tsId);
    })
    .finally(function () {
      S.busy = false;
      btnLoad(config.btnId, false);
    });
}
/* ─── UI FEATURE TOGGLE ─────────────────── */
function updateFeatureUI(type, isEnabled) {
  var configs = {
    voice: {
      item: 'si-voice',
      sub: 'si-voice-sub',
      dot: 'sdot-voice',
      dotText: 'sdot-voice-t',
      enabledText: 'Voice cloned ✓',
      disabledText: 'Not set',
      dotEnabledText: 'Voice ready',
      dotDisabledText: 'Voice missing'
    },
    avatar: {
      item: 'si-avatar',
      sub: 'si-avatar-sub',
      dot: 'sdot-avatar',
      dotText: 'sdot-avatar-t',
      enabledText: 'Avatar uploaded ✓',
      disabledText: 'Not set',
      dotEnabledText: 'Avatar ready',
      dotDisabledText: 'Avatar missing'
    }
  };
  var cfg = configs[type];
  if (!cfg) {
    console.warn('updateFeatureUI: Unknown feature type "' + type + '"');
    return;
  }
  var item = $(cfg.item);
  if (item) item.classList.toggle('done', isEnabled);
  setText($(cfg.sub), isEnabled ? cfg.enabledText : cfg.disabledText);
  setText($(cfg.dotText), isEnabled ? cfg.dotEnabledText : cfg.dotDisabledText);
  $$('.' + cfg.dot).forEach(function (d) {
    d.classList.toggle('on', isEnabled);
  });
}
/* ─── CHIP SELECTION HANDLER ───────────── */
function handleChipSelection(container, selector, callback) {
  if (!container) {
    console.warn('handleChipSelection: Container element not found');
    return;
  }
  delegate(container, 'click', selector, function () {
    $$(selector).forEach(function (c) {
      c.classList.remove('active');
    });
    this.classList.add('active');
    callback.call(this);
  });
}
/* ─── ELEMENT VISIBILITY TOGGLE ─────────── */
function toggleVisibility(elements, visible) {
  if (!Array.isArray(elements)) {
    console.warn('toggleVisibility: elements parameter must be an array');
    return;
  }
  elements.forEach(function (el) {
    if (el) el.hidden = !visible;
  });
}
/* ─── ERRORS ────────────────────────────── */
function showErr(id, msg) {
  var el = $(id); if (!el) return;
  el.textContent = msg;
  el.hidden = false;
}
function hideErr(id) {
  var el = $(id); if (el) el.hidden = true;
}
/* ─── TOAST ─────────────────────────────── */
function toast(msg) {
  var t = $('toast');
  var m = $('toast-msg');
  if (!t || !m) return;
  m.textContent = msg;
  t.hidden = false;
  clearTimeout(S.toastTimer);
  S.toastTimer = setTimeout(function () {
    t.hidden = true;
  }, 3000);
}
/* ─── OVERLAY ───────────────────────────── */
function showOverlay(title, sub) {
  setText($('ov-title'), title);
  setText($('ov-sub'), sub || '');
  $('overlay').hidden = false;
}
function hideOverlay() {
  $('overlay').hidden = true;
}
/* ─── TIME FORMAT ───────────────────────── */
function fmtTime(s) {
  if (!s || isNaN(s)) return '0:00';
  var m = Math.floor(s / 60);
  var sc = Math.floor(s % 60);
  return m + ':' + pad2(sc);
}
// ─── Turnstile ───
function renderTurnstile(containerId) {
  var el = $(containerId);
  if (!el || typeof turnstile === 'undefined') return;
  // clear old widget
  if (S.tsWidgets[containerId] != null) {
    try { turnstile.remove(S.tsWidgets[containerId]); } catch (e) {}
  }
  el.innerHTML = '';
  S.tsTokens = S.tsTokens || {};
  S.tsTokens[containerId] = null;
  S.tsWidgets[containerId] = turnstile.render(el, {
    sitekey: TURNSTILE_KEY,
    theme: 'dark',
    callback: function (token) {
      // user explicitly solved challenge
      S.tsTokens[containerId] = token;
    }
  });
}
function getTurnstileToken(containerId) {
  if (!S.tsTokens || !S.tsTokens[containerId]) return null;
  return S.tsTokens[containerId];
}
function resetTurnstile(containerId) {
  if (typeof turnstile !== 'undefined' && S.tsWidgets[containerId] != null) {
    try { turnstile.reset(S.tsWidgets[containerId]); } catch (e) {}
  }
  if (S.tsTokens) {
    S.tsTokens[containerId] = null;
  }
}
// ─── API ───
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
    // intentionally NO credentials
  }).then(async function (r) {
    let data = null;
    try {
      data = await r.json();
    } catch (e) {
      data = null;
    }
    if (!r.ok) {
      throw Object.assign(
        { status: r.status },
        data || { error: 'Request failed' }
      );
    }
    return data;
  });
}
// ─── User sync ───
function syncUser() {
  apiCall('/balance')
    .then(function (d) {
      S.bal = typeof d.balance === 'number' ? d.balance : 0;
      S.hasVoice = !!d.hasVoice;
      S.hasAvatar = !!d.hasAvatar;
      S.syncError = false;
      updateUI();
    })
    .catch(function () {
      S.syncError = true;
      updateUI();
    });
}
function updateUI() {
  // Balance (credits, not dollars)
  var f = S.bal.toFixed(0) + ' credits';
  setText($('bal-hdr'), f);
  setText($('bal-main'), f);
  // Badge
  var badge = $('scard-badge');
  if (badge) {
    if (S.bal <= 0) {
      setText(badge, '0');
      badge.style.color = '#FF5252';
    } else if (S.bal < 10) {
      setText(badge, 'Low');
      badge.style.color = '#FFD54F';
    } else {
      setText(badge, 'OK');
      badge.style.color = '#00BFA5';
    }
  }
  // Voice & Avatar UI (using helper)
  updateFeatureUI('voice', S.hasVoice);
  updateFeatureUI('avatar', S.hasAvatar);
  // Optional: surface sync issue (non-blocking)
  if (S.syncError) {
    console.warn('User sync failed');
  }
}
// ─── Navigation ───
function navigate(target) {
  if (S.busy) return;
  if (target === 'topup') {
    openTopUp();
    return;
  }
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
  // Render Turnstile once per section
  if (target === 'record' && !S.tsVoice) {
    renderTurnstile('ts-voice');
    S.tsVoice = true;
  }
  if (target === 'avatar' && !S.tsAvatar) {
    renderTurnstile('ts-avatar');
    S.tsAvatar = true;
  }
  if (target === 'generate' && !S.tsGenerate) {
    renderTurnstile('ts-generate');
    S.tsGenerate = true;
  }
  if (target === 'journal') {
    renderJournal();
  }
}
// ─── Top Up ───
function openTopUp() {
  $('modal-topup').hidden = false;
  $('tu-slider').value = 10;
  $('tu-amount').value = '';
  hideErr('err-topup');
  updateTuLabel(10);
}
function closeModal() {
  $$('.modal').forEach(function (m) {
    m.hidden = true;
  });
}
function updateTuLabel(v) {
  v = clamp(Math.round(v || 10), 10, 500);
  setText($('tu-btn-text'), 'Continue — $' + v);
}
function processTopUp() {
  var amt = Math.round(parseInt($('tu-slider').value) || 10);
  if (amt < 10 || amt > 500) {
    showErr('err-topup', 'Enter $10 – $500');
    return;
  }
  hideErr('err-topup');
  btnLoad('btn-topup', true);
  apiCall('/topup', {
    method: 'POST',
    body: JSON.stringify({ amount: amt })
  })
    .then(function (d) {
      if (!d.url) {
        throw { error: 'Unable to start checkout' };
      }
      window.location.href = d.url;
    })
    .catch(function (e) {
      showErr('err-topup', e.error || 'Payment failed');
      btnLoad('btn-topup', false);
    });
}
// ─── Voice Recording ───
function toggleRecord() {
  // Stop if already recording
  if (S.rec && S.rec.state === 'recording') {
    S.rec.stop();
    return;
  }
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function (stream) {
      S.recChunks = [];
      S.rec = new MediaRecorder(stream);
      S.rec.ondataavailable = function (e) {
        if (e.data && e.data.size > 0) {
          S.recChunks.push(e.data);
        }
      };
      S.rec.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        S.recBlob = new Blob(S.recChunks, { type: 'audio/webm' });
        var ra = $('rec-audio');
        if (ra) ra.src = URL.createObjectURL(S.recBlob);
        var rp = $('rec-playback');
        if (rp) rp.hidden = false;
        setText($('rec-btn-text'), 'Re-record');
        var rr = $('rec-ring');
        if (rr) rr.classList.remove('on');
        clearInterval(S.recTimer);
        clearTimeout(S.recHardStop);
      };
      // START RECORDING
      S.rec.start();
      S.recStart = Date.now();
      var rr = $('rec-ring');
      if (rr) rr.classList.add('on');
      setText($('rec-btn-text'), 'Stop Recording');
      var rp = $('rec-playback');
      if (rp) rp.hidden = true;
      hideErr('err-voice');
      // TIMER UI
      S.recTimer = setInterval(function () {
        var s = Math.floor((Date.now() - S.recStart) / 1000);
        setText($('rec-timer'), Math.floor(s / 60) + ':' + pad2(s % 60));
      }, 250);
      // 🔒 HARD STOP AT 30 SECONDS
      S.recHardStop = setTimeout(function () {
        if (S.rec && S.rec.state === 'recording') {
          S.rec.stop();
          toast('Recording limited to 30 seconds');
        }
      }, 30 * 1000);
    })
    .catch(function () {
      showErr('err-voice', 'Microphone access denied');
    });
}
function submitVoice() {
  if (S.busy || !S.recBlob) return;
  // 🔒 basic validation
  if (!S.recBlob.type.startsWith('audio/')) {
    showErr('err-voice', 'Invalid audio format');
    return;
  }
  if (S.recBlob.size > 5 * 1024 * 1024) {
    showErr('err-voice', 'Recording too long. Max ~30 seconds.');
    return;
  }
  var fd = new FormData();
  fd.append('audio', S.recBlob, 'voice.webm');
  submitFormWithTurnstile({
    data: fd,
    tsId: 'ts-voice',
    errId: 'err-voice',
    btnId: 'btn-submit-voice',
    endpoint: '/voice/clone',
    defaultErr: 'Clone failed',
    onSuccess: function () {
      S.hasVoice = true;
      S.recBlob = null; // 🔒 prevent re-submit
      updateUI();
      navigate('home');
      toast('Voice cloned!');
    }
  });
}
// ─── Avatar ───
function onAvatarFile(e) {
  var file = e.target.files && e.target.files[0];
  if (!file) return;
  S.avatarFile = file;
  var reader = new FileReader();
  reader.onload = function (ev) {
    var img = $('av-preview-img');
    if (img) img.src = ev.target.result;
    var box = $('av-preview-box');
    if (box) box.hidden = false;
    var ph = $('av-placeholder');
    if (ph) ph.hidden = true;
  };
  reader.readAsDataURL(file);
  var btn = $('btn-submit-avatar');
  if (btn) btn.disabled = false;
}
function submitAvatar() {
  if (S.busy || !S.avatarFile) return;
  var fd = new FormData();
  fd.append('avatar', S.avatarFile);
  submitFormWithTurnstile({
    data: fd,
    tsId: 'ts-avatar',
    errId: 'err-avatar',
    btnId: 'btn-submit-avatar',
    endpoint: '/avatar/create',
    defaultErr: 'Upload failed',
    onSuccess: function () {
      S.hasAvatar = true;
      updateUI();
      navigate('home');
      toast('Avatar uploaded!');
    }
  });
}
// ─── Generate ───
function generateStory() {
  if (S.busy) return;
  var prompt = ($('gen-prompt') ? $('gen-prompt').value : '').trim();
  if (!prompt) {
    showErr('err-generate', 'Enter a story prompt');
    return;
  }
  if (S.fmt === 'audio' && !S.hasVoice) {
    showErr('err-generate', 'Record your voice first');
    return;
  }
  if (S.fmt === 'video' && !S.hasAvatar) {
    showErr('err-generate', 'Upload an avatar first');
    return;
  }
  var tk = getTurnstileToken('ts-generate');
  if (!tk) {
    showErr('err-generate', 'Complete the verification');
    return;
  }
  hideErr('err-generate');
  S.busy = true;
  showOverlay('Generating preview…', 'Building your story');
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
      hideOverlay();
      S.previewId = d.storyId || null;
      setText($('pv-prompt-echo'), prompt);
      var pvAud = $('pv-audio');
      if (pvAud && d.previewUrl) {
        pvAud.src = d.previewUrl;
      }
      navigate('preview');
    })
    .catch(function (e) {
      hideOverlay();
      showErr('err-generate', e.error || 'Generation failed');
      resetTurnstile('ts-generate');
    })
    .finally(function () {
      S.busy = false;
    });
}
// ─── Unlock ───
function unlockStory(type) {
  if (S.busy || !S.previewId) return;
  // UX guard only (backend still enforces)
  if (S.bal <= 0) {
    openTopUp();
    toast('Add balance first');
    return;
  }
  var tk = getTurnstileToken('ts-generate');
  if (!tk) {
    showErr('err-preview', 'Complete the verification');
    return;
  }
  S.busy = true;
  hideErr('err-preview');
  showOverlay(
    type === 'video' ? 'Creating video…' : 'Creating audio…',
    'This may take a moment'
  );
 apiCall('/generate', {
  method: 'POST',
  headers: { 'X-Turnstile-Token': tk },
  body: JSON.stringify({
    storyId: S.previewId,
    unlockType: type,
    mode: 'unlock'
  })
})
    .then(function (d) {
      hideOverlay();
      // backend is source of truth
      syncUser();
      var entry = {
        id: d.storyId || S.previewId,
        type: type,
        prompt: $('pv-prompt-echo')
          ? $('pv-prompt-echo').textContent
          : '',
        date: new Date().toISOString(),
        audioUrl: d.audioUrl || null,
        videoId: d.videoId || null,
        videoUrl: d.videoUrl || null
      };
      // write journal only after success
      S.journal.unshift(entry);
      localStorage.setItem(
        'rt_journal',
        JSON.stringify(S.journal.slice(0, 50))
      );
      if (d.audioUrl) {
        playFull(entry);
      }
      if (d.videoId) {
        S.videoId = d.videoId;
        showVideoStatus('processing');
        startVideoPoll(d.videoId);
      }
      var tp = $('tab-player');
      if (tp) tp.style.display = '';
      navigate('player');
      toast('Story unlocked!');
    })
    .catch(function (e) {
      hideOverlay();
      showErr('err-preview', e.error || 'Unlock failed');
      syncUser();
    })
    .finally(function () {
      S.busy = false;
    });
}
// ─── Player ───
// attach audio listeners ONCE
audio.addEventListener('play', onPlay);
audio.addEventListener('pause', onPause);
audio.addEventListener('ended', onEnded);
audio.addEventListener('timeupdate', onTimeUpdate);
audio.addEventListener('loadedmetadata', onMeta);
function playFull(entry) {
  // reset audio state
  audio.pause();
  audio.currentTime = 0;
  setText(
    $('pl-title'),
    entry.type === 'video' ? 'Video Story' : 'Audio Story'
  );
  setText($('pl-sub'), (entry.prompt || '').slice(0, 80));
  // reset UI
  onPause();
  setText($('pl-cur'), '0:00');
  setText($('pl-dur'), '0:00');
  // video handling
  var vw = $('vid-player-wrap');
  var vc = $('vid-status');
  toggleVisibility([vc, vw], entry.type === 'video');
  // audio playback
  if (entry.audioUrl) {
    audio.src = entry.audioUrl;
    audio.play().catch(function () {});
  }
}
function togglePlay() {
  if (!audio.src) return;
  audio.paused ? audio.play().catch(function () {}) : audio.pause();
}
function seekRel(sec) {
  if (!audio.duration) return;
  audio.currentTime = clamp(
    audio.currentTime + sec,
    0,
    audio.duration
  );
}
function setPlayState(isPlaying) {
  var ip = $('pl-ic-play');
  var ipa = $('pl-ic-pause');
  var pc = $('pl-circle');
  if (ip) ip.hidden = isPlaying;
  if (ipa) ipa.hidden = !isPlaying;
  if (pc) pc.classList.toggle('on', isPlaying);
}
function onPlay() {
  setPlayState(true);
}
function onPause() {
  setPlayState(false);
}
function onEnded() {
  onPause();
  var sk = $('pl-seek'); if (sk) sk.value = 0;
}
function onTimeUpdate() {
  if (!audio.duration) return;
  var sk = $('pl-seek');
  if (sk) sk.value = (audio.currentTime / audio.duration) * 100;
  setText($('pl-cur'), fmtTime(audio.currentTime));
}
function onMeta() {
  setText($('pl-dur'), fmtTime(audio.duration));
}
// ─── Video Polling ───
function showVideoStatus(status, refunded) {
  var card = $('vid-status');
  var title = $('vid-status-title');
  var desc = $('vid-status-desc');
  var icon = $('vid-status-icon');
  var wrap = $('vid-player-wrap');
  if (status === 'processing') {
    toggleVisibility([card], true);
    toggleVisibility([wrap], false);
    setText(title, 'Processing…');
    setText(desc, 'Video is being generated');
    if (icon) icon.innerHTML = '<div class="spin-sm"></div>';
  }
  if (status === 'completed') {
    toggleVisibility([card], false);
    toggleVisibility([wrap], true);
  }
  if (status === 'failed') {
    toggleVisibility([card], true);
    toggleVisibility([wrap], false);
    setText(title, 'Failed');
    setText(
      desc,
      refunded ? 'Balance refunded' : 'Video generation failed'
    );
    if (icon) {
      icon.innerHTML =
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5252" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    }
  }
}
function startVideoPoll(videoId) {
  stopVideoPoll();
  var start = Date.now();
  var MAX_POLL_MS = 2 * 60 * 1000; // 2 minutes
  S.videoPoll = setInterval(function () {
    // hard stop
    if (Date.now() - start > MAX_POLL_MS) {
      stopVideoPoll();
      showVideoStatus('failed', false);
      toast('Video timed out');
      return;
    }
    apiCall('/video/status?videoId=' + encodeURIComponent(videoId))
      .then(function (d) {
        if (d.status === 'completed' && d.videoUrl) {
          stopVideoPoll();
          showVideoStatus('completed');
          var vel = $('vid-el');
          if (vel) vel.src = d.videoUrl;
          toast('Video ready!');
          syncUser();
        }
        if (d.status === 'failed') {
          stopVideoPoll();
          showVideoStatus('failed', !!d.refunded);
          syncUser();
        }
      })
      .catch(function () {});
  }, 5000);
}
function stopVideoPoll() {
  if (S.videoPoll) {
    clearInterval(S.videoPoll);
    S.videoPoll = null;
  }
}
// ─── Journal ───
function renderJournal() {
  var targets = [$('journal-home'), $('journal-full')];
  targets.forEach(function (container) {
    if (!container) return;
    var list = S.journal.slice(0, 50);
    if (!list.length) {
      container.innerHTML =
        '<div class="journal-empty">No stories yet</div>';
      return;
    }
    container.innerHTML = list.map(function (entry) {
      var isVideo = entry.type === 'video';
      var d = entry.date ? new Date(entry.date) : null;
      var dateStr = d ? d.toLocaleDateString() : '';
      return (
        '<button class="ji" type="button" data-ji="' +
        escHtml(entry.id || '') +
        '">' +
        '<div class="ji-icon ' +
        (isVideo ? 'ji-video' : 'ji-audio') +
        '">' +
        (isVideo ? '🎬' : '🎧') +
        '</div>' +
        '<div class="ji-body">' +
        '<span class="ji-title">' +
        escHtml((entry.prompt || 'Story').slice(0, 60)) +
        '</span>' +
        '<span class="ji-date">' +
        escHtml(dateStr) +
        ' · ' +
        (isVideo ? 'Video' : 'Audio') +
        '</span>' +
        '</div>' +
        '</button>'
      );
    }).join('');
  });
}
// attach delegation ONCE
delegate(document, 'click', '.ji', function () {
  var id = this.getAttribute('data-ji');
  var entry = S.journal.find(function (j) {
    return j.id === id;
  });
  if (!entry) return;
  if (!entry.audioUrl && !entry.videoUrl) {
    toast('This story is no longer available');
    return;
  }
  playFull(entry);
  var tp = $('tab-player');
  if (tp) tp.style.display = '';
  navigate('player');
});
function escHtml(s) {
  var d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
// ─── Init ───
function init() {
  // 🔓 HARD RESET UI STATE ON LOAD
  S.busy = false;
  hideOverlay();
  // Load journal
  S.journal = (function () {
    try {
      return JSON.parse(localStorage.getItem('rt_journal')) || [];
    } catch (e) {
      return [];
    }
  })();
  // Restore language
  S.lang = localStorage.getItem('rt_lang') || 'en';
  // Reset Turnstile flags
  S.tsVoice = false;
  S.tsAvatar = false;
  S.tsGenerate = false;
  /* ─── BASIC UI BINDINGS ─── */
  on($('pl-seek'), 'input', function (e) {
    if (audio.duration) {
      audio.currentTime = (e.target.value / 100) * audio.duration;
    }
  });
  on($('gen-prompt'), 'input', function () {
    setText($('gen-count'), this.value.length);
  });
  var tuAmt = $('tu-amount');
  var tuSlider = $('tu-slider');
  on(tuAmt, 'input', function () {
    var v = clamp(parseInt(tuAmt.value) || 10, 10, 500);
    tuSlider.value = v;
    updateTuLabel(v);
  });
  on(tuSlider, 'input', function () {
    tuAmt.value = tuSlider.value;
    updateTuLabel(parseInt(tuSlider.value));
  });
  /* ─── FILE INPUTS ─── */
  on($('av-input'), 'change', onAvatarFile);
  on($('av-drop'), 'click', function () {
    var fi = $('av-input');
    if (fi) fi.click();
  });
  /* ─── NAVIGATION ─── */
  delegate(document, 'click', '[data-goto]', function () {
    navigate(this.getAttribute('data-goto'));
  });
  delegate(document, 'click', '[data-tab]', function () {
    navigate(this.getAttribute('data-tab'));
  });
  /* ─── MOOD ─── */
  handleChipSelection($('mood-row'), '.mood-chip', function () {
    S.mood = this.getAttribute('data-mood');
    document.body.setAttribute('data-mood', S.mood);
  });
  // Ensure initial mood UI matches state
  $$('.mood-chip').forEach(function (c) {
    c.classList.toggle('active', c.dataset.mood === S.mood);
  });
  document.body.setAttribute('data-mood', S.mood);
  /* ─── LANGUAGE ─── */
  handleChipSelection($('lang-row'), '.lang-chip', function () {
    S.lang = this.getAttribute('data-lang');
    localStorage.setItem('rt_lang', S.lang);
  });
  $$('.lang-chip').forEach(function (c) {
    c.classList.toggle('active', c.getAttribute('data-lang') === S.lang);
  });
  /* ─── FORMAT ─── */
  handleChipSelection($('fmt-list'), '.fmt-item', function () {
    S.fmt = this.getAttribute('data-fmt');
  });
  // Ensure initial format UI matches state
  $$('.fmt-item').forEach(function (c) {
    c.classList.toggle('active', c.dataset.fmt === S.fmt);
  });
  /* ─── ACTION BUTTONS ─── */
  on($('bal-btn'), 'click', openTopUp);
  on($('scard'), 'click', openTopUp);
  on($('btn-rec'), 'click', toggleRecord);
  on($('btn-submit-voice'), 'click', submitVoice);
  on($('btn-submit-avatar'), 'click', submitAvatar);
  on($('btn-generate'), 'click', guardedGenerateStory);
  on($('unlock-audio'), 'click', function () {
    unlockStory('audio');
  });
  on($('unlock-video'), 'click', function () {
    unlockStory('video');
  });
  on($('btn-topup'), 'click', processTopUp);
  on($('pl-playbtn'), 'click', togglePlay);
  on($('pl-rew'), 'click', function () { seekRel(-15); });
  on($('pl-ffw'), 'click', function () { seekRel(15); });
  delegate(document, 'click', '.modal-bg', closeModal);
  /* ─── INITIAL DATA + VIEW ─── */
  syncUser();
  renderJournal();
  // ✅ THIS WAS THE PRIMARY BUG
  navigate('home');
}
document.addEventListener('DOMContentLoaded', init);
/* ─── GENERATION GUARDRAILS ───────────────── */
function canGenerateFull() {
  return Number(S.bal) > 0;
}
function hasSeenPreview() {
  return localStorage.getItem('hasSeenPreview') === 'true';
}
function markPreviewSeen() {
  localStorage.setItem('hasSeenPreview', 'true');
}
/* ─── GUARDED GENERATE FLOW ───────────────── */
function guardedGenerateStory() {
  if (canGenerateFull()) {
    return generateStory();
  }
  if (!hasSeenPreview()) {
    markPreviewSeen();
    return generateStory();
  }
  openTopUp();
}
})();
