/* Work Companion site. Progressive enhancement only: every page works without this file. */

/* Download links. Set a URL to turn a "Coming soon" button into a real download. */
var DOWNLOADS = {
  windowsStore: null, // Microsoft Store listing URL
  windows: null,      // .exe / .msi installer
  mac: null,          // .dmg (universal)
  linux: null         // release page with .AppImage / .deb / .tar.gz
};
var EARLY_ACCESS = 'mailto:support@chaistack.in?subject=Work%20Companion%20early%20access';

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
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
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

    /* Downloads */
    var os = detectOS();
    document.querySelectorAll('[data-download]').forEach(function (a) {
      var key = a.getAttribute('data-download');
      var url = DOWNLOADS[key];
      if (url) {
        a.href = url;
        a.classList.remove('btn-soon'); a.classList.add('btn-primary');
        var label = a.getAttribute('data-label');
        if (label) a.textContent = label;
      } else {
        a.href = EARLY_ACCESS;
      }
    });
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
    var i = 0, timer = null, onScreen = false;
    function step() {
      items.forEach(function (li, k) {
        li.classList.toggle('is-active', k === i);
        li.classList.toggle('is-done', k < i);
      });
      bubble.classList.add('is-out');
      setTimeout(function () {
        tag.textContent = items[i].getAttribute('data-tag');
        msg.textContent = items[i].getAttribute('data-msg');
        bubble.classList.remove('is-out');
      }, 350);
      i = (i + 1) % items.length;
      if (i === 0) setTimeout(function () { items.forEach(function (li) { li.classList.remove('is-done'); }); }, 2600);
    }
    function start() { if (!timer) { step(); timer = setInterval(step, 2800); } }
    function stop() { clearInterval(timer); timer = null; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; if (onScreen && !document.hidden) start(); else stop(); }).observe(qd);
      document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (onScreen) start(); });
    }
  }
})();
