import { useState, useRef } from 'react';
import { Upload, FileStack, CheckCircle2, XCircle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export interface BatchFileResult<T> {
  fileName: string;
  stations: T[];
  status: 'success' | 'error';
  error?: string;
  meta?: Record<string, any>;
}

interface BatchUploadProps<T> {
  mode: 'gravity' | 'magnetic';
  accept: string;
  parseFile: (file: File, buffer: ArrayBuffer) => { stations: T[]; meta?: Record<string, any> };
  onBatchComplete: (results: BatchFileResult<T>[]) => void;
}

function BatchUpload<T>({ mode, accept, parseFile, onBatchComplete }: BatchUploadProps<T>) {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<BatchFileResult<T>[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    setFiles(prev => [...prev, ...selected]);
    setResults([]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setResults([]);
  };

  const processAll = async () => {
    if (files.length === 0) {
      toast.error('No files selected');
      return;
    }
    setProcessing(true);
    setProgress(0);
    const batchResults: BatchFileResult<T>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const buffer = await file.arrayBuffer();
        const parsed = parseFile(file, buffer);
        batchResults.push({
          fileName: file.name,
          stations: parsed.stations,
          status: 'success',
          meta: parsed.meta,
        });
      } catch (err: any) {
        batchResults.push({
          fileName: file.name,
          stations: [],
          status: 'error',
          error: err?.message || 'Parse failed',
        });
      }
      setProgress(((i + 1) / files.length) * 100);
    }

    setResults(batchResults);
    setProcessing(false);

    const successCount = batchResults.filter(r => r.status === 'success').length;
    const totalStations = batchResults.reduce((sum, r) => sum + r.stations.length, 0);

    if (successCount === files.length) {
      toast.success(`All ${files.length} files processed — ${totalStations} total stations`);
    } else {
      toast.warning(`${successCount}/${files.length} files succeeded — ${totalStations} stations`);
    }

    onBatchComplete(batchResults);
  };

  const clearAll = () => {
    setFiles([]);
    setResults([]);
    setProgress(0);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileStack className="h-4 w-4 text-primary" /> Batch Import
        </CardTitle>
        <CardDescription className="text-xs">
          Upload multiple {mode} survey files and process them all at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 flex-1"
            onClick={() => inputRef.current?.click()}
            disabled={processing}
          >
            <Upload className="h-3.5 w-3.5" /> Select Files
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple
            onChange={handleFilesSelected}
            className="hidden"
          />
          {files.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              disabled={processing}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {files.length > 0 && (
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {files.map((file, i) => {
              const result = results.find(r => r.fileName === file.name);
              return (
                <div key={i} className="flex items-center justify-between gap-2 text-xs bg-muted rounded px-2 py-1.5">
                  <span className="truncate flex-1">{file.name}</span>
                  <div className="flex items-center gap-1.5">
                    {result?.status === 'success' && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        <CheckCircle2 className="h-3 w-3 text-green-600 mr-0.5" />
                        {result.stations.length} stations
                      </Badge>
                    )}
                    {result?.status === 'error' && (
                      <Badge variant="destructive" className="text-[10px] h-5">
                        <XCircle className="h-3 w-3 mr-0.5" /> Failed
                      </Badge>
                    )}
                    {!result && !processing && (
                      <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {processing && (
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-[10px] text-muted-foreground text-center">
              Processing {Math.round(progress)}%
            </p>
          </div>
        )}

        {files.length > 0 && (
          <Button
            onClick={processAll}
            size="sm"
            className="w-full gap-1.5"
            disabled={processing || files.length === 0}
          >
            {processing ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...</>
            ) : (
              <><FileStack className="h-3.5 w-3.5" /> Process {files.length} File{files.length > 1 ? 's' : ''}</>
            )}
          </Button>
        )}

        {results.length > 0 && !processing && (
          <div className="text-xs text-muted-foreground text-center">
            {results.filter(r => r.status === 'success').length} succeeded •{' '}
            {results.reduce((s, r) => s + r.stations.length, 0)} total stations merged
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BatchUpload;
