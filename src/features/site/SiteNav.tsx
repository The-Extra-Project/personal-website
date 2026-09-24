import Link from 'next/link';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { cn } from '@/utils/Helpers';

/**
 * The one navigation for the public surfaces. Deliberately server-rendered with
 * no client state: the previous shells each invented their own chrome, and a
 * menu that toggles is the easiest place to reintroduce a hydration mismatch.
 */
export const SiteNav = () => (
  <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-sm">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
      <Link href="/" className="font-display text-lg font-bold tracking-tight">
        Extra
        <span className="text-accent">[Labs]</span>
      </Link>

      <nav aria-label="Sections" className="order-last w-full sm:order-none sm:w-auto">
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-medium text-muted-foreground">
          <li>
            <Link className="transition-colors hover:text-foreground" href="/platform">
              Platform
            </Link>
          </li>
          <li>
            <Link className="transition-colors hover:text-foreground" href="/sim">
              Live reconstructions
            </Link>
          </li>
          <li>
            <Link className="transition-colors hover:text-foreground" href="/#projects">
              Projects
            </Link>
          </li>
          <li>
            <Link className="transition-colors hover:text-foreground" href="/faq">
              FAQ
            </Link>
          </li>
        </ul>
      </nav>

      <Link
        className={cn(buttonVariants({ size: 'sm' }), 'ml-auto')}
        href="/#access"
      >
        Request access
      </Link>
    </div>
  </header>
);
