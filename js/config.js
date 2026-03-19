(function () {
  'use strict';

  window.RT = window.RT || {};

  // API
  RT.API = 'https://api.resonatale.com';
  RT.TURNSTILE_KEY = '0x4AAAAAACLI9vyJZYGLg9lS';

 RT.TIERS = [
    { id: 'shorts',      label: 'Shorts',       minutes: 0.5, scenes: 3,   credits: 3,   price: '$3',   desc: '30 seconds' },
    { id: 'short',       label: 'Short Film',   minutes: 1,   scenes: 5,   credits: 5,   price: '$5',   desc: '1 minute' },
    { id: 'standard',    label: 'Standard',      minutes: 2,   scenes: 8,   credits: 10,  price: '$10',  desc: '2 minutes' },
    { id: 'feature',     label: 'Feature Film',  minutes: 3,   scenes: 12,  credits: 15,  price: '$15',  desc: '3 minutes' }
  ];

  // Moods
  RT.MOODS = ['calm', 'cozy', 'adventure', 'romantic', 'suspense', 'motivational', 'heartwarming', 'dramatic', 'thriller', 'action', 'spiritual', 'comedy', 'horror', 'mystery', 'inspirational'];

  RT.LANGUAGES = [
    { code: 'en', flag: '\u{1F1FA}\u{1F1F8}', name: 'English' },
    { code: 'es', flag: '\u{1F1EA}\u{1F1F8}', name: 'Español' },
    { code: 'fr', flag: '\u{1F1EB}\u{1F1F7}', name: 'Français' },
    { code: 'ja', flag: '\u{1F1EF}\u{1F1F5}', name: '日本語' },
    { code: 'de', flag: '\u{1F1E9}\u{1F1EA}', name: 'Deutsch' },
    { code: 'it', flag: '\u{1F1EE}\u{1F1F9}', name: 'Italiano' },
    { code: 'pt', flag: '\u{1F1F5}\u{1F1F9}', name: 'Português' },
    { code: 'ko', flag: '\u{1F1F0}\u{1F1F7}', name: '한국어' },
    { code: 'zh', flag: '\u{1F1E8}\u{1F1F3}', name: '中文' },
    { code: 'hi', flag: '\u{1F1EE}\u{1F1F3}', name: 'हिन्दी' },
    { code: 'ar', flag: '\u{1F1F8}\u{1F1E6}', name: 'العربية' },
    { code: 'ru', flag: '\u{1F1F7}\u{1F1FA}', name: 'Русский' }
  ];
  
  // Share platforms
  RT.SHARE = [
    { id: 'youtube',   label: 'YouTube',   icon: '▶',  url: 'https://www.youtube.com/upload' },
    { id: 'tiktok',    label: 'TikTok',    icon: '♪',  url: 'https://www.tiktok.com/upload' },
    { id: 'x',         label: 'X',         icon: '𝕏',  url: 'https://twitter.com/intent/tweet?text={text}&url={url}' },
    { id: 'instagram', label: 'Instagram', icon: '📷', url: 'https://www.instagram.com/' },
    { id: 'facebook',  label: 'Facebook',  icon: 'f',  url: 'https://www.facebook.com/sharer/sharer.php?u={url}' },
    { id: 'whatsapp',  label: 'WhatsApp',  icon: '💬', url: 'https://api.whatsapp.com/send?text={text}%20{url}' }
  ];

  // Auth state
  RT.token = localStorage.getItem('rt_token') || '';
  RT.email = localStorage.getItem('rt_email') || '';
  RT.credits = 0;
  RT.hasVoice = false;
  RT.hasUsedPreview = false;
  RT.language = localStorage.getItem('rt_lang') || 'en';

  RT.isLoggedIn = function () { return !!RT.token; };

  RT.saveAuth = function (token, email) {
    RT.token = token;
    RT.email = email;
    localStorage.setItem('rt_token', token);
    localStorage.setItem('rt_email', email);
  };

  RT.clearAuth = function () {
    RT.token = '';
    RT.email = '';
    RT.credits = 0;
    RT.hasVoice = false;
    localStorage.removeItem('rt_token');
    localStorage.removeItem('rt_email');
  };

  RT.setLanguage = function (code) {
    RT.language = code;
    localStorage.setItem('rt_lang', code);
  };

})();