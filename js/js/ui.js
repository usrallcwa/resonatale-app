// ── Clock ──
  function tickClock() {
    var now = new Date();
    var h = now.getHours() % 12;
    var m = now.getMinutes();
    var s = now.getSeconds();
    var $h = document.getElementById('c-h');
    var $m = document.getElementById('c-m');
    var $s = document.getElementById('c-s');
    if ($h) $h.setAttribute('transform', 'rotate(' + ((h * 30) + (m * 0.5)) + ' 100 100)');
    if ($m) $m.setAttribute('transform', 'rotate(' + (m * 6) + ' 100 100)');
    if ($s) $s.setAttribute('transform', 'rotate(' + (s * 6) + ' 100 100)');
  }
  tickClock();
  setInterval(tickClock, 1000);
