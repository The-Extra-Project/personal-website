export const FeatureCard = (props: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="group rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:shadow-xl">
    <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
      {props.icon}
    </div>

    <div className="mt-4 text-lg font-bold">{props.title}</div>

    <div className="my-3 w-8 border-t border-purple-400" />

    <div className="mt-2 text-muted-foreground">{props.children}</div>
  </div>
);
