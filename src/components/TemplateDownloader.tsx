import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, BookOpen } from 'lucide-react';
import {
  downloadGravityExcelTemplate,
  downloadGravityCSVTemplate,
  downloadMagneticExcelTemplate,
  downloadMagneticCSVTemplate,
  downloadFormattingGuide,
} from '@/lib/templateGenerator';
import { toast } from 'sonner';

const TemplateDownloader = () => {
  const handleDownload = (fn: () => void, label: string) => {
    try {
      fn();
      toast.success(`${label} downloaded`);
    } catch {
      toast.error('Download failed');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="h-3.5 w-3.5" /> Templates
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">Gravity Templates</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleDownload(downloadGravityExcelTemplate, 'Gravity Excel template')}>
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          Gravity Template (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload(downloadGravityCSVTemplate, 'Gravity CSV template')}>
          <FileText className="mr-2 h-4 w-4" />
          Gravity Template (.csv)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs">Magnetic Templates</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleDownload(downloadMagneticExcelTemplate, 'Magnetic Excel template')}>
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          Magnetic Template (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload(downloadMagneticCSVTemplate, 'Magnetic CSV template')}>
          <FileText className="mr-2 h-4 w-4" />
          Magnetic Template (.csv)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleDownload(downloadFormattingGuide, 'Formatting guide')}>
          <BookOpen className="mr-2 h-4 w-4 text-primary" />
          Formatting Guide
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TemplateDownloader;
