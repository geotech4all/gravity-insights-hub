import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock, Loader2 } from 'lucide-react';
import GraviMagLogo from '@/components/GraviMagLogo';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setReady(true);
    }
    // Also listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success('Password updated!'); navigate('/'); }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Invalid or expired reset link.</p>
            <Button variant="link" onClick={() => navigate('/auth')} className="mt-2">Back to Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-sm w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2"><GraviMagLogo size={40} /></div>
          <CardTitle>Set New Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-3">
            <div>
              <Label className="text-xs">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="pl-9 h-9" placeholder="Min. 6 characters" required minLength={6} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
