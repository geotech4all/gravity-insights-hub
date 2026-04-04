import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Upload, FileDown, Settings2, Database, BarChart3, Map, FlaskConical, Layers, Gauge, Magnet, Save, Cloud } from 'lucide-react';
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
import ContinuationChart from '@/components/ContinuationChart';
import EulerDeconvolutionChart from '@/components/EulerDeconvolutionChart';
import CorrectionsPanel from '@/components/CorrectionsPanel';
import QCDashboard from '@/components/QCDashboard';
import ValidationPanel from '@/components/ValidationPanel';
import DataExportDialog from '@/components/DataExportDialog';
import TemplateDownloader from '@/components/TemplateDownloader';
import MagneticDataTable from '@/components/MagneticDataTable';
import MagneticCharts from '@/components/MagneticCharts';
import MagneticAdvanced from '@/components/MagneticAdvanced';
import MagneticStationMap from '@/components/MagneticStationMap';
import type { RawStation, ProcessedStation, CalibrationTable } from '@/lib/gravityCalculations';
import { processGravityData, DEFAULT_CALIBRATION, DEFAULT_DENSITY } from '@/lib/gravityCalculations';
import { generateReport } from '@/lib/reportGenerator';
import { detectAndParse, type ValidationError } from '@/lib/dataManager';
import { detectAndParseMagnetic } from '@/lib/magneticParser';
import { processMagneticData, DEFAULT_MAG_PARAMS, type RawMagStation, type ProcessedMagStation, type MagProcessingParams } from '@/lib/magneticCalculations';
import { saveCloudProject, loadCloudProject, type CloudProjectData } from '@/lib/cloudProjects';
import { logActivity } from '@/lib/activityLogger';
import BatchUpload, { type BatchFileResult } from '@/components/BatchUpload';

type DataMode = 'gravity' | 'magnetic';

const Index = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get('project');
  const [cloudId, setCloudId] = useState<string | null>(projectId);
  const [saving, setSaving] = useState(false);
  const [showSplash, setShowSplash] = useState(!projectId);
  const [mode, setMode] = useState<DataMode>('gravity');

  // Gravity state
  const [stations, setStations] = useState<RawStation[]>([]);
  const [processed, setProcessed] = useState<ProcessedStation[]>([]);
  const [calibration, setCalibration] = useState<CalibrationTable[]>(DEFAULT_CALIBRATION);
  const [knownAbsValue, setKnownAbsValue] = useState(978125.672);
  const [baseStationId, setBaseStationId] = useState('');
  const [density, setDensity] = useState(DEFAULT_DENSITY);
  const [projectName, setProjectName] = useState('Gravity Survey');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Magnetic state
  const [magStations, setMagStations] = useState<RawMagStation[]>([]);
  const [magProcessed, setMagProcessed] = useState<ProcessedMagStation[]>([]);
  const [magParams, setMagParams] = useState<MagProcessingParams>(DEFAULT_MAG_PARAMS);

  // ─── Gravity handlers ────────────────────────────────────────────
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

      const results = processGravityData(parsed.stations, parsed.knownAbsValue, parsed.baseStationId, parsed.calibration, density);
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
    if (stations.length === 0) { toast.error('No data to process'); return; }
    const results = processGravityData(stations, knownAbsValue, baseStationId, calibration, density);
    setProcessed(results);
    toast.success('Data reprocessed');
  }, [stations, knownAbsValue, baseStationId, calibration, density]);

  const handleExport = useCallback(async () => {
    if (processed.length === 0) { toast.error('No processed data to export'); return; }
    try {
      await generateReport(processed, projectName, density, knownAbsValue, { includeInterpretation: true, polynomialDegree: 2, anomalyType: 'bouguerAnomaly' });
      toast.success('Report downloaded');
    } catch (err) { toast.error('Failed to generate report'); console.error(err); }
  }, [processed, projectName, density, knownAbsValue]);

  const handleSaveProject = useCallback(async () => {
    setSaving(true);
    try {
      const data: CloudProjectData = mode === 'gravity'
        ? { stations, calibration, knownAbsValue, baseStationId, density }
        : { magStations, magParams };
      const id = await saveCloudProject(cloudId, projectName, mode, data);
      setCloudId(id);
      // Update URL without reload
      window.history.replaceState(null, '', `/editor?project=${id}`);
      toast.success(`Project "${projectName}" saved to cloud`);
      logActivity('save_project', { project_id: id, name: projectName, mode });
    } catch (err) {
      toast.error('Failed to save project');
      console.error(err);
    }
    setSaving(false);
  }, [cloudId, projectName, mode, stations, calibration, knownAbsValue, baseStationId, density, magStations, magParams]);

  // Load cloud project on mount
  useEffect(() => {
    if (!projectId) return;
    loadCloudProject(projectId).then((p) => {
      const d = p.project_data as CloudProjectData;
      setProjectName(p.name);
      setMode(p.data_mode as DataMode);
      if (d.stations) { setStations(d.stations); setCalibration(d.calibration || DEFAULT_CALIBRATION); setKnownAbsValue(d.knownAbsValue || 978125.672); setBaseStationId(d.baseStationId || ''); setDensity(d.density || DEFAULT_DENSITY); const results = processGravityData(d.stations, d.knownAbsValue || 978125.672, d.baseStationId || '', d.calibration || DEFAULT_CALIBRATION, d.density || DEFAULT_DENSITY); setProcessed(results); }
      if (d.magStations) { setMagStations(d.magStations); setMagParams(d.magParams || DEFAULT_MAG_PARAMS); const results = processMagneticData(d.magStations, d.magParams || DEFAULT_MAG_PARAMS); setMagProcessed(results); }
    }).catch(() => toast.error('Failed to load project'));
  }, [projectId]);

  // ─── Magnetic handlers ───────────────────────────────────────────
  const handleMagFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const parsed = detectAndParseMagnetic(file, buffer);
      setMagStations(parsed.stations);

      const params = { ...magParams, driftFactor: parsed.driftFactor, regionalField: parsed.regionalField };
      setMagParams(params);

      const results = processMagneticData(parsed.stations, params);
      setMagProcessed(results);

      const errCount = parsed.validationErrors.filter(e => e.severity === 'error').length;
      if (errCount > 0) {
        toast.warning(`Imported ${parsed.stations.length} magnetic stations with ${errCount} errors`);
      } else {
        toast.success(`Imported ${parsed.stations.length} magnetic stations from ${parsed.format.toUpperCase()}`);
      }
    } catch (err) {
      toast.error('Failed to parse magnetic file. Check format.');
      console.error(err);
    }
  }, [magParams]);

  const handleMagReprocess = useCallback(() => {
    if (magStations.length === 0) { toast.error('No magnetic data'); return; }
    const results = processMagneticData(magStations, magParams);
    setMagProcessed(results);
    toast.success('Magnetic data reprocessed');
  }, [magStations, magParams]);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Mode Switcher */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={mode === 'gravity' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('gravity')}
              className="gap-1.5"
            >
              <Layers className="h-3.5 w-3.5" /> Gravity
            </Button>
            <Button
              variant={mode === 'magnetic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('magnetic')}
              className="gap-1.5"
            >
              <Magnet className="h-3.5 w-3.5" /> Magnetic
            </Button>
          </div>
          <TemplateDownloader />
        </div>

        {/* ═══════════════════════ GRAVITY MODE ═══════════════════════ */}
        {mode === 'gravity' && (
          <>
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
                  <Input type="file" accept=".xlsx,.xls,.csv,.xyz,.gxf,.txt" onChange={handleFileUpload} className="h-9 text-sm cursor-pointer" />
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
                      <Input type="number" value={knownAbsValue} onChange={e => setKnownAbsValue(parseFloat(e.target.value) || 0)} className="h-8 text-sm" step="0.001" />
                    </div>
                    <div>
                      <Label className="text-xs">Density (g/cm³)</Label>
                      <Input type="number" value={density} onChange={e => setDensity(parseFloat(e.target.value) || 2.67)} className="h-8 text-sm" step="0.01" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Base Station ID</Label>
                    <Input type="text" value={baseStationId} onChange={e => setBaseStationId(e.target.value)} className="h-8 text-sm" placeholder="e.g. LKJ/ABJ/010" />
                  </div>
                  <div>
                    <Label className="text-xs">Project Name</Label>
                    <Input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <Button onClick={handleReprocess} size="sm" variant="secondary" className="w-full mt-1">Reprocess Data</Button>
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
                      <Button variant="outline" size="sm" onClick={handleSaveProject} disabled={saving} className="h-7 text-xs gap-1">
                        <Cloud className="h-3 w-3" /> {saving ? 'Saving...' : 'Save'}
                      </Button>
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
                      <p className="text-2xl font-bold text-foreground">{processed.filter(p => !p.remark?.toLowerCase().includes('close')).length}</p>
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
                  <p className="text-[10px] text-muted-foreground text-center mt-1">Includes data tables, statistics, and interpretation results</p>
                </CardContent>
              </Card>
            </div>

            {validationErrors.length > 0 && <ValidationPanel errors={validationErrors} stationCount={stations.length} />}

            {processed.length > 0 && (
              <Tabs defaultValue="table" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="table" className="gap-1"><Database className="h-3.5 w-3.5" /> Data Table</TabsTrigger>
                  <TabsTrigger value="charts" className="gap-1"><BarChart3 className="h-3.5 w-3.5" /> Charts</TabsTrigger>
                  <TabsTrigger value="map" className="gap-1"><Map className="h-3.5 w-3.5" /> Station Map</TabsTrigger>
                  <TabsTrigger value="interpretation" className="gap-1"><FlaskConical className="h-3.5 w-3.5" /> Interpretation</TabsTrigger>
                  <TabsTrigger value="corrections" className="gap-1"><Layers className="h-3.5 w-3.5" /> Corrections</TabsTrigger>
                  <TabsTrigger value="qc" className="gap-1"><Gauge className="h-3.5 w-3.5" /> Survey QC</TabsTrigger>
                </TabsList>
                <TabsContent value="table">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Processed Gravity Data</CardTitle>
                      <CardDescription className="text-xs">All corrections applied: Drift, Latitude (GRS80), Free Air, Bouguer (ρ={density} g/cm³)</CardDescription>
                    </CardHeader>
                    <CardContent><GravityDataTable data={processed} /></CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="charts"><AnomalyCharts data={processed} /></TabsContent>
                <TabsContent value="map"><StationMap data={processed} /></TabsContent>
                <TabsContent value="interpretation" className="space-y-6">
                  <RegionalResidualChart data={processed} />
                  <DerivativeCharts data={processed} />
                  <PowerSpectrumChart data={processed} />
                  <ContinuationChart data={processed} />
                  <EulerDeconvolutionChart data={processed} />
                </TabsContent>
                <TabsContent value="corrections"><CorrectionsPanel data={processed} /></TabsContent>
                <TabsContent value="qc"><QCDashboard data={processed} /></TabsContent>
              </Tabs>
            )}

            {processed.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">No Gravity Data Loaded</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">Upload your gravity survey spreadsheet or manually add stations to begin data reduction.</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ═══════════════════════ MAGNETIC MODE ═══════════════════════ */}
        {mode === 'magnetic' && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Import */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Upload className="h-4 w-4 text-primary" /> Import Magnetic Data
                  </CardTitle>
                  <CardDescription className="text-xs">Excel or CSV format</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleMagFileUpload} className="h-9 text-sm cursor-pointer" />
                </CardContent>
              </Card>

              {/* Parameters */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Settings2 className="h-4 w-4 text-primary" /> Magnetic Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Drift Factor (nT/s)</Label>
                      <Input type="number" value={magParams.driftFactor} onChange={e => setMagParams(p => ({ ...p, driftFactor: parseFloat(e.target.value) || 0 }))} className="h-8 text-sm" step="0.00001" />
                    </div>
                    <div>
                      <Label className="text-xs">Regional Field (nT)</Label>
                      <Input type="number" value={magParams.regionalField} onChange={e => setMagParams(p => ({ ...p, regionalField: parseFloat(e.target.value) || 0 }))} className="h-8 text-sm" step="0.1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Latitude (°)</Label>
                      <Input type="number" value={magParams.latitude} onChange={e => setMagParams(p => ({ ...p, latitude: parseFloat(e.target.value) || 0 }))} className="h-8 text-sm" step="0.01" />
                    </div>
                    <div>
                      <Label className="text-xs">Diurnal Amp. (nT)</Label>
                      <Input type="number" value={magParams.diurnalAmplitude} onChange={e => setMagParams(p => ({ ...p, diurnalAmplitude: parseFloat(e.target.value) || 30 }))} className="h-8 text-sm" step="1" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={magParams.useIGRF}
                      onChange={e => setMagParams(p => ({ ...p, useIGRF: e.target.checked }))}
                      className="rounded border-input"
                      id="useIGRF"
                    />
                    <Label htmlFor="useIGRF" className="text-xs">Use IGRF as regional field</Label>
                  </div>
                  <div>
                    <Label className="text-xs">Project Name</Label>
                    <Input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} className="h-8 text-sm" placeholder="Magnetic Survey" />
                  </div>
                  <Button onClick={handleMagReprocess} size="sm" variant="secondary" className="w-full mt-1">Reprocess Data</Button>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Database className="h-4 w-4 text-primary" /> Magnetic Summary
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={handleSaveProject} disabled={saving} className="h-7 text-xs gap-1">
                      <Cloud className="h-3 w-3" /> {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{magStations.length}</p>
                      <p className="text-xs text-muted-foreground">Stations</p>
                    </div>
                    <div className="rounded-lg bg-muted p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{magProcessed.length}</p>
                      <p className="text-xs text-muted-foreground">Processed</p>
                    </div>
                    {magProcessed.length > 0 && (
                      <>
                        <div className="rounded-lg bg-accent p-3 text-center">
                          <p className="text-lg font-bold text-accent-foreground">
                            {Math.min(...magProcessed.map(p => p.totalAnomaly)).toFixed(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">Min Anomaly</p>
                        </div>
                        <div className="rounded-lg bg-accent p-3 text-center">
                          <p className="text-lg font-bold text-accent-foreground">
                            {Math.max(...magProcessed.map(p => p.totalAnomaly)).toFixed(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">Max Anomaly</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {magProcessed.length > 0 && (
              <Tabs defaultValue="table" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="table" className="gap-1"><Database className="h-3.5 w-3.5" /> Data Table</TabsTrigger>
                  <TabsTrigger value="charts" className="gap-1"><BarChart3 className="h-3.5 w-3.5" /> Charts</TabsTrigger>
                  <TabsTrigger value="map" className="gap-1"><Map className="h-3.5 w-3.5" /> Station Map</TabsTrigger>
                  <TabsTrigger value="advanced" className="gap-1"><FlaskConical className="h-3.5 w-3.5" /> Advanced</TabsTrigger>
                </TabsList>
                <TabsContent value="table"><MagneticDataTable data={magProcessed} /></TabsContent>
                <TabsContent value="charts"><MagneticCharts data={magProcessed} /></TabsContent>
                <TabsContent value="map"><MagneticStationMap data={magProcessed} /></TabsContent>
                <TabsContent value="advanced"><MagneticAdvanced data={magProcessed} latitude={magParams.latitude} /></TabsContent>
              </Tabs>
            )}

            {magProcessed.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Magnet className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">No Magnetic Data Loaded</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">Upload your magnetic survey spreadsheet (Excel or CSV) to begin processing. Download a template from the Templates menu above.</p>
                </CardContent>
              </Card>
            )}
          </>
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
