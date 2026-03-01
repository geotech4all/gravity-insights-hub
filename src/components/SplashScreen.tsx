import { useState, useEffect } from 'react';
import GraviMagLogo from './GraviMagLogo';

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const duration = 3000;
    const interval = 30;
    const step = (interval / duration) * 100;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + step + Math.random() * 2;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => setFadeOut(true), 300);
          setTimeout(() => onComplete(), 800);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-secondary transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Logo + branding */}
      <div className="flex flex-col items-center gap-5 mb-12">
        <GraviMagLogo size={72} className="animate-pulse" />
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-secondary-foreground">
            Gravi<span className="text-primary">Mag</span> Cloud
          </h1>
          <p className="text-sm text-secondary-foreground/60 mt-1">
            by Geotech4All
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-64">
        <div className="h-1 w-full rounded-full bg-secondary-foreground/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-100 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-secondary-foreground/40 text-center mt-3">
          {progress < 30
            ? 'Initializing modules...'
            : progress < 60
            ? 'Loading gravity engine...'
            : progress < 90
            ? 'Preparing workspace...'
            : 'Ready'}
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
