import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import GraviMagLogo from '@/components/GraviMagLogo';
import {
  BarChart3, Globe, Share2, Download, Shield, Zap,
  Check, ArrowRight, MapPin, FileSpreadsheet, Brain,
} from 'lucide-react';

const features = [
  { icon: BarChart3, title: 'Gravity & Magnetic Processing', desc: 'Complete Bouguer, Free-Air, terrain corrections and magnetic reductions with real-time anomaly visualization.' },
  { icon: Globe, title: 'Interactive Station Maps', desc: 'Leaflet-powered maps with color-coded anomaly overlays for spatial analysis of survey data.' },
  { icon: Brain, title: 'Advanced Interpretation', desc: 'Euler deconvolution, power spectrum analysis, regional-residual separation, and derivative computations.' },
  { icon: FileSpreadsheet, title: 'Flexible Data Import', desc: 'Upload Excel/CSV files or manually enter stations. Download professional DOCX reports.' },
  { icon: Share2, title: 'Team Collaboration', desc: 'Share projects with colleagues as viewers or editors. Real-time cloud sync across devices.' },
  { icon: Shield, title: 'Enterprise Security', desc: 'Role-based access control, encrypted storage, and audit logs for compliance.' },
];

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['5 projects', 'All processing tools', 'Chart exports (PNG/SVG)', 'Manual data entry', 'DOCX report generation'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Standard',
    price: '$20',
    period: '/month',
    features: ['50 projects', 'Everything in Free', 'Priority support', 'Team collaboration', 'Bulk data import'],
    cta: 'Upgrade',
    highlight: true,
    earlyBird: '$18/mo for first 3 months',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: ['Unlimited projects', 'Everything in Standard', 'Custom integrations', 'Dedicated support', 'On-premise option'],
    cta: 'Contact Sales',
    highlight: false,
  },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraviMagLogo size={28} />
            <span className="font-bold text-foreground">GraviMag Cloud</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>Sign In</Button>
            <Button size="sm" onClick={() => navigate('/auth')}>Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center space-y-6 max-w-3xl">
        <Badge variant="secondary" className="gap-1"><Zap className="h-3 w-3" /> Now in Public Beta</Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
          Professional Gravity & Magnetic<br />
          <span className="text-primary">Data Processing</span> in the Cloud
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Process, visualize, and interpret geophysical survey data with industry-standard corrections — no desktop software required.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
            Start Free <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
            See Features
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">No credit card required · 5 free projects</p>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-foreground">Everything You Need for Geophysical Analysis</h2>
          <p className="text-muted-foreground mt-2">From raw field data to publication-ready results</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {features.map(f => (
            <Card key={f.title} className="group hover:shadow-md transition-shadow border-border/60">
              <CardContent className="pt-6 space-y-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-foreground">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground mt-2">Start free. Upgrade when you need more</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
          {tiers.map(t => (
            <Card key={t.name} className={`relative ${t.highlight ? 'border-primary shadow-lg ring-1 ring-primary/20' : 'border-border/60'}`}>
              {t.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                </div>
              )}
              <CardContent className="pt-8 pb-6 space-y-5">
                <div>
                  <h3 className="font-bold text-lg text-foreground">{t.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-extrabold text-foreground">{t.price}</span>
                    {t.period && <span className="text-sm text-muted-foreground">{t.period}</span>}
                  </div>
                </div>
                <ul className="space-y-2">
                  {t.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={t.highlight ? 'default' : 'outline'}
                  onClick={() => t.name === 'Enterprise' ? window.location.href = 'mailto:support@geotech4all.com' : navigate('/auth')}
                >
                  {t.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraviMagLogo size={20} />
            <span className="text-sm font-medium text-foreground">GraviMag Cloud</span>
            <span className="text-xs text-muted-foreground">by Geotech4All</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/terms')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</button>
            <button onClick={() => navigate('/privacy')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</button>
            <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} Geotech4All</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
