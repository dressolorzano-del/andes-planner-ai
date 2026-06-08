'use client';
import { useEffect, useRef, useState } from 'react';
import { ECUADOR_POINTS, ROUTE_SEGMENTS, MAP_CENTER, MAP_ZOOM, getPointColor, getTypeLabel } from '@/lib/geo';
import type { GeoPoint, WeatherData } from '@/types';

interface MapViewProps {
  highlightDay?: number | string;
  weather?: WeatherData[];
  compact?: boolean;
}

export default function MapView({ highlightDay, weather, compact = false }: MapViewProps) {
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<GeoPoint | null>(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    const initMap = async () => {
      if (mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      if (!mapRef.current) return;

      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current, {
        center: MAP_CENTER,
        zoom: compact ? 7 : MAP_ZOOM,
        zoomControl: !compact,
        scrollWheelZoom: !compact,
      });

      // OpenStreetMap tile layer — free, no key
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      // Draw route segments
      for (const seg of ROUTE_SEGMENTS) {
        const fromPt = ECUADOR_POINTS.find(p => p.id === seg.from);
        const toPt   = ECUADOR_POINTS.find(p => p.id === seg.to);
        if (!fromPt || !toPt) continue;

        L.polyline(
          [[fromPt.lat, fromPt.lng], [toPt.lat, toPt.lng]],
          { color: seg.color, weight: 2, opacity: 0.7, dashArray: seg.dashed ? '6 4' : undefined }
        ).addTo(map);
      }

      // Add markers
      for (const point of ECUADOR_POINTS) {
        const color = getPointColor(point.type);
        const isHighlighted = highlightDay !== undefined && String(point.routeDay) === String(highlightDay);

        // Custom SVG icon
        const size = point.type === 'summit' ? 22 : point.type === 'refuge' ? 18 : 16;
        const shape = point.type === 'summit'
          ? `<path d="M${size/2} 2 L${size-2} ${size-2} L2 ${size-2}Z" fill="${color}" stroke="white" stroke-width="1.5"/>`
          : point.type === 'refuge'
          ? `<rect x="3" y="5" width="${size-6}" height="${size-7}" fill="${color}" stroke="white" stroke-width="1.2" rx="2"/><path d="M2 ${size/2} L${size/2} 3 L${size-2} ${size/2}" fill="${color}" stroke="white" stroke-width="1.2"/>`
          : `<circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="${color}" stroke="white" stroke-width="1.5"/>`;

        const icon = L.divIcon({
          html: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
            ${shape}
            ${isHighlighted ? `<circle cx="${size/2}" cy="${size/2}" r="${size/2+3}" fill="none" stroke="${color}" stroke-width="2" opacity="0.6"/>` : ''}
          </svg>`,
          className: '',
          iconSize: [size, size],
          iconAnchor: [size/2, size/2],
        });

        // Get weather for this location
        const locationWeather = weather?.find(w =>
          w.location.toLowerCase().includes(point.name.toLowerCase().split(' ')[0].toLowerCase()) ||
          point.name.toLowerCase().includes(w.location.toLowerCase().split(' ')[0].toLowerCase())
        );

        const weatherHtml = locationWeather
          ? `<div style="margin-top:6px;padding:4px 8px;background:#f0f7e6;border-radius:6px;font-size:11px;color:#3B6D11;">
              🌡️ ${locationWeather.tempMin}°–${locationWeather.tempMax}°C · 💨 ${locationWeather.windSpeed}km/h
            </div>`
          : '';

        const popupContent = `
          <div style="font-family:system-ui,sans-serif;min-width:180px;max-width:220px;">
            <div style="font-weight:600;font-size:13px;color:#2C2C2A;margin-bottom:2px;">${point.name}</div>
            <div style="font-size:11px;color:${color};font-weight:500;margin-bottom:4px;">${getTypeLabel(point.type)} · ${point.altitude.toLocaleString()}m</div>
            ${point.description ? `<div style="font-size:11px;color:#5F5E5A;">${point.description}</div>` : ''}
            ${point.routeDay ? `<div style="font-size:11px;color:#888780;margin-top:4px;">Día ${point.routeDay}</div>` : ''}
            ${weatherHtml}
          </div>`;

        const marker = L.marker([point.lat, point.lng], { icon })
          .bindPopup(popupContent, { maxWidth: 240 })
          .addTo(map);

        if (isHighlighted) {
          setTimeout(() => marker.openPopup(), 300);
        }
      }

      // Altitude legend
      if (!compact) {
        const legend = new (L.Control.extend({
          onAdd() {
            const div = L.DomUtil.create('div', '');
            div.style.cssText = 'background:white;padding:8px 10px;border-radius:8px;font-family:system-ui;font-size:11px;border:1px solid #e7e5e4;';
            div.innerHTML = `
              <div style="font-weight:600;margin-bottom:6px;color:#2C2C2A;">Leyenda</div>
              ${[
                { color: '#A32D2D', label: 'Cumbre', shape: '▲' },
                { color: '#BA7517', label: 'Refugio', shape: '■' },
                { color: '#0F6E56', label: 'Aclimatación', shape: '●' },
                { color: '#3B6D11', label: 'Ciudad', shape: '●' },
              ].map(i => `<div style="display:flex;align-items:center;gap:6px;margin:3px 0;color:#444441;">
                <span style="color:${i.color};font-size:14px;">${i.shape}</span>${i.label}
              </div>`).join('')}
              <div style="margin-top:6px;padding-top:6px;border-top:1px solid #f1efe8;color:#888780;font-size:10px;">OpenStreetMap · Sin API key</div>
            `;
            return div;
          },
        }))({ position: 'bottomright' });
        legend.addTo(map);
      }

      mapInstanceRef.current = map;
      setLoaded(true);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-stone-200"
      style={{ height: compact ? 280 : 460 }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center shimmer-bg">
          <div className="text-center">
            <div className="text-2xl mb-2">🗺️</div>
            <div className="text-xs" style={{ color: '#5F5E5A' }}>Cargando mapa...</div>
          </div>
        </div>
      )}
      {loaded && !compact && (
        <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur rounded-xl px-3 py-1.5 border border-stone-200">
          <div className="text-xs font-medium" style={{ color: '#2C2C2A' }}>Ecuador · Ruta de expedición</div>
          <div className="text-xs" style={{ color: '#888780' }}>{ECUADOR_POINTS.filter(p => p.type === 'summit').length} cumbres · {ECUADOR_POINTS.filter(p => p.type === 'refuge').length} refugios</div>
        </div>
      )}
    </div>
  );
}
