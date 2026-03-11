import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import GraviMagLogo from '@/components/GraviMagLogo';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/landing')}>
            <GraviMagLogo size={28} />
            <span className="font-bold text-foreground">GraviMag Cloud</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl prose prose-neutral dark:prose-invert">
        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing or using GraviMag Cloud ("the Service"), operated by Geotech4All ("we", "us", "our"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">2. Description of Service</h2>
          <p className="text-muted-foreground leading-relaxed">
            GraviMag Cloud is a web-based platform for processing, visualizing, and interpreting gravity and magnetic geophysical survey data. The Service includes data import/export, anomaly computation, interactive mapping, and collaborative project management.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">3. User Accounts</h2>
          <p className="text-muted-foreground leading-relaxed">
            You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your credentials and for all activities under your account. Notify us immediately of any unauthorized use.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">4. Subscription & Payment</h2>
          <p className="text-muted-foreground leading-relaxed">
            The Service offers Free, Standard, and Enterprise tiers. Paid subscriptions are billed monthly or annually. You may cancel at any time; cancellation takes effect at the end of the current billing period. We reserve the right to change pricing with 30 days' notice.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">5. Intellectual Property & Data Ownership</h2>
          <p className="text-muted-foreground leading-relaxed">
            You retain all rights to the data you upload. We do not claim ownership of your survey data, results, or reports. The Service software, branding, and documentation remain our intellectual property. You may not reverse-engineer, copy, or redistribute the Service.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">6. Acceptable Use</h2>
          <p className="text-muted-foreground leading-relaxed">
            You agree not to: (a) use the Service for unlawful purposes; (b) attempt to gain unauthorized access to other accounts or systems; (c) upload malicious code; (d) interfere with the Service's operation; or (e) resell access without written permission.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">7. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            The Service is provided "as is" without warranties of any kind. To the maximum extent permitted by law, Geotech4All shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service, including data loss or processing errors.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">8. Termination</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may suspend or terminate your account for violation of these Terms. Upon termination, you may request export of your data within 30 days, after which it may be permanently deleted.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">9. Changes to Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update these Terms from time to time. Material changes will be communicated via email or in-app notice. Continued use after changes constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">10. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For questions about these Terms, contact us at{' '}
            <a href="mailto:support@geotech4all.com" className="text-primary hover:underline">support@geotech4all.com</a>.
          </p>
        </section>
      </main>
    </div>
  );
};

export default TermsOfService;
