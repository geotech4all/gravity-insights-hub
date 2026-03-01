import GraviMagLogo from './GraviMagLogo';

const Header = () => {
  return (
    <header className="bg-secondary text-secondary-foreground border-b-2 border-primary">
      <div className="container mx-auto flex items-center justify-between py-4 px-4">
        <div className="flex items-center gap-3">
          <GraviMagLogo size={40} />
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Gravi<span className="text-primary">Mag</span> Cloud
            </h1>
            <p className="text-xs text-secondary-foreground/70">by Geotech4All</p>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm text-secondary-foreground/80">
          <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
            Phase 2
          </span>
        </nav>
      </div>
    </header>
  );
};

export default Header;
