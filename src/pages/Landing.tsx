import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import GraviMagLogo from '@/components/GraviMagLogo';
import heroDashboard from '@/assets/hero-dashboard.jpg';
import heroField from '@/assets/hero-field.jpg';

import {
  BarChart3, Globe, Share2, Shield, Zap, Check, ArrowRight,
  FileSpreadsheet, Brain, Upload, LineChart, FileDown, Sparkles,
  GraduationCap, Building2, Users,
} from 'lucide-react';

const features = [
  { icon: BarChart3, title: 'Gravity & Magnetic Processing', desc: 'Bouguer, Free-Air, terrain corrections, magnetic reductions — all with real-time anomaly visualization.' },
  { icon: Globe, title: 'Interactive Station Maps', desc: 'Leaflet-powered maps with color-coded anomaly overlays for spatial analysis of survey data.' },
  { icon: Brain, title: 'Advanced Interpretation', desc: 'Euler deconvolution, power spectrum, regional-residual separation, and derivative computations.' },
  { icon: FileSpreadsheet, title: 'Flexible Data Import', desc: 'Upload Excel, CSV, XYZ, or GXF files. Manual entry and bulk import supported.' },
  { icon: Share2, title: 'Team Collaboration', desc: 'Share projects with viewer or editor permissions. Real-time cloud sync across devices.' },
  { icon: Shield, title: 'Enterprise Security', desc: 'Role-based access, encrypted storage, audit logs, and SSO-ready compliance.' },
];

const steps = [
  { icon: Upload, title: 'Upload your survey', desc: 'Drag and drop XLSX, CSV, XYZ, or GXF files. Or enter readings manually.' },
  { icon: LineChart, title: 'Process & visualize', desc: 'Apply industry-standard corrections and explore anomalies in real time.' },
  { icon: FileDown, title: 'Export & share', desc: 'Generate Word reports, export PNG/SVG charts, share with your team.' },
];

const tiers = [
  {
    name: 'Free', price: '$0', period: 'forever',
    desc: 'For students and personal projects',
    features: ['5 projects', 'All processing tools', 'Chart exports (PNG/SVG)', 'DOCX reports'],
    cta: 'Get Started', highlight: false,
  },
  {
    name: 'Standard', price: '$20', period: '/month',
    desc: 'For working professionals',
    features: ['50 projects', 'Everything in Free', 'Priority support', 'Team collaboration', 'Bulk data import'],
    cta: 'Start Standard', highlight: true, earlyBird: '$18/mo for first 3 months',
  },
  {
    name: 'Enterprise', price: 'Custom', period: '',
    desc: 'For organizations and labs',
    features: ['Unlimited projects', 'Everything in Standard', 'Custom integrations', 'Dedicated support', 'On-premise option'],
    cta: 'Contact Sales', highlight: false,
  },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GraviMagLogo size={32} />
            <div className="leading-tight">
              <div className="font-bold text-foreground text-sm">GraviMag Cloud</div>
              <div className="text-[10px] text-muted-foreground -mt-0.5">by Geotech4All</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#academic" className="hover:text-foreground transition-colors">For Universities</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>Sign In</Button>
            <Button size="sm" onClick={() => navigate('/auth')} className="gap-1.5">
              Get Started <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero — full-bleed mission */}
      <section className="relative h-[calc(100vh-4rem)] min-h-[560px] max-h-[820px] w-full overflow-hidden">
        <img
          src={heroField}
          alt="Geophysicist conducting a gravity survey in the field"
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />

        <div className="relative h-full container mx-auto px-4 flex items-center">
          <div className="max-w-2xl space-y-6">
            <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
              Our Mission
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.05]">
              Empowering geoscientists<br />
              to map what lies <span className="text-primary">beneath</span>
            </h1>
            <p className="text-lg text-foreground/80 max-w-xl leading-relaxed">
              GraviMag Cloud puts professional gravity and magnetic data processing
              in the hands of every researcher, student, and exploration team —
              from field survey to publication-ready interpretation.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
              <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 h-12 px-7 text-base shadow-lg shadow-primary/20">
                Start Free <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="h-12 px-7 text-base bg-background/60 backdrop-blur">
                Learn More
              </Button>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Free for universities · No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary mb-4">Features</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Everything you need, from raw field data to publication-ready results
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            One platform replaces a stack of desktop tools. Built by geophysicists, for geophysicists.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {features.map(f => (
            <Card key={f.title} className="group border-border/60 hover:border-primary/40 hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-6 pb-6 space-y-4">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <f.icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-semibold text-foreground text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-muted/30 border-y border-border/40">
        <div className="container mx-auto px-4 py-24">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary mb-4">How it works</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              From upload to insight in three steps
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="absolute -top-4 -left-2 text-7xl font-extrabold text-primary/10 select-none">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="relative space-y-3 pt-6">
                  <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-foreground text-xl">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Academic callout */}
      <section id="academic" className="container mx-auto px-4 py-24">
        <div className="relative max-w-5xl mx-auto rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-10 sm:p-14 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className="bg-primary/10 text-primary border-0 gap-1.5 mb-4">
                <GraduationCap className="h-3.5 w-3.5" /> For Universities
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                Free unlimited access for academic institutions
              </h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                Sign up with your <code className="text-primary font-mono text-sm">.edu</code> or
                <code className="text-primary font-mono text-sm"> .ac.*</code> email to automatically
                unlock unlimited projects, team workspaces, and priority research support — at no cost.
              </p>
              <Button size="lg" onClick={() => navigate('/auth')} className="mt-6 gap-2">
                Sign up with academic email <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Building2, label: 'Auto-verified institutions' },
                { icon: Users, label: 'Team workspaces' },
                { icon: Brain, label: 'Research-grade tools' },
                { icon: Shield, label: 'FERPA-aware storage' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-2 p-4 rounded-xl bg-background/60 border border-border/50">
                  <item.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-muted/30 border-y border-border/40">
        <div className="container mx-auto px-4 py-24">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary mb-4">Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Start free. Upgrade when you need more.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {tiers.map(t => (
              <Card key={t.name} className={`relative flex flex-col ${t.highlight ? 'border-primary shadow-xl shadow-primary/10 ring-1 ring-primary/20 md:scale-105' : 'border-border/60'}`}>
                {t.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground shadow-md">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="pt-8 pb-6 space-y-6 flex-1 flex flex-col">
                  <div>
                    <h3 className="font-bold text-xl text-foreground">{t.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t.desc}</p>
                    <div className="flex items-baseline gap-1 mt-4">
                      <span className="text-4xl font-extrabold text-foreground">{t.price}</span>
                      {t.period && <span className="text-sm text-muted-foreground">{t.period}</span>}
                    </div>
                    {'earlyBird' in t && t.earlyBird && (
                      <p className="text-xs text-primary font-medium mt-1.5">🎉 {t.earlyBird}</p>
                    )}
                  </div>
                  <ul className="space-y-2.5 flex-1">
                    {t.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    size="lg"
                    variant={t.highlight ? 'default' : 'outline'}
                    onClick={() => t.name === 'Enterprise' ? window.location.href = 'mailto:support@geotech4all.com' : navigate('/auth')}
                  >
                    {t.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            🎓 Universities get the <a href="#academic" className="text-primary font-medium hover:underline">Academic plan free forever</a>
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
            Ready to modernize your geophysical workflow?
          </h2>
          <p className="text-lg text-muted-foreground">
            Join geoscientists already using GraviMag Cloud to process surveys faster, collaborate with their teams, and produce publication-ready results.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 h-12 px-8 text-base">
              Start Free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => window.location.href = 'mailto:support@geotech4all.com'} className="h-12 px-8 text-base">
              Talk to Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/20">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <GraviMagLogo size={28} />
              <div className="leading-tight">
                <div className="text-sm font-semibold text-foreground">GraviMag Cloud</div>
                <div className="text-[10px] text-muted-foreground">by Geotech4All</div>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <button onClick={() => navigate('/terms')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</button>
              <button onClick={() => navigate('/privacy')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</button>
              <a href="mailto:support@geotech4all.com" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Contact</a>
              <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} Geotech4All</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
