(function () {
'use strict';

var TURNSTILE_KEY = '0x4AAAAAACLI9vyJZYGLg9lS';
var API = '/api';

(function () {
"use strict";

const API_BASE = "https://api.resonatale.com";

  // ═══════════════════════════════════════
  // CONFIG
  // ═══════════════════════════════════════

  var API = '/api';
  var TURNSTILE_SITEKEY = '0x4AAAAAAA_YOUR_SITE_KEY'; // Replace with real key

  var LANGUAGES = [
    { code: 'en', flag: '\u{1F1FA}\u{1F1F8}', name: 'English' },
    { code: 'es', flag: '\u{1F1EA}\u{1F1F8}', name: 'Spanish' },
    { code: 'fr', flag: '\u{1F1EB}\u{1F1F7}', name: 'French' },
    { code: 'ja', flag: '\u{1F1EF}\u{1F1F5}', name: 'Japanese' },
    { code: 'de', flag: '\u{1F1E9}\u{1F1EA}', name: 'German' },
    { code: 'it', flag: '\u{1F1EE}\u{1F1F9}', name: 'Italian' },
    { code: 'pt', flag: '\u{1F1F5}\u{1F1F9}', name: 'Portuguese' },
    { code: 'ko', flag: '\u{1F1F0}\u{1F1F7}', name: 'Korean' }
  ];

  var MOODS = [
    { id: 'calm', label: 'Calm' },
    { id: 'cozy', label: 'Cozy' },
    { id: 'adventure', label: 'Adventure' },
    { id: 'romantic', label: 'Romantic' },
    { id: 'suspense', label: 'Suspense' },
    { id: 'motivational', label: 'Motivational' },
    { id: 'heartwarming', label: 'Heartwarming' }
  ];

  var TOPUP_PLANS = [
    { id: 'starter', credits: 50, price: '$2.99', desc: '~2 full stories' },
    { id: 'creator', credits: 150, price: '$6.99', desc: '~7 full stories' },
    { id: 'premium', credits: 500, price: '$17.99', desc: '~25 full stories' }
  ];

  // ═══════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════

  var S = {
    screen: 'home',
    mood: '',
    lang: localStorage.getItem('rt_lang') || 'en',
    prompt: '',
    format: 'audio',
    credits: 0,
    loading: false,
    loadingMsg: '',
    turnstileToken: '',
    langOpen: false,

    // Preview data
    previewStory: null,

    // Player data
    playerStory: null,
    playerAudio: null,
    playerPlaying: false,
    playerCurrentTime: 0,
    playerDuration: 0,

    // Journal
    journal: JSON.parse(localStorage.getItem('rt_journal') || '[]'),

    // Modal
    modal: null,
    selectedTopup: 'creator',

    // Toast
    toast: null,
    toastTimer: null
  };

  // ═══════════════════════════════════════
  // DOM REFS
  // ═══════════════════════════════════════

  var $app = document.getElementById('app');
  var $modalRoot = document.getElementById('modal-root');

  // ═══════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function $$(sel, ctx) {
    return Array.from((ctx || document).querySelectorAll(sel));
  }

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'className') el.className = attrs[k];
        else if (k === 'innerHTML') el.innerHTML = attrs[k];
        else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        else if (k === 'style' && typeof attrs[k] === 'object') {
          Object.keys(attrs[k]).forEach(function (p) { el.style[p] = attrs[k][p]; });
        }
        else el.setAttribute(k, attrs[k]);
      });
    }
    if (children) {
      if (typeof children === 'string') el.textContent = children;
      else if (Array.isArray(children)) children.forEach(function (c) { if (c) el.appendChild(c); });
      else el.appendChild(children);
    }
    return el;
  }

  function getLang(code) {
    return LANGUAGES.find(function (l) { return l.code === code; }) || LANGUAGES[0];
  }

  function formatTime(s) {
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function saveJournal() {
    localStorage.setItem('rt_journal', JSON.stringify(S.journal));
  }

  // ═══════════════════════════════════════
  // TOAST
  // ═══════════════════════════════════════

  function showToast(msg, type) {
    if (S.toastTimer) clearTimeout(S.toastTimer);
    S.toast = { msg: msg, type: type || 'error' };
    renderToast();
    S.toastTimer = setTimeout(function () {
      S.toast = null;
      renderToast();
    }, 4000);
  }

  function renderToast() {
    var existing = $('.toast');
    if (existing) existing.remove();
    if (!S.toast) return;
    var t = h('div', {
      className: 'toast' + (S.toast.type === 'success' ? ' success' : '')
    }, S.toast.msg);
    document.body.appendChild(t);
  }

  // ═══════════════════════════════════════
  // API CALLS
  // ═══════════════════════════════════════

  function apiCall(endpoint, method, body) {
    var opts = {
      method: method || 'GET',
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) opts.body = JSON.stringify(body);
    return fetch(API + endpoint, opts).then(function (r) {
      if (!r.ok) return r.json().then(function (e) { throw new Error(e.error || 'Request failed'); });
      return r.json();
    });
  }

  function fetchBalance() {
    apiCall('/balance', 'GET').then(function (data) {
      S.credits = data.credits || 0;
      renderNav();
    }).catch(function () {
      S.credits = 100; // default for demo
      renderNav();
    });
  }

  // ═══════════════════════════════════════
  // RENDER ENGINE
  // ═══════════════════════════════════════

  function render() {
    $app.innerHTML = '';
    $app.appendChild(renderNav());
    $app.appendChild(renderScreen());
    $app.appendChild(renderBottomNav());
    renderModal();
    renderLoadingOverlay();
  }

  // ═══════════════════════════════════════
  // NAV
  // ═══════════════════════════════════════

  function renderNav() {
    var nav = h('nav', { className: 'nav' }, [
      h('div', {
        className: 'nav-logo',
        onClick: function () { navigate('home'); }
      }, 'RESONATALE'),
      h('div', { className: 'nav-right' }, [
        h('div', {
          className: 'nav-credit-badge',
          onClick: function () { openTopupModal(); }
        }, [
          h('span', { className: 'credit-icon' }, '\u2726'),
          h('span', null, S.credits + ' Credits')
        ]),
        h('a', {
          className: 'nav-icon-btn',
          href: 'mailto:admin@resonatale.com',
          title: 'Contact',
          innerHTML: '\u2709'
        })
      ])
    ]);
    return nav;
  }

  // ═══════════════════════════════════════
  // BOTTOM NAV
  // ═══════════════════════════════════════

  function renderBottomNav() {
    var items = [
      { id: 'home', icon: '\u2302', label: 'Home' },
      { id: 'create', icon: '\u2728', label: 'Create' },
      { id: 'journal', icon: '\u{1F4D6}', label: 'Journal' }
    ];

    var nav = h('div', { className: 'bottom-nav' });
    items.forEach(function (item) {
      var isActive = S.screen === item.id ||
        (item.id === 'create' && (S.screen === 'preview' || S.screen === 'player'));
      var btn = h('button', {
        className: 'bottom-nav-item' + (isActive ? ' active' : ''),
        onClick: function () { navigate(item.id); }
      }, [
        h('span', { className: 'bottom-nav-icon' }, item.icon),
        h('span', { className: 'bottom-nav-label' }, item.label)
      ]);
      nav.appendChild(btn);
    });
    return nav;
  }

  // ═══════════════════════════════════════
  // SCREEN ROUTER
  // ═══════════════════════════════════════

  function renderScreen() {
    switch (S.screen) {
      case 'home': return renderHome();
      case 'create': return renderCreate();
      case 'preview': return renderPreview();
      case 'player': return renderPlayer();
      case 'journal': return renderJournal();
      default: return renderHome();
    }
  }

  function navigate(screen) {
    if (S.playerAudio && screen !== 'player') {
      S.playerAudio.pause();
    }
    S.screen = screen;
    S.langOpen = false;
    render();
    window.scrollTo(0, 0);
  }

  // ═══════════════════════════════════════
  // HOME SCREEN
  // ═══════════════════════════════════════

  function renderHome() {
    var screen = h('div', { className: 'screen' });

    var hero = h('div', { className: 'home-hero' }, [
      h('div', { className: 'home-orb' }),
      h('h1', { className: 'home-title' }, 'RESONATALE'),
      h('p', { className: 'home-subtitle' }, 'AI-powered stories narrated in your own voice. Create immersive audio and video experiences.'),
      h('div', { className: 'home-cta-area' }, [
        h('button', {
          className: 'neon-btn',
          onClick: function () { navigate('create'); }
        }, 'Create Story'),
        h('div', { className: 'home-secondary-links' }, [
          h('button', {
            className: 'home-link-btn',
            onClick: function () { navigate('journal'); }
          }, [
            h('span', null, '\u{1F4D6}'),
            h('span', null, 'Journal')
          ]),
          h('button', {
            className: 'home-link-btn',
            onClick: function () { openTopupModal(); }
          }, [
            h('span', null, '\u2726'),
            h('span', null, 'Get Credits')
          ])
        ])
      ])
    ]);

    screen.appendChild(hero);
    screen.appendChild(renderFooterLinks());
    return screen;
  }

  // ═══════════════════════════════════════
  // CREATE SCREEN
  // ═══════════════════════════════════════

  function renderCreate() {
    var screen = h('div', { className: 'screen' });

    // Header
    screen.appendChild(h('div', { className: 'create-header' }, [
      h('h2', null, 'Create Story'),
      h('p', null, 'Choose your mood, language, and let AI craft your tale.')
    ]));

    // Mood
    var moodSection = h('div', { className: 'create-section' }, [
      h('label', { className: 'create-label' }, 'Mood')
    ]);
    var moodGrid = h('div', { className: 'mood-grid' });
    MOODS.forEach(function (mood) {
      var chip = h('button', {
        className: 'mood-chip' + (S.mood === mood.id ? ' active' : ''),
        'data-mood': mood.id,
        onClick: function () {
          S.mood = mood.id;
          render();
        }
      }, mood.label);
      moodGrid.appendChild(chip);
    });
    moodSection.appendChild(moodGrid);
    screen.appendChild(moodSection);

    // Language
    var langSection = h('div', { className: 'create-section' }, [
      h('label', { className: 'create-label' }, 'Language')
    ]);
    langSection.appendChild(renderLangDropdown());
    screen.appendChild(langSection);

    // Prompt
    var promptSection = h('div', { className: 'create-section' }, [
      h('label', { className: 'create-label' }, 'Your Prompt')
    ]);
    var textarea = h('textarea', {
      className: 'prompt-area',
      placeholder: 'A neon dragon soaring through the rings of Saturn...',
      value: S.prompt
    });
    textarea.value = S.prompt;
    textarea.addEventListener('input', function (e) {
      S.prompt = e.target.value;
    });
    promptSection.appendChild(textarea);
    promptSection.appendChild(h('p', { className: 'prompt-hint' }, 'Describe a scene, character, or feeling. Keep it vivid.'));
    screen.appendChild(promptSection);

    // Format
    var formatSection = h('div', { className: 'create-section' }, [
      h('label', { className: 'create-label' }, 'Format')
    ]);
    var formatToggle = h('div', { className: 'format-toggle' });
    ['audio', 'video'].forEach(function (f) {
      formatToggle.appendChild(h('button', {
        className: 'format-opt' + (S.format === f ? ' active' : ''),
        onClick: function () { S.format = f; render(); }
      }, f === 'audio' ? '\u{1F3A7} Audio' : '\u{1F3AC} Video'));
    });
    formatSection.appendChild(formatToggle);
    screen.appendChild(formatSection);

    // Turnstile
    var turnstileBox = h('div', { className: 'turnstile-box' });
    var turnstileDiv = h('div', {
      className: 'cf-turnstile',
      'data-sitekey': TURNSTILE_SITEKEY,
      'data-callback': 'onTurnstileCallback',
      'data-theme': 'dark'
    });
    turnstileBox.appendChild(turnstileDiv);
    screen.appendChild(turnstileBox);

    // Generate button
    var genArea = h('div', { className: 'create-generate-area' });
    genArea.appendChild(h('button', {
      className: 'neon-btn',
      onClick: handleGenerate
    }, 'Generate Preview'));
    genArea.appendChild(h('p', { className: 'prompt-hint', style: { textAlign: 'center' } }, 'Preview is always free'));
    screen.appendChild(genArea);

    screen.appendChild(renderFooterLinks());

    // Re-render turnstile after DOM insert
    setTimeout(function () {
      if (window.turnstile) {
        window.turnstile.render('.cf-turnstile', {
          sitekey: TURNSTILE_SITEKEY,
          theme: 'dark',
          callback: function (token) {
            S.turnstileToken = token;
          }
        });
      }
    }, 100);

    return screen;
  }

  // Language dropdown
  function renderLangDropdown() {
    var current = getLang(S.lang);
    var wrapper = h('div', { className: 'lang-dropdown-wrapper' });

    var trigger = h('button', {
      className: 'lang-trigger' + (S.langOpen ? ' open' : ''),
      onClick: function (e) {
        e.stopPropagation();
        S.langOpen = !S.langOpen;
        render();
      }
    }, [
      h('span', { className: 'lang-flag' }, current.flag),
      h('span', null, current.name),
      h('span', { className: 'lang-arrow' }, '\u25BC')
    ]);
    wrapper.appendChild(trigger);

    if (S.langOpen) {
      var menu = h('div', { className: 'lang-menu' });
      LANGUAGES.forEach(function (lang) {
        menu.appendChild(h('div', {
          className: 'lang-option' + (S.lang === lang.code ? ' active' : ''),
          onClick: function (e) {
            e.stopPropagation();
            S.lang = lang.code;
            S.langOpen = false;
            localStorage.setItem('rt_lang', lang.code);
            render();
          }
        }, [
          h('span', { className: 'lang-flag' }, lang.flag),
          h('span', null, lang.name)
        ]));
      });
      wrapper.appendChild(menu);

      // Close on outside click
      setTimeout(function () {
        document.addEventListener('click', closeLangOnOutside);
      }, 10);
    }

    return wrapper;
  }

  function closeLangOnOutside() {
    if (S.langOpen) {
      S.langOpen = false;
      render();
    }
    document.removeEventListener('click', closeLangOnOutside);
  }

  // ═══════════════════════════════════════
  // GENERATE HANDLER
  // ═══════════════════════════════════════

  function handleGenerate() {
    if (!S.mood) { showToast('Please select a mood.'); return; }
    if (!S.prompt.trim()) { showToast('Please enter a prompt.'); return; }
    if (S.prompt.trim().length < 5) { showToast('Prompt is too short. Be more descriptive.'); return; }

    S.loading = true;
    S.loadingMsg = 'Crafting your story...';
    render();

    var payload = {
      mode: 'preview',
      engine: {
        text: 'openai',
        voice: 'elevenlabs',
        video: 'heygen'
      },
      emotion: S.mood,
      language: S.lang,
      format: S.format,
      prompt: S.prompt.trim(),
      duration_seconds: 90,
      turnstile: S.turnstileToken
    };

    apiCall('/generate', 'POST', payload)
      .then(function (data) {
        S.loading = false;
        S.previewStory = {
          id: data.storyId || generateId(),
          mood: S.mood,
          language: S.lang,
          format: S.format,
          prompt: S.prompt.trim(),
          text: data.text || '',
          audioUrl: data.audioUrl || '',
          videoUrl: data.videoUrl || '',
          mode: 'preview',
          createdAt: new Date().toISOString()
        };
        navigate('preview');
      })
      .catch(function (err) {
        S.loading = false;

        // DEMO FALLBACK — generate mock preview so UI is functional without backend
        S.previewStory = {
          id: generateId(),
          mood: S.mood,
          language: S.lang,
          format: S.format,
          prompt: S.prompt.trim(),
          text: getDemoText(S.mood),
          audioUrl: '',
          videoUrl: '',
          mode: 'preview',
          createdAt: new Date().toISOString()
        };
        navigate('preview');
        showToast('API unavailable. Showing demo preview.', 'error');
      });
  }

  function getDemoText(mood) {
    var texts = {
      calm: 'The lake held still as glass beneath the weight of the evening sky. Not a ripple dared break its surface. She sat on the dock with her feet dangling above the water, watching the last sliver of gold dissolve behind the mountains. Somewhere across the valley, a bird called out once and fell silent.',
      cozy: 'Rain tapped against the windowpane in a rhythm she had known since childhood. The fire crackled low. She pulled the quilt tighter around her shoulders and opened the book to where the corner was folded. The tea was still warm. The house smelled like cinnamon and old paper.',
      adventure: 'The map ended where the canyon began. He stood at the edge, the wind pulling at his jacket, and stared down into the mist that churned between the walls of red stone. Somewhere below, the river roared. Behind him, the trail had vanished under fresh snow. There was only one way forward.',
      romantic: 'She almost did not recognize him. Three years had changed the way he held his shoulders, the lines around his eyes. But his voice was the same. The exact same. And when he said her name across the crowded room, her hand forgot how to hold the glass.',
      suspense: 'The phone rang at three in the morning. She let it ring six times. When she finally answered, the voice on the other end said only two words before the line cut dead. She sat up in the dark, wide awake, replaying the sound of those words over and over.',
      motivational: 'No one clapped when she crossed the finish line. The stadium was empty. The time on the clock meant nothing to anyone but her. She bent over her knees, breathing hard, tears and sweat mixing on the track. Then she straightened up. Then she smiled.',
      heartwarming: 'The letter arrived twelve years late. The handwriting was shaky, the ink faded at the folds. But the words were perfectly clear. He read it standing in the kitchen, still holding his keys, still wearing his coat. By the time he reached the last line, he was sitting on the floor.'
    };
    return texts[mood] || texts.calm;
  }

  // ═══════════════════════════════════════
  // PREVIEW SCREEN
  // ═══════════════════════════════════════

  function renderPreview() {
    if (!S.previewStory) { navigate('create'); return h('div'); }
    var story = S.previewStory;
    var lang = getLang(story.language);
    var screen = h('div', { className: 'screen' });

    var card = h('div', { className: 'preview-card' });

    // Mood badge
    var moodColors = {
      calm: 'rgba(0,229,255,0.15)', cozy: 'rgba(255,159,67,0.15)',
      adventure: 'rgba(0,255,148,0.15)', romantic: 'rgba(255,46,209,0.15)',
      suspense: 'rgba(255,82,82,0.15)', motivational: 'rgba(198,255,0,0.15)',
      heartwarming: 'rgba(255,107,157,0.15)'
    };
    var moodTextColors = {
      calm: '#00E5FF', cozy: '#FF9F43', adventure: '#00FF94',
      romantic: '#FF2ED1', suspense: '#FF5252', motivational: '#C6FF00',
      heartwarming: '#FF6B9D'
    };

    card.appendChild(h('span', {
      className: 'preview-mood-badge',
      style: {
        background: moodColors[story.mood] || moodColors.calm,
        color: moodTextColors[story.mood] || moodTextColors.calm
      }
    }, story.mood));

    card.appendChild(h('h3', { className: 'preview-title' }, 'Preview Ready'));
    card.appendChild(h('p', { className: 'preview-meta' }, lang.flag + ' ' + lang.name + ' \u2022 ' + (story.format === 'audio' ? '\u{1F3A7} Audio' : '\u{1F3AC} Video') + ' \u2022 ~90s'));

    // Audio player if available
    if (story.audioUrl) {
      var audioArea = h('div', { className: 'preview-audio-area' });
      var audio = h('audio', { controls: '', src: story.audioUrl });
      audioArea.appendChild(audio);
      card.appendChild(audioArea);
    }

    // Story text
    if (story.text) {
      var textArea = h('div', { className: 'preview-text-scroll' });
      story.text.split('\n').forEach(function (para) {
        if (para.trim()) textArea.appendChild(h('p', { style: { marginBottom: '12px' } }, para.trim()));
      });
      card.appendChild(textArea);
    }

    // Actions
    var actions = h('div', { className: 'preview-actions' });
    actions.appendChild(h('button', {
      className: 'neon-btn',
      onClick: handleUnlock
    }, 'Unlock Full Story \u2014 20 Credits'));
    actions.appendChild(h('p', { className: 'preview-credit-note' }, 'You have ' + S.credits + ' credits'));
    actions.appendChild(h('button', {
      className: 'preview-back-btn',
      onClick: function () { navigate('create'); }
    }, '\u2190 Back to Create'));
    card.appendChild(actions);

    screen.appendChild(card);
    screen.appendChild(renderFooterLinks());
    return screen;
  }

  // ═══════════════════════════════════════
  // UNLOCK HANDLER
  // ═══════════════════════════════════════

  function handleUnlock() {
    if (S.credits < 20) {
      openTopupModal();
      return;
    }

    S.loading = true;
    S.loadingMsg = 'Generating full story...';
    render();

    var story = S.previewStory;
    var payload = {
      mode: 'unlock',
      storyId: story.id,
      format: story.format,
      duration_seconds: 300
    };

    apiCall('/generate', 'POST', payload)
      .then(function (data) {
        S.loading = false;
        S.credits = Math.max(0, S.credits - 20);

        var fullStory = {
          id: story.id,
          mood: story.mood,
          language: story.language,
          format: story.format,
          prompt: story.prompt,
          text: data.text || story.text,
          audioUrl: data.audioUrl || story.audioUrl,
          videoUrl: data.videoUrl || story.videoUrl,
          mode: 'full',
          createdAt: story.createdAt
        };

        // Save to journal
        S.journal.unshift(fullStory);
        saveJournal();

        // Go to player
        S.playerStory = fullStory;
        navigate('player');
        showToast('Full story unlocked!', 'success');
      })
      .catch(function (err) {
        S.loading = false;

        // DEMO FALLBACK
        S.credits = Math.max(0, S.credits - 20);
        var fullStory = {
          id: story.id,
          mood: story.mood,
          language: story.language,
          format: story.format,
          prompt: story.prompt,
          text: story.text + '\n\n' + getDemoText(story.mood) + '\n\n' + getDemoText('calm'),
          audioUrl: '',
          videoUrl: '',
          mode: 'full',
          createdAt: story.createdAt
        };

        S.journal.unshift(fullStory);
        saveJournal();
        S.playerStory = fullStory;
        navigate('player');
        showToast('Demo mode. Backend not connected.', 'error');
      });
  }

  // ═══════════════════════════════════════
  // PLAYER SCREEN
  // ═══════════════════════════════════════

  function renderPlayer() {
    if (!S.playerStory) { navigate('home'); return h('div'); }
    var story = S.playerStory;
    var screen = h('div', { className: 'screen' });
    var container = h('div', { className: 'player-container' });

    // Ring
    var ringWrapper = h('div', { className: 'player-ring-wrapper' });
    var ring = h('div', { className: 'player-ring' + (S.playerPlaying ? ' playing' : '') });
    var inner = h('div', { className: 'player-ring-inner' }, [
      h('span', { className: 'player-ring-mood' }, story.mood),
      h('span', { className: 'player-ring-time' }, formatTime(S.playerCurrentTime))
    ]);
    ring.appendChild(inner);
    ringWrapper.appendChild(ring);
    container.appendChild(ringWrapper);

    // Info
    container.appendChild(h('div', { className: 'player-info' }, [
      h('h3', null, story.prompt.length > 40 ? story.prompt.slice(0, 40) + '...' : story.prompt),
      h('p', null, getLang(story.language).flag + ' ' + getLang(story.language).name + ' \u2022 ' + (story.mode === 'full' ? 'Full Story' : 'Preview'))
    ]));

    // Progress
    var progressWrapper = h('div', { className: 'player-progress-wrapper' });
    var progressBar = h('div', { className: 'player-progress-bar' });
    var pct = S.playerDuration > 0 ? (S.playerCurrentTime / S.playerDuration * 100) : 0;
    var fill = h('div', { className: 'player-progress-fill', style: { width: pct + '%' } });
    progressBar.appendChild(fill);
    progressBar.addEventListener('click', function (e) {
      if (S.playerAudio && S.playerDuration > 0) {
        var rect = progressBar.getBoundingClientRect();
        var ratio = (e.clientX - rect.left) / rect.width;
        S.playerAudio.currentTime = ratio * S.playerDuration;
      }
    });
    progressWrapper.appendChild(progressBar);
    progressWrapper.appendChild(h('div', { className: 'player-times' }, [
      h('span', null, formatTime(S.playerCurrentTime)),
      h('span', null, formatTime(S.playerDuration))
    ]));
    container.appendChild(progressWrapper);

    // Controls
    var controls = h('div', { className: 'player-controls' });
    controls.appendChild(h('button', {
      className: 'player-ctrl-btn',
      onClick: function () {
        if (S.playerAudio) S.playerAudio.currentTime = Math.max(0, S.playerAudio.currentTime - 15);
      }
    }, '\u23EA'));
    controls.appendChild(h('button', {
      className: 'player-play-btn',
      onClick: togglePlayerPlayback,
      innerHTML: S.playerPlaying ? '\u275A\u275A' : '\u25B6'
    }));
    controls.appendChild(h('button', {
      className: 'player-ctrl-btn',
      onClick: function () {
        if (S.playerAudio) S.playerAudio.currentTime = Math.min(S.playerDuration, S.playerAudio.currentTime + 15);
      }
    }, '\u23E9'));
    container.appendChild(controls);

    // Story text readable
    if (story.text && !story.audioUrl) {
      var textArea = h('div', {
        className: 'preview-text-scroll',
        style: { marginTop: '20px', maxHeight: '250px' }
      });
      story.text.split('\n').forEach(function (para) {
        if (para.trim()) textArea.appendChild(h('p', { style: { marginBottom: '12px' } }, para.trim()));
      });
      container.appendChild(textArea);
    }

    // Back
    container.appendChild(h('button', {
      className: 'player-back-btn',
      onClick: function () {
        if (S.playerAudio) { S.playerAudio.pause(); S.playerAudio = null; }
        S.playerPlaying = false;
        navigate('journal');
      }
    }, '\u2190 Back to Journal'));

    screen.appendChild(container);

    // Init audio if available
    if (story.audioUrl && !S.playerAudio) {
      setTimeout(initPlayerAudio, 50);
    }

    return screen;
  }

  function initPlayerAudio() {
    if (!S.playerStory || !S.playerStory.audioUrl) return;
    S.playerAudio = new Audio(S.playerStory.audioUrl);
    S.playerAudio.addEventListener('loadedmetadata', function () {
      S.playerDuration = S.playerAudio.duration;
      render();
    });
    S.playerAudio.addEventListener('timeupdate', function () {
      S.playerCurrentTime = S.playerAudio.currentTime;
      // Update only player
