'use client';
import { useAndesStore } from '@/store';

const ALTITUDE_ZONES = [
  { max: 3500, label: 'Baja altitud', color: '#639922' },
  { max: 4500, label: 'Media altitud', color: '#BA7517' },
  { max: 5500, label: 'Alta altitud', color: '#EF9F27' },
  { max: 9000, label: 'Zona de cumbre', color: '#A32D2D' },
];

function getAltitudeColor(alt: number) {
  return ALTITUDE_ZONES.find(z => alt < z.max)?.color || '#A32D2D';
}

function AltitudeBadge({ altitude }: { altitude: number }) {
  const color = getAltitudeColor(altitude);
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: color + '20', color }}>
      {altitude.toLocaleString()}m
    </span>
  );
}

export default function ItineraryTab() {
  const { result } = useAndesStore();
  if (!result) return null;

  const maxAlt = Math.max(...result.itinerary.map(d => d.altitude));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Itinerario de aclimatación</h2>
        <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#f0f7e6', color: '#3B6D11' }}>
          {result.itinerary.length} etapas · {result.profile.duration} días
        </span>
      </div>

      {/* Mini altitude profile */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200">
        <div className="text-xs font-medium mb-3" style={{ color: '#5F5E5A' }}>Perfil de altitud</div>
        <div className="flex items-end gap-1 h-12">
          {result.itinerary.map((day, i) => {
            const pct = (day.altitude / maxAlt) * 100;
            const color = getAltitudeColor(day.altitude);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t transition-all" style={{ height: `${pct}%`, background: color, minHeight: 4 }} />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1 text-xs" style={{ color: '#b4b2a9' }}>
          <span>Día 1</span>
          <span>Día {result.profile.duration}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px" style={{ background: '#d3d1c7' }} />
        <div className="space-y-3">
          {result.itinerary.map((day, i) => (
            <div key={i} className="relative flex gap-4">
              {/* Timeline dot */}
              <div className="relative z-10 flex-shrink-0">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: day.isSummitDay ? 'linear-gradient(135deg, #A32D2D, #BA7517)' : day.isRestDay ? '#639922' : '#3B6D11' }}>
                  {day.isSummitDay ? '⛰' : day.isRestDay ? '💤' : String(typeof day.day === 'number' ? day.day : day.day).substring(0, 2)}
                </div>
              </div>

              {/* Content */}
              <div className={`flex-1 bg-white rounded-2xl p-4 border mb-1 ${day.isSummitDay ? 'border-red-200' : 'border-stone-200'}`}
                style={day.isSummitDay ? { borderColor: '#f09595' } : {}}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium" style={{ color: '#888780' }}>Día {day.day}</span>
                      {day.isSummitDay && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#fcebeb', color: '#A32D2D' }}>
                          Día de cumbre
                        </span>
                      )}
                      {day.isRestDay && !day.isSummitDay && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#f0f7e6', color: '#3B6D11' }}>
                          Descanso
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm" style={{ color: '#2C2C2A' }}>{day.location}</h4>
                  </div>
                  <AltitudeBadge altitude={day.altitude} />
                </div>

                <div className="mb-2">
                  <ul className="space-y-0.5">
                    {day.activities.map((act, j) => (
                      <li key={j} className="text-xs" style={{ color: '#5F5E5A' }}>• {act}</li>
                    ))}
                  </ul>
                </div>

                <p className="text-xs italic" style={{ color: '#888780' }}>{day.notes}</p>

                {day.accommodation && (
                  <div className="mt-2 pt-2 border-t border-stone-100 flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: '#888780' }}>
                      <path d="M6 1.5l3.5 3.5v6H2.5V5L6 1.5z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-xs" style={{ color: '#888780' }}>{day.accommodation}</span>
                  </div>
                )}

                {day.alerts?.map((alert, j) => (
                  <div key={j} className="mt-2 flex items-start gap-1.5 p-2 rounded-lg" style={{ background: '#faeeda' }}>
                    <span className="text-xs">⚠️</span>
                    <span className="text-xs" style={{ color: '#633806' }}>{alert}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
