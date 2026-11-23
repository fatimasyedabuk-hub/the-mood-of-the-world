/* The Mood of the World
   Live weather from Open-Meteo drives the look, movement and sound of the page.
   1. Geocoding API: city name  -> coordinates
   2. Forecast API:  coordinates -> current conditions (JSON)
   3. applyScene():  conditions  -> colour, picture, particles, clouds, haze, text, sound
   No libraries. Everything the API returns is inserted with textContent. */
(function () {
  'use strict';

  /* ---------- settings ---------- */
  var GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
  var WX_URL = 'https://api.open-meteo.com/v1/forecast';
  var CURRENT_FIELDS = 'temperature_2m,relative_humidity_2m,wind_speed_10m,cloud_cover,weather_code,is_day';
  var TIMEOUT_MS = 10000;             // give up on a request after 10 s
  var AUTO_REFRESH_MS = 10 * 60 * 1000; // quietly re-check every 10 min while the page is open

  /* design thresholds (not meteorological categories) */
  var COLD_BELOW = 10;                // under 10 C  -> cold palette
  var WARM_FROM = 25;                 // 25 C and up -> warm palette
  var WIND_CAP = 60;                  // km/h at which motion stops getting faster

  var COPY = {
    searchError: "WE COULDN'T FIND THAT LOCATION. TRY ANOTHER CITY.",
    apiError: "WE COULDN'T CONNECT TO THE ATMOSPHERE. PLEASE TRY AGAIN.",
    empty: 'SEARCH FOR A CITY TO DISCOVER ITS ATMOSPHERE.'
  };
  var MESSAGES = {
    clear: 'A little warmth fills the atmosphere.',
    cloudy: 'The world moves beneath a softer sky.',
    rain: 'The atmosphere settles into a quieter rhythm.',
    snow: 'A colder world takes shape.',
    storm: 'The atmosphere becomes unpredictable.',
    night: 'The world slows beneath the night sky.'
  };
  var CODE_LABELS = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Rime fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle', 56: 'Freezing drizzle', 57: 'Dense freezing drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Heavy freezing rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
    80: 'Rain showers', 81: 'Heavy rain showers', 82: 'Violent rain showers', 85: 'Snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail'
  };
  var LIGHT = [51, 53, 56, 61, 71, 77, 85];
  var HEAVY = [55, 57, 65, 67, 75, 82, 86, 95, 96, 99];

  /* ---------- helpers ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var body = document.body;
  var exp = $('experience'), stage = $('stage'), fx = $('fx'), cloudsEl = $('clouds');
  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var storage = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* private mode: ignore */ } }
  };

  /* ---------- state ---------- */
  var mode = 'atmospheric';
  var current = null;                 // { place, wx, group, isDay, ... } once a city has loaded
  var lastAction = null;              // what RETRY repeats
  var reqId = 0;                      // ignore answers that arrive after a newer request
  var soundOn = false;

  function motionAllowed() { return mode === 'atmospheric' && !reduceQuery.matches; }

  /* ---------- weather code -> group ---------- */
  function groupOf(code) {
    if (code === 0 || code === 1) return 'clear';
    if ([2, 3, 45, 48].indexOf(code) > -1) return 'cloudy';
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].indexOf(code) > -1) return 'rain';
    if ([71, 73, 75, 77, 85, 86].indexOf(code) > -1) return 'snow';
    if ([95, 96, 99].indexOf(code) > -1) return 'storm';
    return 'cloudy';                  // unknown code: neutral fallback
  }
  function tempTheme(t) { return t < COLD_BELOW ? 'cold' : (t < WARM_FROM ? 'mild' : 'warm'); }
  function iconFor(group, isDay) {
    if (group === 'clear') return isDay ? 'sun' : 'moon';
    return { cloudy: 'cloud', rain: 'rain', snow: 'snow', storm: 'thunder' }[group] || 'cloud';
  }

  /* ---------- network ---------- */
  function getJSON(url) {
    var ctl = new AbortController();
    var timer = setTimeout(function () { ctl.abort(); }, TIMEOUT_MS);
    return fetch(url, { signal: ctl.signal }).then(function (r) {
      if (!r.ok) { throw new Error('HTTP ' + r.status); }
      return r.json();
    }).then(function (j) { clearTimeout(timer); return j; },
            function (e) { clearTimeout(timer); throw e; });
  }
  function geocode(q) {
    var u = GEO_URL + '?' + new URLSearchParams({ name: q, count: '5', language: 'en', format: 'json' });
    return getJSON(u).then(function (d) { return (d && Array.isArray(d.results)) ? d.results : []; });
  }
  function forecast(place) {
    var u = WX_URL + '?' + new URLSearchParams({
      latitude: place.latitude, longitude: place.longitude, current: CURRENT_FIELDS, timezone: 'auto'
    });
    return getJSON(u).then(function (d) {
      var c = d && d.current;
      var ok = c && ['temperature_2m', 'relative_humidity_2m', 'wind_speed_10m', 'cloud_cover', 'weather_code', 'is_day']
        .every(function (k) { return typeof c[k] === 'number' && isFinite(c[k]); });
      if (!ok) { throw new Error('Unexpected data'); }
      return d;
    });
  }

  /* ---------- UI states: empty | loading | error | ready ---------- */
  function setState(s) {
    exp.dataset.state = s;
    if (s !== 'ready') { exp.removeAttribute('data-busy'); $('busyLine').hidden = true; }
    syncFx(); syncSound();
  }
  function showError(kind) {
    $('errorText').textContent = kind === 'nofound' ? COPY.searchError : COPY.apiError;
    $('retryBtn').hidden = kind === 'nofound';     // nothing to retry when the city does not exist
    setState('error');
  }

  /* ---------- main flows ---------- */
  function search(q) {
    q = (q || '').trim().slice(0, 80);
    if (!q) { $('cityInput').focus(); announce(COPY.empty); return; }
    var id = ++reqId;
    lastAction = { type: 'search', q: q };
    clearMatches();
    setState('loading');
    geocode(q).then(function (results) {
      if (id !== reqId) { return; }
      if (!results.length) { showError('nofound'); return; }
      showMatches(results, 0);
      return forecast(results[0]).then(function (wx) {
        if (id !== reqId) { return; }
        accept(results[0], wx, false);
      });
    }).catch(function () { if (id === reqId) { showError('api'); } });
  }

  /* load weather for a known place; silent = background refresh with no loading screen */
  function loadPlace(place, silent) {
    var id = ++reqId;
    lastAction = { type: 'place', place: place };
    if (silent && current) { exp.dataset.busy = 'true'; $('busyLine').hidden = false; }
    else if (current && exp.dataset.state === 'ready') { exp.dataset.busy = 'true'; $('busyLine').hidden = false; }
    else { setState('loading'); }
    $('refreshBtn').disabled = true;
    return forecast(place).then(function (wx) {
      if (id !== reqId) { return; }
      accept(place, wx, silent);
    }).catch(function () {
      if (id !== reqId) { return; }
      if (silent) { exp.removeAttribute('data-busy'); $('busyLine').hidden = true; $('refreshBtn').disabled = false; return; }
      $('refreshBtn').disabled = false;
      showError('api');
    });
  }

  function accept(place, wx, silent) {
    current = { place: place, wx: wx };
    exp.removeAttribute('data-busy'); $('busyLine').hidden = true;
    $('refreshBtn').disabled = false;
    $('actions').hidden = false;
    applyScene(!silent);
    setState('ready');
    markMatch(place);
  }

  function retry() {
    if (!lastAction) { return; }
    if (lastAction.type === 'search') { search(lastAction.q); }
    else { loadPlace(lastAction.place, false); }
  }

  /* ---------- the scene: data -> interface ---------- */
  function applyScene(animate) {
    var c = current.wx.current, units = current.wx.current_units || {};
    var code = c.weather_code, isDay = c.is_day === 1;
    var group = groupOf(code);
    var temp = Math.round(c.temperature_2m);
    var theme = tempTheme(c.temperature_2m);
    var cover = Math.max(0, Math.min(100, c.cloud_cover));
    var hum = Math.max(0, Math.min(100, c.relative_humidity_2m));
    var wind = Math.max(0, c.wind_speed_10m);
    var label = CODE_LABELS[code] || 'Changing conditions';
    var msg = (!isDay && (group === 'clear' || group === 'cloudy')) ? MESSAGES.night : MESSAGES[group];

    current.group = group; current.isDay = isDay;

    /* 1. temperature (+ day/night) -> colour */
    exp.dataset.temp = theme;
    exp.dataset.theme = isDay ? theme : 'night';      // night wins; temperature keeps a hint (see styles.css)
    if (group === 'rain' || group === 'storm') { exp.dataset.weather = group; } else { exp.removeAttribute('data-weather'); }

    /* 2. weather code + day/night -> picture, icon, words */
    setBackground(isDay ? group : 'night');
    $('condIcon').src = 'assets/icons/' + iconFor(group, isDay) + '.svg';
    $('condText').textContent = label;
    $('message').textContent = msg;
    $('placeName').textContent = [current.place.name, current.place.country || current.place.country_code].filter(Boolean).join(', ');

    /* numbers */
    var tUnit = units.temperature_2m || '°C';
    $('tempSr').textContent = temp + ' degrees ' + (tUnit === '°F' ? 'Fahrenheit' : 'Celsius');
    showTemp(temp, tUnit, animate);
    $('humValue').textContent = Math.round(hum) + (units.relative_humidity_2m || '%');
    $('windValue').textContent = Math.round(wind) + ' ' + (units.wind_speed_10m || 'km/h');
    $('cloudValue').textContent = Math.round(cover) + (units.cloud_cover || '%');
    $('humBar').style.width = hum + '%';
    $('windBar').style.width = Math.min(100, wind / WIND_CAP * 100) + '%';
    $('cloudBar').style.width = cover + '%';

    /* 3. cloud cover -> number and density of clouds; wind -> how fast they drift */
    buildClouds(cover, wind);

    /* 4. humidity -> haze; sun glow in clear or lightly clouded daytime skies */
    exp.style.setProperty('--humidity', (hum / 100).toFixed(2));
    exp.style.setProperty('--sun', (isDay && (group === 'clear' || group === 'cloudy')) ? ((1 - cover / 100) * 0.9).toFixed(2) : '0');

    /* 5. wind + weather code -> particles */
    setParticles(group, code, wind);

    var stamp = (current.wx.current.time || '').slice(11, 16);
    var now = new Date();
    $('updated').textContent = (stamp ? 'Conditions as of ' + stamp + ' local time. ' : '') +
      'Checked ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '.';
    announce('Showing ' + $('placeName').textContent + ': ' + temp + ' degrees, ' + label.toLowerCase() + '.');
    syncSound();
  }

  function setBackground(name) {
    if (mode === 'minimal') { stage.removeAttribute('data-background'); return; }
    stage.dataset.background = name;
  }

  var tempTimer = 0;
  function showTemp(value, unit, animate) {
    var el = $('tempValue');
    cancelAnimationFrame(tempTimer);
    var set = function (v) {
      el.textContent = String(v);
      var d = document.createElement('span'); d.className = 'deg'; d.textContent = unit;
      el.appendChild(d);
    };
    var from = parseInt(el.dataset.v, 10);
    el.dataset.v = String(value);
    if (!animate || !motionAllowed() || isNaN(from) || from === value) { set(value); return; }
    var t0 = performance.now(), dur = 700;
    (function step(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      set(Math.round(from + (value - from) * e));
      if (k < 1) { tempTimer = requestAnimationFrame(step); }
    })(t0);
  }

  /* cloud cover -> 0 to 9 cloud shapes; wind -> drift duration 220 s (calm) to 30 s (60 km/h and over) */
  var cloudSig = '';
  function buildClouds(cover, wind) {
    var n = Math.round(cover / 100 * 9);
    var dur = Math.round(220 - 190 * Math.min(wind, WIND_CAP) / WIND_CAP);
    var sig = n + '/' + dur + '/' + Math.round(cover);
    if (sig === cloudSig) { return; }
    cloudSig = sig;
    cloudsEl.textContent = '';
    for (var i = 0; i < n; i++) {
      var d = document.createElement('div'), w = 260 + Math.random() * 280;
      d.className = 'cloud';
      d.style.width = w + 'px'; d.style.height = (w * 0.42) + 'px';
      d.style.top = (Math.random() * 58) + '%';
      d.style.opacity = (0.2 + cover / 100 * 0.5).toFixed(2);
      d.style.animationDuration = (dur * (0.8 + Math.random() * 0.5)) + 's';
      d.style.animationDelay = '-' + (Math.random() * dur) + 's';
      cloudsEl.appendChild(d);
    }
  }

  /* ---------- particles (rain and snow), drawn on a canvas ---------- */
  var g = fx.getContext('2d'), FW = 0, FH = 0, parts = [], kind = 'none', slant = 0, rafId = 0, lastT = 0;
  function sizeFx() {
    var r = stage.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    FW = r.width; FH = r.height;
    fx.width = Math.max(1, Math.round(FW * dpr)); fx.height = Math.max(1, Math.round(FH * dpr));
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (kind !== 'none') { seed(parts.length); }
  }
  function setParticles(group, code, wind) {
    var w = Math.min(wind, WIND_CAP) / WIND_CAP;           // 0..1
    kind = (group === 'rain' || group === 'storm') ? 'rain' : (group === 'snow' ? 'snow' : 'none');
    var base = kind === 'rain' ? 150 : 110;
    var k = LIGHT.indexOf(code) > -1 ? 0.5 : (HEAVY.indexOf(code) > -1 ? 1.6 : 1);
    slant = w * (kind === 'rain' ? 9 : 3);                  // stronger wind pushes particles sideways
    seed(Math.round(base * k));
    syncFx();
  }
  function seed(n) {
    parts = [];
    for (var i = 0; i < n; i++) {
      parts.push(kind === 'rain'
        ? { x: Math.random() * FW, y: Math.random() * FH, len: 10 + Math.random() * 14, v: 11 + Math.random() * 7, a: 0.25 + Math.random() * 0.35 }
        : { x: Math.random() * FW, y: Math.random() * FH, r: 1 + Math.random() * 2.4, v: 0.6 + Math.random() * 1.2, p: Math.random() * 6.28, a: 0.5 + Math.random() * 0.4 });
    }
  }
  function frame(t) {
    var f = Math.min(3, (t - lastT) / 16.7 || 1); lastT = t;
    g.clearRect(0, 0, FW, FH);
    var i, p;
    if (kind === 'rain') {
      g.lineWidth = 1.3; g.lineCap = 'round';
      for (i = 0; i < parts.length; i++) {
        p = parts[i];
        p.y += p.v * f; p.x += slant * f;
        if (p.y > FH + 20) { p.y = -p.len; p.x = Math.random() * (FW + 60) - 30; }
        if (p.x > FW + 30) { p.x = -30; }
        g.strokeStyle = 'rgba(214,230,255,' + p.a.toFixed(2) + ')';
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + slant * p.len / p.v, p.y + p.len); g.stroke();
      }
    } else if (kind === 'snow') {
      for (i = 0; i < parts.length; i++) {
        p = parts[i];
        p.y += p.v * f; p.x += (Math.sin(t / 900 + p.p) * 0.4 + slant) * f;
        if (p.y > FH + 6) { p.y = -6; p.x = Math.random() * FW; }
        if (p.x > FW + 6) { p.x = -6; } else if (p.x < -6) { p.x = FW + 6; }
        g.fillStyle = 'rgba(255,255,255,' + p.a.toFixed(2) + ')';
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.2832); g.fill();
      }
    }
    rafId = requestAnimationFrame(frame);
  }
  function syncFx() {                                       // run the loop only when it can be seen
    var on = kind !== 'none' && motionAllowed() && body.dataset.view === 'experience' && exp.dataset.state === 'ready' && !document.hidden;
    if (on && !rafId) { lastT = performance.now(); rafId = requestAnimationFrame(frame); }
    if (!on) { cancelAnimationFrame(rafId); rafId = 0; if (FW) { g.clearRect(0, 0, FW, FH); } }
  }

  /* ---------- search results and quick picks ---------- */
  var matchesEl = $('matches'), matchList = [];
  function placeLabel(p) { return [p.name, p.admin1, p.country || p.country_code].filter(Boolean).join(', '); }
  function clearMatches() {
    matchList = []; matchesEl.hidden = true;
    Array.prototype.slice.call(matchesEl.querySelectorAll('button')).forEach(function (b) { b.remove(); });
  }
  function showMatches(results) {
    clearMatches();
    if (results.length < 2) { return; }
    matchList = results;
    results.forEach(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = placeLabel(p);
      b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () { loadPlace(p, false); });
      matchesEl.appendChild(b);
    });
    matchesEl.hidden = false;
  }
  function markMatch(place) {
    var btns = matchesEl.querySelectorAll('button');
    matchList.forEach(function (p, i) { if (btns[i]) { btns[i].setAttribute('aria-pressed', p === place ? 'true' : 'false'); } });
  }

  /* ---------- interactions ---------- */
  $('searchForm').addEventListener('submit', function (e) { e.preventDefault(); search($('cityInput').value); });
  Array.prototype.forEach.call(document.querySelectorAll('.chip[data-city]'), function (b) {
    b.addEventListener('click', function () { $('cityInput').value = b.dataset.city; search(b.dataset.city); });
  });
  $('refreshBtn').addEventListener('click', function () { if (current) { loadPlace(current.place, false); } });
  $('retryBtn').addEventListener('click', retry);

  function setMode(m, save) {
    mode = m; body.dataset.mode = m;
    Array.prototype.forEach.call(document.querySelectorAll('.seg button'), function (b) {
      b.setAttribute('aria-pressed', b.dataset.mode === m ? 'true' : 'false');
    });
    if (save) { storage.set('mood-mode', m); }
    if (current) { setBackground(current.isDay ? current.group : 'night'); }
    syncFx();
    announce(m === 'minimal' ? 'Minimal mode. Less movement, same data.' : 'Atmospheric mode.');
  }
  Array.prototype.forEach.call(document.querySelectorAll('.seg button'), function (b) {
    b.addEventListener('click', function () { setMode(b.dataset.mode, true); });
  });
  if (reduceQuery.addEventListener) { reduceQuery.addEventListener('change', syncFx); }

  /* ---------- ambient sound (off until the visitor turns it on) ---------- */
  var sounds = { rain: $('sndRain'), wind: $('sndWind'), thunder: $('sndThunder') };
  var soundBtn = $('soundBtn');
  function soundKey() {
    return current ? ({ rain: 'rain', storm: 'thunder', snow: 'wind', cloudy: 'wind' }[current.group] || null) : null;
  }
  function pauseAll(except) {
    Object.keys(sounds).forEach(function (k) { if (sounds[k] !== except && !sounds[k].paused) { sounds[k].pause(); sounds[k].currentTime = 0; } });
  }
  function soundNote(t) { $('announce').textContent = t; }
  function syncSound() {
    soundBtn.textContent = soundOn ? 'SOUND: ON' : 'SOUND: OFF';
    soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
    var live = soundOn && body.dataset.view === 'experience' && current && exp.dataset.state === 'ready';
    var key = soundKey();
    if (!live || !key) { pauseAll(null); return; }
    var el = sounds[key];
    pauseAll(el);
    el.volume = 0.6;                       // loops are levelled to about -16 LUFS, so 0.6 is a gentle bed
    if (el.paused) {
      var p = el.play();
      if (p && p.catch) { p.catch(function () { soundOn = false; syncSound(); soundNote('Your browser blocked the sound. Press the sound button again.'); }); }
    }
  }
  soundBtn.addEventListener('click', function () {
    soundOn = !soundOn;
    syncSound();
    if (!soundOn) { soundNote('Sound off.'); }
    else if (!current) { soundNote('Sound on. Search for a city to hear its weather.'); }
    else if (!soundKey()) { soundNote('Sound on. Clear skies are quiet, so nothing plays here.'); }
    else { soundNote('Sound on.'); }
  });

  /* ---------- screens (landing / experience) and About ---------- */
  function announce(t) { $('announce').textContent = ''; setTimeout(function () { $('announce').textContent = t; }, 30); }
  function route() {
    var explore = location.hash === '#explore';
    body.dataset.view = explore ? 'experience' : 'landing';
    $('landing').hidden = explore; exp.hidden = !explore;
    $('exploreLink').setAttribute('aria-current', explore ? 'page' : 'false');
    window.scrollTo(0, 0);
    if (explore) {
      sizeFx();
      if (window.matchMedia('(hover: hover)').matches) { $('cityInput').focus({ preventScroll: true }); }
      else { $('expTitle').focus({ preventScroll: true }); }
      preload();
    }
    syncFx(); syncSound();
  }
  var preloaded = false;
  function preload() {
    if (preloaded) { return; } preloaded = true;
    ['clear', 'cloudy', 'rain', 'snow', 'storm', 'night'].forEach(function (n) { new Image().src = 'assets/backgrounds/' + n + '.webp'; });
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('visibilitychange', syncFx);
  window.addEventListener('resize', function () { if (!exp.hidden) { sizeFx(); } });

  var dlg = $('aboutDialog'), aboutOpener = null;
  $('aboutBtn').addEventListener('click', function () {
    aboutOpener = document.activeElement;
    if (dlg.showModal) { dlg.showModal(); } else { dlg.setAttribute('open', ''); }
  });
  function closeAbout() { if (dlg.close) { dlg.close(); } else { dlg.removeAttribute('open'); } if (aboutOpener) { aboutOpener.focus(); } }
  $('aboutClose').addEventListener('click', closeAbout);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) { closeAbout(); } });   // click on the backdrop

  /* quiet auto-refresh while the visitor is looking at a city */
  setInterval(function () {
    if (current && body.dataset.view === 'experience' && !document.hidden && exp.dataset.state === 'ready' && !exp.dataset.busy) { loadPlace(current.place, true); }
  }, AUTO_REFRESH_MS);

  /* ---------- start ---------- */
  var saved = storage.get('mood-mode');
  setMode(saved === 'minimal' ? 'minimal' : 'atmospheric', false);
  setState('empty');
  route();
})();
