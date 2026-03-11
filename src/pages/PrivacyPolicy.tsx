import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import GraviMagLogo from '@/components/GraviMagLogo';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Account Information:</strong> When you register, we collect your name, email address, and organization. If you sign in with Google, we receive your public profile information.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Survey Data:</strong> Data you upload (station coordinates, gravity/magnetic readings, corrections) is stored securely to provide the Service. We do not access or analyze your data for purposes other than delivering the Service.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Usage Data:</strong> We collect anonymized analytics such as feature usage frequency, session duration, and error reports to improve the Service.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>To provide, maintain, and improve the Service</li>
            <li>To authenticate your identity and manage your account</li>
            <li>To send transactional emails (e.g., password resets, subscription changes)</li>
            <li>To respond to support requests</li>
            <li>To detect and prevent fraud or abuse</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">3. Data Storage & Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your data is stored in encrypted databases with row-level security policies ensuring only authorized users can access their own projects. We use HTTPS for all data transmission and follow industry best practices for infrastructure security.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">4. Data Sharing</h2>
          <p className="text-muted-foreground leading-relaxed">
            We do not sell, rent, or trade your personal information. We may share data only: (a) with your consent; (b) with service providers who assist in operating the Service (under strict confidentiality agreements); (c) when required by law or to protect our rights.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">5. Project Sharing & Collaboration</h2>
          <p className="text-muted-foreground leading-relaxed">
            When you share a project with collaborators, they can access the project data according to the permission level you assign (viewer or editor). You control who has access and can revoke sharing at any time.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">6. Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed">
            We retain your data as long as your account is active. If you delete your account, we will remove your personal data and project data within 30 days, except where retention is required by law.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">7. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You have the right to: (a) access your personal data; (b) correct inaccurate data; (c) export your project data; (d) request deletion of your account and data; (e) withdraw consent for optional data processing. Contact us to exercise these rights.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">8. Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use essential cookies for authentication and session management. We do not use advertising or third-party tracking cookies.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">9. Changes to This Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this Privacy Policy periodically. We will notify you of material changes via email or in-app notification. Your continued use of the Service constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">10. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For privacy-related inquiries, contact us at{' '}
            <a href="mailto:support@geotech4all.com" className="text-primary hover:underline">support@geotech4all.com</a>.
          </p>
        </section>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
