import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProcessedMagStation } from '@/lib/magneticCalculations';

interface Props {
  data: ProcessedMagStation[];
}

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const purpleIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const MagneticStationMap = ({ data }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  const displayData = data.filter(d => d.latitude != null && d.longitude != null);

  useEffect(() => {
    if (!mapRef.current || displayData.length === 0) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const center: [number, number] = [
      displayData.reduce((s, d) => s + (d.latitude || 0), 0) / displayData.length,
      displayData.reduce((s, d) => s + (d.longitude || 0), 0) / displayData.length,
    ];

    const map = L.map(mapRef.current).setView(center, 11);
    mapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markers: L.Marker[] = [];
    displayData.forEach((station) => {
      const isBase = station.remark?.toLowerCase().includes('base');
      const marker = L.marker([station.latitude!, station.longitude!], {
        icon: isBase ? purpleIcon : defaultIcon,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: Calibri, sans-serif; min-width: 200px;">
          <h3 style="margin: 0 0 6px; color: #7B1FA2; font-size: 14px; font-weight: bold;">
            Station ${station.sn}
          </h3>
          <p style="margin: 0 0 4px; font-size: 11px; color: #666;">${station.remark || ''}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 6px 0;" />
          <table style="font-size: 11px; width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 2px 4px; color: #888;">Lat/Long</td><td style="padding: 2px 4px; font-weight: 600;">${(station.latitude || 0).toFixed(5)}°, ${(station.longitude || 0).toFixed(5)}°</td></tr>
            <tr><td style="padding: 2px 4px; color: #888;">Distance</td><td style="padding: 2px 4px; font-weight: 600;">${station.distance.toFixed(1)} m</td></tr>
            <tr><td style="padding: 2px 4px; color: #888;">Total Field</td><td style="padding: 2px 4px; font-weight: 600;">${station.averageNT.toFixed(1)} nT</td></tr>
            <tr><td style="padding: 2px 4px; color: #7B1FA2;">Anomaly</td><td style="padding: 2px 4px; font-weight: bold; color: #7B1FA2;">${station.totalAnomaly.toFixed(2)} nT</td></tr>
            <tr><td style="padding: 2px 4px; color: #888;">IGRF</td><td style="padding: 2px 4px; font-weight: 600;">${station.igrfField.toFixed(1)} nT</td></tr>
          </table>
        </div>
      `);

      markers.push(marker);
    });

    const lineCoords: [number, number][] = displayData.map(d => [d.latitude!, d.longitude!]);
    L.polyline(lineCoords, {
      color: '#7B1FA2',
      weight: 2,
      opacity: 0.6,
      dashArray: '6, 4',
    }).addTo(map);

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.15));
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [displayData]);

  if (displayData.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">No station coordinates available. Ensure your data includes latitude and longitude columns.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          Magnetic Station Map
          <span className="text-xs font-normal text-muted-foreground">
            ({displayData.length} stations • OpenStreetMap)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={mapRef}
          className="w-full rounded-lg border overflow-hidden"
          style={{ height: '500px' }}
        />
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-[#7B1FA2]" /> Base Station
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-primary" /> Survey Station
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-6 border-t-2 border-dashed border-[#7B1FA2]" /> Survey Line
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default MagneticStationMap;
