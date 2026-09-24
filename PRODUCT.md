# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Organisations that own or are responsible for physical terrain and the built
surface on it, and who currently commission 3D reconstruction and monitoring
work: infrastructure and utility operators, rail and road asset owners,
quarries and extraction sites, construction firms, municipal and heritage
authorities responsible for historic structures, and the insurance and risk
functions that underwrite them.

Their job: know what the surface of a site is, know when it changes, and be able
to prove both — without a per-seat, per-project licence bill from a proprietary
cloud vendor, and without sending sensitive site data to a service they do not
control.

## Product Purpose

Extralabs reconstructs real-world surface geometry from capture — LiDAR HD,
drone and street-level imagery, video — into 3D models that are accurate enough
to measure against over time, and turns change in that geometry into hazard
signal.

Success is a site owner who can answer "has this moved, and by how much" from
their own data, on infrastructure they can audit, at a cost that tracks what
they actually measured.

## Positioning

**Sovereign, open-source 3D reconstruction with pay-as-you-go economics.**

The incumbent path (Esri, Pix4D Cloud and comparable services) is proprietary,
licensed per seat or per project, and requires handing site data to the vendor's
cloud. Extralabs builds on open-source reconstruction — including the LiDAR HD
work of the IGN and open photogrammetry and Gaussian-splat pipelines — on
infrastructure the customer can inspect and host, and charges by usage rather
than by licence.

The mechanism a neighbouring vendor could not truthfully copy: the whole
pipeline is open and runnable on the customer's own or sovereign
infrastructure, so there is no data-egress requirement and no black box between
capture and measurement.

## Operating Context

Workflows and materials that are factual parts of using or evaluating the
product:

- **Capture sources**: IGN LiDAR HD point clouds (national coverage, France),
  drone photogrammetry, terabyte-scale video flythroughs, and street-level
  panorama imagery (Panoramax, Mapillary, Google Street View) for ground-level
  context and entry points.
- **Reconstruction**: photogrammetric and Gaussian-splat reconstruction of
  surfaces, including the Wasure/Sparkling-Wasure graph-cut surface
  reconstruction from LiDAR, and open world-model reconstruction from imagery.
- **Pipeline stages**: ingestion and organisation of tiles, geo-registration
  into a real coordinate reference system (Lambert-93 / WGS84), reconstruction,
  change measurement, and serving.
- **Outputs**: point clouds, meshes, Gaussian splats, and web-renderable
  formats (SPZ / SOG) that stream to a browser.
- **Deployment reality**: GPU batch and serverless GPU (Cloud Run) jobs, GCS
  backed; the team runs the pipeline itself end to end.

## Capabilities and Constraints

Confirmed:

- 3D surface reconstruction from LiDAR HD, imagery, and video.
- Change detection between epochs of the same site — the basis of the hazard
  claims.
- Infrastructure monitoring as an ongoing service, not a one-off survey.
- Open-source and sovereign deployment: the stack runs on infrastructure the
  customer or their jurisdiction controls.
- Pay-as-you-go commercial model, positioned directly against proprietary
  reconstruction cloud services.
- Web delivery: reconstructions are viewable in the browser, not only in desktop
  GIS.

Terminology in use: reconstruction, surface change, epoch, geo-registration,
point cloud, mesh, Gaussian splat, LiDAR HD, digital twin.

Explicitly undecided / not claimed: pricing numbers, customer counts, funding,
certifications, and any accuracy figure beyond what a specific delivered
dataset demonstrates. Hazard domains are stated as target applications, not as
production deployments.

## Brand Commitments

- Name: **Extralabs** (written as one word in product copy; the repository and
  GitHub organisation use "Extra Project"). Contact domain: `extralabs.xyz`.
- Team, as directed:
  - **Charlie Durand** — CEO
  - **Laurent Caraffa** — CSO (officiating)
  - **Dhruv Malik** — Fullstack engineer and technical director
- Tone: technical, direct, evidence-led. The audience includes engineers and
  geospatial professionals, so precise terminology is preferred over marketing
  abstraction. Avoid inflated claims.

## Evidence on Hand

Real material that exists and may be shown or referenced:

- A working reconstruction and ETL pipeline in this repository, with real
  Fontainebleau (Circuit des 25 Bosses) reconstructions published and rendering
  in the browser.
- IGN LiDAR HD integration, including a documented LiDAR HD implementation note.
- Multiple deployed service implementations: LiDAR/point-cloud processing,
  PDAL, tiling, Panoramax and Mapillary ingestion, Google Street View ingestion,
  a Wasure reconstruction service, a visual-positioning-system component, and
  a Lyra/Gaussian-splat pipeline.
- The open-source Wasure surface-reconstruction codebase, vendored in-repo.

Must not be fabricated: customer logos, testimonials, named case studies,
benchmark accuracy numbers, press coverage, funding announcements, or partner
relationships. None of these exist in the repository, and the page must not
invent them.

## Product Principles

1. **Sovereignty over convenience.** If the customer cannot inspect or host the
   pipeline, it is the wrong pipeline. Data-egress requirements are a product
   defect, not a footnote.
2. **Measurement, not decoration.** A reconstruction is only valuable to the
   degree that it supports a defensible measurement. Pretty output that cannot
   be compared across epochs is not the product.
3. **Pay for what you measure.** Usage-based economics against per-seat
   licensing is a positioning commitment, not a pricing footnote.
4. **Open where it matters.** Build on open reconstruction and open data
   (LiDAR HD, open photogrammetry) so the customer is never locked to one
   vendor's format or cloud.
5. **Say only what the data supports.** Claims are bounded by delivered
   datasets; hazard domains are stated as what the system is built to detect,
   not as deployments that have not happened.

## Accessibility & Inclusion

No product-specific standard has been established. The baseline expectation for
a public marketing surface applies: readable type at real sizes, sufficient
contrast in both themes, keyboard-operable controls, and no motion that cannot be
disabled.
