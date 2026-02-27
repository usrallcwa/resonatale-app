(function () {
  'use strict';

  window.RT = window.RT || {};

  // ══════════════════════════════════════
  // API — MUST point to your worker domain
  // ══════════════════════════════════════
  RT.API_BASE = 'https://api.resonatale.com';

  RT.TURNSTILE_KEY = '0x4AAAAAACLI9vyJZYGLg9lS';

  RT.MOODS = ['calm', 'cozy', 'adventure', 'romantic', 'suspense', 'motivational', 'heartwarming'];

  RT.DURATIONS = [
    { value: '1', label: '1 min', price: 'Free preview' },
    { value: '5', label: '5 min', price: '10 credits' },
    { value: '10', label: '10 min', price: '20 credits' }
  ];

  RT.PACKAGES = [
    { id: 'starter', credits: 20, price: 499, label: '20 Credits', desc: '2 short films', stripe_price: 'price_starter' },
    { id: 'creator', credits: 60, price: 1199, label: '60 Credits', desc: '6 short films', stripe_price: 'price_creator', popular: true },
    { id: 'studio', credits: 150, price: 2499, label: '150 Credits', desc: '15 short films', stripe_price: 'price_studio' }
  ];

})();
