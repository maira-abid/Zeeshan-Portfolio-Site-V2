/*
 * Exports what Framer can take, from this site's content and from the editorial choices in build.js:
 *   framer/cms/categories.csv, industries.csv, projects.csv, privacy-policy.html
 *   framer/assets/thumbs, featured, tall   (upload-ready web-size pictures)
 *   framer/components/FeaturedPanels.tsx   (its six default panels are rewritten between the generated markers)
 *   framer/seo/seo.csv, site-jsonld.html, llms.txt, og/*.jpg   (from the built docs/ pages: run `node build.js --pages` first)
 * Run:  node export-framer.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
const F = path.join(ROOT, 'framer');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'content', 'data.js'), 'utf8'), ctx);
const S = ctx.window.SITE;

// ---- read the editorial maps out of build.js (so there is one source of truth) ----
const build = fs.readFileSync(path.join(ROOT, 'build.js'), 'utf8');
function grab(name) {
  const i = build.indexOf('const ' + name + ' =');
  if (i < 0) throw new Error('build.js has no const ' + name);
  let j = build.indexOf('=', i) + 1;
  while (/\s/.test(build[j])) j++;
  const open = build[j], close = open === '{' ? '}' : ']';
  if (open !== '{' && open !== '[') throw new Error(name + ' is not an object or array literal');
  let depth = 0, q = null, k = j;
  for (; k < build.length; k++) {
    const c = build[k];
    if (q) { if (c === '\\') { k++; continue; } if (c === q) q = null; continue; }
    if (c === '/' && build[k + 1] === '/') { while (k < build.length && build[k] !== '\n') k++; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === open) depth++;
    if (c === close && --depth === 0) break;
  }
  return vm.runInNewContext('(' + build.slice(j, k + 1) + ')');
}
const CASES = grab('CASES'), GALLERIES = grab('GALLERIES'), HERO = grab('HERO'), THEME = grab('THEME'), OUTCOME = grab('OUTCOME'),
  ROW = grab('ROW'), TLDR = grab('TLDR'), PANEL = grab('PANEL');
const ORDER = [...CASES, ...GALLERIES];
const projects = ORDER.map((slug) => S.projects.find((p) => p.slug === slug)).filter(Boolean);

const csvCell = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
const csv = (rows) => '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const catName = (id) => S.categories.find((c) => c.id === id).name;
const indName = (id) => S.industries.find((c) => c.id === id).name;
const mk = (d) => fs.mkdirSync(d, { recursive: true });
mk(path.join(F, 'cms')); mk(path.join(F, 'components')); mk(path.join(F, 'seo', 'og'));

fs.writeFileSync(path.join(F, 'cms', 'categories.csv'), csv([['Title', 'Slug', 'Order'], ...S.categories.map((c, i) => [c.name, c.id, i + 1])]));
fs.writeFileSync(path.join(F, 'cms', 'industries.csv'), csv([['Title', 'Slug', 'Order'], ...S.industries.map((c, i) => [c.name, c.id, i + 1])]));

function writeupHTML(p) {
  const out = [];
  p.blocks.forEach((b) => {
    if (b.type === 'section') {
      out.push('<h2>' + esc(b.title) + '</h2>');
      (b.paras || []).forEach((t) => out.push('<p>' + esc(t) + '</p>'));
      if (b.stats) out.push('<ul>' + b.stats.map((s) => '<li><strong>' + esc(s.n) + '</strong> ' + esc(s.l) + '</li>').join('') + '</ul>');
      else if (b.bullets) out.push('<ul>' + b.bullets.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>');
    } else if (b.type === 'media' && b.heading) {
      out.push('<h2>' + esc(b.heading) + '</h2>');
      b.items.forEach((m) => { if (m.t === 'vimeo') out.push('<p><a href="https://vimeo.com/' + m.id + '">' + esc(m.title || 'Watch on Vimeo') + '</a></p>'); });
    }
  });
  return out.join('\n');
}
const pictures = (p) => {
  const files = [];
  const add = (m) => { if (m && m.src && (m.t === 'img' || m.t === 'scroll')) files.push('content/img/' + m.src); };
  add(p.lead);
  p.blocks.forEach((b) => { (b.media || []).forEach(add); (b.items || []).forEach(add); });
  return files.join('; ');
};
const keyResults = (p) => {
  const b = p.blocks.filter((x) => x.stats)[0];
  return b ? b.stats.map((s) => String(s.n).replace(/^-(?=\d)/, '−').replace(/(\d)-(\d)/g, '$1–$2') + ' ' + s.l).join(' · ') : '';
};
const panelImg = (slug) => (PANEL[slug] ? PANEL[slug].img : HERO[slug]);

const rows = [['Title', 'Slug', 'Client', 'Categories', 'Industries', 'Summary', 'Two-sentence summary', 'Thumbnail (file)', 'Lead video (Vimeo URL)', 'Write-up', 'Images to place (files)',
  'Full case study', 'Featured', 'Key results (one line)', 'Work list: number', 'Work list: after number', 'Home panel: kicker', 'Home panel: big number', 'Home panel: after number',
  'Home panel: outcome', 'Home panel: colour', 'Home panel: text colour', 'Home panel: image (file)', 'Home panel: image focus']];
projects.forEach((p) => {
  const m = S.featuredMeta[p.slug], row = ROW[p.slug] || ['', ''];
  rows.push([p.title, p.slug, p.client, p.categories.map(catName).join(', '), p.industries.map(indName).join(', '), p.summary, TLDR[p.slug] || '',
    'framer/assets/thumbs/' + p.slug + '.webp', p.lead.t === 'vimeo' ? 'https://vimeo.com/' + p.lead.id : '', writeupHTML(p), pictures(p),
    CASES.includes(p.slug) ? 'true' : 'false', S.featured.includes(p.slug) ? 'true' : 'false', keyResults(p), row[0], row[1],
    m ? m.need : '', m ? m.metric : '', m ? m.words : '', OUTCOME[p.slug] || (m && m.outcome) || '', THEME[p.slug][0], THEME[p.slug][1],
    m ? 'framer/assets/featured/' + p.slug + '.webp' : '', m ? ((PANEL[p.slug] && PANEL[p.slug].pos) || '50% 50%') : '']);
});
fs.writeFileSync(path.join(F, 'cms', 'projects.csv'), csv(rows));

// Privacy policy
{
  const P = S.privacy;
  const li = (a) => '<ul>' + a.map((t) => '<li>' + t + '</li>').join('') + '</ul>';
  const html = ['<h1>Privacy Policy</h1>', '<p>Last updated: ' + esc(P.updated) + '</p>'].concat(P.sections.map((sec, i) =>
    '<h2>' + (i + 1) + '. ' + esc(sec.title) + '</h2>' + (sec.paras || []).map((t) => '<p>' + esc(t) + '</p>').join('') + (sec.list ? li(sec.list) : '') + (sec.after ? '<p>' + esc(sec.after) + '</p>' : '') +
    (sec.contact ? '<p>' + esc(S.fullName) + '<br>Toronto, Ontario, Canada<br>Email: ' + esc(P.email || '[email address to be added]') + '</p>' : ''))).join('\n');
  fs.writeFileSync(path.join(F, 'cms', 'privacy-policy.html'), html);
}

// Pictures (web-size files already in content/img; never the full-size originals)
{
  const img = path.join(ROOT, 'content', 'img'), out = path.join(F, 'assets');
  const copy = (src, dir, name) => { mk(path.join(out, dir)); fs.copyFileSync(path.join(img, src), path.join(out, dir, name)); };
  ['thumbs', 'featured', 'tall'].forEach((d) => fs.rmSync(path.join(out, d), { recursive: true, force: true }));
  projects.forEach((p) => copy(HERO[p.slug], 'thumbs', p.slug + '.webp'));
  S.featured.forEach((slug) => copy(panelImg(slug), 'featured', slug + '.webp'));
  const tall = [];
  projects.forEach((p) => p.blocks.forEach((b) => (b.items || []).concat(b.media || []).forEach((m) => { if (m.t === 'scroll') tall.push(m.src); })));
  tall.forEach((src) => copy(src, 'tall', src.replace('/', '-')));
  console.log('assets:', projects.length, 'thumbs,', S.featured.length, 'featured,', tall.length, 'tall designs');
}

// Default panels in FeaturedPanels.tsx
{
  const f = path.join(F, 'components', 'FeaturedPanels.tsx');
  if (fs.existsSync(f)) {
    let src = fs.readFileSync(f, 'utf8');
    const items = S.featured.map((slug) => {
      const p = S.projects.find((x) => x.slug === slug), m = S.featuredMeta[slug];
      return { kicker: m.need, metric: m.metric, words: m.words, title: p.title, outcome: OUTCOME[slug] || m.outcome, chips: p.categories.map(catName).join(', '), href: '/work/' + slug,
        panel: THEME[slug][0], text: THEME[slug][1], imageFile: slug + '.webp', imagePos: (PANEL[slug] && PANEL[slug].pos) || '50% 50%', alt: (PANEL[slug] && PANEL[slug].alt) || m.alt };
    });
    src = src.replace(/\/\/ <generated:items>[\s\S]*?\/\/ <\/generated:items>/, () => '// <generated:items>\nconst DEFAULT_ITEMS: Item[] = ' + JSON.stringify(items, null, 4) + '\n// </generated:items>');
    fs.writeFileSync(f, src);
  }
}

// SEO pack from the built pages in docs/ (titles, descriptions, share images, structured data)
{
  const docs = path.join(ROOT, 'docs');
  if (fs.existsSync(path.join(docs, 'index.html'))) {
    const pages = [];
    (function walk(dir, rel) {
      fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
        if (e.isDirectory()) { if (e.name !== 'assets') walk(path.join(dir, e.name), rel + e.name + '/'); }
        else if (e.name === 'index.html') pages.push(rel);
      });
    })(docs, '');
    const dec = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    const seoRows = [['Page', 'Path', 'Title', 'Description', 'Share image']];
    pages.sort().forEach((rel) => {
      const h = fs.readFileSync(path.join(docs, rel, 'index.html'), 'utf8');
      const title = (h.match(/<title>([^<]*)/) || [])[1], desc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1], og = (h.match(/property="og:image" content="[^"]*\/og\/([^"]+)"/) || [])[1];
      seoRows.push([rel === '' ? 'Home' : rel.replace(/\/$/, ''), '/' + rel, dec(title), dec(desc), og ? 'og/' + og : '']);
    });
    fs.writeFileSync(path.join(F, 'seo', 'seo.csv'), csv(seoRows));
    const idx = fs.readFileSync(path.join(docs, 'index.html'), 'utf8');
    const ld = [...idx.matchAll(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g)].map((m) => m[0]).join('\n');
    fs.writeFileSync(path.join(F, 'seo', 'site-jsonld.html'), '<!-- Site Settings > General > Custom Code > End of <head>. Replace the domain (currently the GitHub preview address) with the real one first. Needs a paid Framer plan. -->\n' + ld + '\n');
    if (fs.existsSync(path.join(docs, 'llms.txt'))) fs.copyFileSync(path.join(docs, 'llms.txt'), path.join(F, 'seo', 'llms.txt'));
    const ogDir = path.join(docs, 'assets', 'og');
    if (fs.existsSync(ogDir)) fs.readdirSync(ogDir).forEach((f) => fs.copyFileSync(path.join(ogDir, f), path.join(F, 'seo', 'og', f)));
    console.log('seo:', seoRows.length - 1, 'pages');
  } else console.log('seo: docs/ not built, skipped (run node build.js --pages first)');
}
console.log('exported', S.categories.length, 'categories,', S.industries.length, 'industries,', projects.length, 'projects (hidden ones left out)');
