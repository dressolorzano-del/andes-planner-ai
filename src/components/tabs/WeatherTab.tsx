'use client';
import { useAndesStore } from '@/store';

const WMO_ICONS: Record<number, string> = { 0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️', 51: '🌦️', 61: '🌧️', 71: '❄️', 75: '🌨️', 80: '🌧️', 85: '🌨️', 95: '⛈️' };

export default function WeatherTab() {
  const { result } = useAndesStore();
  if (!result) return null;

  const weather = result.weather;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Condiciones climáticas</h2>
        <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#e1f5ee', color: '#0F6E56' }}>
          Open-Meteo API
        </span>
      </div>

      {/* Context card */}
      <div className="rounded-2xl p-4 border" style={{ background: '#e1f5ee', borderColor: '#9FE1CB' }}>
        <div className="text-sm font-medium mb-1" style={{ color: '#085041' }}>Período del viaje</div>
        <div className="text-xs" style={{ color: '#0F6E56' }}>
          {result.profile.arrivalDate
            ? `Del ${new Date(result.profile.arrivalDate).toLocaleDateString('es-EC')} — ${result.profile.duration} días`
            : 'Fechas por confirmar'
          }
          {' · '}Temporada {new Date(result.profile.arrivalDate || new Date()).getMonth() + 1 >= 6 &&
            new Date(result.profile.arrivalDate || new Date()).getMonth() + 1 <= 9 ? 'seca (óptima)' : 'variable'}
        </div>
      </div>

      {/* Location cards */}
      <div className="grid grid-cols-1 gap-4">
        {weather.map((w, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-stone-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-base" style={{ color: '#2C2C2A' }}>{w.location}</h3>
                <div className="text-xs mt-0.5" style={{ color: '#888780' }}>
                  Altitud: {w.altitude.toLocaleString()}m
                </div>
              </div>
              <div className="text-3xl">{WMO_ICONS[w.weatherCode] || '🌤️'}</div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-2 rounded-xl" style={{ background: '#faeeda' }}>
                <div className="text-lg font-bold" style={{ color: '#BA7517' }}>{w.tempMax}°</div>
                <div className="text-xs" style={{ color: '#888780' }}>Máx</div>
              </div>
              <div className="text-center p-2 rounded-xl" style={{ background: '#e1f5ee' }}>
                <div className="text-lg font-bold" style={{ color: '#0F6E56' }}>{w.tempMin}°</div>
                <div className="text-xs" style={{ color: '#888780' }}>Mín</div>
              </div>
              <div className="text-center p-2 rounded-xl" style={{ background: '#f1efe8' }}>
                <div className="text-lg font-bold" style={{ color: '#5F5E5A' }}>{w.windSpeed}</div>
                <div className="text-xs" style={{ color: '#888780' }}>km/h</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="flex justify-between px-2 py-1 rounded-lg" style={{ background: '#f1efe8' }}>
                <span style={{ color: '#888780' }}>Precipitación</span>
                <span className="font-medium" style={{ color: '#2C2C2A' }}>{w.precipitation} mm</span>
              </div>
              {w.snowfall > 0 && (
                <div className="flex justify-between px-2 py-1 rounded-lg" style={{ background: '#f1efe8' }}>
                  <span style={{ color: '#888780' }}>Nieve esperada</span>
                  <span className="font-medium" style={{ color: '#2C2C2A' }}>{w.snowfall} cm</span>
                </div>
              )}
            </div>

            <p className="text-xs italic" style={{ color: '#888780' }}>{w.description}</p>

            {/* Altitude-specific warnings */}
            {w.altitude > 5000 && (
              <div className="mt-3 space-y-1">
                {w.windSpeed > 55 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg text-xs" style={{ background: '#fcebeb', color: '#A32D2D' }}>
                    ⚠️ Vientos por encima del umbral de seguridad ({w.windSpeed} km/h)
                  </div>
                )}
                {w.tempMin < -20 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg text-xs" style={{ background: '#faeeda', color: '#633806' }}>
                    🥶 Temperatura extrema — equipo de capas adicionales obligatorio
                  </div>
                )}
                {w.windSpeed <= 45 && w.precipitation <= 12 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg text-xs" style={{ background: '#f0f7e6', color: '#3B6D11' }}>
                    ✅ Condiciones generalmente favorables para el período
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-xs text-center py-2" style={{ color: '#b4b2a9' }}>
        Datos proporcionados por Open-Meteo (open-meteo.com) · Actualizado en tiempo real
      </div>
    </div>
  );
}
