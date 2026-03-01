import GraviMagLogo from './GraviMagLogo';

const Header = () => {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="container mx-auto flex items-center justify-between py-4 px-4">
        <div className="flex items-center gap-3">
          <GraviMagLogo size={40} />
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              GraviMag Cloud
            </h1>
            <p className="text-xs text-primary-foreground/70">by Geotech4All</p>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <span className="rounded-full bg-primary-foreground/20 px-3 py-1 text-xs font-medium text-primary-foreground">
            Phase 2
          </span>
        </nav>
      </div>
    </header>
  );
};

export default Header;
