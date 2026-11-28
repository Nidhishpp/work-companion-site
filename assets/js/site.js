/* Work Companion site. Progressive enhancement only: every page works without this file. */

/* Download links live in download.html, written from the latest release by tools/update-downloads.mjs. */

(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  /* Theme */
  function storedTheme() { try { return localStorage.getItem('wc-theme'); } catch (e) { return null; } }
  function saveTheme(t) { try { localStorage.setItem('wc-theme', t); } catch (e) { /* ignore */ } }
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function current() { return root.getAttribute('data-theme') || (mq && mq.matches ? 'dark' : 'light'); }
  var t0 = storedTheme();
  if (t0 === 'light' || t0 === 'dark') root.setAttribute('data-theme', t0);

  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  ready(function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var tt = document.getElementById('theme-toggle');
    function syncToggle() {
      if (!tt) return;
      var dark = current() === 'dark';
      root.setAttribute('data-theme', current());
      tt.setAttribute('aria-pressed', dark ? 'true' : 'false');
      tt.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    }
    if (tt) {
      if (t0 === 'light' || t0 === 'dark') syncToggle();
      else {
        tt.setAttribute('aria-pressed', current() === 'dark' ? 'true' : 'false');
        if (current() === 'dark') root.setAttribute('data-theme', 'dark');
      }
      tt.addEventListener('click', function () {
        var next = current() === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next); saveTheme(next); syncToggle();
      });
    }

    /* Mobile nav */
    var header = document.querySelector('.site-header');
    var nt = document.querySelector('.nav-toggle');
    if (header && nt) {
      nt.addEventListener('click', function () {
        var open = header.classList.toggle('nav-open');
        nt.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && header.classList.contains('nav-open')) {
          header.classList.remove('nav-open'); nt.setAttribute('aria-expanded', 'false'); nt.focus();
        }
      });
      header.querySelectorAll('.site-nav a').forEach(function (a) {
        a.addEventListener('click', function () { header.classList.remove('nav-open'); nt.setAttribute('aria-expanded', 'false'); });
      });
    }

    /* Current page in nav */
    var here = location.pathname.split('/').pop() || '';
    document.querySelectorAll('.site-nav a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href && href.indexOf('#') === -1 && href === here) a.setAttribute('aria-current', 'page');
    });

    /* Reveal on scroll */
    var io = 'IntersectionObserver' in window;
    var reveals = document.querySelectorAll('.reveal');
    if (!io || reduce) reveals.forEach(function (el) { el.classList.add('is-visible'); });
    else {
      var ro = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-visible'); ro.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -5% 0px', threshold: 0 });
      reveals.forEach(function (el) { ro.observe(el); });
    }

    /* Animated SVGs: run only while on screen */
    var animated = document.querySelectorAll('[data-animate]');
    if (!reduce) {
      animated.forEach(function (el) { el.classList.add('anim'); });
      if (io) {
        var ao = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { en.target.classList.toggle('paused', !en.isIntersecting); });
        });
        animated.forEach(function (el) { ao.observe(el); });
      }
    }

    /* Downloads: highlight the visitor's platform */
    var os = detectOS();
    if (os) {
      document.querySelectorAll('.platform[data-os="' + os + '"]').forEach(function (c) { c.classList.add('is-yours'); });
      var names = { windows: 'Windows', mac: 'macOS', linux: 'Linux' };
      document.querySelectorAll('[data-os-name]').forEach(function (s) { s.textContent = names[os]; });
    }

    /* Copy buttons */
    document.querySelectorAll('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var text = b.getAttribute('data-copy');
        var done = function () { var o = b.textContent; b.textContent = 'Copied'; setTimeout(function () { b.textContent = o; }, 1400); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
      });
    });

    /* Legal TOC: highlight the section in view */
    var toc = document.querySelector('.legal .toc');
    if (toc && io) {
      var links = {};
      toc.querySelectorAll('a[href^="#"]').forEach(function (a) { links[decodeURIComponent(a.getAttribute('href').slice(1))] = a; });
      var heads = Object.keys(links).map(function (id) { return document.getElementById(id); }).filter(Boolean);
      var visible = {};
      var to = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
        var active = null;
        for (var i = 0; i < heads.length; i++) { if (visible[heads[i].id]) { active = heads[i].id; break; } }
        if (!active) return;
        Object.keys(links).forEach(function (id) {
          links[id].classList.toggle('is-active', id === active);
          if (id === active) links[id].setAttribute('aria-current', 'location'); else links[id].removeAttribute('aria-current');
        });
      }, { rootMargin: '-80px 0px -60% 0px' });
      heads.forEach(function (h) { to.observe(h); });
    }

    /* Queue demo: one bubble at a time, highest priority first */
    var qd = document.querySelector('[data-queue-demo]');
    if (qd && !reduce) runQueueDemo(qd);
  });

  function detectOS() {
    var p = ((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || '').toLowerCase();
    var ua = navigator.userAgent.toLowerCase();
    if (/android|iphone|ipad/.test(ua)) return null;
    if (p.indexOf('win') > -1) return 'windows';
    if (p.indexOf('mac') > -1) return 'mac';
    if (p.indexOf('linux') > -1 || p.indexOf('x11') > -1) return 'linux';
    return null;
  }

  function runQueueDemo(qd) {
    var items = qd.querySelectorAll('.qd-list li');
    var bubble = qd.querySelector('.qd-bubble');
    var tag = bubble.querySelector('.tag');
    var msg = bubble.querySelector('.msg');
    // `current` is the reminder on screen. The chips and the bubble always
    // show the same one: the bubble fades out, swaps to the new text, and
    // fades back in, and the chips change only when the new text appears.
    var current = 0, timer = null, swap = null, onScreen = false;
    function mark(k) {
      items.forEach(function (li, n) {
        li.classList.toggle('is-active', n === k);
        li.classList.toggle('is-done', n < k);
      });
    }
    function show(k) {
      clearTimeout(swap);
      bubble.classList.add('is-out');
      swap = setTimeout(function () {
        current = k;
        tag.textContent = items[k].getAttribute('data-tag');
        msg.textContent = items[k].getAttribute('data-msg');
        mark(k);
        bubble.classList.remove('is-out');
      }, 350);
    }
    function next() { show((current + 1) % items.length); }
    // Resuming carries on from the reminder on screen rather than restarting.
    function start() { if (!timer) timer = setInterval(next, 2800); }
    function stop() {
      clearInterval(timer); timer = null;
      // Finish a half-done swap so the chips and bubble never disagree.
      if (bubble.classList.contains('is-out')) { clearTimeout(swap); bubble.classList.remove('is-out'); }
    }
    mark(current);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; if (onScreen && !document.hidden) start(); else stop(); }).observe(qd);
      document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (onScreen) start(); });
    }
  }
})();
