import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { unstable_setRequestLocale } from 'next-intl/server';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { AccessForm } from '@/features/site/AccessForm';
import { SiteShell } from '@/features/site/SiteShell';
import { cn } from '@/utils/Helpers';

const TITLE = 'Extralabs — 3D capture of the physical world, made scalable';
const DESCRIPTION
  = 'Extralabs turns drone passes, street panoramas and national LiDAR into measured 3D surfaces you own. Position recovered without a GNSS fix, on open infrastructure you control.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website', siteName: 'Extralabs' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'Extralabs',
  'url': 'https://extralabs.vercel.app',
  'email': 'contact@extralabs.xyz',
  'description': DESCRIPTION,
  'founder': [
    { '@type': 'Person', 'name': 'Charlie Durand', 'jobTitle': 'CEO' },
    { '@type': 'Person', 'name': 'Laurent Caraffa', 'jobTitle': 'CSO' },
  ],
  'knowsAbout': [
    '3D surface reconstruction',
    'LiDAR HD',
    'Gaussian splatting',
    'visual positioning systems',
    'change detection',
    'geospatial infrastructure',
  ],
};

/* ------------------------------------------------------------------ content */

const PIPELINE = [
  {
    step: 'Capture',
    body: 'A drone pass, a phone panorama, or imagery you already hold. No surveyed control point and no satellite fix needed at capture time.',
  },
  {
    step: 'World model',
    body: 'The footage becomes geometry through open world-model reconstruction, with high-density splats carrying the fine surface.',
  },
  {
    step: 'Fusion',
    body: 'Registered against open geodata — street network, national terrain and elevation models, existing LiDAR — so it lands in a real coordinate system.',
  },
  {
    step: 'Positioning',
    body: 'A visual positioning system resolves where each capture sits, and re-resolves it on every later visit. Position becomes a measurement, not an assumption.',
  },
  {
    step: 'Surface and change',
    body: 'National LiDAR is the ground-truth base layer, splats are superimposed on it, and differencing two epochs gives the movement with its uncertainty stated.',
  },
];

const SERVICES = [
  {
    title: '3D surface reconstruction',
    body: 'Terrain, buildings, cliffs and quarries reconstructed to a measurable surface — from national LiDAR, drone photogrammetry, or Gaussian splats, whichever the site allows.',
    detail: 'LiDAR HD · photogrammetry · splats',
  },
  {
    title: 'Change detection and hazard monitoring',
    body: 'The same site observed again and differenced against its own history. That is the signal behind rockfall, erosion, subsidence, and encroaching fuel load.',
    detail: 'movement · erosion · fuel load',
  },
  {
    title: 'Positioning without a satellite fix',
    body: 'Under heavy canopy, inside a quarry, against a cliff face, or in a street where the sky is a sliver — places where a GNSS fix is unavailable and a survey still has to be possible.',
    detail: 'visual positioning · repeatable',
  },
  {
    title: 'Sovereign deployment',
    body: 'The pipeline is assembled from open components and runs on infrastructure you or your jurisdiction controls. There is no vendor cloud in the path, so there is nothing to ship data to.',
    detail: 'open stack · your estate',
  },
  {
    title: 'Data products you can hand on',
    body: 'Reconstructed surfaces delivered as the formats your teams already use — streamable splats, tiled point clouds, elevation models, and watertight meshes.',
    detail: 'splats · tiles · DEM · meshes',
  },
];

const PROJECTS = [
  {
    name: 'Circuit des 25 Bosses, Fontainebleau',
    body: 'Six reconstructions of a sandstone boulder circuit, geo-registered and published as splats that stream straight into a browser. It proves the pipeline on terrain that is genuinely difficult: low relief, heavy canopy, and no satellite reception under the trees.',
    tag: 'live now',
  },
  {
    name: 'IGN LiDAR HD integration',
    body: 'Ingestion and processing of France\u2019s national LiDAR product as the survey-grade ground-truth surface. Reconstructions are superimposed on the LiDAR-derived mesh rather than floating free of it.',
    tag: 'base layer',
  },
  {
    name: 'Wasure surface reconstruction',
    body: 'Regularised, watertight surface reconstruction from point clouds — the research line our co-founder published on, and the open implementation we build on to turn LiDAR into measurable surfaces rather than loose point soup.',
    tag: 'research',
  },
  {
    name: 'Visual positioning system',
    body: 'Pose estimated from imagery alone and served as a geospatial position: location plus orientation with an accuracy figure. This is what lets a capture be placed without a satellite fix.',
    tag: 'positioning',
  },
  {
    name: 'Capture and ETL pipeline',
    body: 'Ingestion, tiling, geo-registration, reconstruction and serving, run as resumable stages on GPU. It is the same pipeline every reconstruction above came out of.',
    tag: 'infrastructure',
  },
  {
    name: 'Drone simulation and rendering',
    body: 'A simulated drone eye over a reconstructed site, generated as short cinematic clips and turned back into geometry — useful for planning a flight, and for showing a site to people who cannot visit it.',
    tag: 'simulation',
  },
];

const ROADMAP = [
  {
    phase: 'Built',
    when: 'today',
    body: 'A working pipeline end to end, reconstructions live in the browser, national LiDAR integrated, positioning recovered without a satellite fix.',
    state: 'done' as const,
  },
  {
    phase: 'Next',
    when: 'in progress',
    body: 'A regional pilot with a public partner, wider coverage across Île-de-France, and more capture sources feeding the same pipeline.',
    state: 'now' as const,
  },
  {
    phase: 'Then',
    when: 'planned',
    body: 'Coverage that keeps itself current as the network grows, so nobody has to commission an acquisition campaign to get an up-to-date surface again.',
    state: 'next' as const,
  },
];

const PARTNERS = ['Agoranov', 'Bpifrance', 'Région Île-de-France', 'Protocol Labs', 'IGN France'];

const TEAM = [
  {
    role: 'CEO',
    name: 'Charlie Durand',
    body: 'Sets the direction and the commercial model — sovereign, open infrastructure priced against what you actually measure.',
  },
  {
    role: 'CSO · co-founder',
    name: 'Laurent Caraffa',
    body: 'Owns the science: reconstruction, registration, and the change-detection methods the hazard work rests on.',
  },
  {
    role: 'Technical director',
    name: 'Dhruv Malik',
    body: 'Builds and runs the pipeline, the services, and the browser-based viewer end to end.',
  },
];

const GALLERY = [
  { src: '/site/sim-pano-175106e9.png', caption: 'Granite boulders and autumn birch, Fontainebleau' },
  { src: '/site/sim-croix-lorraine.png', caption: 'The Lorraine monument clearing, reconstructed' },
  { src: '/site/sim-trail-ascent.png', caption: 'A forest trail under heavy canopy — no sky, no satellite fix' },
  { src: '/site/sim-pano-06d14b03.png', caption: 'A sandy clearing at the 25 Bosses trailhead' },
  { src: '/site/sim-yt-seg11.png', caption: 'Reconstructed from a public flythrough, not a survey' },
];

/* --------------------------------------------------------------------- page */

const IndexPage = (props: { params: { locale: string } }) => {
  unstable_setRequestLocale(props.params.locale);

  return (
    <>
      { }
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      <SiteShell>
        {/* ---------------------------------------------------------- hero */}
        <section className="border-b border-border/70 bg-gradient-to-b from-secondary/60 to-background">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-28">
            <div>
              <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                A better way to map the world in 3D.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Extralabs turns ordinary capture — a drone pass, a street panorama, national
                LiDAR — into measured 3D surfaces you own. Position is recovered from the imagery
                itself, so a site can be surveyed even where the sky is a sliver.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link className={cn(buttonVariants({ size: 'lg' }))} href="#access">
                  Request access
                </Link>
                <Link
                  className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))}
                  href="/sim"
                >
                  See live reconstructions
                </Link>
              </div>

              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-6">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Sites live
                  </dt>
                  <dd className="mt-1 font-display text-2xl font-semibold">6</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Base layer
                  </dt>
                  <dd className="mt-1 font-display text-2xl font-semibold">LiDAR HD</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Satellite fix
                  </dt>
                  <dd className="mt-1 font-display text-2xl font-semibold text-accent">
                    not needed
                  </dd>
                </div>
              </dl>
            </div>

            <figure className="overflow-hidden rounded-2xl border border-border bg-navy shadow-xl">
              <Image
                alt="A reconstructed Fontainebleau boulder field, rendered from Gaussian splats"
                className="h-auto w-full object-cover"
                height={720}
                priority
                src="/site/sim-pano-175106e9.png"
                width={1280}
              />
              <figcaption className="border-t border-white/10 px-5 py-3.5 text-sm leading-relaxed text-navy-foreground/75">
                Fontainebleau, reconstructed from a street-level panorama and registered without a
                GNSS fix.
              </figcaption>
            </figure>
          </div>
        </section>

        {/* ------------------------------------------------- what we are */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.25fr]">
            <h2 className="text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
              We make 3D capture of the physical world scalable.
            </h2>
            <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
              <p>
                Acquiring 3D data has never been the hard part — sensors are everywhere. The hard
                part is that the data arrives fragmented and heterogeneous, and turning it into one
                coherent, current model of a place has meant commissioning a survey campaign.
              </p>
              <p>
                We reconstruct that fragmented capture into detailed, evolving surfaces, and we do it
                on open infrastructure. That matters for two reasons: a public body can keep its
                data inside its own jurisdiction, and anyone can verify how a number was produced.
              </p>
              <p className="text-foreground">
                For local government, infrastructure operators, and anyone responsible for ground
                that has to stay where it is.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ proof */}
        <section className="border-y border-border/70 bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              This is not a roadmap. It is running.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Every reconstruction below was produced by the pipeline described here, and you can
              open them in the browser yourself.
            </p>

            <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
              {PIPELINE.map((item, index) => (
                <li key={item.step}>
                  <div className="font-mono text-xs text-accent">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <h3 className="mt-2 font-display text-base font-semibold">{item.step}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </li>
              ))}
            </ol>

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {GALLERY.map(image => (
                <figure
                  key={image.src}
                  className="overflow-hidden rounded-xl border border-border bg-navy"
                >
                  <Image
                    alt={image.caption}
                    className="h-48 w-full object-cover"
                    height={384}
                    loading="lazy"
                    src={image.src}
                    width={640}
                  />
                  <figcaption className="px-4 py-3 text-xs leading-relaxed text-navy-foreground/75">
                    {image.caption}
                  </figcaption>
                </figure>
              ))}

              <div className="flex flex-col justify-center rounded-xl border border-dashed border-accent/40 bg-accent/5 p-6">
                <p className="font-display text-base font-semibold">See them moving</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  The reconstructions stream into the browser — orbit them, and read the station
                  record beside each one.
                </p>
                <Link
                  className="mt-4 text-sm font-medium text-accent hover:underline"
                  href="/sim"
                >
                  Open the live reconstructions →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- services */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24" id="services">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            What we do for you.
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Five things, in the order they usually matter to a site owner.
          </p>

          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service, index) => (
              <article
                key={service.title}
                className={cn(
                  'bg-card p-7',
                  // Five items never fill a 2- or 3-column row, and an unpainted
                  // track shows the container's border colour as a hole.
                  index === SERVICES.length - 1 && 'sm:col-span-2',
                )}
              >
                <h3 className="text-balance font-display text-lg font-semibold">{service.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{service.body}</p>
                <p className="mt-4 font-mono text-xs text-accent">{service.detail}</p>
              </article>
            ))}
          </div>
        </section>

        {/* --------------------------------------------------- projects */}
        <section className="border-y border-border/70 bg-secondary/40" id="projects">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              What we have built.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Named work, in plain language — what it is, and what it proves.
            </p>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {PROJECTS.map(project => (
                <article
                  key={project.name}
                  className="rounded-xl border border-border bg-card p-7 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-balance font-display text-lg font-semibold">
                      {project.name}
                    </h3>
                    <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 font-mono text-[0.68rem] text-accent">
                      {project.tag}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {project.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- roadmap */}
        <section className="bg-navy text-navy-foreground" id="roadmap">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Where we are.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-navy-foreground/70">
              We would rather show what exists than promise what might.
            </p>

            <ol className="mt-14 grid gap-6 md:grid-cols-3">
              {ROADMAP.map(item => (
                <li
                  key={item.phase}
                  className="rounded-xl border border-white/10 bg-white/5 p-7"
                >
                  <div
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                      item.state === 'done' && 'bg-roadmap-done text-navy',
                      item.state === 'now' && 'bg-roadmap-now text-navy',
                      item.state === 'next' && 'bg-roadmap-next text-navy',
                    )}
                  >
                    {item.phase}
                  </div>
                  <div className="mt-4 font-mono text-xs text-navy-foreground/60">
                    {item.when}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-navy-foreground/85">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* -------------------------------------------------- partners */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-sm font-medium text-muted-foreground">
            Backed and supported by
          </h2>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {PARTNERS.map(partner => (
              <li
                key={partner}
                className="font-display text-lg font-semibold text-foreground/45 transition-colors hover:text-foreground/80"
              >
                {partner}
              </li>
            ))}
          </ul>
        </section>

        {/* ------------------------------------------------------ team */}
        <section className="border-t border-border/70 bg-secondary/40" id="team">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Who is building it.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              A small team. Between us we cover the science, the commercial model and the
              engineering — which is why the pipeline is short and nothing in it is a black box.
            </p>

            <ul className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
              {TEAM.map(person => (
                <li key={person.name} className="bg-card p-7">
                  <div className="font-mono text-xs text-accent">{person.role}</div>
                  <div className="mt-3 font-display text-lg font-semibold">{person.name}</div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{person.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------------------------------------------------- access */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24" id="access">
          <div className="grid gap-12 rounded-2xl border border-border bg-card p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 className="text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Point it at a site you already care about.
              </h2>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
                Tell us the site and what you need to know about it — movement, erosion, fuel load,
                or simply a surface you can measure against next season. If we cannot answer it, we
                will say so.
              </p>
              <p className="mt-6 text-sm text-muted-foreground">
                Or write to us directly at
                {' '}
                <a
                  className="font-medium text-accent hover:underline"
                  href="mailto:contact@extralabs.xyz"
                >
                  contact@extralabs.xyz
                </a>
              </p>
            </div>

            <AccessForm />
          </div>
        </section>
      </SiteShell>
    </>
  );
};

export default IndexPage;
