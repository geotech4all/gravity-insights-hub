import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, FolderOpen, Trash2, Clock, Layers, Magnet, Search, Loader2 } from 'lucide-react';
import Header from '@/components/Header';

interface CloudProject {
  id: string;
  name: string;
  description: string;
  data_mode: string;
  updated_at: string;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<CloudProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user) fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, data_mode, updated_at, created_at')
      .order('updated_at', { ascending: false });
    setLoading(false);
    if (error) { toast.error('Failed to load projects'); return; }
    setProjects(data || []);
  };

  const handleNewProject = () => {
    navigate('/editor');
  };

  const handleOpenProject = (id: string) => {
    navigate(`/editor?project=${id}`);
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success(`"${name}" deleted`); setProjects(p => p.filter(x => x.id !== id)); }
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
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
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="pl-9 h-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">
                {projects.length === 0 ? 'No Projects Yet' : 'No matching projects'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                {projects.length === 0 ? 'Create your first project to start processing gravity or magnetic survey data.' : 'Try a different search term.'}
              </p>
              {projects.length === 0 && (
                <Button onClick={handleNewProject} className="mt-4 gap-1.5">
                  <Plus className="h-4 w-4" /> New Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(project => (
              <Card
                key={project.id}
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={e => { e.stopPropagation(); handleDeleteProject(project.id, project.name); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {project.description && (
                    <CardDescription className="text-xs line-clamp-2">{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(project.updated_at).toLocaleDateString()} · {project.data_mode}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
