(function () {
'use strict';

var TURNSTILE_KEY = '0x4AAAAAACLI9vyJZYGLg9lS';
var API = '/api';

(function () {
"use strict";

const API_BASE = "https://api.resonatale.com";

const S = {
  bal: 0,
  hasVoice: false,
  hasAvatar: false,
  busy: false,
  previewId: null
};

const audio = new Audio();

/* ---------- HELPERS ---------- */

function $(id) { return document.getElementById(id); }
function $$(sel) { return document.querySelectorAll(sel); }

function navigate(target) {
  $$(".layer").forEach(l => l.classList.remove("active"));
  const el = $("layer-" + target);
  if (el) el.classList.add("active");
}

async function api(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : null
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "API Error");
  }

  return data;
}

/* ---------- UI ---------- */

function updateUI() {
  const balTxt = S.bal + " credits";
  if ($("bal-hdr")) $("bal-hdr").textContent = balTxt;
  if ($("bal-main")) $("bal-main").textContent = balTxt;

  const v = $("sdot-voice");
  const a = $("sdot-avatar");

  if (v) v.classList.toggle("active", S.hasVoice);
  if (a) a.classList.toggle("active", S.hasAvatar);
}

/* ---------- USER ---------- */

async function syncUser() {
  try {
    const d = await api("/balance");
    S.bal = Number(d.balance) || 0;
    S.hasVoice = !!d.hasVoice;
    S.hasAvatar = !!d.hasAvatar;
    updateUI();
  } catch (e) {
    console.error("Balance sync failed");
  }
}

/* ---------- GENERATE ---------- */

async function generateStory() {
  if (S.busy) return;

  if (!$("age-confirm").checked) {
    alert("You must confirm you are 18+");
    return;
  }

  const prompt = $("gen-prompt").value.trim();
  if (!prompt) return;

  S.busy = true;

  try {
    const d = await api("/generate", {
      method: "POST",
      body: {
        prompt,
        mood: "calm",
        language: "en",
        format: "audio"
      }
    });

    if (d.previewUrl) {
      $("pv-audio").src = d.previewUrl;
      navigate("preview");
    }

  } catch (e) {
    alert(e.message);
  }

  S.busy = false;
}

/* ---------- INIT ---------- */

function init() {

  document.addEventListener("click", function (e) {
    const g = e.target.closest("[data-goto]");
    if (g) navigate(g.getAttribute("data-goto"));
  });

  if ($("bal-btn")) $("bal-btn").addEventListener("click", () => navigate("home"));
  if ($("btn-generate")) $("btn-generate").addEventListener("click", generateStory);

  navigate("home");
  syncUser();
}

document.addEventListener("DOMContentLoaded", init);

})();
