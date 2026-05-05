import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface InviteInfo {
  id: string;
  org_id: string;
  email: string;
  role: string;
  expires_at: string;
  accepted_at: string | null;
  org_name: string;
  org_slug: string;
  org_type: string;
}

const AcceptInvite = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setError('Missing invitation token.');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke('invite-lookup', {
        body: { token },
      });
      if (error || !data?.invite) {
        setError(data?.error || error?.message || 'Invitation not found or expired.');
      } else {
        setInvite(data.invite);
      }
      setLoading(false);
    };
    load();
  }, [token]);

  const accept = async () => {
    if (!token || !user) return;
    setAccepting(true);
    const { data, error } = await supabase.functions.invoke('invite-accept', {
      body: { token },
    });
    setAccepting(false);
    if (error || !data?.success) {
      toast.error(data?.error || error?.message || 'Failed to accept invitation.');
      return;
    }
    toast.success(`Welcome to ${invite?.org_name}!`);
    if (invite?.org_id) localStorage.setItem('activeOrgId', invite.org_id);
    navigate('/');
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {error ? <XCircle className="h-6 w-6 text-destructive" /> : invite?.accepted_at ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <Building2 className="h-6 w-6 text-primary" />}
          </div>
          <CardTitle>
            {error ? 'Invitation Issue' : invite?.accepted_at ? 'Already Accepted' : 'Organization Invitation'}
          </CardTitle>
          <CardDescription>
            {error
              ? error
              : invite?.accepted_at
                ? 'This invitation has already been used.'
                : `You have been invited to join ${invite?.org_name}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invite && !error && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Organization</span>
                <span className="font-medium">{invite.org_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Role</span>
                <Badge variant="secondary" className="capitalize">{invite.role}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invited Email</span>
                <span className="font-medium">{invite.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expires</span>
                <span>{new Date(invite.expires_at).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          {!user && invite && !error && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                Sign in with <strong>{invite.email}</strong> to accept.
              </p>
              <Button asChild className="w-full">
                <Link to={`/auth?redirect=/invite/${token}`}>Sign In / Sign Up</Link>
              </Button>
            </div>
          )}

          {user && invite && !invite.accepted_at && !error && (
            <>
              {user.email?.toLowerCase() !== invite.email.toLowerCase() && (
                <p className="text-xs text-destructive text-center">
                  Warning: you are signed in as {user.email}, but the invitation is for {invite.email}.
                </p>
              )}
              <Button onClick={accept} disabled={accepting} className="w-full">
                {accepting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Accept Invitation
              </Button>
            </>
          )}

          {(error || invite?.accepted_at) && (
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Go to Dashboard</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvite;
