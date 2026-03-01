import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, TrendingDown, Repeat, MapPin } from 'lucide-react';
import type { ProcessedStation } from '@/lib/gravityCalculations';
import { computeSurveyQC } from '@/lib/advancedCalculations';

const QCDashboard = ({ data }: { data: ProcessedStation[] }) => {
  const qc = useMemo(() => computeSurveyQC(data), [data]);
  const { overallStats, loopStats } = qc;

  const driftQuality = Math.abs(overallStats.maxDriftRate) < 0.5 ? 'good' : Math.abs(overallStats.maxDriftRate) < 1.5 ? 'fair' : 'poor';
  const closureQuality = overallStats.maxClosureError < 0.02 ? 'good' : overallStats.maxClosureError < 0.1 ? 'fair' : 'poor';

  const qualityColor = (q: string) =>
    q === 'good' ? 'bg-green-100 text-green-800' : q === 'fair' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <MapPin className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold text-foreground">{overallStats.totalStations}</p>
            <p className="text-xs text-muted-foreground">Stations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Repeat className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold text-foreground">{overallStats.totalLoops}</p>
            <p className="text-xs text-muted-foreground">Loops</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <TrendingDown className="h-5 w-5 mx-auto text-primary mb-1" />
            <div className="flex items-center justify-center gap-1">
              <p className="text-xl font-bold text-foreground">{overallStats.meanDriftRate.toFixed(4)}</p>
              <Badge variant="outline" className={`text-[10px] ${qualityColor(driftQuality)}`}>{driftQuality}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Mean Drift (mGal/hr)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            {closureQuality === 'good' ? (
              <CheckCircle className="h-5 w-5 mx-auto text-green-600 mb-1" />
            ) : (
              <AlertTriangle className="h-5 w-5 mx-auto text-yellow-600 mb-1" />
            )}
            <div className="flex items-center justify-center gap-1">
              <p className="text-xl font-bold text-foreground">{overallStats.meanClosureError.toFixed(4)}</p>
              <Badge variant="outline" className={`text-[10px] ${qualityColor(closureQuality)}`}>{closureQuality}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Mean Closure (mGal)</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Survey Metadata</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">{overallStats.surveyDuration}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Elevation Range</span><span className="font-medium">{overallStats.elevationRange[0].toFixed(1)} – {overallStats.elevationRange[1].toFixed(1)} m</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Mean Elevation</span><span className="font-medium">{overallStats.meanElevation.toFixed(1)} m</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Lat Extent</span><span className="font-medium">{overallStats.coordinateExtent.latMin.toFixed(4)}° – {overallStats.coordinateExtent.latMax.toFixed(4)}°</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Lon Extent</span><span className="font-medium">{overallStats.coordinateExtent.lonMin.toFixed(4)}° – {overallStats.coordinateExtent.lonMax.toFixed(4)}°</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Data Completeness</span><span className="font-medium">{overallStats.dataCompleteness.toFixed(0)}%</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Repeatability (σ)</span><span className="font-medium">{overallStats.repeatabilityStd.toFixed(4)} mGal</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quality Thresholds</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Max Drift Rate</span><span className="font-medium">{overallStats.maxDriftRate.toFixed(4)} mGal/hr</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Max Closure Error</span><span className="font-medium">{overallStats.maxClosureError.toFixed(4)} mGal</span></div>
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="outline" className="text-[10px] bg-green-100 text-green-800">Good</Badge>
              <span>Drift &lt; 0.5, Closure &lt; 0.02 mGal</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] bg-yellow-100 text-yellow-800">Fair</Badge>
              <span>Drift &lt; 1.5, Closure &lt; 0.1 mGal</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] bg-red-100 text-red-800">Poor</Badge>
              <span>Exceeds fair thresholds</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loop-by-Loop Table */}
      {loopStats.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Loop-by-Loop Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Loop</TableHead>
                    <TableHead className="text-xs">Open</TableHead>
                    <TableHead className="text-xs">Close</TableHead>
                    <TableHead className="text-xs">Stations</TableHead>
                    <TableHead className="text-xs">Duration (min)</TableHead>
                    <TableHead className="text-xs">Drift (mGal/hr)</TableHead>
                    <TableHead className="text-xs">Closure (mGal)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loopStats.map(loop => (
                    <TableRow key={loop.loopIndex}>
                      <TableCell className="text-xs font-medium">{loop.loopIndex}</TableCell>
                      <TableCell className="text-xs">{loop.openStation}</TableCell>
                      <TableCell className="text-xs">{loop.closeStation}</TableCell>
                      <TableCell className="text-xs">{loop.stationCount}</TableCell>
                      <TableCell className="text-xs">{loop.duration}</TableCell>
                      <TableCell className="text-xs">{loop.driftRate.toFixed(4)}</TableCell>
                      <TableCell className="text-xs">{loop.closureError.toFixed(4)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QCDashboard;
