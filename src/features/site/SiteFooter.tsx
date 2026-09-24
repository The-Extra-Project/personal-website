import Link from 'next/link';

/**
 * The one footer for the public surfaces.
 *
 * Social handles are intentionally absent rather than pointed at
 * `twitter.com` / `linkedin.com` homepages — the design audit flagged those
 * generic links as a credibility leak. Add them once the real profiles exist.
 */
const COLUMNS = [
  {
    heading: 'Product',
    links: [
      { label: 'Platform', href: '/platform' },
      { label: 'Live reconstructions', href: '/sim' },
      { label: 'Projects', href: '/#projects' },
      { label: 'Services', href: '/#services' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'Team', href: '/#team' },
      { label: 'Roadmap', href: '/#roadmap' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact', href: '/#access' },
    ],
  },
  {
    heading: 'Elsewhere',
    links: [
      { label: 'GitHub', href: 'https://github.com/The-Extra-Project' },
      { label: 'Writing', href: 'https://medium.com/circum-protocol' },
      { label: 'contact@extralabs.xyz', href: 'mailto:contact@extralabs.xyz' },
    ],
  },
];

export const SiteFooter = () => (
  <footer className="border-t border-border/70 bg-secondary/40">
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="font-display text-lg font-bold tracking-tight">
            Extra
            <span className="text-accent">[Labs]</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Making 3D capture of the physical world scalable, affordable, and
            yours to run.
          </p>
        </div>

        {COLUMNS.map(column => (
          <div key={column.heading}>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {column.heading}
            </div>
            <ul className="mt-4 space-y-2.5 text-sm">
              {column.links.map(link => (
                <li key={link.label}>
                  <Link
                    className="text-foreground/80 transition-colors hover:text-accent"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-col gap-3 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          ©
          {new Date().getFullYear()}
          {' '}
          Extra Labs. All rights reserved.
        </span>
        <span>Fontainebleau · Île-de-France</span>
      </div>
    </div>
  </footer>
);
