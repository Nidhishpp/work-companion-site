/* Work Companion home page: the characters. The hero screen plays a workday,
   the gang picker lets visitors choose a buddy, and the chosen buddy walks in
   as a guide once they scroll past the hero, saying a line for each section.
   Everything here is decoration: the page reads the same without it. */
(function () {
  'use strict';

  var CHARS = {
    mug: { name: 'Mugsy', blurb: 'Sips, stirs and puffs a little steam.', lines: ['Chai break? You’ve earned it.', 'I’m brewing something good.', 'Sip, sip. Have you had water today?'] },
    robot: { name: 'Bloop', blurb: 'Scans, reboots and busts out a little dance.', lines: ['Beep boop! Water time.', 'Scanning your day… looks great!', 'Rebooting… just kidding. Hi!'] },
    cat: { name: 'Whiskers', blurb: 'Grooms, purrs and chases its own tail.', lines: ['Purr… your meeting is in 5 minutes.', 'I could nap. You could stretch.', 'Mrrp! Pet me, then back to work.'] },
    blob: { name: 'Mochi', blurb: 'Jiggles, bounces and melts into a pancake.', lines: ['Boing! Stretch with me.', 'Squish! That tickles.', 'I’m mostly jelly and good vibes.'] },
    ghost: { name: 'Boo', blurb: 'Floats about and plays peekaboo.', lines: ['Boo! Did you drink water yet?', 'Peekaboo! Time for a break.', 'I’m a friendly ghost, promise.'] },
    spidey: { name: 'Spidey', blurb: 'Swings in on a web and hangs around.', lines: ['Just dropping in: standup in 5!', 'Hanging around till you need me.', 'Thwip! Here’s your reminder.'] },
    owl: { name: 'Hoot', blurb: 'Reads, hoots and turns its head right round.', lines: ['Hoo-hoo. Deep focus, I’ll keep watch.', 'Wise move: take a short break.', 'I read your notes. Nice work!'] },
    plant: { name: 'Sprig', blurb: 'Blooms in the sun and wilts if you forget water.', lines: ['Water for you, water for me.', 'I grow a little every break you take.', 'Sunshine! Go get some.'] },
    dragon: { name: 'Ember', blurb: 'Hovers, puffs smoke and does a tiny roar.', lines: ['Rawr! Great work today.', 'Puff! Time to stop for the day.', 'Tiny dragon, big reminders.'] },
    aviator: { name: 'Pip', blurb: 'Scouts ahead, reads maps and throws paper planes.', lines: ['Pip here, flying in with your next meeting!', 'Clear skies ahead today.', 'Paper plane delivery: take a break!'] }
  };
  var ORDER = ['mug', 'robot', 'cat', 'blob', 'ghost', 'spidey', 'owl', 'plant', 'dragon', 'aviator'];
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var io = 'IntersectionObserver' in window;

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  function src(id) { return 'assets/img/chars/' + id + '.svg'; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function hello(id) { return 'Hi, I’m ' + CHARS[id].name + '! I’ll show you around.'; }

  var buddy = CHARS[get('wc-buddy')] ? get('wc-buddy') : 'mug';
  var listeners = [];
  function choose(id) {
    if (!CHARS[id]) return;
    buddy = id; put('wc-buddy', id);
    listeners.forEach(function (f) { f(id); });
  }

  // Restart a one-shot CSS animation.
  function play(el, cls) {
    if (reduce || !el) return;
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
  }
  function swapImg(img, id) {
    if (!img || img.getAttribute('src') === src(id)) return;
    if (reduce) { img.src = src(id); return; }
    img.classList.add('is-poof');
    setTimeout(function () { img.src = src(id); img.classList.remove('is-poof'); }, 160);
  }

  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  ready(function () {
    document.querySelectorAll('[data-buddy-img]').forEach(function (img) { img.src = src(buddy); });
    listeners.push(function (id) { document.querySelectorAll('[data-buddy-img]').forEach(function (img) { swapImg(img, id); }); });
    stage();
    gang();
    guide();
  });

  /* Hero: a workday plays on the screen, one bubble at a time. */
  function stage() {
    var st = document.querySelector('[data-stage]');
    if (!st) return;
    var btn = st.querySelector('[data-stage-char]'), img = btn.querySelector('img');
    var bubble = st.querySelector('[data-stage-bubble]'), text = st.querySelector('[data-stage-text]');
    var join = st.querySelector('[data-stage-join]'), clock = st.querySelector('[data-clock]');
    var pause = st.querySelector('[data-stage-pause]');
    var SCRIPT = [
      ['9:00', 'Good morning! Ready when you are ☀️'],
      ['9:55', 'Standup in 5 minutes', true],
      ['11:30', 'Time for some water 💧'],
      ['15:00', 'Stand up and stretch with me 🙆'],
      ['18:00', 'Great work today. Time to log off 🌙']
    ];
    var i = 0, timer = null, swap = null, onScreen = !io, paused = reduce;

    function render() { clock.textContent = SCRIPT[i][0]; text.textContent = SCRIPT[i][1]; join.hidden = !SCRIPT[i][2]; }
    function next() {
      clearTimeout(swap);
      bubble.classList.add('is-out');
      swap = setTimeout(function () { i = (i + 1) % SCRIPT.length; render(); bubble.classList.remove('is-out'); play(btn, 'is-hop'); }, 300);
    }
    function start() { if (!timer && onScreen && !paused && !document.hidden) timer = setInterval(next, 3400); }
    function stop() { clearInterval(timer); timer = null; }
    function syncPause() {
      pause.textContent = paused ? 'Play' : 'Pause';
    }

    img.src = src(buddy);
    btn.setAttribute('aria-label', 'Meet the next character. Now showing ' + CHARS[buddy].name);
    btn.addEventListener('click', function () {
      choose(ORDER[(ORDER.indexOf(buddy) + 1) % ORDER.length]);
      play(btn, 'is-hop');
    });
    listeners.push(function (id) {
      swapImg(img, id);
      btn.setAttribute('aria-label', 'Meet the next character. Now showing ' + CHARS[id].name);
    });
    pause.addEventListener('click', function () {
      paused = !paused; syncPause();
      if (paused) stop(); else { next(); start(); }
    });
    syncPause();
    if (io) {
      new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; if (onScreen) start(); else stop(); }).observe(st);
    } else start();
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  }

  /* Gang: pick a buddy. Tapping the current one makes it talk. */
  function gang() {
    var root = document.querySelector('[data-gang]');
    if (!root) return;
    var btns = root.querySelectorAll('[data-char]');
    var pic = root.querySelector('.gang-pic'), img = root.querySelector('[data-gang-img]');
    var name = root.querySelector('[data-gang-name]'), blurb = root.querySelector('[data-gang-blurb]'), say = root.querySelector('[data-gang-say]');

    function show(id, line) {
      btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-char') === id ? 'true' : 'false'); });
      swapImg(img, id);
      name.textContent = CHARS[id].name;
      blurb.textContent = CHARS[id].blurb;
      say.textContent = line || hello(id);
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-char');
        put('wc-guide', 'on');
        if (id === buddy) show(id, pick(CHARS[id].lines)); else choose(id);
        play(pic, 'is-hop');
        play(say, 'is-pop');
      });
    });
    listeners.push(function (id) { show(id); });
    show(buddy);
  }

  /* Guide: the chosen buddy walks in once the hero is scrolled past and
     says a line for each section. Tap it to chat, or send it away. */
  function guide() {
    var hero = document.querySelector('[data-hero]');
    if (!hero || !io) return;

    var el = document.createElement('div');
    el.className = 'guide';
    el.innerHTML =
      '<p class="guide-bubble" aria-hidden="true"></p>' +
      '<button class="guide-char" type="button"><img alt="" width="120" height="120"></button>' +
      '<button class="guide-close" type="button" aria-label="Send the guide away"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>';
    document.body.appendChild(el);
    document.documentElement.classList.add('has-guide');

    var bubble = el.querySelector('.guide-bubble'), charBtn = el.querySelector('.guide-char');
    var img = charBtn.querySelector('img'), close = el.querySelector('.guide-close');
    var shown = false, pastHero = false, talkTimer = null, walkTimer = null, roamTimer = null;
    var said = {};
    var wide = window.matchMedia('(min-width: 900px)');

    function label() { charBtn.setAttribute('aria-label', 'Say hi to ' + CHARS[buddy].name); }
    img.src = src(buddy); label();

    function say(line) {
      if (!shown) return;
      bubble.textContent = line;
      bubble.classList.add('is-on');
      play(bubble, 'is-pop');
      clearTimeout(talkTimer);
      talkTimer = setTimeout(function () { bubble.classList.remove('is-on'); }, 4000);
    }
    function walk(x, ms) {
      el.style.setProperty('--walk', (reduce ? 0 : ms) + 'ms');
      el.style.setProperty('--x', x);
      if (reduce) return;
      el.classList.add('is-walking');
      clearTimeout(walkTimer);
      walkTimer = setTimeout(function () { el.classList.remove('is-walking'); }, ms);
    }
    function roam() {
      clearTimeout(roamTimer);
      if (reduce) return;
      roamTimer = setTimeout(function () {
        if (shown && wide.matches && !bubble.classList.contains('is-on')) {
          var span = Math.min(360, window.innerWidth * 0.3);
          walk(-Math.round(Math.random() * span) + 'px', 1800);
        }
        roam();
      }, 9000 + Math.random() * 7000);
    }
    function enter() {
      if (shown || get('wc-guide') === 'off') return;
      shown = true;
      el.classList.add('is-in');
      walk('0px', 1400);
      setTimeout(function () { say(hello(buddy)); }, reduce ? 0 : 1300);
      roam();
    }
    function leave() {
      if (!shown) return;
      shown = false;
      bubble.classList.remove('is-on');
      clearTimeout(roamTimer);
      walk('calc(100% + 40px)', 1200);
      setTimeout(function () { if (!shown) el.classList.remove('is-in'); }, reduce ? 0 : 1200);
    }

    el.style.setProperty('--x', 'calc(100% + 40px)');
    charBtn.addEventListener('click', function () { play(charBtn, 'is-hop'); say(pick(CHARS[buddy].lines)); });
    close.addEventListener('click', function () {
      put('wc-guide', 'off');
      say('Okay, bye for now! Pick me again any time.');
      setTimeout(leave, reduce ? 0 : 900);
    });

    listeners.push(function (id) {
      swapImg(img, id); label();
      if (shown) say(hello(id));
    });

    // Show the guide below the hero, but step aside while the character
    // picker is on screen: the picker already shows the character, and on a
    // phone the guide would cover its buttons.
    var picker = document.querySelector('[data-gang]'), inPicker = false;
    function update() { if (pastHero && !inPicker) enter(); else leave(); }
    var watch = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.target === hero) pastHero = !e.isIntersecting && e.boundingClientRect.top < 0;
        else inPicker = e.isIntersecting;
      });
      update();
    }, { rootMargin: '-90px 0px 0px 0px' });
    watch.observe(hero);
    if (picker) watch.observe(picker);

    var sections = document.querySelectorAll('[data-guide-line]');
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var line = e.target.getAttribute('data-guide-line');
        var now = Date.now();
        if (said[line] && now - said[line] < 30000) return;
        if (!shown) return;
        said[line] = now;
        say(line);
      });
    }, { rootMargin: '-40% 0px -50% 0px' });
    sections.forEach(function (s) { so.observe(s); });
  }
})();
