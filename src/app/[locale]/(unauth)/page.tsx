import '@/styles/survey.css';

import type { Metadata } from 'next';
import { Archivo, JetBrains_Mono } from 'next/font/google';
import { unstable_setRequestLocale } from 'next-intl/server';

import { ControlSheet } from '@/features/landing/survey/ControlSheet';
import { WaitingListForm } from '@/features/landing/WaitingListForm';

// Self-hosted at build by next/font: a technical grotesque for language, and a
// monospace with tabular figures for every measurement on the sheet.
const surveyUi = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-survey-ui',
  display: 'swap',
});

const surveyData = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-survey-data',
  display: 'swap',
});

const TITLE = 'Extralabs — sovereign 3D surface reconstruction and hazard detection';
const DESCRIPTION
  = 'Extralabs reconstructs surface geometry from LiDAR HD, drone and street-level capture, and recovers position without GNSS by fusing generated world models with open terrain data. Open-source, sovereign infrastructure, pay-as-you-go.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Extralabs',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'Extralabs',
  'url': 'https://extralab.vercel.app',
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

/** The capture-to-measurement pipeline, as it runs in this repository. */
const PIPELINE = [
  {
    n: '01',
    t: 'Capture',
    d: 'Drone flythrough, street-level panorama, or national LiDAR. No surveyed control point and no GNSS fix is required at capture time.',
  },
  {
    n: '02',
    t: 'World model',
    d: 'Open world-model reconstruction (the Lyra 2.0 / World Labs class of model) turns the footage into geometry, and high-density splats carry the fine surface.',
  },
  {
    n: '03',
    t: 'Fusion',
    d: 'The reconstruction is registered against fused open geodata — street network, national terrain and elevation models, existing LiDAR coverage — so it lands in a real coordinate reference system.',
  },
  {
    n: '04',
    t: 'Visual positioning',
    d: 'A visual positioning system resolves where each capture sits without a satellite fix, and re-resolves it on every later visit. Position becomes a measurement rather than an assumption.',
  },
  {
    n: '05',
    t: 'Surface and change',
    d: 'The LiDAR HD reconstruction mesh is the ground-truth base layer, and splats are superimposed on it. Differencing two epochs gives the movement, with its uncertainty stated.',
  },
];

/** What has actually been built. Every entry exists in this repository. */
const PROJECTS = [
  {
    name: 'Circuit des 25 Bosses, Fontainebleau',
    role: 'Reference survey',
    src: 'drone · panoramax · flythrough',
    body: 'Six reconstructions of a sandstone boulder circuit, geo-registered and published as Gaussian splats that stream straight into a browser. It proves the open pipeline on terrain that is genuinely difficult: low relief, heavy canopy, and no satellite reception under the trees.',
  },
  {
    name: 'IGN LiDAR HD integration',
    role: 'Base layer',
    src: 'national coverage · france',
    body: 'Ingestion and processing of the IGN LiDAR HD product as the survey-grade ground-truth surface. Splat reconstructions are superimposed on the LiDAR-derived mesh instead of floating free of it.',
  },
  {
    name: 'Wasure surface reconstruction',
    role: 'Reconstruction',
    src: 'open source · point clouds',
    body: 'Regularised surface reconstruction from point clouds — the open implementation we build on to turn LiDAR into watertight, measurable surfaces rather than loose point soup.',
  },
  {
    name: 'Visual positioning system',
    role: 'Positioning',
    src: 'openvps · panoramax · streetview',
    body: 'Pose estimation from imagery alone, served as a geospatial pose: position plus orientation with an accuracy figure, for capture that has no satellite fix.',
  },
  {
    name: 'Capture and ETL pipeline',
    role: 'Infrastructure',
    src: 'gpu batch · serverless',
    body: 'Ingestion, tiling, geo-registration, reconstruction and serving, run as resumable stages on GPU. It is the same pipeline the reconstructions above were produced with.',
  },
];

/** The open stack the platform is assembled from, as it stands in the repository. */
const SERVICES = [
  { name: 'LiDAR and point-cloud processing', note: 'PDAL, COPC, tile preparation', src: 'pdal-processor' },
  { name: 'Gaussian splat pipeline', note: 'reconstruction to SPZ and SOG', src: 'splat ETL' },
  { name: 'Panoramax ingestion', note: 'French street-level imagery', src: 'ign-panoramax' },
  { name: 'Mapillary ingestion', note: 'crowd-sourced street imagery', src: 'mapillary' },
  { name: 'Street View ingestion', note: 'third imagery source', src: 'streetview' },
  { name: 'Data fusion', note: 'street graph, GIS, terrain, boundaries', src: 'fusion' },
  { name: 'Tile serving', note: 'streaming to the browser', src: 'tile-server' },
  { name: 'Terrain and elevation', note: 'open DEM, hillshade, slope', src: 'opentopography' },
];

const TEAM = [
  {
    role: 'CEO',
    who: 'Charlie Durand',
    what: 'Sets the direction and the commercial model — sovereign, open infrastructure with usage-based pricing against the per-seat reconstruction clouds.',
  },
  {
    role: 'CSO',
    who: 'Laurent Caraffa',
    what: 'Co-founder. Owns the science: reconstruction, registration, and the change-detection methods the hazard work rests on.',
  },
  {
    role: 'Technical director',
    who: 'Dhruv Malik',
    what: 'Fullstack engineer. Builds and runs the pipeline, the services, and the browser-based viewer end to end.',
  },
];

const IndexPage = (props: { params: { locale: string } }) => {
  unstable_setRequestLocale(props.params.locale);

  return (
    <div className={`sv ${surveyUi.variable} ${surveyData.variable}`}>
      { }
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      <header className="sv-head">
        <div className="sv-shell sv-head-in">
          <a className="sv-mark" href="/">
            Extralabs
            <span>3D surface intelligence</span>
          </a>
          <nav className="sv-nav" aria-label="Sections">
            <a href="#projects">Projects</a>
            <a href="#pipeline">Pipeline</a>
            <a href="#platform">Platform</a>
            <a href="#team">Team</a>
            <a className="sv-btn" href="#access">
              Request access
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* First viewport: the control network, read in one epoch. */}
        <ControlSheet />

        <section className="sv-shell sv-band">
          <div className="sv-split">
            <h2 className="sv-h2">Position without a satellite fix.</h2>
            <div>
              <p className="sv-lede">
                Every reconstruction here was placed in a real coordinate reference
                system without a GNSS fix at capture time. Position is recovered
                visually: a generated world model of the scene, fused with street
                imagery and open terrain data, resolved into a visual positioning
                system. Under heavy canopy, in a quarry, beside a cliff face, or in a
                street where the sky is a sliver, that is the difference between a
                survey and a guess.
              </p>
              <p className="sv-body" style={{ marginTop: '1.1rem' }}>
                Because the fix is visual, it repeats. A site visited again resolves
                into the same frame as its first visit, which is what makes change
                measurable rather than merely visible.
              </p>
            </div>
          </div>
        </section>

        <section id="pipeline" className="sv-shell sv-band">
          <h2 className="sv-h2">From capture to a measurement you can defend.</h2>
          <ol className="sv-chain" style={{ marginTop: '2.4rem' }}>
            {PIPELINE.map(step => (
              <li key={step.n}>
                <span className="n">{step.n}</span>
                <span className="t">{step.t}</span>
                <span className="d">{step.d}</span>
              </li>
            ))}
          </ol>
        </section>

        <section id="projects" className="sv-shell sv-band">
          <div className="sv-split">
            <h2 className="sv-h2">What has been built.</h2>
            <p className="sv-body">
              Not concepts. Each of these is a working system in the repository, and the
              Fontainebleau reconstructions are live and viewable in the browser.
            </p>
          </div>
          <ul className="sv-ledger" style={{ marginTop: '2.4rem' }}>
            {PROJECTS.map(project => (
              <li key={project.name}>
                <h3>{project.name}</h3>
                <p>{project.body}</p>
                <span className="src">
                  {project.role}
                  {' · '}
                  {project.src}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="sv-shell sv-band">
          <div className="sv-split">
            <h2 className="sv-h2">Hazards it is built to read.</h2>
            <div>
              <p className="sv-lede">
                Surface change is the signal underneath all of it. The same differencing
                that measures a moving boulder face also carries fire fuel load, erosion
                and structural movement — different questions asked of one measurement.
              </p>
              <ul className="sv-body" style={{ marginTop: '1.2rem', paddingLeft: '1.1rem' }}>
                <li>Forest fire risk — fuel load, canopy structure, and how both shift between seasons.</li>
                <li>Climate change — erosion and drainage changing the shape of a slope across epochs.</li>
                <li>Civil infrastructure — settlement and movement on assets that must not move.</li>
                <li>Ancient cities and heritage — architectural faults and slow structural drift.</li>
                <li>Construction — as-built against design, with progress measured rather than estimated.</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="platform" className="sv-shell sv-band">
          <div className="sv-split">
            <h2 className="sv-h2">Sovereign by construction, not by promise.</h2>
            <div>
              <p className="sv-lede">
                The pipeline is assembled from open components and runs on infrastructure
                you or your jurisdiction controls. There is no requirement to ship site
                data to a vendor cloud, because there is no vendor cloud in the path.
              </p>
              <p className="sv-body" style={{ marginTop: '1.1rem' }}>
                That is also the commercial difference. Proprietary reconstruction
                services — the Esri and Pix4D Cloud class of product — license per seat
                or per project, and the data leaves your estate. Ours is open where it
                matters, and priced against what you actually measure.
              </p>
            </div>
          </div>
          <ul className="sv-ledger" style={{ marginTop: '2.4rem' }}>
            {SERVICES.map(service => (
              <li key={service.name}>
                <h3>{service.name}</h3>
                <p>{service.note}</p>
                <span className="src">{service.src}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="team" className="sv-shell sv-band">
          <div className="sv-split">
            <h2 className="sv-h2">Who is building it.</h2>
            <p className="sv-body">
              A small team. Between us we cover the science, the commercial model and the
              engineering — which is why the pipeline is short and nothing in it is a
              black box.
            </p>
          </div>
          <ul className="sv-roster" style={{ marginTop: '2.4rem' }}>
            {TEAM.map(member => (
              <li key={member.who}>
                <span className="role">{member.role}</span>
                <p className="who">{member.who}</p>
                <p className="what">{member.what}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="access" className="sv-shell sv-band">
          <div className="sv-close">
            <div>
              <h2 className="sv-h2">Point it at a site you already care about.</h2>
              <p className="sv-body" style={{ marginTop: '1.1rem' }}>
                Tell us the site and what you need to know about it — movement, erosion,
                fuel load, or simply a surface you can measure against next season. If we
                cannot answer it, we will say so.
              </p>
              <p style={{ marginTop: '1.6rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                <a className="sv-btn" href="mailto:contact@extralabs.xyz">
                  contact@extralabs.xyz
                </a>
                <a className="sv-btn sv-btn-ghost" href="/sim">
                  Open the live reconstructions
                </a>
              </p>
            </div>
            <WaitingListForm />
          </div>
        </section>
      </main>

      <footer className="sv-shell sv-foot">
        <a className="sv-mark" href="/">
          Extralabs
        </a>
        <a href="https://github.com/The-Extra-Project">GitHub</a>
        <a href="/faq">FAQ</a>
        <a href="mailto:contact@extralabs.xyz">contact@extralabs.xyz</a>
        <span style={{ marginLeft: 'auto' }}>© Extralabs</span>
      </footer>
    </div>
  );
};

export default IndexPage;
