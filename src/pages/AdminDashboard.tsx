import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, FolderOpen, Activity, Search, Loader2, Shield, ArrowLeft, Crown } from 'lucide-react';

interface UserProfile {
  user_id: string;
  display_name: string | null;
  organization: string | null;
  avatar_url: string | null;
  subscription_tier: string;
  created_at: string;
}

interface ProjectRow {
  id: string;
  name: string;
  user_id: string;
  data_mode: string;
  created_at: string;
  updated_at: string;
}

interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string | null;
  action: string;
  metadata: any;
  created_at: string;
}

const TIER_BADGE: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  standard: 'bg-primary/10 text-primary',
  enterprise: 'bg-amber-500/10 text-amber-600',
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { checkAdmin(); }, [user]);

  const checkAdmin = async () => {
    if (!user) return;
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    const admin = !!data;
    setIsAdmin(admin);
    if (admin) fetchAll();
    else setLoading(false);
  };

  const fetchAll = async () => {
    setLoading(true);
    const [usersRes, projectsRes, logsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name, user_id, data_mode, created_at, updated_at').order('updated_at', { ascending: false }),
      supabase.from('user_activity_logs').select('*').order('created_at', { ascending: false }).limit(200),
    ]);
    setUsers((usersRes.data as any[]) || []);
    setProjects((projectsRes.data as ProjectRow[]) || []);
    setLogs((logsRes.data as ActivityLog[]) || []);
    setLoading(false);
  };

  const handleTierChange = async (userId: string, newTier: string) => {
    const { error } = await supabase.from('profiles').update({ subscription_tier: newTier } as any).eq('user_id', userId);
    if (error) { toast.error('Failed to update tier'); return; }
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, subscription_tier: newTier } : u));
    // Log the tier change activity
    if (user) {
      const targetUser = users.find(u => u.user_id === userId);
      await supabase.from('user_activity_logs').insert({
        user_id: user.id,
        user_email: user.email,
        action: 'tier_upgrade',
        metadata: { target_user_id: userId, target_name: targetUser?.display_name, new_tier: newTier },
      });
    }
    toast.success(`Tier updated to ${newTier}. Email notification will be sent when email service is configured.`);
  };

  if (isAdmin === null || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Shield className="h-12 w-12 text-destructive/40 mb-4" />
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-sm text-muted-foreground mt-1">You don't have admin privileges.</p>
          <Button variant="outline" className="mt-4 gap-1.5" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    (u.display_name || '').toLowerCase().includes(search.toLowerCase()) ||
    u.user_id.includes(search)
  );

  const userProjectCount = (userId: string) => projects.filter(p => p.user_id === userId).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Admin Dashboard
            </h2>
            <p className="text-sm text-muted-foreground">Geotech4All — Platform Analytics & Management</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Users className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{users.length}</p><p className="text-xs text-muted-foreground">Total Users</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><FolderOpen className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{projects.length}</p><p className="text-xs text-muted-foreground">Total Projects</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Activity className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{logs.length}</p><p className="text-xs text-muted-foreground">Activity Logs</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Crown className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{users.filter(u => u.subscription_tier !== 'free').length}</p><p className="text-xs text-muted-foreground">Paid Users</p></div></div></CardContent></Card>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users" className="gap-1"><Users className="h-3.5 w-3.5" /> Users</TabsTrigger>
            <TabsTrigger value="projects" className="gap-1"><FolderOpen className="h-3.5 w-3.5" /> Projects</TabsTrigger>
            <TabsTrigger value="activity" className="gap-1"><Activity className="h-3.5 w-3.5" /> Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="pl-9 h-9" />
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Projects</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(u => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">{u.display_name || 'Unnamed'}</TableCell>
                        <TableCell>{u.organization || '—'}</TableCell>
                        <TableCell>
                          <Select value={u.subscription_tier} onValueChange={v => handleTierChange(u.user_id, v)}>
                            <SelectTrigger className="h-7 w-[110px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell><Badge variant="secondary">{userProjectCount(u.user_id)}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.slice(0, 100).map(p => {
                      const owner = users.find(u => u.user_id === p.user_id);
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{p.data_mode}</Badge></TableCell>
                          <TableCell className="text-sm">{owner?.display_name || p.user_id.slice(0, 8)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(p.updated_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.slice(0, 100).map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-sm">{log.user_email || log.user_id.slice(0, 8)}</TableCell>
                        <TableCell><Badge variant="secondary" className="capitalize">{log.action.replace(/_/g, ' ')}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{JSON.stringify(log.metadata)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
