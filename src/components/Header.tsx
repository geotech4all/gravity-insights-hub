import { Globe } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto flex items-center justify-between py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Globe className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Geotech<span className="text-primary">4All</span>
            </h1>
            <p className="text-xs text-secondary-foreground/70">Gravity Data Reduction WebApp</p>
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
