'use client';
import { useAndesStore } from '@/store';

function ScoreBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color = pct >= 90 ? '#3B6D11' : pct >= 75 ? '#639922' : '#BA7517';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#f1efe8' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-medium w-8" style={{ color }}>{value.toFixed(1)}</span>
    </div>
  );
}

export default function AgenciesTab() {
  const { result } = useAndesStore();
  if (!result) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Comparativa de agencias</h2>
        <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#f0f7e6', color: '#3B6D11' }}>
          {result.agencies.length} opciones evaluadas
        </span>
      </div>

      {result.agencies.map((agency) => (
        <div key={agency.id}
          className={`bg-white rounded-2xl p-5 border transition-all ${agency.isRecommended ? 'border-2 shadow-md' : 'border-stone-200'}`}
          style={agency.isRecommended ? { borderColor: '#3B6D11' } : {}}>
          
          {agency.isRecommended && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3"
              style={{ background: '#f0f7e6', color: '#3B6D11' }}>
              ✓ Recomendada por Claude
            </div>
          )}

          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-base" style={{ color: '#2C2C2A' }}>{agency.name}</h3>
              <p className="text-xs mt-0.5" style={{ color: '#888780' }}>
                {agency.location} · Fundada {agency.founded} · {agency.rating}★ ({agency.reviewCount} reseñas)
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {agency.certifications.map(c => (
                  <span key={c} className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: '#e1f5ee', color: '#0F6E56' }}>{c}</span>
                ))}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xl font-bold" style={{ color: '#2C2C2A' }}>${agency.pricePerPerson.toLocaleString()}</div>
              <div className="text-xs" style={{ color: '#888780' }}>por persona</div>
            </div>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <div className="text-xs mb-1" style={{ color: '#888780' }}>Seguridad</div>
              <ScoreBar value={agency.safetyScore} />
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: '#888780' }}>Adecuación al perfil</div>
              <ScoreBar value={agency.adequacyScore || 8} />
            </div>
          </div>

          {/* Services */}
          <div className="mb-4">
            <div className="text-xs font-medium mb-2" style={{ color: '#5F5E5A' }}>Servicios incluidos</div>
            <div className="flex flex-wrap gap-1.5">
              {agency.servicesIncluded.map(s => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-lg"
                  style={{ background: '#f0f7e6', color: '#3B6D11' }}>✓ {s}</span>
              ))}
            </div>
          </div>

          {/* Pros / Cons */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-medium mb-1.5" style={{ color: '#3B6D11' }}>Puntos fuertes</div>
              <ul className="space-y-1">
                {agency.pros.slice(0, 3).map((p, i) => (
                  <li key={i} className="text-xs" style={{ color: '#444441' }}>+ {p}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-medium mb-1.5" style={{ color: '#BA7517' }}>A considerar</div>
              <ul className="space-y-1">
                {agency.cons.slice(0, 3).map((c, i) => (
                  <li key={i} className="text-xs" style={{ color: '#444441' }}>− {c}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Languages */}
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
            <div className="flex gap-2">
              {agency.languages.map(l => (
                <span key={l} className="text-xs px-2 py-0.5 rounded" style={{ background: '#f1efe8', color: '#5F5E5A' }}>{l}</span>
              ))}
            </div>
            {agency.website && (
              <a href={agency.website} target="_blank" rel="noopener noreferrer"
                className="text-xs" style={{ color: '#3B6D11' }}>
                Ver sitio web →
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
