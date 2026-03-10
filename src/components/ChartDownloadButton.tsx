import { Download, Image, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportChartAsPNG, exportChartAsSVG } from '@/lib/chartExport';

interface Props {
  containerRef: React.RefObject<HTMLElement>;
  filename: string;
}

const ChartDownloadButton = ({ containerRef, filename }: Props) => {
  const handleExport = (format: 'png' | 'svg') => {
    if (!containerRef.current) return;
    if (format === 'png') exportChartAsPNG(containerRef.current, filename);
    else exportChartAsSVG(containerRef.current, filename);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Download className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => handleExport('png')}>
          <Image className="mr-2 h-4 w-4" /> Download PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('svg')}>
          <FileCode className="mr-2 h-4 w-4" /> Download SVG
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ChartDownloadButton;
