type LinkDockItem = {
  label: string;
  href: string;
  note: string;
};

type LinkDockProps = {
  title: string;
  items: LinkDockItem[];
};

export default function LinkDock({ title, items }: LinkDockProps) {
  return (
    <section className="link-dock" aria-labelledby="link-dock-title">
      <h2 id="link-dock-title">{title}</h2>
      <div className="link-dock-grid">
        {items.map((item) => (
          <a key={item.href} href={item.href} className="link-dock-item">
            <span>{item.label}</span>
            <small>{item.note}</small>
          </a>
        ))}
      </div>
    </section>
  );
}
