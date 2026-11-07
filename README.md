# Zeeshan Abid: portfolio, version 2

A second, independent portfolio for Zeeshan Abid (designer, Toronto), designed as a hiring-focused site rather than a brand-spec build. The original, brief-led site lives in its own repository: **Zeeshan-Portfolio-Site**.

**Live preview:** https://maira-abid.github.io/Zeeshan-Portfolio-Site-V2/ (marked `noindex` until the real domain and email are set)

## This repository

```
content/    the portfolio data (data.js, media.js) and the optimised images the site uses
src/        styles.css, main.js, fonts
build.js    builds the whole site from content/ + src/
docs/       the built site GitHub Pages serves (committed; rebuilt with npm run build:pages)
public/     local preview build (not committed)
```

```bash
npm install            # once (installs sharp, used for the share images)
npm run build          # local preview in ./public (open public/index.html, or: npm run serve)
npm run build:pages    # rebuild ./docs for GitHub Pages, then commit and push
npm run build:live     # build for a real domain (see "Going live" below)
```

Pushing to `main` publishes whatever is in `docs/`, so run `npm run build:pages` first.

---

A second, independent portfolio built from the same projects and images as the main site (copied into `content/`), but designed from scratch as I would for a hiring-focused portfolio. It is not meant to be a Framer copy: it is the answer to "what would you make if nobody gave you a brand?"

**To look at it:** double-click `public/index.html`. Every page links to an explicit `index.html`, so all the tabs work straight from disk with no server. (When hosted, the address bar still shows the clean URL.)

```bash
node build.js     # rebuilds ./public (16 pages)
node serve.js     # optional preview at http://localhost:5190
```

**Interaction layer (all optional, all switch off with the Motion button in the footer or `prefers-reduced-motion`):**
- Move the mouse over the home headline and a film frame of each project follows you, changing as you travel.
- Images in the project panels drift against the pointer.
- Headline words rise in; the key word gets a marker wipe; headline numbers count up as they scroll into view.
- A quiet one-row client ticker and a scroll-progress bar under the header.
- Dark is the default (the work pops on it); the header button switches to light and remembers the choice.

## The thinking

**Who reads it.** A hiring manager or creative director with about 90 seconds and ten other tabs open. They need three things fast: what this person does, proof it worked, and how to reach them.

**The positioning.** Most designer portfolios show style. Zeeshan's strongest material is results: a #1 selling brand for a year, 3x sales in five days, 40% fewer support queries. So the hero is one line, *Design that moves numbers.*, and the whole site backs it up with figures taken from the project write-ups. Nothing is invented.

**The look (deliberately not a template).**
- *Slate:* the hero facts sit in a clapperboard-style table, with a film-timecode ruler header that comes back on the case-study side panel and the contact band.
- *Stack:* the home page shows each of the six case studies once, full screen, as a stack of panels that slide over one another. Each leads with the problem it solved ("A brand that sells"), the number it moved, and a large image. On phones they become normal stacked cards. The Work page is a results menu with dot leaders.
- *Hard edges:* 2px ink rules, square corners, no shadows, no pills, no gradients or glassy cards.
- *Type:* Raleway only (from the brand style guide PDF), uppercase and heavy for display and small labels. It is an open-licence font (SIL OFL), self-hosted (about 48 KB). The punk font from the first site is for the logo only and is not used here.
- *Colour:* from the style guide: Violet Ray #8F00FF, Carbon Black #1B1B1B, That Other Grey #E5E5E5 and White. Dark mode is Carbon Black with a lighter tint of the violet for text and marks (pure violet is too dim on black); light mode is white with the pure violet. One highlight: a violet marker pen on the key word of each page headline. Everything else is ink on paper, or the project’s own colour taken from the work itself.
- *Brand checks, used sparingly:* a faint checkerboard behind the home hero that fades out, card suits (spade, heart, club, diamond) between the client names in the marquee, and one thin row of checks above the footer. Nothing else.
- Light and dark follow the visitor's system.

## What it is built to do

| Goal | How |
|---|---|
| Fast | Plain HTML, one CSS file, one small JS file. No framework. WebP images with srcset, lazy-loaded; Vimeo only loads on click. |
| Accessible | axe-core: zero violations on all 16 pages. Keyboard navigation, native `<dialog>` lightbox, visible focus, reduced-motion respected, project colours checked for 4.5:1 text contrast at build time. |
| Findable | Each page has a title, description, canonical URL, Open Graph image, and JSON-LD (Person, ProfessionalService, WebSite, CollectionPage, CreativeWork, BreadcrumbList). Also sitemap.xml, robots.txt and llms.txt. |
| Works without JS | Every page is complete HTML. JS only adds the tabs, filter, lightbox and form helper. |
| Smooth | CSS view transitions between pages, so a project image carries across to its case study; scroll-driven reveals where the browser supports them. |

## Placeholders to replace (top of `build.js`, `CONFIG`)

- `url`: the real domain
- `email`: the real address (used on Contact and in the privacy policy)
- `availability`: the status line in the hero (set `''` to hide)
- `resumeUrl`: link to a PDF résumé (appears on Contact only when set)
- `indexable`: set `true` when it should be searched. It ships as `noindex` so a draft cannot be indexed by accident.
- Headshot: there is a labelled placeholder on the About page.

## Editorial choices to review

- Six full case studies (Pizza Now, Collegiate Survival Sale, CarSwitch, Evercare, Breakfast Box, Black Friday) plus four image-led projects. Projects with no write-up yet (showreel, app launch, Startup Grind) are left out rather than shown thin.
- The "How I work" steps and "What I can help with" list are drawn from the existing write-ups.

## Not done / caveats

- Not tested in Safari or Firefox. View transitions and scroll-driven animation degrade to a normal page load and static content.
- This version is plain static files. Moving it to Framer would mean rebuilding it there; it was not designed around Framer's limits.

## Going live (SEO and local search)

The default build is a **preview**: links end in `index.html` so it opens from a double-click, and every page is `noindex` with a `robots.txt` that blocks crawlers, so a draft can never be indexed by accident.

When you have the real domain and email:

```bash
SITE_URL=https://yourdomain.com SITE_EMAIL=you@yourdomain.com node build.js --live
```

`--live` switches to clean links (`/work/`, not `/work/index.html`), allows indexing, points the sitemap, canonical links, share images and search data at the real domain, and adds the email and Toronto map coordinates to the search data. If either value is still a placeholder it stays `noindex` and says so. Optionally set `CONFIG.headshotUrl` to add your photo to the search data.

After deploying: submit `sitemap.xml` in Google Search Console and Bing Webmaster Tools, and check the share image with a link-preview tool.

## Tango photos hidden, image protection, white project colours

- **Tango photos are hidden, not deleted:** `tango-photos` is left out of `GALLERIES` in `build.js` (the data and images stay in `content/`). Add it back to that list to show it again. Its page and image files no longer appear in `public/` or `docs/`.
- **Image protection (a deterrent only):** gallery images are buttons that open the lightbox (there is no link to the image file to open in a new tab), and images do not offer the right-click menu, cannot be dragged out, and are not long-press savable (`src/main.js`, last rule in `src/styles.css`). It cannot stop screenshots, developer tools, or someone who already knows an image's address. The GitHub repository itself is public, so the files are also downloadable there.
- **White text on every project colour (owner's choice)** (`THEME` in `build.js`). The four light colours from the work (orange, pink, mint, beige) are darkened only slightly, from about 1.8 to 2.0:1 up to about 3.2 to 3.3:1 with white. That passes WCAG for large text (3:1) but not for small text (4.5:1), so the build still prints a "LOW CONTRAST" warning for them.

## Client list, 1200 px images, home panel crops (07-Nov-2026)

- **Client strip:** the scrolling strip on the home page uses the client's own list, alphabetical (`CLIENTS` in `build.js`).
- **No full-size images are published.** `webRel()` / `imgTag()` / `copyImages()` only use and only copy the largest web copy of each image (1200 px wide at most); the full-size files stay in `content/img/` for rebuilding the share images but are never in `public/` or `docs/`. This is a deterrent, like the right-click and drag block: screenshots still work, and the GitHub repository itself still contains the files in `content/img/`.
- **Home panels:** the picture sits in a 4:3 frame, and `PANEL` in `build.js` picks the frame and crop for CarSwitch (the "Looking to sell your car?" frame) and Breakfast Box (logo kept whole). The picture is shown whole at rest and only zooms slightly and drifts on hover.
