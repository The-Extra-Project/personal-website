# DESIGN.md — Extralabs

## The world

The surface is a **geodetic control network sheet**: the artifact a surveyor produces
when a network has been observed and reduced. It is not a map and not a dashboard. It is
a record of measurement — stations, baselines, observed angles, residuals, and the epoch
each observation belongs to.

The thesis the form carries: **the network was positioned visually, not by satellite.**
Extralabs recovers position without a GNSS fix by fusing generated world models with
street imagery and open terrain data. The page demonstrates that claim with its own
structure rather than asserting it.

This refuses the category default for the sector: hero, three feature cards, logo strip.

## Surfaces

| surface | route | mode |
|---|---|---|
| Landing | `/[locale]` | Persuade |
| Live reconstructions | `/[locale]/sim` | Experience |

## Palette

Dark, because the audience already reads this material on a dark ground — the
point-cloud viewer is their instrument, and the landing page shares its world.

| token | value | role |
|---|---|---|
| `--ground` | `#0a0d11` | page |
| `--ground-raise` | `#0e1319` | cells, panels |
| `--ink` | `#e8eef4` | primary text |
| `--ink-mid` | `#a7b8c6` | secondary — tinted from the ground hue, never grey |
| `--ink-dim` | `#7e8f9e` | tertiary, field labels |
| `--rule` | `rgba(120, 150, 175, 0.16)` | hairlines and the graticule |
| `--signal` | `#ffb02e` | the current epoch, the primary action — rationed |
| `--link` | `#4cc2ff` | links only |

Amber means *live / current / act*. It is never decoration. Cyan is links only.

## Type

Self-hosted at build by `next/font`, so there is no render-blocking third party and no
layout shift.

- **Archivo** (`--font-survey-ui`) — a technical grotesque for language. Headings and
  body. Weight 600 for headings, 400 for body.
- **JetBrains Mono** (`--font-survey-data`) — every measurement on the sheet: station
  identifiers, coordinates, sigmas, deltas, baselines, the coordinate rail, field labels.
  Tabular figures matter here, which is why the mono is earned rather than stylistic.

Display cap `3.3rem`; body measure held to 65–75ch; tracking floor `-0.04em`.
The station name in the hero is the largest type on the page — it outranks every
section heading, because the instrument is the subject.

## Form rules

- **The graticule** is a square ruling anchored to the sheet's own content measure. The
  verticals land on the content edges and its quarter lines; both axes share one pitch.
  It is derived from the layout, not wallpaper behind it.
- **Station notation**: filled mark with an outer ring; the active station takes the
  ring in `--signal`. Baselines are hairlines; sight lines are dashed; angle arcs carry
  the observed angle.
- **Hairlines, not shadows.** Cells draw their own rules as inset shadows and the
  container carries the cell ground, so an unpainted trailing track can never read as a
  hole.
- **No decorative gradients, no frosted glass.** Depth is border or shadow, never both.
- **No eyebrow above a heading.** The station identifier sits *inside* the `h1`.
- The em dash is bound to the preceding word (`\u00A0—`) so a line never opens on it.

## The signature interaction

The **epoch control** re-reads the sheet. Pulling an epoch restates every station's
sigma and delta in place — the values remount and flash to `--signal` before settling —
and the rail's epoch field follows. Nothing reloads. This is the one authored moment;
it is guarded by `prefers-reduced-motion`.

## Honesty

Sigmas, epoch deltas and baseline lengths are **illustrative of the method, not surveyed
results**, and the sheet says so in the record. Station identifiers, names and anchor
coordinates are real. The hazard framing states what the measurement can carry, not what
has been certified.

## Ownership

Extralabs. Product: `PRODUCT.md`. Surface briefs: `.impeccable/surfaces/`.

---

## Update — one app, two surfaces (company shell + instrument stage)

The product surface previously owned `/` with its own dark instrument world (near-black
ground, amber signal). That read as a product page and never gave the company's big picture.
The app now has a **company shell** that owns the light surfaces, with the instrument kept as a
deliberate dark stage inside it.

**Colour** — derived from the incumbent scheme rather than invented:

| role | token | value |
|---|---|---|
| page ground | `--background` | white / `secondary` grey for alternating bands |
| deep section ground | `--surface-navy` | `222.2 47.4% 11.2%` (`#0f172a`) |
| accent | `--accent` | `173.8 80.4% 40.2%` — teal |
| accent strong | `--accent-strong` | `160.1 84.1% 39.4%` — emerald |
| roadmap states | `--roadmap-{done,now,next}` | the three greens already in the roadmap bar |
| instrument signal | `--signal` (survey.css) | `#2dd4bf` (was amber `#ffb02e`) |

The indigo → purple → pink gradient is **retired**. It was the strongest "AI tell" on the page
and the repo's own audit flagged it as critical. Section subtitles are now solid and quiet,
`CTABanner` uses the navy surface, and `FeatureCard` / `Sponsors` / `StickyBanner` use the accent.

**Type** — declared once in `src/app/[locale]/layout.tsx`, self-hosted by `next/font`:
Archivo (`--font-display`) for headings, Public Sans (`--font-text`) for reading, JetBrains Mono
(`--font-data`) for measurement only. The instrument's faces alias onto these, so nothing
declares a font twice.

**Structure** — `src/features/site/` holds the shared shell (`SiteNav`, `SiteFooter`,
`SiteShell`) and the light `AccessForm`. Surfaces:

- `/` company story (hero, what we are, proof, services, projects, roadmap, partners, team, access)
- `/platform` the instrument — dark stage inside the light shell
- `/sim`, `/sim/[world]` live reconstructions
- `/faq` real answers (previously 404 — the core site linked to it)

**Imagery** — real reconstruction renders in `public/site/` (deploy-safe), never boilerplate
stock. The instrument's graticule is now `position: absolute` within the sheet rather than
viewport-fixed, so it cannot bleed over the light chrome.
