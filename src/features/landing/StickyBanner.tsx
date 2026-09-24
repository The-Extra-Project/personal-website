export const StickyBanner = (props: { children: React.ReactNode }) => (
  <div className="sticky top-0 z-50 bg-navy p-4 text-center text-lg font-semibold text-navy-foreground [&_a:hover]:text-accent-strong [&_a]:text-accent">
    {props.children}
  </div>
);
