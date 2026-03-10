import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartDownloadButton from '@/components/ChartDownloadButton';
import type { ProcessedStation } from '@/lib/gravityCalculations';
import { computeContinuation } from '@/lib/advancedCalculations';

const ContinuationChart = ({ data }: { data: ProcessedStation[] }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(2);
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [anomalyType, setAnomalyType] = useState<'bouguerAnomaly' | 'freeAirAnomaly'>('bouguerAnomaly');

  const continuationHeight = direction === 'up' ? height : -height;
  const results = computeContinuation(data, continuationHeight, anomalyType);

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Upward / Downward Continuation</CardTitle>
          <CardDescription className="text-xs">
            {direction === 'up' ? 'Attenuates shallow sources (smoothing)' : 'Enhances shallow sources (sharpening)'}
          </CardDescription>
        </div>
        <ChartDownloadButton containerRef={chartRef} filename="continuation" />
      </CardHeader>
      <CardContent className="space-y-4" ref={chartRef}>
        <div className="flex gap-4 items-end flex-wrap">
          <div className="space-y-1">
            <Label className="text-xs">Direction</Label>
            <Select value={direction} onValueChange={(v) => setDirection(v as 'up' | 'down')}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="up">Upward</SelectItem>
                <SelectItem value="down">Downward</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Anomaly</Label>
            <Select value={anomalyType} onValueChange={(v) => setAnomalyType(v as any)}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bouguerAnomaly">Bouguer</SelectItem>
                <SelectItem value="freeAirAnomaly">Free Air</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px] space-y-1">
            <Label className="text-xs">Height: {height} km</Label>
            <Slider
              value={[height]}
              onValueChange={([v]) => setHeight(v)}
              min={0.5}
              max={direction === 'up' ? 20 : 5}
              step={0.5}
              className="w-full"
            />
          </div>
        </div>

        {results.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={results}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="distance" label={{ value: 'Distance (km)', position: 'insideBottom', offset: -5 }} tick={{ fontSize: 10 }} />
              <YAxis label={{ value: 'mGal', angle: -90, position: 'insideLeft' }} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="original" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" name="Original" dot={false} />
              <Line type="monotone" dataKey="continued" stroke="hsl(var(--primary))" name={`${direction === 'up' ? 'Upward' : 'Downward'} ${height}km`} dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ContinuationChart;
