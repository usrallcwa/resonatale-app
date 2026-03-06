(function () {
  'use strict';

  window.RT = window.RT || {};

  // API
  RT.API = 'https://api.resonatale.com';
  RT.TURNSTILE_KEY = '0x4AAAAAACLI9vyJZYGLg9lS';

  // Tiers (honest durations based on 10 sec per scene)
  RT.TIERS = [
    { id: 'short',    label: 'Trailer',  minutes: 0.5, scenes: 3,  credits: 8,   price: '$8',   desc: '30 second trailer' },
    { id: 'standard', label: 'Short',    minutes: 2,   scenes: 12, credits: 30,  price: '$30',  desc: '2 minute short' },
    { id: 'extended', label: 'Standard', minutes: 3,   scenes: 20, credits: 50,  price: '$50',  desc: '3 minute film' },
    { id: 'feature',  label: 'Feature',  minutes: 6,   scenes: 38, credits: 120, price: '$120', desc: '6 minute feature' },
    { id: 'epic',     label: 'Epic',     minutes: 9,   scenes: 55, credits: 199, price: '$199', desc: '9 minute epic' },
  ];

  // Genres
  RT.GENRES = [
    { id: 'action',       label: 'Action & Thriller', icon: '🎬' },
    { id: 'fantasy',      label: 'Fantasy & Sci-Fi',  icon: '🧙' },
    { id: 'romance',      label: 'Romance & Drama',   icon: '💕' },
    { id: 'comedy',       label: 'Comedy',            icon: '😂' },
    { id: 'music',        label: 'Music Video',       icon: '🎵' },
    { id: 'documentary',  label: 'Documentary',       icon: '📖' },
    { id: 'travel',       label: 'Travel & Adventure',icon: '🌍' },
    { id: 'horror',       label: 'Horror & Mystery',  icon: '👻' },
    { id: 'business',     label: 'Business & Pitch',  icon: '💼' },
    { id: 'education',    label: 'Education',         icon: '📚' },
    { id: 'gaming',       label: 'Gaming & Anime',    icon: '🎮' },
    { id: 'motivational', label: 'Motivational',      icon: '✨' },
    { id: 'food',         label: 'Food & Lifestyle',  icon: '🍳' },
    { id: 'sports',       label: 'Sports',            icon: '⚽' },
    { id: 'holiday',      label: 'Holiday & Events',  icon: '🎄' },
  ];

  // Moods
  RT.MOODS = ['epic', 'calm', 'dark', 'upbeat', 'intense', 'romantic', 'mysterious', 'inspiring'];

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
    { code: 'ru', flag: '🇷🇺', name: 'Russian' },
  ];

  // Share platforms
  RT.SHARE = [
    { id: 'youtube',   label: 'YouTube',   icon: '▶',  url: 'https://www.youtube.com/upload' },
    { id: 'tiktok',    label: 'TikTok',    icon: '♪',  url: 'https://www.tiktok.com/upload' },
    { id: 'x',         label: 'X',         icon: '𝕏',  url: 'https://twitter.com/intent/tweet?text={text}&url={url}' },
    { id: 'instagram', label: 'Instagram', icon: '📷', url: 'https://www.instagram.com/' },
    { id: 'facebook',  label: 'Facebook',  icon: 'f',  url: 'https://www.facebook.com/sharer/sharer.php?u={url}' },
    { id: 'whatsapp',  label: 'WhatsApp',  icon: '💬', url: 'https://api.whatsapp.com/send?text={text}%20{url}' },
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

  RT.logout = RT.clearAuth;

  RT.setLanguage = function (code) {
    RT.language = code;
    localStorage.setItem('rt_lang', code);
  };

})();