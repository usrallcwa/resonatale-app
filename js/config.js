(function () {
  'use strict';

  window.RT = window.RT || {};

  // API
  RT.API = 'https://api.resonatale.com';
  RT.TURNSTILE_KEY = '0x4AAAAAACLI9vyJZYGLg9lS';

  // Tiers
  RT.TIERS = [
    { id: 'trailer',  label: 'Trailer',  minutes: 0.5, scenes: 3,  credits: 5,   price: '$5',   desc: '24 second trailer' },
    { id: 'short',    label: 'Short',    minutes: 1,   scenes: 8,  credits: 12,  price: '$12',  desc: '1 minute short' },
    { id: 'standard', label: 'Standard', minutes: 3,   scenes: 18, credits: 30,  price: '$30',  desc: '3 minute film' },
    { id: 'feature',  label: 'Feature',  minutes: 5,   scenes: 35, credits: 50,  price: '$50',  desc: '5 minute feature' },
    { id: 'epic',     label: 'Epic',     minutes: 10,  scenes: 60, credits: 90,  price: '$90',  desc: '10 minute epic' }
  ];

  // Moods
  RT.MOODS = ['calm', 'cozy', 'adventure', 'romantic', 'suspense', 'motivational', 'heartwarming', 'dramatic'];

  // Languages
  RT.LANGUAGES = [
    { code: 'en', flag: '🇺🇸', name: 'English' },
    { code: 'es', flag: '🇪🇸', name: 'Spanish' },
    { code: 'fr', flag: '🇫🇷', name: 'French' },
    { code: 'ja', flag: '🇯🇵', name: 'Japanese' },
    { code: 'de', flag: '🇩🇪', name: 'German' },
    { code: 'it', flag: '🇮🇹', name: 'Italian' },
    { code: 'pt', flag: '🇵🇹', name: 'Portuguese' },
    { code: 'ko', flag: '🇰🇷', name: 'Korean' },
    { code: 'zh', flag: '🇨🇳', name: 'Chinese' },
    { code: 'hi', flag: '🇮🇳', name: 'Hindi' },
    { code: 'ar', flag: '🇸🇦', name: 'Arabic' },
    { code: 'ru', flag: '🇷🇺', name: 'Russian' }
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