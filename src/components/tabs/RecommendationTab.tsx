'use client';
import { useAndesStore } from '@/store';

export default function RecommendationTab() {
  const { result } = useAndesStore();
  if (!result) return null;
  const { recommendation, recommendedAgency, profile } = result;

  return (
    <div className="space-y-4">
      {/* Hero card */}
      <div className="rounded-2xl p-6 border-l-4 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #3B6D11, #0F6E56)', borderLeftColor: '#97C459' }}>
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <svg viewBox="0 0 100 100" fill="none"><path d="M0 100 L30 30 L50 60 L70 10 L100 100Z" fill="white"/></svg>
        </div>
        <div className="relative z-10">
          <div className="text-xs font-medium mb-1 opacity-80">Recomendación de Claude</div>
          <h2 className="text-xl font-bold mb-1">{recommendedAgency?.name || 'Plan Personalizado'}</h2>
          <p className="text-sm opacity-90 mb-4">{recommendation.summary}</p>
          <div className="flex flex-wrap gap-4">
            <div>
              <div className="text-2xl font-bold">${recommendation.totalBudget.toLocaleString()}</div>
              <div className="text-xs opacity-70">Total para {profile.groupSize} personas</div>
            </div>
            {recommendedAgency && (
              <div>
                <div className="text-2xl font-bold">${recommendedAgency.pricePerPerson.toLocaleString()}</div>
                <div className="text-xs opacity-70">Por persona</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Claude rationale */}
      {recommendation.claudeRationale && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: '#f0f7e6', color: '#3B6D11' }}>C</div>
            <span className="text-sm font-semibold" style={{ color: '#3B6D11' }}>Por qué esta recomendación</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#444441' }}>{recommendation.claudeRationale}</p>
        </div>
      )}

      {/* Pros / Cons */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-stone-200">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#3B6D11' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#f0f7e6"/><path d="M5 8l2 2 4-4" stroke="#3B6D11" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Fortalezas
          </h3>
          <ul className="space-y-2">
            {recommendation.pros.map((p, i) => (
              <li key={i} className="text-xs flex items-start gap-2" style={{ color: '#444441' }}>
                <span style={{ color: '#639922' }}>·</span> {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-stone-200">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#BA7517' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#faeeda"/><path d="M8 5v4M8 11v.5" stroke="#BA7517" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Consideraciones
          </h3>
          <ul className="space-y-2">
            {recommendation.cons.map((c, i) => (
              <li key={i} className="text-xs flex items-start gap-2" style={{ color: '#444441' }}>
                <span style={{ color: '#BA7517' }}>·</span> {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Safety alerts */}
      {recommendation.safetyAlerts.length > 0 && (
        <div className="rounded-2xl p-4 border" style={{ background: '#faeeda', borderColor: '#EF9F27' }}>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: '#633806' }}>
            ⚠️ Alertas de seguridad
          </h3>
          <ul className="space-y-1.5">
            {recommendation.safetyAlerts.map((alert, i) => (
              <li key={i} className="text-xs" style={{ color: '#633806' }}>• {alert}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Next steps */}
      {recommendation.nextSteps.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200">
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#2C2C2A' }}>Próximos pasos</h3>
          <ol className="space-y-2">
            {recommendation.nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-xs" style={{ color: '#444441' }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: '#f0f7e6', color: '#3B6D11' }}>{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
