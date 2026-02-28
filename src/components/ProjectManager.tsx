import { useState } from 'react';
import { Save, FolderOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { listSavedProjects, loadProject, deleteProject, type SavedProject } from '@/lib/dataManager';

interface Props {
  onSave: () => void;
  onLoad: (project: SavedProject) => void;
}

const ProjectManager = ({ onSave, onLoad }: Props) => {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<string[]>([]);

  const handleOpen = () => {
    setProjects(listSavedProjects());
    setOpen(true);
  };

  const handleLoad = (name: string) => {
    const project = loadProject(name);
    if (project) {
      onLoad(project);
      setOpen(false);
      toast.success(`Project "${name}" loaded`);
    } else {
      toast.error('Failed to load project');
    }
  };

  const handleDelete = (name: string) => {
    deleteProject(name);
    setProjects(listSavedProjects());
    toast.success(`Project "${name}" deleted`);
  };

  return (
    <div className="flex gap-1.5">
      <Button variant="outline" size="sm" onClick={onSave} className="h-7 text-xs gap-1">
        <Save className="h-3 w-3" /> Save
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" onClick={handleOpen} className="h-7 text-xs gap-1">
            <FolderOpen className="h-3 w-3" /> Load
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Saved Projects</DialogTitle>
          </DialogHeader>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No saved projects</p>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {projects.map(name => (
                  <div key={name} className="flex items-center justify-between rounded-lg border p-2.5">
                    <button
                      onClick={() => handleLoad(name)}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors text-left"
                    >
                      {name}
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(name)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectManager;
