/*
 * Builds the static site from the portfolio data in ./content/data.js and the optimised images in ./content/img.
 *   node build.js            local preview  -> ./public   (links end in index.html, so it also opens from a double-click)
 *   node build.js --pages    GitHub Pages   -> ./docs     (clean links; this is the folder Pages serves)
 *   node build.js --live     real host      -> ./public   (clean links; indexable once the domain and email are real)
 * Output is plain HTML + one CSS file + one small JS file (progressive enhancement only). No framework, no runtime rendering.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const sharp = require('sharp');

const PAGES = process.argv.includes('--pages');
const PAGES_URL = 'https://maira-abid.github.io/Zeeshan-Portfolio-Site-V2'; // where GitHub Pages serves this repo
const HERE = __dirname, OUT = process.env.OUT_DIR || path.join(HERE, PAGES ? 'docs' : 'public'), SITE = path.join(HERE, 'content');

/* ---------- things to confirm / replace ---------- */
const CONFIG = {
  url: 'https://www.example.com',            // TODO: real domain (no trailing slash)
  email: 'hello@example.com',                // TODO: real email address
  availability: 'Open to new roles and projects', // TODO: confirm (shown in the home page pill; set '' to hide)
  indexable: false,                          // set true when this version should be searched/indexed
  resumeUrl: '',                             // TODO: link to a PDF résumé (shown only if set)
  social: [                                  // TODO: paste your profile URLs; a link appears in the footer (and in search data) only once its URL is set
    { label: 'Behance', href: 'https://www.behance.net/Zeeshan-Abid' },
    { label: 'Vimeo', href: 'https://vimeo.com/zeeshanabid' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/zeeshan-abid1/' },
    { label: 'Instagram', href: 'https://www.instagram.com/zeeshanabid_photodesign/' },
  ],
};
// Real values can also be passed without editing this file:  SITE_URL=https://yourdomain.com SITE_EMAIL=you@yourdomain.com node build.js --live
if (PAGES) CONFIG.url = PAGES_URL;
if (process.env.SITE_URL) CONFIG.url = process.env.SITE_URL.replace(/\/$/, '');
if (process.env.SITE_EMAIL) CONFIG.email = process.env.SITE_EMAIL;
const socials = () => CONFIG.social.filter((s) => s.href && s.href !== '#');
const hasEmail = () => !/@example\.com$/i.test(CONFIG.email);
const hasDomain = () => !/example\.com/i.test(CONFIG.url);
// `node build.js --live` builds for a real web host: clean folder links (/work/ not /work/index.html) and, once the domain and email are real, indexable.
// The default build keeps explicit index.html links so the site also opens straight from disk.
const LIVE = process.argv.includes('--live') || PAGES;
CONFIG.cleanLinks = LIVE;
if (LIVE) CONFIG.indexable = hasDomain() && hasEmail();
CONFIG.headshotUrl = CONFIG.headshotUrl || ''; // TODO: absolute URL of a headshot, added to the Person search data when set

/* ---------- load the portfolio data ---------- */
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(SITE, 'data.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(SITE, 'media.js'), 'utf8'), ctx);
const S = ctx.window.SITE, MEDIA = ctx.window.MEDIA, SEO = S.seo;
const proj = (slug) => S.projects.find((p) => p.slug === slug);
const catName = (id) => S.categories.find((c) => c.id === id).name;
const indName = (id) => S.industries.find((c) => c.id === id).name;

/* ---------- editorial choices ---------- */
// Only work that can be defended with a story is a full case study. Projects with no write-up yet are left out of this version.
const CASES = ['pizza-now', 'collegiate-survival-sale', 'carswitch', 'evercare', 'breakfast-box', 'black-friday'];
const GALLERIES = ['byte-app', 'annual-winter-sale', 'generation-magazines']; // 'tango-photos' is hidden at the owner's request: add it back to this list to show it again
const ORDER = [...CASES, ...GALLERIES];
const THEME = { // each project's own colour, taken from the work, and the text colour that is readable on it
  // every project uses white text (owner's choice). The four light colours from the work (orange, pink, mint, beige) are darkened only slightly, to about 3.2:1 with white:
  // enough for large text (3:1) but still under 4.5:1 for small text, so the build below still warns about them.
  'pizza-now': ['#17763a', '#ffffff'], 'collegiate-survival-sale': ['#d3202b', '#ffffff'], carswitch: ['#c97c00', '#ffffff'], evercare: ['#14367a', '#ffffff'],
  'breakfast-box': ['#dc6b8e', '#ffffff'], 'black-friday': ['#14a074', '#ffffff'], 'byte-app': ['#c4312f', '#ffffff'], 'annual-winter-sale': ['#b3121a', '#ffffff'],
  'generation-magazines': ['#a08b64', '#ffffff'], 'tango-photos': ['#c2185b', '#ffffff'],
};
const HERO = {
  'pizza-now': 'pizza-now/box-1.webp', 'breakfast-box': 'breakfast-box/bb-3.webp', 'black-friday': 'black-friday/hero-1.webp', 'collegiate-survival-sale': 'collegiate-survival-sale/hero-5.webp',
  carswitch: 'carswitch/intro.webp', evercare: 'evercare/flatten-curve.webp', 'byte-app': 'byte-app/cover.webp', 'annual-winter-sale': 'annual-winter-sale/final-designs.webp',
  'generation-magazines': 'generation-magazines/covers.webp', 'tango-photos': 'tango-photos/tango-3947.webp',
};
const OUTCOME = { // one line, all from the write-ups
  'pizza-now': 'The highest-selling brand on the Byte app for a year, driving 50–60% of daily sales.',
  'collegiate-survival-sale': 'Tripled sales and sold 60% of the stock in five days.',
  carswitch: '35k views, 30% fewer queries and 50% more website visits.',
  evercare: 'Cut common COVID-19 queries by 40% with explainers averaging 20K views.',
  'breakfast-box': '150–200 orders a day for the four months after launch.',
  'black-friday': 'Lifted Black Friday product sales by 60–70%.',
  'byte-app': 'A full redesign of a food-delivery app for usability and a modern look.',
  'annual-winter-sale': 'One sale, adapted for newspaper, web and social media.',
  'generation-magazines': 'Editorial design for three issues of a fashion magazine.',
  'tango-photos': 'Photography from the Toronto Tango 8 Festival, 2026.',
};
const ROW = { // the bold number and the words after it, for the Work list
  'pizza-now': ['#1', 'selling brand for a year'], 'collegiate-survival-sale': ['3x', 'sales in five days'], carswitch: ['35k', 'views, 30% fewer queries'], evercare: ['−40%', 'COVID-19 queries'],
  'breakfast-box': ['150–200', 'orders a day'], 'black-friday': ['+60–70%', 'Black Friday sales'],
};
const BADGE = { 'pizza-now': '#1', 'collegiate-survival-sale': '3x', carswitch: '35k', evercare: '−40%', 'breakfast-box': '150–200', 'black-friday': '+60–70%' };
const TLDR = { // the whole story in two sentences (all from the write-ups)
  'pizza-now': 'Byte needed an affordable pizza brand for a budget-conscious audience. I named it and designed the whole identity, and it became the app’s top seller for a year.',
  'collegiate-survival-sale': 'Milkyway wanted back-to-school sales from students. A rough, chaotic, collage-style campaign tripled sales and cleared 60% of the stock in five days.',
  carswitch: 'CarSwitch had to make a boring process interesting. Three humorous animations cut social media queries by 30% and lifted website visits by 50%.',
  evercare: 'In the early days of COVID-19 people were confused by too much or too little information. Four calm explainer animations averaged around 20K views and cut common queries by 40%.',
  'breakfast-box': 'Byte’s new cloud-kitchen restaurant needed a premium but playful identity. The vintage, pastel brand brought in 150–200 orders a day for four months.',
  'black-friday': 'Multiverse wanted to stand out on Black Friday. A turquoise-on-black campaign across email and social lifted product sales by 60–70%.',
};
const PROOF = [
  { need: 'A brand that sells', slug: 'pizza-now', metric: '#1', label: 'selling brand on the Byte app, for a full year', img: 'pizza-now/box-1.webp', alt: 'Pizza Now boxes' },
  { need: 'A launch that gets orders', slug: 'breakfast-box', metric: '150–200', label: 'orders a day for the first four months', img: 'breakfast-box/bb-3.webp', alt: 'Breakfast Box branding' },
  { need: 'A campaign that converts', slug: 'collegiate-survival-sale', metric: '3x', label: 'sales, with 60% of the stock gone in five days', img: 'collegiate-survival-sale/hero-5.webp', alt: 'Collegiate Survival Sale posts and devices' },
  { need: 'A hard message made simple', slug: 'evercare', metric: '−40%', label: 'common COVID-19 questions after four explainer animations', img: 'evercare/storyboard-5.webp', alt: 'Evercare explainer animation frame' },
  { need: 'Animation that gets noticed', slug: 'carswitch', metric: '35k', label: 'views, 30% fewer queries and 50% more website visits', img: 'carswitch/intro.webp', alt: 'CarSwitch animation frame' },
];
// Home panels: the picture is shown in a 4:3 frame, so each frame (and where it is cropped) is chosen to keep logos, headlines and subjects whole.
// pos = which part of a wider picture stays visible (0% = left edge, 100% = right edge).
const PANEL = {
  carswitch: { img: 'carswitch/storyboard-4.webp', pos: '64% 50%', alt: 'CarSwitch animation frame: a seller character beside the question "Looking to sell your car?"' },
  'breakfast-box': { img: 'breakfast-box/bb-3.webp', pos: '0% 50%', alt: 'Breakfast Box branding with the logo on a plate of breakfast' },
};
const POSTERS = { carswitch: ['carswitch/intro.webp', 'carswitch/storyboard-2.webp', 'carswitch/storyboard-3.webp'], evercare: ['evercare/flatten-curve.webp', 'evercare/storyboard-3.webp', 'evercare/storyboard-5.webp', 'evercare/storyboard-7.webp'] };

/* ---------- helpers ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const typo = (s) => String(s).replace(/^-(?=\d)/, '−').replace(/(\d)-(\d)/g, '$1–$2');
const clean = (t) => String(t).replace(/\s*Full write-up coming soon\.?/i, '').trim();
const fit = (parts, max) => { for (const t of parts) if (t.length <= max) return t; return parts[parts.length - 1].slice(0, max - 1).replace(/\s+\S*$/, '') + '…'; };
const results = (p) => { for (const b of p.blocks) if (b.stats) return b.stats.map((s) => ({ n: typo(s.n), l: s.l })); return []; };
const firstSentences = (t, n) => (t.match(/[^.!?]+[.!?]+/g) || [t]).slice(0, n).join(' ').trim();
let ROOTP = ''; // path prefix back to the site root for the page being rendered ('', '../', '../../')
const used = new Set();
// The client's clients, alphabetical (client's list, 07-Nov-2026): used by the scrolling strip on the home page.
const CLIENTS = ['Breakfast Box', 'Byte Technology Systems', 'CarSwitch', 'Colabs', 'Evercare Hospital', 'Generation (Pvt) Ltd', 'Multiverse', 'Pizza Now', 'Start-up Grind', 'Treble App', 'Uncle Tetsu'];
function srcFile(rel) { return path.join(SITE, 'img', rel); }
// High-resolution protection: the site only ever uses (and only ever publishes) the largest web copy of an image, 1200 px wide at most,
// never the full-size file. Images that are already 1200 px or smaller have no separate copies and are used as they are.
function webRel(rel) {
  const m = MEDIA['img/' + rel] || {};
  return m.v && m.v.length ? rel.replace(/\.webp$/, '') + '-' + m.v[m.v.length - 1] + '.webp' : rel;
}
function imgTag(rel, alt, o = {}) {
  used.add(rel);
  const m = MEDIA['img/' + rel] || {}, base = rel.replace(/\.webp$/, '');
  const url = (r) => ROOTP + 'assets/img/' + r;
  let srcset = '';
  if (m.v && m.v.length) srcset = ` srcset="${m.v.map((w) => `${url(base + '-' + w + '.webp')} ${w}w`).join(', ')}" sizes="${o.sizes || '100vw'}"`;
  const dims = m.w ? ` width="${m.w}" height="${m.h}"` : '';
  const style = [o.vt ? `view-transition-name:${o.vt}` : '', o.pos ? `object-position:${o.pos}` : ''].filter(Boolean).join(';');
  return `<img src="${url(webRel(rel))}" alt="${esc(alt)}"${dims}${srcset}${o.eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"${style ? ` style="${style}"` : ''}>`;
}
function copyImages() {
  for (const rel of used) {
    const base = rel.replace(/\.webp$/, ''), m = MEDIA['img/' + rel] || {};
    const names = m.v && m.v.length ? m.v.map((w) => `${base}-${w}.webp`) : [rel]; // the full-size file is not published when web copies exist
    for (const n of names) { const to = path.join(OUT, 'assets', 'img', n); fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(srcFile(n), to); }
  }
}
const themeStyle = (slug) => { const t = THEME[slug] || ['#8f00ff', '#ffffff']; return `--pa:${t[0]};--on:${t[1]}`; };
const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

/* ---------- brand motifs: card suits (shapes from the original site's icon set) ---------- */
const SUITS = ['spade', 'heart', 'club', 'diamond'];
const SUIT_SPRITE = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>'
  + '<symbol id="s-heart" viewBox="0 0 24 24"><path d="M12 21.8C5 15.6 2.2 12.4 2.2 8.6 2.2 5.6 4.4 3.4 7.2 3.4c1.9 0 3.6 1 4.8 2.9 1.2-1.9 2.9-2.9 4.8-2.9 2.8 0 5 2.2 5 5.2 0 3.8-2.8 7-9.8 13.2z"/></symbol>'
  + '<symbol id="s-club" viewBox="0 0 24 24"><path d="M12 2a4.2 4.2 0 0 0-3 7.1 4.5 4.5 0 1 0 2.3 8.2c-.1 2.2-.9 3.9-2.5 4.7h6.4c-1.6-.8-2.4-2.5-2.5-4.7a4.5 4.5 0 1 0 2.3-8.2A4.2 4.2 0 0 0 12 2z"/></symbol>'
  + '<symbol id="s-diamond" viewBox="0 0 24 24"><path d="M12 1.8l7 10.2-7 10.2L5 12z"/></symbol>'
  + '<symbol id="s-spade" viewBox="0 0 24 24"><path d="M12 1.8C9.6 5.6 4 9.1 4 13.6a4.1 4.1 0 0 0 7.2 2.7c-.1 2.4-.9 4.4-2.7 5.5h7c-1.8-1.1-2.6-3.1-2.7-5.5A4.1 4.1 0 0 0 20 13.6C20 9.1 14.4 5.6 12 1.8z"/></symbol></defs></svg>';

/* ---------- page shell ---------- */
function shell(pg, body) {
  const url = CONFIG.url + pg.path, og = CONFIG.url + '/assets/og/' + pg.og + '.jpg';
  const robots = CONFIG.indexable ? 'index, follow, max-image-preview:large' : 'noindex, nofollow';
  const nav = [['work/', 'Work', 'work'], ['about/', 'About', 'about']]
    .map(([h, t, k]) => `<a href="${ROOTP}${h}"${pg.key === k ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  const html = `<!doctype html>
<html lang="en-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(pg.title)}</title>
<meta name="description" content="${esc(pg.description)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#1b1b1b">
<meta property="og:type" content="website"><meta property="og:site_name" content="Zeeshan Abid"><meta property="og:locale" content="en_CA">
<meta property="og:title" content="${esc(pg.title)}"><meta property="og:description" content="${esc(pg.description)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${og}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${ROOTP}assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="${ROOTP}assets/fonts/raleway-var.woff2" as="font" type="font/woff2" crossorigin>

<link rel="stylesheet" href="${ROOTP}assets/css/styles.css">
<script>(function(){var d=document.documentElement;d.className+=' js';var t='dark',m='on';try{t=localStorage.getItem('zs-theme')||'dark';m=localStorage.getItem('zs-motion')||(matchMedia('(prefers-reduced-motion: reduce)').matches?'off':'on')}catch(e){}d.setAttribute('data-theme',t);d.setAttribute('data-motion',m)})()</script>
<script type="application/ld+json">${JSON.stringify(pg.jsonld)}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="wrap">
  <a class="brand" href="${ROOTP || './'}" aria-label="Zeeshan Abid, home"><b>Zeeshan Abid</b><span>Designer / Toronto 43.65°N</span></a>
  <div class="header-end"><button class="theme-btn" type="button" aria-pressed="false" aria-label="Light theme"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg></button>
  <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">Menu</button></div>
  <nav class="nav" id="nav" aria-label="Main">${nav}<a class="btn" href="${ROOTP}contact/"${pg.key === 'contact' ? ' aria-current="page"' : ''}>Contact</a></nav>
</div><div class="progress" aria-hidden="true"></div></header>
<main id="main">
${body}
</main>
<div class="checks" aria-hidden="true"></div>
<footer class="site-footer"><div class="wrap">
  <p>&copy; 2026 Zeeshan Abid. Multi-disciplinary designer in Toronto, Ontario, Canada.</p>
  <ul><li><a href="${ROOTP}work/">Work</a></li><li><a href="${ROOTP}about/">About</a></li><li><a href="${ROOTP}contact/">Contact</a></li><li><a href="${ROOTP}privacy/">Privacy</a></li><li><button class="motion-btn" type="button" aria-pressed="true">Motion: on</button></li></ul>
  ${socials().length ? `<nav class="social" aria-label="Elsewhere online"><span>Elsewhere</span><ul>${socials().map((s) => `<li><a href="${esc(s.href)}" rel="me noopener" target="_blank">${esc(s.label)}<span class="sr-only"> (opens in a new tab)</span></a></li>`).join('')}</ul></nav>` : ''}
</div></footer>
<script src="${ROOTP}assets/js/main.js" defer></script>
</body>
</html>
`;
  // Every internal page link points at an explicit index.html so the site also works when opened straight from disk (file://) with no web server.
  return CONFIG.cleanLinks ? html : html.replace(/href="((?!https?:|mailto:|#)[^"]*\/)"/g, 'href="$1index.html"');
}
const cta = () => ''; // the closing banner was removed; every page already links to Contact from the menu and footer

/* ---------- structured data ---------- */
const personId = CONFIG.url + '/#zeeshan', websiteId = CONFIG.url + '/#website';
function graph(pg, extra) {
  const address = { '@type': 'PostalAddress', addressLocality: SEO.city, addressRegion: SEO.provinceCode, addressCountry: SEO.countryCode };
  const person = { '@type': 'Person', '@id': personId, name: 'Zeeshan Abid', jobTitle: 'Brand, motion and campaign designer', url: CONFIG.url + '/', address, knowsAbout: SEO.knowsAbout, sameAs: socials().map((s) => s.href), ...(hasEmail() ? { email: CONFIG.email } : {}), ...(CONFIG.headshotUrl ? { image: CONFIG.headshotUrl } : {}),
    description: 'Multi-disciplinary designer in Toronto, Ontario, working since 2017 in branding, motion graphics, marketing campaigns, packaging and UI/UX.' };
  const service = { '@type': 'ProfessionalService', '@id': CONFIG.url + '/#service', name: 'Zeeshan Abid, design services', url: CONFIG.url + '/', founder: { '@id': personId }, address, areaServed: [{ '@type': 'City', name: SEO.city }, { '@type': 'AdministrativeArea', name: SEO.province }, { '@type': 'Country', name: SEO.country }], serviceType: SEO.knowsAbout, geo: { '@type': 'GeoCoordinates', latitude: SEO.lat, longitude: SEO.lon }, ...(hasEmail() ? { email: CONFIG.email } : {}) };
  const site = { '@type': 'WebSite', '@id': websiteId, url: CONFIG.url + '/', name: 'Zeeshan Abid', inLanguage: 'en-CA', publisher: { '@id': personId } };
  const crumbs = pg.crumbs || [];
  const bc = crumbs.length ? { '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: CONFIG.url + c[1] })) } : null;
  const page = { '@type': pg.type || 'WebPage', '@id': CONFIG.url + pg.path + '#webpage', url: CONFIG.url + pg.path, name: pg.title, description: pg.description, inLanguage: 'en-CA', isPartOf: { '@id': websiteId } };
  return { '@context': 'https://schema.org', '@graph': [person, site, ...(['home', 'about', 'contact'].includes(pg.key) ? [service] : []), page, ...(extra || []), ...(bc ? [bc] : [])] };
}

/* ---------- pages ---------- */
const pages = [];
function add(pg, body) { pages.push({ pg, body }); }

function card(p, cls) {
  const [pa] = THEME[p.slug];
  const badge = BADGE[p.slug] ? `<span class="wcard__badge"><b class="num">${BADGE[p.slug]}</b> ${p.slug === 'pizza-now' ? 'selling brand' : p.slug === 'carswitch' ? 'views' : p.slug === 'black-friday' ? 'sales' : p.slug === 'evercare' ? 'queries' : p.slug === 'breakfast-box' ? 'orders a day' : 'sales'}</span>` : '';
  return `<a class="wcard ${cls}" href="${ROOTP}work/${p.slug}/" style="${themeStyle(p.slug)}">
  <div class="wcard__img">${imgTag(HERO[p.slug], '', { sizes: cls.includes('12') ? '100vw' : '(max-width: 720px) 100vw, 40vw', vt: 'p-' + p.slug })}${badge}</div>
  <div class="wcard__body"><h3>${esc(p.title)}</h3><p>${esc(OUTCOME[p.slug])}</p>
  <div class="wcard__meta">${p.categories.map((c) => `<span class="chip">${esc(catName(c))}</span>`).join('')}<span class="chip">${esc(indName(p.industries[0]))}</span></div></div>
</a>`;
}

function home() {
  ROOTP = '';
  const NEED = { 'pizza-now': 'A brand that sells', 'collegiate-survival-sale': 'A campaign that converts', carswitch: 'Animation that gets noticed', evercare: 'A hard message made simple', 'breakfast-box': 'A launch that gets orders', 'black-friday': 'A sale that stands out' };
  const stack = CASES.map((slug, i) => { const p = proj(slug), n = String(i + 1).padStart(2, '0');
    return `<li class="pan" style="${themeStyle(slug)}"><div class="wrap pan__in">
    <div class="pan__txt"><p class="pan__kick"><b>${n}</b> ${esc(NEED[slug])}</p>
      <p class="pan__metric num" aria-hidden="true">${ROW[slug][0]}</p><p class="pan__words">${esc(ROW[slug][1])}</p>
      <h3><a class="pan__link" href="work/${slug}/">${esc(p.title)}</a></h3><p class="pan__out">${esc(OUTCOME[slug])}</p>
      <div class="pan__chips">${p.categories.map((c) => `<span class="chip">${esc(catName(c))}</span>`).join('')}</div></div>
    <div class="pan__img">${imgTag(PANEL[slug] ? PANEL[slug].img : HERO[slug], PANEL[slug] ? PANEL[slug].alt : ((p.lead && p.lead.alt) || p.title), { sizes: '(max-width: 860px) 100vw, 58vw', vt: 'p-' + slug, eager: i === 0, pos: PANEL[slug] && PANEL[slug].pos })}</div></div></li>`; }).join('');
  const body = `<section class="hero hero--home"><div class="wrap">
  <div class="hero__top"><h1 class="display">Design that moves <em>numbers.</em></h1></div>
  <div class="hero__row">
    <div><p class="lede">I am Zeeshan, a designer in Toronto. I build brands, campaigns and motion, then check the numbers: a pizza brand that became the app's top seller, a sale that tripled revenue, animations that cut support queries by 40%.</p>
    <div class="hero__actions"><a class="btn" href="work/">See the work ${arrow}</a></div></div>
    <dl class="slate"><div><dt>Role</dt><dd>Brand, motion and campaign designer</dd></div><div><dt>Base</dt><dd>Toronto, Ontario</dd></div><div><dt>Since</dt><dd>2017, across 8 industries</dd></div>${CONFIG.availability ? `<div><dt>Status</dt><dd><i class="dot" aria-hidden="true"></i>${esc(CONFIG.availability)}</dd></div>` : ''}</dl>
  </div>
</div></section>
<section class="stack" aria-labelledby="work-h"><div class="wrap section__head"><h2 class="display" id="work-h">Selected work</h2><p>Projects where design changed a number the business cared about.</p></div>
<ol class="stack__list">${stack}</ol>
<div class="wrap stack__all"><a class="btn btn--ghost" href="work/">See all work ${arrow}</a></div></section>
<section class="band" aria-label="Results at a glance"><div class="wrap"><ul>
  <li><b class="num">3x</b><span>sales from one back-to-school campaign</span></li>
  <li><b class="num">50–60%</b><span>of daily app sales from one brand I created</span></li>
  <li><b class="num">−40%</b><span>common queries after four explainer animations</span></li>
  <li><b class="num">2017</b><span>designing professionally since</span></li>
</ul></div></section>
<section class="section" aria-labelledby="how-h"><div class="wrap">
  <div class="section__head"><h2 class="display" id="how-h">How I work</h2></div>
  <ol class="steps">
    <li class="step reveal"><h3>Understand</h3><p>The business, the audience and the constraints, before any design tool is opened.</p><small>CarSwitch: started with the brand's mission, values and personality.</small></li>
    <li class="step reveal"><h3>Explore</h3><p>Mood boards, references and a few clear directions to react to.</p><small>Breakfast Box: researched art styles before choosing a direction.</small></li>
    <li class="step reveal"><h3>Show, then build</h3><p>Storyboards, layouts and logo options early, so nobody is surprised later.</p><small>CarSwitch: storyboards approved before a frame was animated.</small></li>
    <li class="step reveal"><h3>Ship and measure</h3><p>Launch, read the numbers and keep what works.</p><small>Black Friday: tracked a 4.67% email click rate and sales lift.</small></li>
  </ol>
</div></section>
<section class="section" aria-labelledby="svc-h"><div class="wrap">
  <div class="section__head"><h2 class="display" id="svc-h">What I can help with</h2></div>
  <ul class="services">
    <li><b>Brand identity</b><span>Names, logos, colour, type and the voice that makes people remember you.</span></li>
    <li><b>Motion and animation</b><span>Explainers, social videos and kinetic type that make a message stick.</span></li>
    <li><b>Campaign design</b><span>Email, social and web visuals that turn attention into sales.</span></li>
    <li><b>Print and packaging</b><span>Newspaper ads, magazines, boxes and storefronts.</span></li>
    <li><b>UI and UX design</b><span>App screens, flows and wireframes people can actually use.</span></li>
    <li><b>Photography</b><span>Event photography, from brand launches to tango floors.</span></li>
  </ul>
</div></section>
<section class="section brands" aria-labelledby="cl-h"><div class="wrap">
  <h2 class="label" id="cl-h">Brands I have worked with</h2></div>
  <div class="marquee">${SUIT_SPRITE}${(() => { const names = CLIENTS; const row = (rev, hid) => `<div class="marquee__row${rev ? ' marquee__row--rev' : ''}"${hid ? ' aria-hidden="true"' : ''}>${[0, 1].map((k) => `<ul${k ? ' aria-hidden="true"' : ''}>${(rev ? [...names].reverse() : names).map((c, i) => `<li>${c}<svg class="suit" aria-hidden="true" viewBox="0 0 24 24"><use href="#s-${SUITS[i % SUITS.length]}"/></svg></li>`).join('')}</ul>`).join('')}</div>`; return row(false, false); })()}</div>
</section>
${cta()}`;
  add({ file: 'index.html', path: '/', key: 'home', og: 'home', title: 'Zeeshan Abid | Brand, Motion and Campaign Designer in Toronto', description: 'Toronto designer building brands, campaigns and animations that move numbers: 3x sales, a #1 food brand, 40% fewer support queries. See the work.', type: 'WebPage' }, body);
}

function work() {
  ROOTP = '../';
  const cats = S.categories.filter((c) => ORDER.some((s) => proj(s).categories.includes(c.id)));
  const rows = ORDER.map((slug, i) => {
    const p = proj(slug), res = ROW[slug] ? `<b class="num">${ROW[slug][0]}</b> ${esc(ROW[slug][1])}` : esc(OUTCOME[slug]);
    return `<li data-cats="${p.categories.join(' ')}"><a href="${slug ? ROOTP + 'work/' + slug + '/' : '#'}">
      <span class="i">${String(i + 1).padStart(2, '0')}</span>
      ${imgTag(HERO[slug], '', { sizes: '96px' }).replace('class=', 'class=').replace('<img ', '<img class="thumb" ')}
      <span class="t">${esc(p.title)}<small>${p.categories.map(catName).join(' / ')}</small></span><i class="lead" aria-hidden="true"></i><span class="r">${res}</span></a></li>`;
  }).join('\n');
  const body = `<section class="hero" style="padding-bottom:0"><div class="wrap">
  <p class="label">Work</p><h1 class="display">Real work. <em>Real results.</em></h1>
  <p class="lede hero__sub">Case studies with the numbers, and image-led projects. Click a row to read.</p>
  <div class="filters" role="group" aria-label="Filter projects"><button type="button" data-filter="all" aria-pressed="true">All</button>${cats.map((c) => `<button type="button" data-filter="${c.id}" aria-pressed="false">${esc(c.name)}</button>`).join('')}</div>
  <p class="sr-only" id="filter-live" aria-live="polite"></p>
  <ul class="worklist">${rows}</ul>
</div></section>${cta()}`;
  add({ file: 'work/index.html', path: '/work/', key: 'work', og: 'work', title: 'Selected Work and Case Studies | Zeeshan Abid', description: 'Case studies by Zeeshan Abid, Toronto: branding, motion, campaigns, print and UI/UX, with the results each one delivered.', type: 'CollectionPage', crumbs: [['Home', '/'], ['Work', '/work/']],
    extra: [{ '@type': 'ItemList', numberOfItems: ORDER.length, itemListElement: ORDER.map((s, i) => ({ '@type': 'ListItem', position: i + 1, url: CONFIG.url + '/work/' + s + '/', name: proj(s).title })) }] }, body);
}

const LABELS = { Introduction: ['Context', 'About the client'], 'Problem Identification': ['The challenge', 'What needed solving'], 'My Role': ['My role', 'What I did'], 'Process & Problem Solving': ['Approach', 'How I worked it out'], 'The Outcome': ['Results', 'What happened'] };
function casePage(slug) {
  ROOTP = '../../';
  const p = proj(slug), isCase = CASES.includes(slug), res = results(p);
  const idx = ORDER.indexOf(slug), next = proj(ORDER[(idx + 1) % ORDER.length]);
  const reframe = p.blocks.find((b) => b.title === 'Reframe');
  const tldr = TLDR[slug] || clean(p.summary);
  let n = 0, html = '';
  const gal = (items, cap, cls) => {
    const list = items.filter((m) => m.t === 'img').slice(0, cap); if (!list.length) return '';
    return `<div class="gallery ${cls || ''}">${list.map((m) => `<button type="button" class="zoom" data-full="${ROOTP}assets/img/${webRel(m.src)}" aria-label="Enlarge image: ${esc(m.alt)}">${imgTag(m.src, m.alt, { sizes: list.length === 1 ? '(max-width: 980px) 100vw, 60vw' : '(max-width: 720px) 100vw, 30vw' })}</button>`).join('')}</div>`;
  };
  // tall designs (emails, long pages, magazines): shown in a fixed-height window that scrolls, so the whole design can be read in place
  const scr = (items) => {
    const list = items.filter((m) => m.t === 'scroll'); if (!list.length) return '';
    return `<div class="scrolls scrolls--${Math.min(list.length, 3)}">${list.map((m) => `<figure><div class="scroll" tabindex="0" role="region" aria-label="${esc(m.alt)}: scrollable design">${imgTag(m.src, m.alt, { sizes: '(max-width: 720px) 100vw, 50vw' })}</div><figcaption>${esc(m.alt)}</figcaption></figure>`).join('')}</div>`;
  };
  p.blocks.forEach((b) => {
    if (b.type === 'section') {
      if (b.title === 'Reframe' && isCase) return;
      const lab = LABELS[b.title] || [b.title, b.title]; n++;
      const stats = b.stats ? `<div class="stats">${b.stats.map((s) => `<div class="stat"><b class="num">${typo(s.n)}</b><span>${esc(s.l)}</span></div>`).join('')}</div>` : '';
      const bullets = b.bullets && !b.stats ? `<ul style="list-style:disc;padding-left:1.2em;margin-top:12px">${b.bullets.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '';
      html += `<section class="reveal"><h2><small>${String(n).padStart(2, '0')} / ${esc(lab[0])}</small>${esc(lab[1])}</h2>${(b.paras || []).map((t) => `<p>${esc(t)}</p>`).join('')}${stats}${bullets}${b.media ? gal(b.media, 2, b.media.length > 1 ? 'gallery--2' : 'gallery--1') + scr(b.media) : ''}</section>`;
    } else if (b.type === 'media') {
      if (b.layout === 'videos') {
        const vids = b.items.filter((m) => m.t === 'vimeo'); if (!vids.length) return;
        const posters = POSTERS[slug] || [];
        html += `<section class="reveal"><h2><small>Watch</small>${esc(b.heading)}</h2><div class="facades">${vids.map((v, i) => `<button class="facade" type="button" data-vimeo="${v.id}" data-title="${esc(v.title)}" aria-label="Play video: ${esc(v.title)}">${imgTag(posters[i % posters.length] || HERO[slug], '', { sizes: '(max-width: 720px) 100vw, 33vw' })}<span class="play" aria-hidden="true"><i><svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg></i></span><b>${esc(v.title)}</b></button>`).join('')}</div></section>`;
      } else if (b.items.some((m) => m.t === 'scroll')) {
        const sec = `<section class="reveal"><h2><small>${b.layout === 'scroll' && /email/i.test(b.heading) ? 'In the inbox' : 'Full designs'}</small>${esc(b.heading)}</h2>${b.note ? `<p>${esc(b.note)}</p>` : '<p>Scroll inside each design to see all of it.</p>'}${scr(b.items)}</section>`;
        html += sec;
      } else if (b.items.some((m) => m.t === 'img')) {
        const cap = slug === 'tango-photos' ? 12 : 12;
        html += `<section class="reveal"><h2><small>Selected visuals</small>${esc(b.heading)}</h2>${gal(b.items, cap)}</section>`;
      }
    }
  });
  const [pa, on] = THEME[slug];
  const glance =`<aside class="glance" aria-label="Project at a glance"><dl>
    <div><dt>Client</dt><dd>${esc(p.client)}</dd></div>
    <div><dt>Industry</dt><dd>${p.industries.map(indName).join(', ')}</dd></div>
    <div><dt>What I did</dt><dd><ul>${p.categories.map((c) => `<li>${esc(catName(c))}</li>`).join('')}</ul></dd></div>
    ${res.length ? `<div class="res"><dt>Results</dt><dd><ul>${res.slice(0, 3).map((r) => `<li><b class="num">${r.n}</b> ${esc(r.l)}</li>`).join('')}</ul></dd></div>` : ''}
  </dl></aside>`;
  const body = `<section class="case-hero" style="${themeStyle(slug)}"><div class="wrap">
  <p class="crumbs"><a href="${ROOTP}work/">Work</a> / ${esc(p.title)}</p>
  <h1 class="display">${esc(p.title)}</h1>
  <p class="lede">${esc(OUTCOME[slug])}</p>
  <div class="tags">${p.categories.map((c) => `<span class="chip">${esc(catName(c))}</span>`).join('')}</div>
</div></section>
<div class="wrap case-cover"><figure>${imgTag(HERO[slug], p.lead && p.lead.alt ? p.lead.alt : p.title, { eager: true, sizes: '(max-width: 1240px) 100vw, 1240px', vt: 'p-' + slug })}</figure></div>
<div class="wrap case">
  ${glance}
  <div class="prose">
    <div class="tldr reveal" style="${themeStyle(slug)}"><p class="label">The short version</p><p>${esc(tldr)}</p></div>
    ${html}
  </div>
</div>
<div class="next"><a href="${ROOTP}work/${next.slug}/" style="${themeStyle(next.slug)}"><div class="wrap"><span class="label">Next project</span><b>${esc(next.title)}</b></div></a></div>
${cta()}
<dialog class="lb" aria-label="Image viewer"><div class="in"><img alt=""></div><button type="button" aria-label="Close image">&times;</button></dialog>`;
  const c0 = catName(p.categories[0]);
  const title = fit([`${p.title}: ${c0} Case Study | Zeeshan Abid`, `${p.title} | Zeeshan Abid, Toronto Designer`, `${p.title} | Zeeshan Abid`], 62);
  const description = fit([`${OUTCOME[slug]} ${clean(p.summary)}`, OUTCOME[slug] + ' A project by Zeeshan Abid, designer in Toronto.', OUTCOME[slug]], 160);
  const image = { '@type': 'ImageObject', url: CONFIG.url + '/assets/og/' + slug + '.jpg', width: 1200, height: 630 };
  add({ file: `work/${slug}/index.html`, path: `/work/${slug}/`, key: 'work', og: slug, title, description, type: 'WebPage', crumbs: [['Home', '/'], ['Work', '/work/'], [p.title, `/work/${slug}/`]],
    extra: [{ '@type': 'CreativeWork', '@id': CONFIG.url + `/work/${slug}/#work`, name: p.title, description: `${OUTCOME[slug]} ${clean(p.summary)}`, url: CONFIG.url + `/work/${slug}/`, image, creator: { '@id': personId }, author: { '@id': personId }, inLanguage: 'en-CA',
      genre: p.categories.map(catName), keywords: [...p.categories.map(catName), ...p.industries.map(indName), 'Toronto designer'].join(', '), sponsor: { '@type': 'Organization', name: p.client } }] }, body);
}

function about() {
  ROOTP = '../';
  const body = `<section class="wrap hero"><p class="label">About</p><h1 class="display" style="margin-top:12px">Design is how I <em>answer questions.</em></h1>
  <div class="about-page"><div class="portrait" role="img" aria-label="Headshot placeholder"><span>Headshot coming soon</span></div>
  <div class="prose"><section><p class="lede" style="max-width:none">${esc(S.about[0])}</p></section>
  <section><p>${esc(S.about[1])}</p><p>${esc(S.about[2])}</p></section>
  <section><p>${esc(S.about[3])}</p><p>${esc(S.about[4])}</p></section>
  <section><p>${esc(S.about[5].replace('{{work}}', 'versatile art-style').replace('{{contact}}', 'Drop me a message'))} <a href="${ROOTP}contact/">Start the conversation.</a></p></section>
  <ul class="facts"><li><b>Toronto, ON</b><span>Based in Canada</span></li><li><b>Since 2017</b><span>Designing professionally</span></li><li><b>8 industries</b><span>Fashion, advertising, healthcare, retail, tech, apps, food, cannabis</span></li><li><b>Next</b><span>Design research, creative management and marketing</span></li></ul>
  </div></div></section>${cta()}`;
  add({ file: 'about/index.html', path: '/about/', key: 'about', og: 'about', title: 'About Zeeshan Abid | Designer in Toronto, Ontario', description: 'Zeeshan Abid is a designer in Toronto, ON, working since 2017 in branding, motion graphics, marketing, packaging and UI/UX across fashion, healthcare and tech.', type: 'AboutPage', crumbs: [['Home', '/'], ['About', '/about/']] }, body);
}

function contact() {
  ROOTP = '../';
  const field = (id, label, type, req, extra) => `<div class="field"><label for="${id}">${label}${req ? ' <span aria-hidden="true">*</span>' : ''}</label>${type === 'textarea' ? `<textarea id="${id}" name="${id}"${req ? ' required' : ''} aria-describedby="${id}-err"></textarea>` : `<input id="${id}" name="${id}" type="${type}"${req ? ' required' : ''} aria-describedby="${id}-err" ${extra || ''}>`}<span class="err" id="${id}-err"></span></div>`;
  const body = `<section class="wrap hero"><p class="label">Contact</p><h1 class="display" style="margin-top:12px">Let's make something <em>people remember.</em></h1>
  <div class="contact-grid"><div><p class="lede">Hiring, a project or just a design question? Send a few lines. I reply personally.</p>
  <a class="mail" href="mailto:${CONFIG.email}">${CONFIG.email}</a>
  <ul class="prose" style="margin-top:34px;display:grid;gap:14px;max-width:46ch"><li><b>Helpful to include:</b> what you are trying to achieve, the timeline, and a link to anything relevant.</li><li><b>Where I am:</b> Toronto, Ontario. Happy to work with teams anywhere.</li>${CONFIG.resumeUrl ? `<li><a href="${CONFIG.resumeUrl}">Download my résumé (PDF)</a></li>` : ''}<li><a href="https://vimeo.com/zeeshanabid" rel="me noopener">See my animation work on Vimeo</a></li></ul></div>
  <form class="form" data-mailto="${CONFIG.email}" novalidate>
    ${field('name', 'Your name', 'text', true, 'autocomplete="name"')}${field('email', 'Email address', 'email', true, 'autocomplete="email" inputmode="email"')}${field('company', 'Company (optional)', 'text', false, 'autocomplete="organization"')}${field('subject', 'Subject (optional)', 'text', false)}${field('message', 'What would you like to talk about?', 'textarea', true)}
    <button class="btn" type="submit">Write my email ${arrow}</button>
    <p class="note" id="form-status" role="status">This opens your email app with your message ready to send.</p>
  </form></div></section>`;
  add({ file: 'contact/index.html', path: '/contact/', key: 'contact', og: 'contact', title: 'Contact Zeeshan Abid | Hire a Designer in Toronto', description: 'Get in touch with Zeeshan Abid, a multi-disciplinary designer in Toronto, ON, about branding, motion graphics, marketing or UI/UX work.', type: 'ContactPage', crumbs: [['Home', '/'], ['Contact', '/contact/']] }, body);
}

function privacy() {
  ROOTP = '../';
  const P = S.privacy, em = CONFIG.email;
  const body = `<section class="wrap hero"><p class="label">Legal</p><h1 class="display" style="margin-top:12px">Privacy <em>policy</em></h1><p class="lede" style="margin-top:14px">Last updated: ${esc(P.updated)}</p>
  <div class="prose-page prose">${P.sections.map((s) => `<h2>${esc(s.title)}</h2>${(s.paras || []).map((t) => `<p>${esc(t)}</p>`).join('')}${s.list ? `<ul>${s.list.map((t) => `<li>${t}</li>`).join('')}</ul>` : ''}${s.after ? `<p>${esc(s.after)}</p>` : ''}${s.contact ? `<p>Zeeshan Abid, Toronto, Ontario, Canada. Email: <a href="mailto:${em}">${em}</a></p>` : ''}`).join('')}</div></section>`;
  add({ file: 'privacy/index.html', path: '/privacy/', key: 'privacy', og: 'home', title: 'Privacy Policy | Zeeshan Abid', description: SEO.pages.privacy.description, type: 'WebPage', crumbs: [['Home', '/'], ['Privacy', '/privacy/']] }, body);
}

// The 404 page is served from any depth, so its links must be absolute; on a GitHub Pages project site that means including the repo path.
const NOTFOUND_BASE = new URL(CONFIG.url).pathname.replace(/\/$/, '');
function notFound() {
  ROOTP = '';
  const body = `<section class="wrap hero"><p class="label">404</p><h1 class="display" style="margin-top:12px">That page <em>wandered off.</em></h1><p class="lede hero__sub">Try the work or head home.</p><div class="hero__actions"><a class="btn" href="${NOTFOUND_BASE}/work/">See the work</a><a class="btn btn--ghost" href="${NOTFOUND_BASE}/">Home</a></div></section>`;
  add({ file: '404.html', path: '/404.html', key: '404', og: 'home', title: 'Page not found | Zeeshan Abid', description: 'This page could not be found.', type: 'WebPage' }, body);
}

/* ---------- write everything ---------- */
async function ogImages() {
  const dir = path.join(OUT, 'assets', 'og'); fs.mkdirSync(dir, { recursive: true });
  for (const slug of ORDER) await sharp(srcFile(HERO[slug])).resize(1200, 630, { fit: 'cover', position: 'attention' }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(dir, slug + '.jpg'));
  const trio = ['pizza-now', 'collegiate-survival-sale', 'carswitch'];
  const tiles = await Promise.all(trio.map((s) => sharp(srcFile(HERO[s])).resize(400, 630, { fit: 'cover', position: 'attention' }).jpeg({ quality: 82 }).toBuffer()));
  const collage = sharp({ create: { width: 1200, height: 630, channels: 3, background: '#1b1b1b' } }).composite(tiles.map((input, i) => ({ input, left: i * 400, top: 0 }))).jpeg({ quality: 82 });
  for (const n of ['home', 'work', 'about', 'contact']) await collage.clone().toFile(path.join(dir, n + '.jpg'));
}

(async () => {
  for (const d of ['work', 'about', 'contact', 'privacy', 'assets/img', 'assets/css', 'assets/js', 'assets/og']) fs.rmSync(path.join(OUT, d), { recursive: true, force: true });
  home(); work(); [...CASES, ...GALLERIES].forEach(casePage); about(); contact(); privacy(); notFound();
  for (const { pg, body } of pages) {
    const depth = pg.file.includes('/') ? pg.file.split('/').length - 1 : 0; ROOTP = '../'.repeat(depth);
    pg.jsonld = graph(pg, pg.extra);
    const file = path.join(OUT, pg.file); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, shell(pg, body));
  }
  fs.mkdirSync(path.join(OUT, 'assets', 'css'), { recursive: true }); fs.mkdirSync(path.join(OUT, 'assets', 'js'), { recursive: true });
  fs.copyFileSync(path.join(HERE, 'src', 'styles.css'), path.join(OUT, 'assets', 'css', 'styles.css'));
  fs.copyFileSync(path.join(HERE, 'src', 'main.js'), path.join(OUT, 'assets', 'js', 'main.js'));
  fs.mkdirSync(path.join(OUT, 'assets', 'fonts'), { recursive: true });
  for (const f of fs.readdirSync(path.join(HERE, 'src', 'fonts'))) fs.copyFileSync(path.join(HERE, 'src', 'fonts', f), path.join(OUT, 'assets', 'fonts', f));
  fs.writeFileSync(path.join(OUT, '.nojekyll'), ''); // tell GitHub Pages to serve the files as they are
  fs.writeFileSync(path.join(OUT, 'assets', 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#1b1b1b"/><rect x="10" y="10" width="44" height="44" fill="#8f00ff"/><path d="M19 21h26L21 43h26" fill="none" stroke="#ffffff" stroke-width="6" stroke-linejoin="miter"/></svg>');  copyImages(); await ogImages();
  const urls = pages.filter((x) => x.pg.file !== '404.html');
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map((x) => `  <url><loc>${CONFIG.url}${x.pg.path}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>`).join('\n') + '\n</urlset>\n');
  fs.writeFileSync(path.join(OUT, 'robots.txt'), CONFIG.indexable ? `User-agent: *\nAllow: /\n\nSitemap: ${CONFIG.url}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
  const ll = ['# Zeeshan Abid', '', '> Zeeshan Abid is a multi-disciplinary designer in Toronto, Ontario, Canada, working since 2017 in branding, motion graphics, marketing campaigns, packaging and UI/UX.', '', '## Highlights', '',
    ...CASES.map((s) => `- [${proj(s).title}](${CONFIG.url}/work/${s}/): ${OUTCOME[s]}`), '', '## Pages', '', `- [Work](${CONFIG.url}/work/)`, `- [About](${CONFIG.url}/about/)`, `- [Contact](${CONFIG.url}/contact/)`, ''];
  fs.writeFileSync(path.join(OUT, 'llms.txt'), ll.join('\n'));
  // go-live report
  console.log(`mode: ${LIVE ? 'LIVE (clean links)' : 'preview (index.html links, opens from disk)'} | search engines: ${CONFIG.indexable ? 'allowed' : 'blocked (noindex)'}`);
  if (!hasDomain()) console.log('TODO: CONFIG.url is still the placeholder domain (sitemap, canonical, share images, search data).');
  if (!hasEmail()) console.log('TODO: CONFIG.email is still the placeholder (Contact page, privacy policy, search data).');
  if (LIVE && !CONFIG.indexable) console.log('NOTE: --live kept the site noindex until the domain and email above are real.');
  // report
  let total = 0; (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f), s = fs.statSync(p); if (s.isDirectory()) walk(p); else total += s.size; } })(OUT);
  console.log(`${pages.length} pages, ${used.size} images (+ variants), ${(total / 1048576).toFixed(1)} MB in ${path.basename(OUT)}/`);
  const bad = Object.entries(THEME).filter(([, [a, b]]) => { const L = (h) => { const c = [1, 3, 5].map((i) => { const v = parseInt(h.substr(i, 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }; const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) < 4.5; });
  console.log(bad.length ? 'LOW CONTRAST themes: ' + bad.map((b) => b[0]).join(', ') : 'All project colour themes pass 4.5:1 text contrast.');
})().catch((e) => { console.error(e); process.exit(1); });
