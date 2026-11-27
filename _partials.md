# Shared shell (paste on every page)

Head (inside `<head>`, after your own title/description/canonical):

```html
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="assets/css/site.css">
<script src="assets/js/site.js" defer></script>
```

Start of `<body>`:

```html
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="container">
    <a class="brand" href="./"><svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect width="64" height="64" rx="16" fill="#a8471f"/><circle cx="32" cy="27" r="13" fill="#fbf6ee"/><circle cx="27" cy="25" r="2.2" fill="#2b1e16"/><circle cx="37" cy="25" r="2.2" fill="#2b1e16"/><path d="M28.5 30.5q3.5 2.5 7 0" fill="none" stroke="#2b1e16" stroke-width="1.8" stroke-linecap="round"/><path d="M15 34h34l-3 15a6 6 0 0 1-6 5H24a6 6 0 0 1-6-5z" fill="#efe1cc"/><path d="M49 37h2.5a5 5 0 0 1 0 10H47" fill="none" stroke="#efe1cc" stroke-width="3"/><path d="M16 38h32" stroke="#c98b52" stroke-width="3"/><circle cx="22" cy="34" r="3" fill="#fbf6ee"/><circle cx="42" cy="34" r="3" fill="#fbf6ee"/></svg><span>Work Companion<small>by ChaiStack</small></span></a>
    <button class="icon-btn nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Menu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    <nav class="site-nav" id="site-nav" aria-label="Main">
      <ul>
        <li><a href="./#features">Features</a></li>
        <li><a href="./#privacy">Privacy</a></li>
        <li><a href="download.html">Download</a></li>
        <li><a href="support.html">Support</a></li>
      </ul>
      <button class="icon-btn" id="theme-toggle" type="button" aria-pressed="false" aria-label="Switch theme"><svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg></button>
    </nav>
  </div>
</header>
```

Main for legal pages: `<main id="main" class="legal">` with `header.legal-head`, `nav.toc`, `article.prose` (wrap tables in `<div class="table-wrap">`), `aside.callout`, `div.summary-grid > div.summary-card`. Give every h2 an `id` that the TOC links to.

End of `<body>`:

```html
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="brand" href="./"><svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect width="64" height="64" rx="16" fill="#a8471f"/><circle cx="32" cy="27" r="13" fill="#fbf6ee"/><circle cx="27" cy="25" r="2.2" fill="#2b1e16"/><circle cx="37" cy="25" r="2.2" fill="#2b1e16"/><path d="M28.5 30.5q3.5 2.5 7 0" fill="none" stroke="#2b1e16" stroke-width="1.8" stroke-linecap="round"/><path d="M15 34h34l-3 15a6 6 0 0 1-6 5H24a6 6 0 0 1-6-5z" fill="#efe1cc"/><path d="M49 37h2.5a5 5 0 0 1 0 10H47" fill="none" stroke="#efe1cc" stroke-width="3"/><path d="M16 38h32" stroke="#c98b52" stroke-width="3"/><circle cx="22" cy="34" r="3" fill="#fbf6ee"/><circle cx="42" cy="34" r="3" fill="#fbf6ee"/></svg><span>Work Companion<small>by ChaiStack</small></span></a>
        <p>A private desktop companion for your workday. No servers, no accounts, no tracking.</p>
      </div>
      <div>
        <h2>Product</h2>
        <ul>
          <li><a href="./#features">Features</a></li>
          <li><a href="download.html">Download</a></li>
          <li><a href="support.html">Support</a></li>
          <li><a href="support.html#changelog">Changelog</a></li>
        </ul>
      </div>
      <div>
        <h2>Legal</h2>
        <ul>
          <li><a href="privacy.html">Privacy policy</a></li>
          <li><a href="terms.html">Terms of service</a></li>
          <li><a href="cookies.html">Cookie policy</a></li>
          <li><a href="security.html">Security</a></li>
          <li><a href="accessibility.html">Accessibility</a></li>
          <li><a href="licenses.html">Open-source notices</a></li>
          <li><a href="legal.html">Legal hub</a></li>
        </ul>
      </div>
      <div>
        <h2>Contact</h2>
        <ul>
          <li>Help: <a href="mailto:support@chaistack.in">support@chaistack.in</a></li>
          <li>Privacy: <a href="mailto:privacy@chaistack.in">privacy@chaistack.in</a></li>
          <li>General: <a href="mailto:info@chaistack.in">info@chaistack.in</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© 2026 ChaiStack. Work Companion is free software under the MIT License.</p>
    </div>
  </div>
</footer>
```
