import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save, User, Building2, Crown, Mail } from 'lucide-react';
import { logActivity } from '@/lib/activityLogger';

const TIER_LABELS: Record<string, string> = { free: 'Free', standard: 'Standard', enterprise: 'Enterprise' };
const TIER_COLORS: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  standard: 'bg-primary/10 text-primary',
  enterprise: 'bg-amber-500/10 text-amber-600',
};

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier, projectCount, projectLimit } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [organization, setOrganization] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        setDisplayName(data.display_name || '');
        setOrganization(data.organization || '');
        setAvatarUrl(data.avatar_url || '');
      }
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      display_name: displayName.trim() || null,
      organization: organization.trim() || null,
      avatar_url: avatarUrl.trim() || null,
    }).eq('user_id', user.id);
    setSaving(false);
    if (error) { toast.error('Failed to save profile'); return; }
    await logActivity('profile_update', { display_name: displayName, organization });
    toast.success('Profile updated successfully');
  };

  const initials = (displayName || user?.email || 'U').slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-foreground">Profile Settings</h2>
            <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" /> Personal Information
            </CardTitle>
            <CardDescription>Update your display name and organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Avatar URL</Label>
                <Input
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><User className="h-3 w-3" /> Display Name</Label>
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your Name" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><Building2 className="h-3 w-3" /> Organization</Label>
                <Input value={organization} onChange={e => setOrganization(e.target.value)} placeholder="Company / University" className="h-9" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
              <Input value={user?.email || ''} disabled className="h-9 bg-muted" />
              <p className="text-[10px] text-muted-foreground">Email cannot be changed from here</p>
            </div>

            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4" /> Subscription
            </CardTitle>
            <CardDescription>Your current plan and usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge className={TIER_COLORS[tier]}>{TIER_LABELS[tier]} Plan</Badge>
              <span className="text-sm text-muted-foreground">
                {projectCount} / {projectLimit === 999999 ? '∞' : projectLimit} projects used
              </span>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              To upgrade your plan, contact <span className="text-primary font-medium">support@geotech4all.com</span> or ask your administrator.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ProfileSettings;
