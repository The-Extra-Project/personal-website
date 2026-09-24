import { SiteFooter } from './SiteFooter';
import { SiteNav } from './SiteNav';

/** The shared public shell: one nav, one footer, one column system. */
export const SiteShell = (props: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col">
    <SiteNav />
    <main className="flex-1">{props.children}</main>
    <SiteFooter />
  </div>
);
