import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProcessedStation } from '@/lib/gravityCalculations';

interface Props {
  data: ProcessedStation[];
}

// Fix default marker icons for Leaflet in bundled environments
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const StationMap = ({ data }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  const displayData = data.filter(d => !d.remark?.toLowerCase().includes('close loop'));

  useEffect(() => {
    if (!mapRef.current || displayData.length === 0) return;

    // Destroy previous map instance
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const center: [number, number] = [
      displayData.reduce((s, d) => s + d.latitude, 0) / displayData.length,
      displayData.reduce((s, d) => s + d.longitude, 0) / displayData.length,
    ];

    const map = L.map(mapRef.current).setView(center, 11);
    mapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add station markers
    const markers: L.Marker[] = [];
    displayData.forEach((station, i) => {
      const isBase = station.remark?.toLowerCase().includes('open');
      const marker = L.marker([station.latitude, station.longitude], {
        icon: isBase ? redIcon : defaultIcon,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: Calibri, sans-serif; min-width: 200px;">
          <h3 style="margin: 0 0 6px; color: #E31E24; font-size: 14px; font-weight: bold;">
            ${station.stationId}
          </h3>
          <p style="margin: 0 0 4px; font-size: 11px; color: #666;">${station.description}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 6px 0;" />
          <table style="font-size: 11px; width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 2px 4px; color: #888;">Lat/Long</td><td style="padding: 2px 4px; font-weight: 600;">${station.latitude.toFixed(5)}°, ${station.longitude.toFixed(5)}°</td></tr>
            <tr><td style="padding: 2px 4px; color: #888;">Height</td><td style="padding: 2px 4px; font-weight: 600;">${station.height.toFixed(2)} m</td></tr>
            <tr><td style="padding: 2px 4px; color: #888;">Abs. Gravity</td><td style="padding: 2px 4px; font-weight: 600;">${station.absoluteGravity.toFixed(3)} mGal</td></tr>
            <tr><td style="padding: 2px 4px; color: #E31E24;">FAA</td><td style="padding: 2px 4px; font-weight: bold; color: #E31E24;">${station.freeAirAnomaly.toFixed(3)} mGal</td></tr>
            <tr><td style="padding: 2px 4px; color: #1565C0;">BA</td><td style="padding: 2px 4px; font-weight: bold; color: #1565C0;">${station.bouguerAnomaly.toFixed(3)} mGal</td></tr>
          </table>
          ${station.remark ? `<p style="margin: 6px 0 0; font-size: 10px; color: #999; font-style: italic;">${station.remark}</p>` : ''}
        </div>
      `);

      markers.push(marker);
    });

    // Draw survey line connecting stations
    const lineCoords: [number, number][] = displayData.map(d => [d.latitude, d.longitude]);
    L.polyline(lineCoords, {
      color: '#E31E24',
      weight: 2,
      opacity: 0.6,
      dashArray: '6, 4',
    }).addTo(map);

    // Fit bounds
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          Station Map
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
            <span className="inline-block w-3 h-3 rounded-full bg-primary" /> Base Station
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-accent-foreground" /> Survey Station
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-6 border-t-2 border-dashed border-primary" /> Survey Line
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default StationMap;
