import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, FolderOpen, Trash2, Clock, Layers, Magnet, Search, Loader2, Users } from 'lucide-react';
import Header from '@/components/Header';
import ShareProjectDialog from '@/components/ShareProjectDialog';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import { logActivity } from '@/lib/activityLogger';

interface CloudProject {
  id: string;
  name: string;
  description: string;
  data_mode: string;
  updated_at: string;
  created_at: string;
}

interface SharedProject extends CloudProject {
  permission: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canCreateProject } = useSubscription();
  const [projects, setProjects] = useState<CloudProject[]>([]);
  const [sharedProjects, setSharedProjects] = useState<SharedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user) {
      fetchProjects();
      logActivity('dashboard_view');
    }
  }, [user]);

  const fetchProjects = async () => {
    setLoading(true);
    const [ownRes, sharedRes] = await Promise.all([
      supabase
        .from('projects')
        .select('id, name, description, data_mode, updated_at, created_at')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false }),
      supabase
        .from('project_shares')
        .select('project_id, permission')
        .eq('shared_with_user_id', user!.id),
    ]);
    setProjects(ownRes.data || []);

    if (sharedRes.data && sharedRes.data.length > 0) {
      const ids = sharedRes.data.map((s: any) => s.project_id);
      const { data: sharedDetails } = await supabase
        .from('projects')
        .select('id, name, description, data_mode, updated_at, created_at')
        .in('id', ids);
      const mapped = (sharedDetails || []).map((p: any) => ({
        ...p,
        permission: sharedRes.data!.find((s: any) => s.project_id === p.id)?.permission || 'viewer',
      }));
      setSharedProjects(mapped);
    }
    setLoading(false);
  };

  const handleNewProject = () => {
    if (!canCreateProject) {
      toast.error('Project limit reached. Upgrade your plan to create more projects.');
      return;
    }
    navigate('/editor');
  };
  const handleOpenProject = (id: string) => navigate(`/editor?project=${id}`);

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else {
      toast.success(`"${name}" deleted`);
      setProjects(p => p.filter(x => x.id !== id));
      logActivity('delete_project', { project_id: id, name });
    }
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredShared = sharedProjects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const ProjectCard = ({ project, shared = false, permission }: { project: CloudProject; shared?: boolean; permission?: string }) => (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors group"
      onClick={() => handleOpenProject(project.id)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {project.data_mode === 'magnetic' ? (
              <Magnet className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <Layers className="h-4 w-4 text-primary shrink-0" />
            )}
            <CardTitle className="text-sm line-clamp-1">{project.name}</CardTitle>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100">
            {!shared && <ShareProjectDialog projectId={project.id} projectName={project.name} />}
            {!shared && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                onClick={e => { e.stopPropagation(); handleDeleteProject(project.id, project.name); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        {project.description && (
          <CardDescription className="text-xs line-clamp-2">{project.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {new Date(project.updated_at).toLocaleDateString()} · {project.data_mode}
          {shared && permission && (
            <span className="ml-1 rounded bg-muted px-1.5 py-0.5 capitalize">{permission}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <SubscriptionBanner />
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">My Projects</h2>
            <p className="text-sm text-muted-foreground">Cloud-saved gravity & magnetic surveys</p>
          </div>
          <Button onClick={handleNewProject} className="gap-1.5">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." className="pl-9 h-9" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="my-projects">
            <TabsList>
              <TabsTrigger value="my-projects" className="gap-1">
                <FolderOpen className="h-3.5 w-3.5" /> My Projects ({filtered.length})
              </TabsTrigger>
              <TabsTrigger value="shared" className="gap-1">
                <Users className="h-3.5 w-3.5" /> Shared with me ({filteredShared.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-projects">
              {filtered.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <FolderOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground">
                      {projects.length === 0 ? 'No Projects Yet' : 'No matching projects'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md">
                      {projects.length === 0 ? 'Create your first project to start processing.' : 'Try a different search term.'}
                    </p>
                    {projects.length === 0 && (
                      <Button onClick={handleNewProject} className="mt-4 gap-1.5">
                        <Plus className="h-4 w-4" /> New Project
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                  {filtered.map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="shared">
              {filteredShared.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground">No shared projects</h3>
                    <p className="text-sm text-muted-foreground mt-1">Projects shared with you will appear here.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                  {filteredShared.map(project => (
                    <ProjectCard key={project.id} project={project} shared permission={project.permission} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
