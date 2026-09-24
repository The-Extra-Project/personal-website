---
version: 1
slug: "src-app-locale-unauth-page-tsx"
primary_target: "src/app/[locale]/(unauth)/page.tsx"
related_targets: ["src/app/[locale]/(marketing)/sim/page.tsx"]
---

# Surface brief — Extralabs landing page

**Primary target:** `/` → `src/app/[locale]/(unauth)/page.tsx`
**Mode:** Persuade
**Related targets:** `/sim` (the viewer the page hands off to)

## Scope

Replace the incumbent landing page. The current page is the SaaS boilerplate
hero plus three NextJS-screenshot feature cards; two prior audits in
`.commandcode/design/` already scored it 5.6/10, flagged the
indigo→purple→pink gradient as the strongest AI tell, and called the template
screenshots the single highest-severity trust problem. The old look is evidence
of what this product is not; it is not authority over what it becomes.

## Audience, job, action

Geospatial engineers, surveyors, infrastructure and asset owners, heritage and
climate-risk teams, and the people who currently buy Pix4D Cloud or Esri
reconstruction. Their job: know what the surface of a site is, know when it
changed, and be able to prove both on infrastructure they can inspect.

Action: request access (waiting list) or open the live viewer.

## Proof and content

Real material only. The page may show: the working Fontainebleau / Circuit des
25 Bosses reconstructions, the IGN LiDAR HD integration, the ETL stages, the
open-source services in the repository, and the named team. It must not invent
customers, logos, testimonials, benchmarks, funding, or certifications.

## Direction contract

**THESIS.** The page is a geodetic control network that was never surveyed by
satellite. Positioning is recovered visually — generated world models (Lyra /
World Labs), street-level and aerial imagery, and open terrain data fused into a
visual positioning system — so Extralabs' actual claim (sovereign, GNSS-free
surface intelligence) is demonstrated by the page's own structure instead of
asserted in a headline. It refuses the category arrangement outright: centred
hero, three equal feature cards, logo strip, gradient eyebrow.

**OWN-WORLD.** A survey sheet, not a SaaS page. Near-black cool ground with a
hairline graticule; station marks as small ringed circles; measured baselines as
thin ink lines carrying angle arcs; station names in small tracked caps; every
coordinate and measurement in a real monospace with tabular figures. Colour is
rationed and structural: one signal amber for the live epoch and the primary
action, one cold cyan for links, everything else neutral ink. No decorative
gradients, no frosted glass, no icon tiles.

**STORY.** The visitor learns that position and surface change are recovered
*without GNSS*, from imagery and world models; that the whole pipeline is open
and sovereign; that pricing is pay-as-you-go against per-seat reconstruction
clouds. They believe it because the page shows real observed parameters — sigma,
epoch deltas, baselines — and the real capture-to-splat pipeline. They act by
requesting access or opening the viewer.

**FIRST VIEWPORT.** Left column: a station record set large in monospace —
`STATION 02 · ROCHE DE LA TORTUE`, observation epoch, positional sigma, and the
measured delta against the previous epoch. Centre and right: the network plot,
stations joined by measured baselines with angle arcs at the vertices, one
station ringed as active. A full-width coordinate rail sits at the base of the
viewport: `Lambert-93 · RGF93 / IGN69 · epoch`. The primary action
(`Request access`) lives in the station record, not floating centre-page; a
secondary link opens `/sim`.

**FORM.** Grounded candidate 6 of 7 — the geodetic control network / triangulation
diagram. Seed key `c1aabb5b`. Raised by three named donations: **packed density**
(from the toy-catalogue challenger — evidence packs edge to edge rather than
floating in airy card padding), **absolute grid discipline** (from the teletext
challenger — every element snaps to the graticule; nothing floats), and
**single-control transformation** (from the drawcord-cape challenger — one epoch
control re-reads the entire network).

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its
provenance

## Memorable moment

Pulling the epoch control. Every station on the network re-reads its delta and
sigma in place, baselines restate their lengths, and the coordinate rail
re-stamps — one control, total change of state, no page navigation.

## Unresolved

- Exact positioning sigmas and deltas are illustrative of the method, not
  surveyed results, and must be labelled synthetic on the page.
- Waiting-list endpoint behaviour is inherited from the incumbent component.
