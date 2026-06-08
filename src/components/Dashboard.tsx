'use client';
import { useEffect, useState } from 'react';
import { useAndesStore } from '@/store';
import type { SavedPlanSummary } from '@/types';

function PlanCard({ plan, onLoad }: { plan: SavedPlanSummary; onLoad: (id: string) => void }) {
  const date = new Date(plan.createdAt).toLocaleDateString('es-EC', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="bg-white rounded-2xl p-5 border border-stone-200 hover:border-stone-300 transition-all cursor-pointer group"
      onClick={() => onLoad(plan.id)}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate" style={{ color: '#2C2C2A' }}>{plan.title}</h3>
          <p className="text-xs mt-0.5" style={{ color: '#888780' }}>{date}</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
          className="flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: '#3B6D11' }}>
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {plan.mountains.map(m => (
          <span key={m} className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: '#f0f7e6', color: '#3B6D11' }}>🏔 {m}</span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center rounded-lg py-1.5" style={{ background: '#f1efe8' }}>
          <div className="text-xs font-medium" style={{ color: '#2C2C2A' }}>{plan.durationDays}d</div>
          <div className="text-xs" style={{ color: '#888780' }}>días</div>
        </div>
        <div className="text-center rounded-lg py-1.5" style={{ background: '#f1efe8' }}>
          <div className="text-xs font-medium" style={{ color: '#2C2C2A' }}>{plan.groupSize}</div>
          <div className="text-xs" style={{ color: '#888780' }}>personas</div>
        </div>
        <div className="text-center rounded-lg py-1.5" style={{ background: '#f1efe8' }}>
          <div className="text-xs font-medium" style={{ color: '#2C2C2A' }}>
            ${plan.totalBudget ? Math.round(plan.totalBudget / 1000) + 'k' : plan.budgetPerPerson + '/p'}
          </div>
          <div className="text-xs" style={{ color: '#888780' }}>total</div>
        </div>
      </div>

      {plan.recommendedAgencyName && (
        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: '#3B6D11' }}>
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1"/>
            <path d="M4 6l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xs" style={{ color: '#5F5E5A' }}>{plan.recommendedAgencyName}</span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user, setStep, setResult, setSavedPlans, savedPlans, reset } = useAndesStore();
  const [loading, setLoading] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/plans?userId=${user.id}`)
      .then(r => r.json())
      .then(data => { setSavedPlans(data.plans || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleLoadPlan = async (planId: string) => {
    setLoadingPlanId(planId);
    try {
      const res = await fetch(`/api/plans?planId=${planId}`);
      if (!res.ok) throw new Error('Not found');
      const { plan } = await res.json();
      setResult(plan);
      setStep('results');
    } catch {
      alert('No se pudo cargar el plan');
    } finally {
      setLoadingPlanId(null);
    }
  };

  const handleNewPlan = () => {
    reset();
    setStep('profile-1');
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f8fdf4 0%, #f1efe8 100%)' }}>
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#3B6D11' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 14 L5 6 L8 10 L11 4 L14 14Z" fill="white" fillOpacity="0.9"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: '#2C2C2A' }}>Andes Planner AI</div>
              {user && <div className="text-xs" style={{ color: '#888780' }}>{user.email}</div>}
            </div>
          </div>
          <button onClick={handleNewPlan}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
            style={{ background: '#3B6D11' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Nuevo plan
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">
            Hola{user ? `, ${user.email.split('@')[0]}` : ''} 👋
          </h1>
          <p className="text-sm" style={{ color: '#888780' }}>
            {savedPlans.length > 0
              ? `Tienes ${savedPlans.length} plan${savedPlans.length > 1 ? 'es' : ''} guardado${savedPlans.length > 1 ? 's' : ''}`
              : 'Planifica tu primera expedición en los Andes'}
          </p>
        </div>

        {/* New plan CTA when no plans */}
        {savedPlans.length === 0 && !loading && (
          <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center mb-8">
            <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: '#f0f7e6' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 21 L7 9 L12 15 L16 6 L21 21Z" stroke="#3B6D11" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#2C2C2A' }}>Tu primera expedición</h2>
            <p className="text-sm mb-4" style={{ color: '#888780' }}>
              Completa el formulario y Claude analizará tu perfil para generar un plan personalizado
            </p>
            <button onClick={handleNewPlan}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-medium"
              style={{ background: '#3B6D11' }}>
              Planificar ahora
            </button>
          </div>
        )}

        {/* Plans grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-stone-200 h-40 shimmer-bg" />
            ))}
          </div>
        ) : savedPlans.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: '#2C2C2A' }}>Planes anteriores</h2>
              <span className="text-xs" style={{ color: '#888780' }}>{savedPlans.length} planes</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedPlans.map(plan => (
                <div key={plan.id} className="relative">
                  {loadingPlanId === plan.id && (
                    <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center z-10">
                      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                        style={{ borderColor: '#3B6D11', borderTopColor: 'transparent' }} />
                    </div>
                  )}
                  <PlanCard plan={plan} onLoad={handleLoadPlan} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Feature summary */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '🧠', title: 'Agente Claude', desc: '6 herramientas nativas' },
            { icon: '🌤️', title: 'Clima en vivo', desc: 'Open-Meteo API' },
            { icon: '🏢', title: 'Agencias reales', desc: 'Google Places + catálogo' },
            { icon: '📊', title: 'AI Logs', desc: 'Tokens y costo real' },
          ].map(f => (
            <div key={f.title} className="bg-white rounded-2xl p-4 border border-stone-200 text-center">
              <div className="text-xl mb-1">{f.icon}</div>
              <div className="text-xs font-medium" style={{ color: '#2C2C2A' }}>{f.title}</div>
              <div className="text-xs mt-0.5" style={{ color: '#888780' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
