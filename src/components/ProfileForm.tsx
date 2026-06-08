'use client';
import { useState } from 'react';
import { useAndesStore } from '@/store';

const MOUNTAINS = ['Cotopaxi (5,897m)', 'Chimborazo (6,268m)', 'Illiniza Norte (5,126m)', 'Cayambe (5,790m)', 'Carihuairazo (5,018m)'];
const LANGUAGES = ['Español', 'Inglés', 'Portugués', 'Francés', 'Alemán'];
const ACCOMMODATION = ['Hotel', 'Refugio de montaña', 'Hostal', 'Lodge eco-turístico', 'Camping'];

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
        selected
          ? 'border-summit-600 bg-summit-50 text-summit-700 font-medium'
          : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
      }`}
      style={selected ? { borderColor: '#4a7a18', background: '#f0f7e6', color: '#3B6D11' } : {}}
    >
      {label}
    </button>
  );
}

function RadioCard({ value, current, label, sub, onChange }: any) {
  const selected = current === value;
  return (
    <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
      selected ? 'border-green-600 bg-green-50' : 'border-stone-200 bg-white hover:border-stone-300'
    }`} style={selected ? { borderColor: '#3B6D11', background: '#f0f7e6' } : {}}>
      <div className="mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
        style={{ borderColor: selected ? '#3B6D11' : '#d6d3d1' }}>
        {selected && <div className="w-2 h-2 rounded-full" style={{ background: '#3B6D11' }} />}
      </div>
      <div>
        <div className="text-sm font-medium" style={{ color: '#2C2C2A' }}>{label}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color: '#888780' }}>{sub}</div>}
      </div>
      <input type="radio" className="hidden" value={value} checked={selected} onChange={() => onChange(value)} />
    </label>
  );
}

export default function ProfileForm() {
  const { step, profile, updateProfile, setStep, clearProgress } = useAndesStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleArray = (field: string, val: string) => {
    const arr = (profile as any)[field] as string[] || [];
    updateProfile({ [field]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] });
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!profile.arrivalDate) e.arrivalDate = 'Ingresa una fecha de llegada';
    if (!profile.groupSize || profile.groupSize < 1) e.groupSize = 'Ingresa el número de personas';
    if (!profile.budget || profile.budget < 500) e.budget = 'Ingresa un presupuesto (mín. $500)';
    if (!profile.targetMountains?.length) e.mountains = 'Selecciona al menos una montaña';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAnalyze = () => {
    clearProgress();
    setStep('analyzing');
  };

  const progress = step === 'profile-1' ? 25 : 50;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f8fdf4 0%, #f1efe8 100%)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-stone-200">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <button onClick={() => setStep('landing')} className="flex items-center gap-2 text-sm" style={{ color: '#888780' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Inicio
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: '#3B6D11' }}>
              Paso {step === 'profile-1' ? '1' : '2'} de 2
            </span>
            <div className="w-32 h-1.5 bg-stone-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: '#3B6D11' }} />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Step 1 */}
        {step === 'profile-1' && (
          <div className="animate-fade-up">
            <h2 className="text-3xl font-bold mb-1">Tu expedición</h2>
            <p className="mb-8 text-base" style={{ color: '#888780' }}>Cuéntanos sobre el viaje que planeas hacer</p>

            <div className="space-y-6">
              {/* Dates & basics */}
              <div className="bg-white rounded-2xl p-5 border border-stone-200 space-y-4">
                <h3 className="font-semibold text-base" style={{ color: '#2C2C2A' }}>Datos del viaje</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: '#5F5E5A' }}>Fecha de llegada</label>
                    <input type="date" value={profile.arrivalDate || ''}
                      onChange={e => updateProfile({ arrivalDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                      style={{ borderColor: errors.arrivalDate ? '#A32D2D' : '#e7e5e4' }}
                    />
                    {errors.arrivalDate && <p className="text-xs mt-1" style={{ color: '#A32D2D' }}>{errors.arrivalDate}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: '#5F5E5A' }}>Duración (días)</label>
                    <select value={profile.duration || 14}
                      onChange={e => updateProfile({ duration: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      style={{ borderColor: '#e7e5e4' }}>
                      {[7, 10, 12, 14, 18, 21].map(d => <option key={d} value={d}>{d} días</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: '#5F5E5A' }}>Personas en el grupo</label>
                    <input type="number" min={1} max={12} value={profile.groupSize || ''}
                      onChange={e => updateProfile({ groupSize: Number(e.target.value) })}
                      placeholder="ej. 3"
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      style={{ borderColor: errors.groupSize ? '#A32D2D' : '#e7e5e4' }}
                    />
                    {errors.groupSize && <p className="text-xs mt-1" style={{ color: '#A32D2D' }}>{errors.groupSize}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: '#5F5E5A' }}>Presupuesto por persona (USD)</label>
                    <input type="number" min={500} value={profile.budget || ''}
                      onChange={e => updateProfile({ budget: Number(e.target.value) })}
                      placeholder="ej. 2500"
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      style={{ borderColor: errors.budget ? '#A32D2D' : '#e7e5e4' }}
                    />
                    {errors.budget && <p className="text-xs mt-1" style={{ color: '#A32D2D' }}>{errors.budget}</p>}
                  </div>
                </div>
              </div>

              {/* Mountains */}
              <div className="bg-white rounded-2xl p-5 border border-stone-200">
                <h3 className="font-semibold text-base mb-1" style={{ color: '#2C2C2A' }}>Montañas objetivo</h3>
                <p className="text-xs mb-3" style={{ color: '#888780' }}>Selecciona una o más</p>
                <div className="flex flex-wrap gap-2">
                  {MOUNTAINS.map(m => (
                    <Chip key={m} label={m}
                      selected={(profile.targetMountains || []).includes(m.split(' ')[0])}
                      onClick={() => toggleArray('targetMountains', m.split(' ')[0])}
                    />
                  ))}
                </div>
                {errors.mountains && <p className="text-xs mt-2" style={{ color: '#A32D2D' }}>{errors.mountains}</p>}
              </div>

              {/* Languages */}
              <div className="bg-white rounded-2xl p-5 border border-stone-200">
                <h3 className="font-semibold text-base mb-1" style={{ color: '#2C2C2A' }}>Idioma preferido</h3>
                <div className="flex flex-wrap gap-2 mt-3">
                  {LANGUAGES.map(l => (
                    <Chip key={l} label={l}
                      selected={(profile.preferredLanguage || []).includes(l)}
                      onClick={() => toggleArray('preferredLanguage', l)}
                    />
                  ))}
                </div>
              </div>

              {/* Accommodation */}
              <div className="bg-white rounded-2xl p-5 border border-stone-200">
                <h3 className="font-semibold text-base mb-3" style={{ color: '#2C2C2A' }}>Preferencias de hospedaje</h3>
                <div className="flex flex-wrap gap-2">
                  {ACCOMMODATION.map(a => (
                    <Chip key={a} label={a}
                      selected={(profile.accommodationPrefs || []).includes(a)}
                      onClick={() => toggleArray('accommodationPrefs', a)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button onClick={() => { if (validateStep1()) setStep('profile-2'); }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all hover:shadow-md"
                style={{ background: '#3B6D11' }}>
                Continuar
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 'profile-2' && (
          <div className="animate-fade-up">
            <h2 className="text-3xl font-bold mb-1">Perfil del equipo</h2>
            <p className="mb-8 text-base" style={{ color: '#888780' }}>Esto permite personalizar la seguridad y el itinerario</p>

            <div className="space-y-6">
              {/* Experience */}
              <div className="bg-white rounded-2xl p-5 border border-stone-200">
                <h3 className="font-semibold text-base mb-3" style={{ color: '#2C2C2A' }}>Experiencia previa en montañismo</h3>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: 'none', label: 'Sin experiencia', sub: 'Nunca he estado en alta montaña' },
                    { value: 'hiking', label: 'Senderismo avanzado', sub: 'Hasta 3,500m, sin técnica glaciar' },
                    { value: 'high_altitude', label: 'Alta montaña (hasta 5,000m)', sub: 'Experiencia en volcanes o trekking a gran altitud' },
                    { value: 'expedition', label: 'Expediciones 6,000m+', sub: 'Alta montaña técnica, glaciares' },
                  ].map(opt => (
                    <RadioCard key={opt.value} {...opt} current={profile.mountainExperience} onChange={(v: string) => updateProfile({ mountainExperience: v as any })} />
                  ))}
                </div>
              </div>

              {/* Max altitude */}
              <div className="bg-white rounded-2xl p-5 border border-stone-200">
                <h3 className="font-semibold text-base mb-1" style={{ color: '#2C2C2A' }}>Altitud máxima alcanzada (metros)</h3>
                <p className="text-xs mb-3" style={{ color: '#888780' }}>Ingresa 0 si no tienes experiencia en altura</p>
                <input type="number" min={0} max={8848} value={profile.maxAltitudeReached || ''}
                  onChange={e => updateProfile({ maxAltitudeReached: Number(e.target.value) })}
                  placeholder="ej. 4500"
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                  style={{ borderColor: '#e7e5e4' }}
                />
              </div>

              {/* Fitness */}
              <div className="bg-white rounded-2xl p-5 border border-stone-200">
                <h3 className="font-semibold text-base mb-3" style={{ color: '#2C2C2A' }}>Condición física del grupo</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'regular', label: 'Regular', sub: 'Actividad física esporádica' },
                    { value: 'good', label: 'Buena', sub: 'Actividad física 2x/semana' },
                    { value: 'very_good', label: 'Muy buena', sub: 'Entrena regularmente (3–4x/sem)' },
                    { value: 'athlete', label: 'Atleta', sub: 'Entrenamiento diario intenso' },
                  ].map(opt => (
                    <RadioCard key={opt.value} {...opt} current={profile.fitnessLevel} onChange={(v: string) => updateProfile({ fitnessLevel: v as any })} />
                  ))}
                </div>
              </div>

              {/* Services */}
              <div className="bg-white rounded-2xl p-5 border border-stone-200">
                <h3 className="font-semibold text-base mb-3" style={{ color: '#2C2C2A' }}>Servicios requeridos</h3>
                <div className="space-y-2">
                  {[
                    { field: 'guideRequired', label: 'Guía certificado ASEGUIM obligatorio', sub: 'Altamente recomendado para volcanes glaciares' },
                    { field: 'gearIncluded', label: 'Equipo técnico incluido por la agencia', sub: 'Crampones, piolet, casco, arnés' },
                    { field: 'rescueInsurance', label: 'Seguro de rescate en altitud', sub: 'Evacuación aérea cubierta' },
                    { field: 'transportIncluded', label: 'Transporte incluido', sub: 'Traslados ciudad-refugio-ciudad' },
                  ].map(({ field, label, sub }) => (
                    <label key={field} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:border-stone-300"
                      style={{ borderColor: '#e7e5e4' }}>
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ background: (profile as any)[field] ? '#3B6D11' : 'white', borderWidth: 2, borderStyle: 'solid', borderColor: (profile as any)[field] ? '#3B6D11' : '#d6d3d1' }}
                        onClick={() => updateProfile({ [field]: !(profile as any)[field] })}
                      >
                        {(profile as any)[field] && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: '#2C2C2A' }}>{label}</div>
                        <div className="text-xs" style={{ color: '#888780' }}>{sub}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Risk tolerance */}
              <div className="bg-white rounded-2xl p-5 border border-stone-200">
                <h3 className="font-semibold text-base mb-3" style={{ color: '#2C2C2A' }}>Tolerancia al riesgo</h3>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: 'conservative', label: 'Conservador', sub: 'Priorizo seguridad sobre cumbre. Si hay duda, desciendo.' },
                    { value: 'moderate', label: 'Moderado', sub: 'Balance entre seguridad y logro. Decisión informada en campo.' },
                    { value: 'high', label: 'Alto', sub: 'Expedición clásica. Acepto condiciones desafiantes para alcanzar la cumbre.' },
                  ].map(opt => (
                    <RadioCard key={opt.value} {...opt} current={profile.riskTolerance} onChange={(v: string) => updateProfile({ riskTolerance: v as any })} />
                  ))}
                </div>
              </div>

              {/* Medical notes */}
              <div className="bg-white rounded-2xl p-5 border border-stone-200">
                <h3 className="font-semibold text-base mb-1" style={{ color: '#2C2C2A' }}>Condiciones médicas o notas relevantes</h3>
                <p className="text-xs mb-3" style={{ color: '#888780' }}>Opcional — asma, hipertensión, sensibilidad conocida a la altitud, etc.</p>
                <textarea
                  value={profile.medicalConditions || ''}
                  onChange={e => updateProfile({ medicalConditions: e.target.value })}
                  placeholder="Ej: Uno del grupo tuvo AMS leve a 4,500m hace 2 años..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none"
                  style={{ borderColor: '#e7e5e4' }}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-between mt-8">
              <button onClick={() => setStep('profile-1')}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border font-medium text-sm transition-all hover:bg-stone-100"
                style={{ borderColor: '#d6d3d1', color: '#5F5E5A' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Atrás
              </button>
              <button onClick={handleAnalyze}
                className="flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold transition-all hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #3B6D11, #4a7a18)', boxShadow: '0 4px 16px rgba(59,109,17,0.25)' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2a7 7 0 1 0 0 14A7 7 0 0 0 9 2z" stroke="white" strokeWidth="1.5"/><path d="M6 9l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Analizar con Claude
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
