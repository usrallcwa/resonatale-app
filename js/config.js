(function () {
  'use strict';

  window.RT = window.RT || {};

  // API
  RT.API = 'https://api.resonatale.com';
  RT.TURNSTILE_KEY = '0x4AAAAAACLI9vyJZYGLg9lS';

 RT.TIERS = [
    { id: 'trailer',  label: 'Trailer',  minutes: 0.5, scenes: 3,   credits: 5,   price: '$5',   desc: '24 second trailer' },
    { id: 'short',    label: 'Short',    minutes: 1,   scenes: 8,   credits: 12,  price: '$12',  desc: '1 minute short' },
    { id: 'standard', label: 'Standard', minutes: 3,   scenes: 18,  credits: 30,  price: '$30',  desc: '3 minute film' },
    { id: 'feature',  label: 'Feature',  minutes: 5,   scenes: 35,  credits: 50,  price: '$50',  desc: '5 minute feature' },
    { id: 'epic',     label: 'Epic',     minutes: 10,  scenes: 60,  credits: 90,  price: '$90',  desc: '10 minute epic' },
    { id: 'cinema',   label: 'Cinema',   minutes: 20,  scenes: 150, credits: 199, price: '$199', desc: '20 minute cinema' }
  ];

  // Moods
  RT.MOODS = ['calm', 'cozy', 'adventure', 'romantic', 'suspense', 'motivational', 'heartwarming', 'dramatic', 'thriller', 'action', 'spiritual', 'comedy', 'horror', 'mystery', 'inspirational'];

  // Languages
  RT.LANGUAGES = [
    { code: 'en', flag: 'EN', name: 'English' },
    { code: 'es', flag: 'ES', name: 'Español' },
    { code: 'fr', flag: 'FR', name: 'Français' },
    { code: 'ja', flag: 'JA', name: '日本語' },
    { code: 'de', flag: 'DE', name: 'Deutsch' },
    { code: 'it', flag: 'IT', name: 'Italiano' },
    { code: 'pt', flag: 'PT', name: 'Português' },
    { code: 'ko', flag: 'KO', name: '한국어' },
    { code: 'zh', flag: 'ZH', name: '中文' },
    { code: 'hi', flag: 'HI', name: 'हिन्दी' },
    { code: 'ar', flag: 'AR', name: 'العربية' },
    { code: 'ru', flag: 'RU', name: 'Русский' }
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