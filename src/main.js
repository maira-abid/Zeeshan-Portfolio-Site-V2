/* Progressive enhancement only: every page is complete HTML without this file. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* mobile menu */
  var mb = $('.menu-btn'), nav = $('#nav');
  if (mb && nav) {
    mb.addEventListener('click', function () { var o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o ? 'true' : 'false'); mb.textContent = o ? 'Close' : 'Menu'; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { nav.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); mb.textContent = 'Menu'; mb.focus(); } });
  }

  /* "What do you need?" selector: panels are all visible without JS; with JS they become tabs */
  var panels = $$('.proof__panel');
  if (panels.length > 1) {
    var tabs = document.createElement('div'); tabs.className = 'proof__tabs'; tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'What do you need?');
    var btns = panels.map(function (p, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'proof__tab'; b.setAttribute('role', 'tab'); b.id = 'tab-' + i; b.setAttribute('aria-controls', p.id);
      b.textContent = $('.proof__need', p).textContent; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); tabs.appendChild(b); return b;
    });
    var host = $('#proof-tabs'); host.appendChild(tabs);
    var select = function (i, focus) {
      btns.forEach(function (b, j) { b.setAttribute('aria-selected', j === i ? 'true' : 'false'); b.tabIndex = j === i ? 0 : -1; panels[j].hidden = j !== i; });
      if (focus) btns[i].focus();
    };
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { select(i); });
      b.addEventListener('keydown', function (e) {
        var k = e.key, n = btns.length;
        if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); select((i + 1) % n, true); }
        else if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); select((i - 1 + n) % n, true); }
        else if (k === 'Home') { e.preventDefault(); select(0, true); } else if (k === 'End') { e.preventDefault(); select(n - 1, true); }
      });
    });
    $$('.proof__need').forEach(function (n) { n.classList.add('sr-only'); });
    select(0);
  }

  /* reel: frame counter, and drag-to-scroll for mouse users (touch and keyboard scroll natively) */
  var strip = $('.reel__strip');
  if (strip) {
    var frames = $$('.frame', strip), count = $('.reel__count'), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var upd = function () {
      var x = strip.scrollLeft, best = 0, d = 1e9;
      frames.forEach(function (f, i) { var dd = Math.abs(f.offsetLeft - x - 24); if (dd < d) { d = dd; best = i; } });
      if (count) count.textContent = pad(best + 1) + ' / ' + pad(frames.length);
    };
    strip.addEventListener('scroll', upd, { passive: true }); upd();
    var down = false, moved = false, sx = 0, sl = 0;
    strip.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = true; moved = false; sx = e.clientX; sl = strip.scrollLeft; });
    window.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 5) { moved = true; strip.classList.add('drag'); } if (moved) strip.scrollLeft = sl - dx; });
    window.addEventListener('pointerup', function () { down = false; strip.classList.remove('drag'); });
    strip.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    strip.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }

  /* work list: filters + cursor-following preview */
  var fl = $$('.filters button');
  if (fl.length) {
    fl.forEach(function (b) {
      b.addEventListener('click', function () {
        fl.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        var f = b.getAttribute('data-filter');
        $$('.worklist li').forEach(function (li) { li.hidden = !(f === 'all' || (li.getAttribute('data-cats') || '').split(' ').indexOf(f) > -1); });
        var live = $('#filter-live'); if (live) live.textContent = (function (n) { return n + (n === 1 ? ' project shown' : ' projects shown'); })($$('.worklist li:not([hidden])').length);
      });
    });
  }
  /* Image protection (a deterrent, not a lock): no right-click menu, no dragging an image out and no long-press "save image" on images,
     so "Open image in new tab" and "Save image as" are not offered. It cannot stop screenshots or the browser's developer tools. */
  document.addEventListener('contextmenu', function (e) { if (e.target && e.target.tagName === 'IMG') e.preventDefault(); });
  document.addEventListener('dragstart', function (e) { if (e.target && e.target.tagName === 'IMG') e.preventDefault(); });

  /* gallery lightbox (native <dialog>) */
  var dlg = $('dialog.lb');
  if (dlg && typeof dlg.showModal === 'function') {
    var di = $('img', dlg);
    // gallery images are buttons, not links to the image file, so there is no "open in new tab" link to click
    $$('.gallery .zoom').forEach(function (b) {
      b.addEventListener('click', function () { var im = $('img', b); di.src = b.getAttribute('data-full'); di.alt = im ? im.alt : ''; dlg.showModal(); });
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.closest('.in') === e.target || e.target.tagName === 'BUTTON') dlg.close(); });
  }

  /* video facades: nothing loads from Vimeo until you press play */
  $$('.facade[data-vimeo]').forEach(function (f) {
    f.addEventListener('click', function () {
      var ifr = document.createElement('iframe'); ifr.src = 'https://player.vimeo.com/video/' + f.getAttribute('data-vimeo') + '?autoplay=1&dnt=1'; ifr.title = f.getAttribute('data-title') || 'Video';
      ifr.allow = 'autoplay; fullscreen; picture-in-picture'; ifr.setAttribute('allowfullscreen', ''); f.innerHTML = ''; f.appendChild(ifr); f.replaceWith(f); f.style.cursor = 'default'; ifr.focus();
    }, { once: true });
  });

  /* contact form: opens a ready-written email (no server needed) */
  var form = $('form[data-mailto]');
  if (form) {
    var fields = ['name', 'email', 'message'], msgs = { name: 'Add your name.', email: 'Add a valid email address.', message: 'Tell me a little about the project or role.' };
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var ok = true, first = null;
      fields.forEach(function (id) {
        var el = $('#' + id), v = el.value.trim(), bad = !v || (id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
        el.setAttribute('aria-invalid', bad ? 'true' : 'false'); $('#' + id + '-err').textContent = bad ? msgs[id] : ''; if (bad) { ok = false; if (!first) first = el; }
      });
      if (!ok) { first.focus(); return; }
      var body = $('#message').value.trim() + '\n\n' + $('#name').value.trim() + '\n' + $('#email').value.trim() + ($('#company') && $('#company').value.trim() ? '\n' + $('#company').value.trim() : '');
      location.href = 'mailto:' + form.getAttribute('data-mailto') + '?subject=' + encodeURIComponent($('#subject').value.trim() || 'Hello from your portfolio') + '&body=' + encodeURIComponent(body);
      $('#form-status').textContent = 'Your email app should open with the message ready to send. If it does not, write to ' + form.getAttribute('data-mailto') + '.';
    });
  }

  /* ===== interaction layer ===== */
  var root = document.documentElement;
  var motionOn = function () { return root.getAttribute('data-motion') !== 'off'; };
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

  /* pages link to .../index.html so they open from disk; tidy the address bar when served over http(s) */
  if (/^https?:$/.test(location.protocol) && /\/index\.html$/.test(location.pathname)) { try { history.replaceState(null, '', location.pathname.replace(/index\.html$/, '') + location.search + location.hash); } catch (e) {} }

  /* theme and motion switches (choices are remembered) */
  var tb = $('.theme-btn');
  if (tb) {
    var syncTheme = function () { tb.setAttribute('aria-pressed', root.getAttribute('data-theme') === 'light' ? 'true' : 'false'); };
    syncTheme();
    tb.addEventListener('click', function () { var t = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'; root.setAttribute('data-theme', t); try { localStorage.setItem('zs-theme', t); } catch (e) {} syncTheme(); });
  }
  var mo = $('.motion-btn');
  if (mo) {
    mo.removeAttribute('aria-pressed');
    var syncMotion = function () { mo.textContent = 'Motion: ' + (motionOn() ? 'on' : 'off'); };
    syncMotion();
    mo.addEventListener('click', function () { var m = motionOn() ? 'off' : 'on'; root.setAttribute('data-motion', m); try { localStorage.setItem('zs-motion', m); } catch (e) {} syncMotion(); });
  }

  /* kinetic headline on the home page */
  var h1 = $('.hero--home h1');
  if (h1 && motionOn() && !reduce) {
    var n = 0;
    Array.prototype.slice.call(h1.childNodes).forEach(function (node) {
      if (node.nodeType !== 3) return;
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (w) {
        if (!w) return;
        if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
        var o = document.createElement('span'), i = document.createElement('span'); o.className = 'w'; o.style.setProperty('--i', n++); i.textContent = w; o.appendChild(i); frag.appendChild(o);
      });
      h1.replaceChild(frag, node);
    });
  }

  /* project cards: the image drifts against the pointer */
  if (fine && !reduce) {
    $$('.pan').forEach(function (c) {
      c.addEventListener('pointermove', function (e) { if (!motionOn()) return; var r = c.getBoundingClientRect(); c.style.setProperty('--px', ((e.clientX - r.left) / r.width - .5).toFixed(3)); c.style.setProperty('--py', ((e.clientY - r.top) / r.height - .5).toFixed(3)); });
      c.addEventListener('pointerleave', function () { c.style.setProperty('--px', 0); c.style.setProperty('--py', 0); });
    });
  }

  /* numbers count up when they scroll into view (the final value stays in the page for screen readers) */
  var countUp = function (el) {
    var final = el.textContent, parts = final.split(/(\d+)/); if (parts.length < 3) return;
    var vis = document.createElement('span'), sr = document.createElement('span'); vis.setAttribute('aria-hidden', 'true'); sr.className = 'sr-only'; sr.textContent = final;
    el.textContent = ''; el.appendChild(vis); el.appendChild(sr);
    var t0 = performance.now(), dur = 1100;
    (function step(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      vis.textContent = parts.map(function (p, i) { return i % 2 ? Math.round(parseInt(p, 10) * e) : p; }).join('');
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  };
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); if (motionOn()) countUp(en.target); } }); }, { threshold: .6 });
    $$('.band b, .stat b').forEach(function (c) { io.observe(c); });
  }

  /* ===== lab: pointer and scroll effects =====
     Plain JavaScript and CSS, no libraries, no WebGL. Every effect does nothing for Motion: off, reduced-motion and touch screens, only runs
     while something is moving (no idle loops), and a frame-rate guard switches Motion off by itself if the page ever runs below ~30 fps. */
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var slow = 0, lastT = 0;
  var guard = function (t) { // call once per animation frame from the effects below
    if (lastT && t - lastT < 250) { slow = t - lastT > 36 ? slow + 1 : Math.max(0, slow - 1); }
    lastT = t;
    if (slow >= 20 && motionOn()) {
      slow = 0; root.setAttribute('data-motion', 'off'); // not saved: the next visit starts with the visitor's own choice
      if (mo) mo.textContent = 'Motion: off (auto)';
    }
  };

  /* 1. magnetic buttons: the main buttons lean toward the pointer */
  if (fine && !reduce) {
    $$('.btn, .theme-btn, .motion-btn').forEach(function (el) {
      el.classList.add('mag');
      el.addEventListener('pointermove', function (e) {
        if (!motionOn()) return;
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', clamp((e.clientX - (r.left + r.width / 2)) * .22, -9, 9).toFixed(1) + 'px');
        el.style.setProperty('--my', clamp((e.clientY - (r.top + r.height / 2)) * .3, -7, 7).toFixed(1) + 'px');
      });
      el.addEventListener('pointerleave', function () { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); });
    });
  }

  /* 2. home headline: the letters ripple up as the pointer passes */
  var hero = $('.hero--home');
  if (h1 && hero && fine && !reduce && motionOn()) {
    $$('.w > span', h1).forEach(function (inner) {
      var s = inner.textContent; inner.textContent = '';
      s.split('').forEach(function (ch) { var c = document.createElement('span'); c.className = 'c'; c.textContent = ch; inner.appendChild(c); });
    });
    var chars = $$('.c', h1), pts = [], mxp = -999, myp = -999, rafOn = false;
    var measure = function () { pts = chars.map(function (c) { var r = c.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }); };
    var ripple = function (t) {
      guard(t); var any = false;
      for (var i = 0; i < chars.length; i++) {
        var d = Math.sqrt(Math.pow(pts[i][0] - mxp, 2) + Math.pow(pts[i][1] - myp, 2)), k = Math.max(0, 1 - d / 170);
        if (k > 0) any = true;
        chars[i].style.setProperty('--k', k.toFixed(3));
      }
      if (any) requestAnimationFrame(ripple); else rafOn = false;
    };
    hero.addEventListener('pointerenter', measure);
    hero.addEventListener('pointermove', function (e) {
      if (!motionOn()) return;
      mxp = e.clientX; myp = e.clientY;
      if (!pts.length) measure();
      if (!rafOn) { rafOn = true; requestAnimationFrame(ripple); }
    });
    hero.addEventListener('pointerleave', function () { mxp = myp = -999; if (!rafOn) { rafOn = true; requestAnimationFrame(ripple); } });
  }

  /* 3. client strip: it skews with the speed of the scroll */
  var strips = $$('.marquee ul');
  if (strips.length && !reduce) {
    var lastY = window.pageYOffset, sk = 0, queued = false;
    var skew = function (t) {
      guard(t);
      var y = window.pageYOffset, v = y - lastY; lastY = y;
      sk += ((motionOn() ? clamp(v * .3, -10, 10) : 0) - sk) * .18;
      strips.forEach(function (u) { u.style.transform = Math.abs(sk) < .03 ? '' : 'skewX(' + (-sk).toFixed(2) + 'deg)'; });
      if (Math.abs(sk) > .03 || Math.abs(v) > .2) requestAnimationFrame(skew); else queued = false;
    };
    window.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(skew); } }, { passive: true });
  }

  /* 4. themed cursor: a small square is the pointer. Over something clickable (buttons, links, rows, the picture of a card) the square fades away and four
        corner brackets open from the pointer and expand onto that element, then close again when you leave. Text fields keep the normal text cursor.
        Mouse and trackpad only; created on the first real mouse move; off with Motion: off. What is under the pointer is read on every move, so it can never go stale. */
  if (fine && !reduce) {
    var C_TEXT = 'input:not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]';
    var C_LINK = 'a[href], button, summary, select, label[for], [role="button"], .facade, .zoom, input[type="submit"], input[type="checkbox"], input[type="radio"]';
    var cw, frEl, sqEl, cBuilt = false, cx = -100, cy = -100, fx = -100, fy = -100, fw = 14, fh = 14, lockEl = null, cLoop = false, cLast = null;
    var pickLock = function (t) { // the element the brackets should hug, or null
      if (!t || !t.closest) return null;
      var p = t.closest('.pan'); if (p) return $('.pan__img', p) || null;          // home panels: hug the picture
      var w = t.closest('.wcard'); if (w) return $('.wcard__img', w) || null;       // work cards: hug the picture
      var l = t.closest(C_LINK); if (!l) return null;
      var r = l.getBoundingClientRect();
      return (r.height <= 160 || (r.width <= 700 && r.height <= 260)) ? l : null;   // rows, buttons, links; not whole sections
    };
    var cTarget = function () {
      if (lockEl && document.documentElement.contains(lockEl)) { var r = lockEl.getBoundingClientRect(), pad = 7; return [r.left + r.width / 2, r.top + r.height / 2, r.width + pad * 2, r.height + pad * 2]; }
      return [cx, cy, 14, 14];
    };
    var cFrame = function (t) {
      guard(t);
      var g = cTarget(); fx += (g[0] - fx) * .32; fy += (g[1] - fy) * .32; fw += (g[2] - fw) * .32; fh += (g[3] - fh) * .32;
      frEl.style.width = fw.toFixed(1) + 'px'; frEl.style.height = fh.toFixed(1) + 'px';
      frEl.style.transform = 'translate3d(' + (fx - fw / 2).toFixed(1) + 'px,' + (fy - fh / 2).toFixed(1) + 'px,0)';
      if (Math.abs(g[0] - fx) > .3 || Math.abs(g[1] - fy) > .3 || Math.abs(g[2] - fw) > .3 || Math.abs(g[3] - fh) > .3) requestAnimationFrame(cFrame); else cLoop = false;
    };
    var cKick = function () { if (!cLoop && motionOn()) { cLoop = true; requestAnimationFrame(cFrame); } };
    var cBuild = function (x, y) {
      cw = document.createElement('div'); cw.className = 'zk'; cw.setAttribute('aria-hidden', 'true');
      cw.innerHTML = '<div class="zk__fr"><b></b><b></b><b></b><b></b></div><div class="zk__sq"></div>';
      document.body.appendChild(cw); frEl = cw.firstChild; sqEl = cw.lastChild; root.classList.add('zk-on'); root.classList.remove('zk-pre');
      cBuilt = true; fx = cx = x; fy = cy = y; sqEl.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) translate(-50%,-50%)';
    };
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      if (!cBuilt) cBuild(e.clientX, e.clientY);
      cx = e.clientX; cy = e.clientY; cw.classList.remove('is-out');
      sqEl.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0) translate(-50%,-50%)';
      if (e.target !== cLast) { // only when the element under the pointer changes
        cLast = e.target; var was = lockEl; lockEl = pickLock(e.target);
        if (lockEl && !was) { fx = cx; fy = cy; fw = fh = 14; }   // open from the pointer
        cw.classList.toggle('is-on', !!lockEl);
        cw.classList.toggle('is-text', !!(e.target && e.target.closest && e.target.closest(C_TEXT)));
        cKick();
      }
      if (!lockEl && !cLoop) { fx = cx; fy = cy; }               // idle: sit on the pointer, invisible
    }, { passive: true });
    window.addEventListener('scroll', function () { if (lockEl) cKick(); }, { passive: true });
    document.addEventListener('pointerdown', function (e) { if (cBuilt && e.button === 0) cw.classList.add('is-down'); }, { passive: true });
    document.addEventListener('pointerup', function () { if (cBuilt) { cw.classList.remove('is-down'); cLast = null; } }, { passive: true });
    /* carry the pointer position over to the next page, so the cursor is there from the first moment (no flash of the normal arrow) */
    var cSave = function () { if (cBuilt && cx >= 0) { try { sessionStorage.setItem('zk-pos', JSON.stringify({ x: cx, y: cy, t: Date.now() })); } catch (e) {} } };
    window.addEventListener('pagehide', cSave); document.addEventListener('pointerdown', cSave, { passive: true });
    (function () {
      var sp = null; try { sp = JSON.parse(sessionStorage.getItem('zk-pos') || 'null'); sessionStorage.removeItem('zk-pos'); } catch (e) {}
      if (sp && Date.now() - sp.t < 6000 && sp.x >= 0 && sp.x <= window.innerWidth && sp.y >= 0 && sp.y <= window.innerHeight && motionOn()) {
        cBuild(sp.x, sp.y);
        var under = document.elementFromPoint(sp.x, sp.y); // start in the right state if the pointer is already over something clickable
        if (under) { cLast = under; lockEl = pickLock(under); if (lockEl) { fx = cx; fy = cy; fw = fh = 14; cw.classList.add('is-on'); cKick(); } cw.classList.toggle('is-text', !!(under.closest && under.closest(C_TEXT))); }
      } else root.classList.remove('zk-pre');
    })();
    document.documentElement.addEventListener('mouseleave', function () { if (cBuilt) { lockEl = null; cLast = null; cw.classList.remove('is-on'); cw.classList.add('is-out'); } });
  }
})();
