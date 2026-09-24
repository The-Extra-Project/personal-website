import type { Metadata } from 'next';
import Link from 'next/link';
import { unstable_setRequestLocale } from 'next-intl/server';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SiteShell } from '@/features/site/SiteShell';

const TITLE = 'FAQ — Extralabs';
const DESCRIPTION
  = 'How Extralabs reconstructs 3D surfaces, why a satellite fix is not required, where your data lives, and what the output can tell you.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website', siteName: 'Extralabs' },
};

const QUESTIONS = [
  {
    q: 'What does Extralabs actually do?',
    a: 'We turn capture you already have — a drone pass, a phone panorama, national LiDAR — into a measured 3D surface of a place, and we place that surface in a real coordinate reference system so it can be compared against the same place later. The comparison is the product: it is how you see movement, erosion, or growth over time.',
  },
  {
    q: 'Do you need a satellite fix to position the capture?',
    a: 'No. That is the point. Position is recovered from the imagery itself by a visual positioning system, then tied to open geodata. It means a site can be surveyed under heavy canopy, inside a quarry, against a cliff face, or in a street where the sky is a sliver — all places where a GNSS fix is unreliable or unavailable. Because the fix is visual, it repeats: a site visited again resolves into the same frame as its first visit.',
  },
  {
    q: 'What can you capture from?',
    a: 'Drone flythroughs, street-level panoramas, existing LiDAR, and public imagery. We also ingest open street-level sources — including French national street-level imagery and crowd-sourced coverage — which means a site may already have usable capture before anyone flies it.',
  },
  {
    q: 'Where does our data live?',
    a: 'On infrastructure you or your jurisdiction controls. The pipeline is assembled from open components and runs on your estate, so there is no requirement to ship site data to a vendor cloud — because there is no vendor cloud in the path. This is also why we can work with public bodies who cannot move their data across a border.',
  },
  {
    q: 'How is it priced?',
    a: 'Against what you actually measure, rather than per seat or per project. Proprietary reconstruction services typically license by seat or by project and retain the data in their own estate. Ours is open where it matters and priced to usage.',
  },
  {
    q: 'What can the change detection tell us?',
    a: 'The same differencing that measures a moving boulder face also carries fire fuel load, erosion and structural movement — different questions asked of one measurement. In practice that covers rockfall and cliff stability, slope and drainage change, settlement on assets that must not move, slow drift in heritage structures, and as-built against design in construction.',
  },
  {
    q: 'How accurate is a reconstruction?',
    a: 'It depends on the capture and on the base layer, and we state the uncertainty rather than implying a single number for everything. Where national LiDAR is available we use it as the ground-truth surface and superimpose the reconstruction on it, which anchors the fine detail to a survey-grade reference.',
  },
  {
    q: 'Can I see the output before talking to anyone?',
    a: 'Yes. The Fontainebleau reconstructions are live in the browser — you can orbit them and read the measurement record beside each one.',
  },
];

const FaqPage = (props: { params: { locale: string } }) => {
  unstable_setRequestLocale(props.params.locale);

  return (
    <SiteShell>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:py-24">
        <h1 className="text-balance font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Questions we get asked.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          If yours is not here, write to
          {' '}
          <a
            className="font-medium text-accent hover:underline"
            href="mailto:contact@extralabs.xyz"
          >
            contact@extralabs.xyz
          </a>
          .
        </p>

        <Accordion className="mt-12 w-full" collapsible type="single">
          {QUESTIONS.map((item, index) => (
            <AccordionItem key={item.q} value={`q-${index}`}>
              <AccordionTrigger className="text-left font-display text-base font-semibold">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-14 rounded-xl border border-border bg-secondary/40 p-7">
          <p className="font-display text-lg font-semibold">See it rather than read about it.</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The reconstructions are live, and you can open them in the browser.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="text-sm font-medium text-accent hover:underline" href="/sim">
              Open the live reconstructions →
            </Link>
            <Link className="text-sm font-medium text-accent hover:underline" href="/#access">
              Request access →
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
};

export default FaqPage;
