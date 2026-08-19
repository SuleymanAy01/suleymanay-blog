(function () {
  'use strict';

  const KEY = 'suleymanay-admin-theme';
  const siteKey = 'theme';
  const DARK = 'dark';
  const LIGHT = 'light';

  function preferred() {
    const saved = localStorage.getItem(KEY) || localStorage.getItem(siteKey);
    if (saved === LIGHT || saved === DARK) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK : LIGHT;
  }

  function updateMeta(theme) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === DARK ? '#141210' : '#f4f1e9');
  }

  function updateButton(theme) {
    const btn = document.querySelector('.sa-admin-theme-toggle');
    if (!btn) return;
    const dark = theme === DARK;
    btn.setAttribute('aria-label', dark ? 'Açık temaya geç' : 'Koyu temaya geç');
    btn.title = dark ? 'Açık tema' : 'Koyu tema';
    const icon = btn.querySelector('.sa-admin-theme-icon');
    const label = btn.querySelector('.sa-admin-theme-label');
    if (icon) icon.textContent = dark ? '☀' : '☾';
    if (label) label.textContent = dark ? 'Açık' : 'Koyu';
  }

  function injectPreviewStyles(frame, theme) {
    try {
      const doc = frame.contentDocument;
      if (!doc) return;
      let style = doc.getElementById('sa-admin-preview-theme');
      if (!style) {
        style = doc.createElement('style');
        style.id = 'sa-admin-preview-theme';
        doc.head.appendChild(style);
      }
      style.textContent = theme === DARK ? `
        :root,body{background:#141210 !important;color:#eee6d8 !important;color-scheme:dark !important}
        body{margin:0}
        a{color:#d2a15c !important}
        ::selection{background:rgba(210,161,92,.28)}
        input,textarea,select,[contenteditable="true"]{background:#1b1815 !important;color:#eee6d8 !important;border-color:#342c23 !important}
        img{max-width:100%}
      ` : `
        :root,body{background:#f4f1e9 !important;color:#1b1916 !important;color-scheme:light !important}
        body{margin:0}
        a{color:#a56d25 !important}
        input,textarea,select,[contenteditable="true"]{background:#fbfaf6 !important;color:#1b1916 !important;border-color:#d8d0c1 !important}
        img{max-width:100%}
      `;
      frame.classList.toggle('sa-admin-preview-dark', theme === DARK);
    } catch (_) {
      /* Cross-document access can fail for an external preview; CSS still handles the admin shell. */
    }
  }

  function fixPreviewFrames(theme) {
    document.querySelectorAll('#nc-root iframe').forEach(function (frame) {
      if (!frame.dataset.saThemeBound) {
        frame.dataset.saThemeBound = '1';
        frame.addEventListener('load', function () {
          injectPreviewStyles(frame, document.documentElement.dataset.adminTheme || preferred());
        });
      }
      injectPreviewStyles(frame, theme);
    });
  }

  function markWhiteSurfaces(theme) {
    if (theme !== DARK) {
      document.querySelectorAll('[data-sa-dark-surface="1"]').forEach(function (el) {
        el.removeAttribute('data-sa-dark-surface');
      });
      return;
    }

    const skip = new Set(['HTML', 'BODY', 'SVG', 'PATH', 'IMG', 'VIDEO', 'CANVAS', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'BUTTON']);
    const nodes = document.querySelectorAll('#nc-root div, #nc-root section, #nc-root article, #nc-root main, #nc-root aside, #nc-root form, #nc-root label');

    nodes.forEach(function (el) {
      if (skip.has(el.tagName) || el.dataset.saKeepLight === '1') return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 40 || rect.height < 24) return;
      const cs = getComputedStyle(el);
      const bg = cs.backgroundColor;
      if (!bg) return;
      const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
      if (!match) return;
      const r = +match[1], g = +match[2], b = +match[3], a = match[4] === undefined ? 1 : +match[4];
      if (a > 0.85 && r > 238 && g > 238 && b > 238) {
        el.setAttribute('data-sa-dark-surface', '1');
      }
    });
  }

  function paint(theme) {
    document.documentElement.dataset.adminTheme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(KEY, theme);
    updateMeta(theme);
    updateButton(theme);
    fixPreviewFrames(theme);
    markWhiteSurfaces(theme);
  }

  function mount() {
    paint(document.documentElement.dataset.adminTheme || preferred());
    if (document.querySelector('.sa-admin-theme-toggle')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sa-admin-theme-toggle';
    btn.innerHTML = '<span class="sa-admin-theme-icon" aria-hidden="true"></span><span class="sa-admin-theme-label"></span>';
    btn.addEventListener('click', function () {
      paint(document.documentElement.dataset.adminTheme === DARK ? LIGHT : DARK);
    });
    document.body.appendChild(btn);
    updateButton(document.documentElement.dataset.adminTheme || preferred());
  }

  function start() {
    if (!document.body) return setTimeout(start, 50);
    mount();

    let timer = 0;
    const observer = new MutationObserver(function () {
      if (timer) return;
      timer = window.setTimeout(function () {
        timer = 0;
        const theme = document.documentElement.dataset.adminTheme || preferred();
        fixPreviewFrames(theme);
        markWhiteSurfaces(theme);
        if (!document.querySelector('.sa-admin-theme-toggle')) mount();
      }, 80);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    window.setInterval(function () {
      const theme = document.documentElement.dataset.adminTheme || preferred();
      fixPreviewFrames(theme);
      markWhiteSurfaces(theme);
    }, 1200);
  }

  document.addEventListener('DOMContentLoaded', start);
})();
