import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Share2, Trash2, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface Share {
  id: string;
  shared_with_email: string;
  permission: string;
  created_at: string;
}

interface Props {
  projectId: string;
  projectName: string;
}

const ShareProjectDialog = ({ projectId, projectName }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'viewer' | 'editor'>('viewer');
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) fetchShares();
  }, [open]);

  const fetchShares = async () => {
    const { data } = await supabase
      .from('project_shares')
      .select('id, shared_with_email, permission, created_at')
      .eq('project_id', projectId);
    setShares((data as Share[]) || []);
  };

  const handleShare = async () => {
    if (!email || !user) return;
    if (email === user.email) { toast.error("Can't share with yourself"); return; }
    setLoading(true);

    // Try to resolve user_id from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('display_name', email)
      .maybeSingle();

    const { error } = await supabase.from('project_shares').insert({
      project_id: projectId,
      owner_id: user.id,
      shared_with_email: email,
      shared_with_user_id: profile?.user_id || null,
      permission,
    } as any);

    setLoading(false);
    if (error) {
      if (error.code === '23505') toast.error('Already shared with this email');
      else toast.error('Failed to share');
      return;
    }
    toast.success(`Shared with ${email}`);
    setEmail('');
    fetchShares();

    // Log activity
    await supabase.from('user_activity_logs').insert({
      user_id: user.id,
      user_email: user.email,
      action: 'share_project',
      metadata: { project_id: projectId, shared_with: email, permission },
    } as any);
  };

  const handleRemoveShare = async (shareId: string, shareEmail: string) => {
    const { error } = await supabase.from('project_shares').delete().eq('id', shareId);
    if (error) toast.error('Failed to remove');
    else { toast.success(`Removed ${shareEmail}`); fetchShares(); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={e => e.stopPropagation()}>
          <Share2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" onClick={e => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="text-sm">Share "{projectName}"</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-xs">Email address</Label>
              <Input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="colleague@email.com"
                className="h-8 text-sm"
                type="email"
              />
            </div>
            <div>
              <Label className="text-xs">Permission</Label>
              <Select value={permission} onValueChange={v => setPermission(v as 'viewer' | 'editor')}>
                <SelectTrigger className="h-8 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button size="sm" className="h-8" onClick={handleShare} disabled={loading || !email}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Share'}
              </Button>
            </div>
          </div>

          {shares.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Shared with</Label>
              {shares.map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium">{s.shared_with_email}</span>
                    <span className="ml-2 text-xs text-muted-foreground capitalize">{s.permission}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => handleRemoveShare(s.id, s.shared_with_email)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareProjectDialog;
