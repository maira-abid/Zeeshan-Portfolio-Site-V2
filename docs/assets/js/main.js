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
  var rows = $$('.worklist a[data-img]');
  if (rows.length && window.matchMedia('(pointer: fine)').matches && !reduce) {
    var peek = document.createElement('div'); peek.className = 'peek'; peek.setAttribute('aria-hidden', 'true'); peek.innerHTML = '<img alt="" width="300" height="225">'; document.body.appendChild(peek);
    var pimg = $('img', peek), x = 0, y = 0, tx = 0, ty = 0, raf = 0;
    var loop = function () { x += (tx - x) * 0.16; y += (ty - y) * 0.16; peek.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) rotate(' + ((tx - x) * 0.04).toFixed(2) + 'deg)'; raf = requestAnimationFrame(loop); };
    rows.forEach(function (a) {
      a.addEventListener('pointerenter', function (e) { pimg.src = a.getAttribute('data-img'); peek.style.setProperty('--pa', a.getAttribute('data-pa') || ''); tx = x = e.clientX + 24; ty = y = e.clientY - 70; peek.classList.add('on'); if (!raf) loop(); });
      a.addEventListener('pointermove', function (e) { tx = e.clientX + 24; ty = e.clientY - 70; });
      a.addEventListener('pointerleave', function () { peek.classList.remove('on'); cancelAnimationFrame(raf); raf = 0; });
    });
  }

  /* gallery lightbox (native <dialog>) */
  var dlg = $('dialog.lb');
  if (dlg && typeof dlg.showModal === 'function') {
    var di = $('img', dlg);
    $$('.gallery a').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); var im = $('img', a); di.src = a.href; di.alt = im ? im.alt : ''; dlg.showModal(); });
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

  /* hero: a film frame of each project follows the pointer over the headline and changes as you travel */
  var htop = $('.hero__top');
  if (htop && fine && !reduce) {
    var list = []; try { list = JSON.parse(htop.getAttribute('data-lens') || '[]'); } catch (e) {}
    if (list.length) {
      var lens = document.createElement('div'); lens.className = 'lens'; lens.setAttribute('aria-hidden', 'true');
      lens.innerHTML = '<img alt="" width="400" height="300"><div class="lens__tag"><span></span><span></span></div>'; htop.appendChild(lens);
      var limg = $('img', lens), ltags = $$('.lens__tag span', lens), hint = $('.lens-hint'), li = -1, travelled = 0, lastX = null, lastY = null, lx = 0, ly = 0, ltx = 0, lty = 0, lraf = 0, started = false;
      var showFrame = function (i) { li = (i + list.length) % list.length; limg.src = list[li][0]; ltags[0].textContent = list[li][1]; ltags[1].textContent = pad2(li + 1); };
      var lloop = function () { lx += (ltx - lx) * .2; ly += (lty - ly) * .2; lens.style.transform = 'translate3d(' + lx.toFixed(1) + 'px,' + ly.toFixed(1) + 'px,0) rotate(' + ((ltx - lx) * .035).toFixed(2) + 'deg)'; lraf = requestAnimationFrame(lloop); };
      htop.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse' || !motionOn()) return;
        var r = htop.getBoundingClientRect(); ltx = e.clientX - r.left - lens.offsetWidth / 2; lty = e.clientY - r.top - lens.offsetHeight / 2;
        if (!started) { started = true; lx = ltx; ly = lty; showFrame(0); lens.classList.add('on'); if (hint) hint.classList.add('used'); if (!lraf) lloop(); }
        if (lastX !== null) { travelled += Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY); if (travelled > 340) { travelled = 0; showFrame(li + 1); } }
        lastX = e.clientX; lastY = e.clientY; lens.classList.add('on');
        if (!lraf) lloop();
      });
      htop.addEventListener('pointerleave', function () { lens.classList.remove('on'); cancelAnimationFrame(lraf); lraf = 0; started = false; lastX = lastY = null; });
    }
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
})();
