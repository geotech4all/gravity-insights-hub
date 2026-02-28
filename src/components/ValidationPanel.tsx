import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { ValidationError } from '@/lib/dataManager';

interface Props {
  errors: ValidationError[];
  stationCount: number;
}

const ValidationPanel = ({ errors, stationCount }: Props) => {
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;
  const isClean = errors.length === 0;

  return (
    <Card className={isClean ? 'border-green-500/30' : errorCount > 0 ? 'border-destructive/30' : 'border-yellow-500/30'}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {isClean ? (
            <><CheckCircle2 className="h-4 w-4 text-green-500" /> Data Quality: All Clear</>
          ) : (
            <><AlertTriangle className="h-4 w-4 text-yellow-500" /> Data Quality Check</>
          )}
          <span className="ml-auto flex gap-1.5">
            {errorCount > 0 && <Badge variant="destructive" className="text-[10px]">{errorCount} errors</Badge>}
            {warningCount > 0 && <Badge variant="secondary" className="text-[10px]">{warningCount} warnings</Badge>}
            <Badge variant="outline" className="text-[10px]">{stationCount} stations</Badge>
          </span>
        </CardTitle>
      </CardHeader>
      {!isClean && (
        <CardContent className="pt-0">
          <ScrollArea className="h-[120px]">
            <div className="space-y-1">
              {errors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 text-xs py-1 border-b border-border/50 last:border-0">
                  {err.severity === 'error' ? (
                    <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
                  )}
                  <span className="text-muted-foreground">
                    {err.row > 0 && <span className="font-medium text-foreground">Row {err.row}: </span>}
                    {err.message}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
};

export default ValidationPanel;
