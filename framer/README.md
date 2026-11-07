# Copying version 2 into Framer

Framer cannot import HTML, so this site (`content/` + `src/`, built by `build.js`) is the design reference and this folder holds what can be imported,
pasted or uploaded. Regenerate after content changes: `node build.js --pages && node export-framer.js`.

```
framer/
  cms/        categories.csv, industries.csv, projects.csv (9 projects), privacy-policy.html
  components/ ClientTicker (set to card-suit separators), FeaturedPanels, ScrollFrames, ThemeSwitch, CountUp, BackgroundPattern
  custom-code/ theme-head.html (Start of <head>), protect-images.html (End of <body>)
  assets/     thumbs/, featured/, tall/ (web-size pictures to upload)
  seo/        seo.csv, site-jsonld.html, llms.txt, og/*.jpg
```

**Status:** the components are the same files as the original site's Framer pack. They pass TypeScript strict mode and render correctly server-side with a stand-in for
the `framer` module. They have NOT been tried inside Framer. The theme switch is the least certain piece (see "Light and dark" below).

## Pages
| Page | Build |
|---|---|
| Home | Hero with the headline "Design that moves numbers." and the facts table; **FeaturedPanels** (six panels, white text on each project's colour, big result number first); the four-number band (**CountUp** per number); "How I work"; "What I can help with"; **ClientTicker** (11 clients, card suits); footer with a thin checkerboard strip (**BackgroundPattern**, Fade out off, height 24). |
| Work | "Real work. Real results.": a CMS Collection List styled as rows (bold result number, project, tags). Native Framer, no code needed. |
| Case study (`/work/:slug`) | Number-led hero, an "at a glance" side panel, numbered chapters (Context, Challenge, My role, Approach, Results). Emails and other tall designs: **ScrollFrames** (three in a row inside the text column, trimmed images from `assets/tall/`). Fields for the one-line key results and the two-sentence summary are in the CSV. |
| About, Contact, Privacy | Text pages. Contact: use Framer's built-in Form (name, email, company, subject, message) instead of the website's "write my email" mailto form. |

## Light and dark
The website has a dark (default) and light version with a half-moon switch. Put **ThemeSwitch** in the header and paste `custom-code/theme-head.html` into Start of `<head>`. Code components follow
it automatically ("Follow theme"). For ordinary layers type `var(--zk-page)`, `var(--zk-text)`, `var(--zk-card)`, `var(--zk-accent)` in colour fields, or use Framer's own light/dark colour styles.
Light = That Other Grey page, white cards, Carbon Black text, violet accents. **Not confirmed:** that Framer colour fields accept `var(--...)` or that your plan allows custom code; if not, ship dark only.
(The website's light cards are `#F5F5F5`; the component uses `#FFFFFF`: change it in `THEMES` if you want an exact match.)

## Other notes
- Raleway only; colours from the client's style guide (Violet Ray `#8F00FF`, Carbon Black `#1B1B1B`, That Other Grey `#E5E5E5`, White).
- Tango Photos is hidden at the owner's request and left out of the CSV.
- Not rebuilt in Framer (optional extras on the website): the Motion on/off button, the kinetic headline, the scroll progress bar and the hover drift on panels.
- `custom-code/protect-images.html` is a deterrent, not a lock; upload only web-size copies.
- SEO: `seo/seo.csv` has every page's title, description and share image; `site-jsonld.html` needs the real domain; Framer cannot serve `llms.txt` at the root.
- Placeholders still to replace: real domain and email, headshot, logo.
