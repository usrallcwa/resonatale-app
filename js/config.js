(function () {
  'use strict';

  window.RT = window.RT || {};

  RT.API_BASE = 'https://api.resonatale.com';
  RT.TURNSTILE_KEY = '0x4AAAAAACLI9vyJZYGLg9lS';

  RT.MOODS = ['calm', 'cozy', 'adventure', 'romantic', 'suspense', 'motivational', 'heartwarming'];

  RT.DURATIONS = [
    { value: '1', label: '1 min', credits: 5, price: '$1.99' },
    { value: '5', label: '5 min', credits: 15, price: '$6.99' },
    { value: '10', label: '10 min', credits: 30, price: '$12.99' }
  ];

  RT.PACKAGES = [
    { id: 'starter', credits: 15, price: 499, label: '15 Credits', desc: '1 short film + previews', stripe_price: 'price_starter' },
    { id: 'creator', credits: 50, price: 1499, label: '50 Credits', desc: '2-3 full films', stripe_price: 'price_creator', popular: true },
    { id: 'studio', credits: 120, price: 2999, label: '120 Credits', desc: '5-6 full films', stripe_price: 'price_studio' }
  ];

  // Credit costs per duration
  RT.creditCost = function (duration) {
    var d = RT.DURATIONS.find(function (x) { return x.value === String(duration); });
    return d ? d.credits : 5;
  };

})();
