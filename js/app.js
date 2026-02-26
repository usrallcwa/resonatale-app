// app.js

// ============================================
// GLOBAL STATE & CONFIGURATION
// ============================================

const API_BASE = "https://api.resonatale.com";

let appState = {
  voiceLanguage: "ENG",
  voiceMood: "calm",
  storyScenes: [],
};

window.appState = appState;
window.API_BASE = API_BASE;

document.addEventListener("DOMContentLoaded", () => {
  initLanguageSelector();
  initMoodPicker();
  setupBriefCounter();
});
const SUPPORTED_LANGUAGES = [
  { code: "ENG", label: "English", flag: "🇺🇸" },
  { code: "SPA", label: "Español", flag: "🇪🇸" },
  { code: "MEX", label: "Español (México)", flag: "🇲🇽" },
  { code: "FRA", label: "Français", flag: "🇫🇷" },
  { code: "DEU", label: "Deutsch", flag: "🇩🇪" },
  { code: "POR", label: "Português", flag: "🇧🇷" },
  { code: "ITA", label: "Italiano", flag: "🇮🇹" },
  { code: "JPN", label: "日本語", flag: "🇯🇵" },
  { code: "CMN", label: "中文 (普通话)", flag: "🇨🇳" },
  { code: "KOR", label: "한국어", flag: "🇰🇷" },
  { code: "HIN", label: "हिन्दी", flag: "🇮🇳" },
  { code: "ARA", label: "العربية", flag: "🇸🇦" },
  { code: "RUS", label: "Русский", flag: "🇷🇺" },
  { code: "TUR", label: "Türkçe", flag: "🇹🇷" },
  { code: "SWE", label: "Svenska", flag: "🇸🇪" },
  { code: "NLD", label: "Nederlands", flag: "🇳🇱" },
  { code: "POL", label: "Polski", flag: "🇵🇱" },
  { code: "UKR", label: "Українська", flag: "🇺🇦" },
  { code: "VIE", label: "Tiếng Việt", flag: "🇻🇳" },
];

function initLanguageSelector() {
  const select = document.getElementById("voiceLanguageSelect");
  if (!select) return;

  select.innerHTML = SUPPORTED_LANGUAGES.map(
    (lang) => `<option value="${lang.code}">${lang.flag} ${lang.label}</option>`
  ).join("");

  select.value = appState.voiceLanguage;
  select.addEventListener("change", (e) => {
    appState.voiceLanguage = e.target.value;
  });
}

// MOOD

function initMoodPicker() {
  const container = document.getElementById("moodPicker");
  if (!container) return;
  const buttons = container.querySelectorAll(".mood-btn");

  const applyActive = (activeMood) => {
    buttons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mood === activeMood);
    });
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      appState.voiceMood = btn.dataset.mood || "calm";
      applyActive(appState.voiceMood);
    });
  });

  applyActive(appState.voiceMood);
}

// BRIEF COUNTER

function setupBriefCounter() {
  const briefDesc = document.getElementById("briefDesc");
  const counterEl = document.getElementById("briefCount");
  if (!briefDesc || !counterEl) return;

  briefDesc.addEventListener("input", (e) => {
    counterEl.textContent = e.target.value.length;
  });
}

// STORY GENERATION

async function onCreateMovieClicked() {
  const briefEl = document.getElementById("briefDesc");
  const brief = briefEl ? briefEl.value.trim() : "";

  if (!brief) {
    alert("Please describe your 1-minute movie first.");
    return;
  }

  const mood = appState.voiceMood;
  const language = appState.voiceLanguage;
  const durationMinutes = 1;

  document.getElementById("storyOutput").textContent =
    "Creating your story scenes…";

  try {
    const res = await fetch(`${API_BASE}/api/story`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief, mood, language, durationMinutes }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.error || "Story API failed");
    }

    appState.storyScenes = data.scenes;
    renderScenes(data.scenes);
  } catch (err) {
    console.error(err);
    document.getElementById("storyOutput").textContent =
      "Sorry, something went wrong generating your story.";
  }
}

window.onCreateMovieClicked = onCreateMovieClicked;

function renderScenes(scenes) {
  const container = document.getElementById("storyOutput");
  if (!container) return;

  container.innerHTML = scenes
    .map(
      (s) => `
      <div class="scene-card">
        <h3>${s.title}</h3>
        <p><strong>Visual:</strong> ${s.description}</p>
        <p><strong>Voiceover:</strong> ${s.voiceover}</p>
      </div>
    `
    )
    .join("");
}
