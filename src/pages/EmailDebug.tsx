import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Loader2, RefreshCw, Mail, ArrowLeft, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

// Bumped whenever the email templates in supabase/functions/_shared/email-templates change.
const TEMPLATE_VERSION = '1.1.0';
const TEMPLATE_UPDATED_AT = '2026-05-12';

interface EmailLogRow {
  id: string;
  created_at: string;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  message_id: string | null;
  metadata: Record<string, unknown> | null;
}

const STATUS_VARIANT: Record<string, { label: string; className: string }> = {
  sent:        { label: 'Sent',        className: 'bg-green-500/15 text-green-700 border-green-500/30' },
  pending:     { label: 'Pending',     className: 'bg-amber-500/15 text-amber-700 border-amber-500/30' },
  failed:      { label: 'Failed',      className: 'bg-destructive/15 text-destructive border-destructive/30' },
  dlq:         { label: 'Dead-letter', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  bounced:     { label: 'Bounced',     className: 'bg-destructive/15 text-destructive border-destructive/30' },
  complained:  { label: 'Complained',  className: 'bg-destructive/15 text-destructive border-destructive/30' },
  suppressed:  { label: 'Suppressed',  className: 'bg-muted text-muted-foreground border-border' },
};

const EmailDebug = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<EmailLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      setIsAdmin(!!data);
      if (data) await load();
      else setLoading(false);
    })();
  }, [user]);

  const load = async () => {
    setRefreshing(true);
    const { data, error } = await supabase.rpc('get_email_send_log', { _limit: 200 });
    if (error) {
      toast.error('Failed to load email log');
    } else {
      setRows((data || []) as EmailLogRow[]);
    }
    setLoading(false);
    setRefreshing(false);
  };

  // Deduplicate by message_id, keeping latest row.
  const latestByMessage = useMemo(() => {
    const map = new Map<string, EmailLogRow>();
    for (const r of rows) {
      const key = r.message_id || r.id;
      if (!map.has(key)) map.set(key, r);
    }
    return Array.from(map.values());
  }, [rows]);

  const authRows = useMemo(
    () => latestByMessage.filter(r =>
      ['signup', 'recovery', 'magiclink', 'invite', 'email_change', 'reauthentication', 'auth_emails'].includes(r.template_name)
    ),
    [latestByMessage],
  );

  const stats = useMemo(() => {
    const s = { total: 0, sent: 0, pending: 0, failed: 0 };
    for (const r of authRows) {
      s.total++;
      if (r.status === 'sent') s.sent++;
      else if (r.status === 'pending') s.pending++;
      else s.failed++;
    }
    return s;
  }, [authRows]);

  const lastByTemplate = useMemo(() => {
    const m = new Map<string, EmailLogRow>();
    for (const r of authRows) if (!m.has(r.template_name)) m.set(r.template_name, r);
    return m;
  }, [authRows]);

  const recentErrors = useMemo(
    () => authRows.filter(r => r.status !== 'sent' && r.status !== 'pending').slice(0, 10),
    [authRows],
  );

  const TEMPLATES = ['signup', 'magiclink', 'recovery', 'invite', 'email_change', 'reauthentication'];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-8">
          <Card><CardContent className="p-8 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto text-destructive mb-3" />
            <h2 className="text-xl font-semibold mb-2">Admins only</h2>
            <p className="text-muted-foreground mb-4">You don't have access to the email debug page.</p>
            <Button onClick={() => navigate('/')}>Go home</Button>
          </CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6 space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Admin
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Mail className="h-6 w-6 text-primary" /> Auth email status
              </h1>
              <p className="text-sm text-muted-foreground">
                Template version <span className="font-mono">{TEMPLATE_VERSION}</span> · updated {TEMPLATE_UPDATED_AT} · sender <span className="font-mono">notify.gravimagcloud.com</span>
              </p>
            </div>
          </div>
          <Button onClick={load} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total" value={stats.total} icon={<Mail className="h-4 w-4" />} />
          <StatCard label="Sent" value={stats.sent} icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} />
          <StatCard label="Pending" value={stats.pending} icon={<Clock className="h-4 w-4 text-amber-600" />} />
          <StatCard label="Failed" value={stats.failed} icon={<AlertTriangle className="h-4 w-4 text-destructive" />} />
        </div>

        {/* Last attempt per template */}
        <Card>
          <CardHeader><CardTitle className="text-base">Last attempt per template</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TEMPLATES.map(t => {
                  const r = lastByTemplate.get(t);
                  return (
                    <TableRow key={t}>
                      <TableCell className="font-mono text-xs">{t}</TableCell>
                      <TableCell>{r ? <StatusBadge status={r.status} /> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                      <TableCell className="text-xs">{r?.recipient_email || '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r ? formatDistanceToNow(new Date(r.created_at), { addSuffix: true }) : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-destructive max-w-xs truncate">{r?.error_message || ''}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent delivery errors */}
        <Card>
          <CardHeader><CardTitle className="text-base">Recent delivery errors</CardTitle></CardHeader>
          <CardContent className="p-0">
            {recentErrors.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">No recent errors. 🎉</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentErrors.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.template_name}</TableCell>
                      <TableCell className="text-xs">{r.recipient_email}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-xs text-destructive">{r.error_message || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Full log */}
        <Card>
          <CardHeader><CardTitle className="text-base">All recent auth emails ({authRows.length})</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Message ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {authRows.slice(0, 100).map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.template_name}</TableCell>
                    <TableCell className="text-xs">{r.recipient_email}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground truncate max-w-[180px]">
                      {r.message_id || '—'}
                    </TableCell>
                  </TableRow>
                ))}
                {authRows.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                    No auth emails logged yet.
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) => (
  <Card><CardContent className="p-4">
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      {icon}
    </div>
    <div className="text-2xl font-bold mt-1">{value}</div>
  </CardContent></Card>
);

const StatusBadge = ({ status }: { status: string }) => {
  const v = STATUS_VARIANT[status] || { label: status, className: 'bg-muted text-muted-foreground border-border' };
  return <Badge variant="outline" className={v.className}>{v.label}</Badge>;
};

export default EmailDebug;
