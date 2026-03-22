(function () {
  'use strict';

  window.RT = window.RT || {};

  // ── API ──

  RT.API          = 'https://api.resonatale.com';
  RT.TURNSTILE_KEY = '0x4AAAAAACLI9vyJZYGLg9lS';

  // ── Tiers ──

  RT.TIERS = [
    { id: 'shorts',   label: 'Shorts',      minutes: 0.5, scenes: 3,  credits: 3,  price: '$3',  desc: '30 seconds' },
    { id: 'short',    label: 'Short Film',  minutes: 1,   scenes: 5,  credits: 5,  price: '$5',  desc: '1 minute'   },
    { id: 'standard', label: 'Standard',    minutes: 2,   scenes: 8,  credits: 10, price: '$10', desc: '2 minutes'  },
    { id: 'feature',  label: 'Feature Film',minutes: 3,   scenes: 12, credits: 15, price: '$15', desc: '3 minutes'  },
  ];

  // ── Moods ──

  RT.MOODS = [
    'calm', 'cozy', 'adventure', 'romantic', 'suspense', 'motivational',
    'heartwarming', 'dramatic', 'thriller', 'action', 'spiritual',
    'comedy', 'horror', 'mystery', 'inspirational',
  ];

  // ── Voices ──

  RT.VOICES = [
    { id: 'clone',                    name: 'My Voice',   desc: 'Your cloned voice',         icon: '🎤'  },
    { id: 'pNInz6obpgDQGcFmaJgB',    name: 'Adam',       desc: 'Deep male narrator',        icon: '🎙️' },
    { id: 'ErXwobaYiN019PkySvjV',    name: 'Antoni',     desc: 'Warm male voice',           icon: '🎙️' },
    { id: '21m00Tcm4TlvDq8ikWAM',    name: 'Rachel',     desc: 'Calm female narrator',      icon: '👩'  },
    { id: 'EXAVITQu4vr4xnSDxMaL',    name: 'Bella',      desc: 'Soft female voice',         icon: '👩'  },
    { id: 'MF3mGyEYCl7XYWbV9V6O',    name: 'Elli',       desc: 'Young female voice',        icon: '👧'  },
    { id: 'TxGEqnHWrfWFTfGW9XjX',    name: 'Josh',       desc: 'Deep authoritative male',   icon: '🎙️' },
    { id: 'VR6AewLTigWG4xSOukaG',    name: 'Arnold',     desc: 'Strong male voice',         icon: '💪'  },
    { id: 'pqHfZKP75CvOlQylNhV4',    name: 'Bill',       desc: 'Wise older male',           icon: '👴'  },
    { id: 'onwK4e9ZLuTAKqWW03F9',    name: 'Daniel',     desc: 'British male narrator',     icon: '🇬🇧' },
    { id: 'XB0fDUnXU5powFXDhCwa',    name: 'Charlotte',  desc: 'Elegant female',            icon: '👸'  },
  ];

  // ── Languages ──

  RT.LANGUAGES = [
    { code: 'en', flag: '🇺🇸', name: 'English'    },
    { code: 'es', flag: '🇪🇸', name: 'Español'    },
    { code: 'fr', flag: '🇫🇷', name: 'Français'   },
    { code: 'ja', flag: '🇯🇵', name: '日本語'      },
    { code: 'de', flag: '🇩🇪', name: 'Deutsch'    },
    { code: 'it', flag: '🇮🇹', name: 'Italiano'   },
    { code: 'pt', flag: '🇵🇹', name: 'Português'  },
    { code: 'ko', flag: '🇰🇷', name: '한국어'      },
    { code: 'zh', flag: '🇨🇳', name: '中文'        },
    { code: 'hi', flag: '🇮🇳', name: 'हिन्दी'     },
    { code: 'ar', flag: '🇸🇦', name: 'العربية'    },
    { code: 'ru', flag: '🇷🇺', name: 'Русский'    },
  ];

  // ── Share Platforms ──

  RT.SHARE = [
    { id: 'youtube',   label: 'YouTube',   icon: '▶',  url: 'https://www.youtube.com/upload' },
    { id: 'tiktok',    label: 'TikTok',    icon: '♪',  url: 'https://www.tiktok.com/upload'  },
    { id: 'x',         label: 'X',         icon: '𝕏',  url: 'https://twitter.com/intent/tweet?text={text}&url={url}' },
    { id: 'instagram', label: 'Instagram', icon: '📷', url: 'https://www.instagram.com/'     },
    { id: 'facebook',  label: 'Facebook',  icon: 'f',  url: 'https://www.facebook.com/sharer/sharer.php?u={url}'    },
    { id: 'whatsapp',  label: 'WhatsApp',  icon: '💬', url: 'https://api.whatsapp.com/send?text={text}%20{url}'     },
  ];

  // ── Auth State ──

  RT.token          = localStorage.getItem('rt_token') || '';
  RT.email          = localStorage.getItem('rt_email') || '';
  RT.refCode        = localStorage.getItem('rt_ref')   || '';
  RT.credits        = 0;
  RT.hasVoice       = false;
  RT.hasUsedPreview = false;
  RT.language       = localStorage.getItem('rt_lang')  || '';

  // Seed referral code from URL ?ref= on first visit
  (function () {
    try {
      var ref = new URLSearchParams(window.location.search).get('ref');
      if (ref && !RT.refCode) {
        RT.refCode = ref;
        localStorage.setItem('rt_ref', ref);
      }
    } catch (e) {}
  })();

  RT.isLoggedIn = function () { return !!RT.token; };

  RT.saveAuth = function (token, email) {
    RT.token = token;
    RT.email = email;
    localStorage.setItem('rt_token', token);
    localStorage.setItem('rt_email', email);
  };

  RT.clearAuth = function () {
    RT.token          = '';
    RT.email          = '';
    RT.credits        = 0;
    RT.hasVoice       = false;
    RT.hasUsedPreview = false;
    localStorage.removeItem('rt_token');
    localStorage.removeItem('rt_email');
  };

  RT.setLanguage = function (code) {
    RT.language = code;
    localStorage.setItem('rt_lang', code);
  };

})();
