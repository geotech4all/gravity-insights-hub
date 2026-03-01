import { useState, useCallback } from 'react';
import { Upload, FileDown, Settings2, Database, BarChart3, Map, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import Header from '@/components/Header';
import SplashScreen from '@/components/SplashScreen';
import GravityDataTable from '@/components/GravityDataTable';
import ManualEntryForm from '@/components/ManualEntryForm';
import AnomalyCharts from '@/components/AnomalyCharts';
import StationMap from '@/components/StationMap';
import RegionalResidualChart from '@/components/RegionalResidualChart';
import DerivativeCharts from '@/components/DerivativeCharts';
import PowerSpectrumChart from '@/components/PowerSpectrumChart';
import ValidationPanel from '@/components/ValidationPanel';
import ProjectManager from '@/components/ProjectManager';
import DataExportDialog from '@/components/DataExportDialog';
import type { RawStation, ProcessedStation, CalibrationTable } from '@/lib/gravityCalculations';
import { processGravityData, DEFAULT_CALIBRATION, DEFAULT_DENSITY } from '@/lib/gravityCalculations';
import { generateReport } from '@/lib/reportGenerator';
import { detectAndParse, saveProject, type ValidationError, type SavedProject } from '@/lib/dataManager';

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [stations, setStations] = useState<RawStation[]>([]);
  const [processed, setProcessed] = useState<ProcessedStation[]>([]);
  const [calibration, setCalibration] = useState<CalibrationTable[]>(DEFAULT_CALIBRATION);
  const [knownAbsValue, setKnownAbsValue] = useState(978125.672);
  const [baseStationId, setBaseStationId] = useState('');
  const [density, setDensity] = useState(DEFAULT_DENSITY);
  const [projectName, setProjectName] = useState('Gravity Survey');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const parsed = detectAndParse(file, buffer);
      setStations(parsed.stations);
      setCalibration(parsed.calibration);
      setKnownAbsValue(parsed.knownAbsValue);
      setBaseStationId(parsed.baseStationId);
      setValidationErrors(parsed.validationErrors);

      const results = processGravityData(
        parsed.stations,
        parsed.knownAbsValue,
        parsed.baseStationId,
        parsed.calibration,
        density
      );
      setProcessed(results);

      const errCount = parsed.validationErrors.filter(e => e.severity === 'error').length;
      const warnCount = parsed.validationErrors.filter(e => e.severity === 'warning').length;
      if (errCount > 0) {
        toast.warning(`Imported ${parsed.stations.length} stations (${parsed.format.toUpperCase()}) with ${errCount} errors, ${warnCount} warnings`);
      } else {
        toast.success(`Imported ${parsed.stations.length} stations from ${parsed.format.toUpperCase()} file`);
      }
    } catch (err) {
      toast.error('Failed to parse file. Check format.');
      console.error(err);
    }
  }, [density]);

  const handleAddStation = useCallback((station: RawStation) => {
    setStations(prev => {
      const updated = [...prev, station];
      if (updated.length > 0 && baseStationId) {
        const results = processGravityData(updated, knownAbsValue, baseStationId, calibration, density);
        setProcessed(results);
      }
      return updated;
    });
    toast.success('Station added');
  }, [knownAbsValue, baseStationId, calibration, density]);

  const handleReprocess = useCallback(() => {
    if (stations.length === 0) {
      toast.error('No data to process');
      return;
    }
    const results = processGravityData(stations, knownAbsValue, baseStationId, calibration, density);
    setProcessed(results);
    toast.success('Data reprocessed');
  }, [stations, knownAbsValue, baseStationId, calibration, density]);

  const handleExport = useCallback(async () => {
    if (processed.length === 0) {
      toast.error('No processed data to export');
      return;
    }
    try {
      await generateReport(processed, projectName, density, knownAbsValue, {
        includeInterpretation: true,
        polynomialDegree: 2,
        anomalyType: 'bouguerAnomaly',
      });
      toast.success('Report downloaded');
    } catch (err) {
      toast.error('Failed to generate report');
      console.error(err);
    }
  }, [processed, projectName, density, knownAbsValue]);

  const handleSaveProject = useCallback(() => {
    saveProject({
      version: 1,
      projectName,
      knownAbsValue,
      baseStationId,
      density,
      calibration,
      stations,
      savedAt: new Date().toISOString(),
    });
    toast.success(`Project "${projectName}" saved`);
  }, [projectName, knownAbsValue, baseStationId, density, calibration, stations]);

  const handleLoadProject = useCallback((project: SavedProject) => {
    setStations(project.stations);
    setCalibration(project.calibration);
    setKnownAbsValue(project.knownAbsValue);
    setBaseStationId(project.baseStationId);
    setDensity(project.density);
    setProjectName(project.projectName);

    const results = processGravityData(
      project.stations, project.knownAbsValue, project.baseStationId, project.calibration, project.density
    );
    setProcessed(results);
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Top controls */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Import Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="h-4 w-4 text-primary" /> Import Data
              </CardTitle>
              <CardDescription className="text-xs">Excel, CSV, XYZ, or GXF format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="file"
                accept=".xlsx,.xls,.csv,.xyz,.gxf,.txt"
                onChange={handleFileUpload}
                className="h-9 text-sm cursor-pointer"
              />
              <ManualEntryForm onAdd={handleAddStation} />
            </CardContent>
          </Card>

          {/* Parameters Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings2 className="h-4 w-4 text-primary" /> Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Known Abs. Value (mGal)</Label>
                  <Input
                    type="number"
                    value={knownAbsValue}
                    onChange={e => setKnownAbsValue(parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm"
                    step="0.001"
                  />
                </div>
                <div>
                  <Label className="text-xs">Density (g/cm³)</Label>
                  <Input
                    type="number"
                    value={density}
                    onChange={e => setDensity(parseFloat(e.target.value) || 2.67)}
                    className="h-8 text-sm"
                    step="0.01"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Base Station ID</Label>
                <Input
                  type="text"
                  value={baseStationId}
                  onChange={e => setBaseStationId(e.target.value)}
                  className="h-8 text-sm"
                  placeholder="e.g. LKJ/ABJ/010"
                />
              </div>
              <div>
                <Label className="text-xs">Project Name</Label>
                <Input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <Button onClick={handleReprocess} size="sm" variant="secondary" className="w-full mt-1">
                Reprocess Data
              </Button>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="h-4 w-4 text-primary" /> Summary
                </CardTitle>
                <div className="flex gap-1.5">
                  <ProjectManager onSave={handleSaveProject} onLoad={handleLoadProject} />
                  <DataExportDialog data={processed} projectName={projectName} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{stations.length}</p>
                  <p className="text-xs text-muted-foreground">Stations</p>
                </div>
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {processed.filter(p => !p.remark?.toLowerCase().includes('close')).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Processed</p>
                </div>
                {processed.length > 0 && (
                  <>
                    <div className="rounded-lg bg-accent p-3 text-center">
                      <p className="text-lg font-bold text-accent-foreground">
                        {Math.min(...processed.map(p => p.freeAirAnomaly)).toFixed(1)} – {Math.max(...processed.map(p => p.freeAirAnomaly)).toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">FAA Range</p>
                    </div>
                    <div className="rounded-lg bg-accent p-3 text-center">
                      <p className="text-lg font-bold text-accent-foreground">
                        {Math.min(...processed.map(p => p.bouguerAnomaly)).toFixed(1)} – {Math.max(...processed.map(p => p.bouguerAnomaly)).toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">BA Range</p>
                    </div>
                  </>
                )}
              </div>
              <Button onClick={handleExport} className="w-full mt-4" disabled={processed.length === 0}>
                <FileDown className="mr-2 h-4 w-4" /> Export Full Report
              </Button>
              <p className="text-[10px] text-muted-foreground text-center mt-1">
                Includes data tables, statistics, and interpretation results
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Validation Panel */}
        {validationErrors.length > 0 && (
          <ValidationPanel errors={validationErrors} stationCount={stations.length} />
        )}

        {/* Data, Charts, Map Tabs */}
        {processed.length > 0 && (
          <Tabs defaultValue="table" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="table" className="gap-1">
                <Database className="h-3.5 w-3.5" /> Data Table
              </TabsTrigger>
              <TabsTrigger value="charts" className="gap-1">
                <BarChart3 className="h-3.5 w-3.5" /> Charts
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-1">
                <Map className="h-3.5 w-3.5" /> Station Map
              </TabsTrigger>
              <TabsTrigger value="interpretation" className="gap-1">
                <FlaskConical className="h-3.5 w-3.5" /> Interpretation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="table">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Processed Gravity Data</CardTitle>
                  <CardDescription className="text-xs">
                    All corrections applied: Drift, Latitude (GRS80), Free Air, Bouguer (ρ={density} g/cm³)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GravityDataTable data={processed} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="charts">
              <AnomalyCharts data={processed} />
            </TabsContent>

            <TabsContent value="map">
              <StationMap data={processed} />
            </TabsContent>

            <TabsContent value="interpretation" className="space-y-6">
              <RegionalResidualChart data={processed} />
              <DerivativeCharts data={processed} />
              <PowerSpectrumChart data={processed} />
            </TabsContent>
          </Tabs>
        )}

        {/* Empty state */}
        {processed.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Upload className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No Data Loaded</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Upload your gravity survey spreadsheet (Excel, CSV, XYZ, or GXF) or manually add stations to begin data reduction.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="border-t bg-card py-4 mt-8">
        <div className="container mx-auto text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} GraviMag Cloud — by Geotech4All
        </div>
      </footer>
    </div>
  );
};

export default Index;
