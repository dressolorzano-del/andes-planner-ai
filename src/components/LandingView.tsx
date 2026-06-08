'use client';
import { useState, useEffect } from 'react';
import { useAndesStore } from '@/store';
import AuthModal from './AuthModal';

export default function LandingView() {
  const { setStep, user, setUser, setSavedPlans } = useAndesStore();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Restore session on mount
  useEffect(() => {
    fetch('/api/auth')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          fetch(`/api/plans?userId=${data.user.id}`)
            .then(r => r.json())
            .then(d => setSavedPlans(d.plans || []))
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const handleSignOut = async () => {
    await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'signout' }) });
    setUser(null);
    setSavedPlans([]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="bg-white/90 backdrop-blur border-b border-stone-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#3B6D11' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 12 L4.5 5 L7 8.5 L9.5 3 L12 12Z" fill="white"/>
            </svg>
          </div>
          <span className="text-sm font-semibold" style={{ color: '#2C2C2A' }}>Andes Planner AI</span>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="text-xs" style={{ color: '#888780' }}>{user.email}</span>
              <button onClick={() => setStep('dashboard')}
                className="text-xs px-3 py-1.5 rounded-lg border transition-all hover:bg-stone-50"
                style={{ borderColor: '#e7e5e4', color: '#3B6D11' }}>
                Mis planes
              </button>
              <button onClick={handleSignOut}
                className="text-xs px-3 py-1.5 rounded-lg border transition-all hover:bg-stone-50"
                style={{ borderColor: '#e7e5e4', color: '#888780' }}>
                Salir
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setAuthMode('signin'); setShowAuth(true); }}
                className="text-xs px-3 py-1.5 rounded-lg border transition-all hover:bg-stone-50"
                style={{ borderColor: '#e7e5e4', color: '#5F5E5A' }}>
                Iniciar sesión
              </button>
              <button onClick={() => { setAuthMode('signup'); setShowAuth(true); }}
                className="text-xs px-3 py-1.5 rounded-xl text-white"
                style={{ background: '#3B6D11' }}>
                Registrarse
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-20 mountain-pattern overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #f8fdf4 0%, #e8f4d8 40%, #d4eab8 100%)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 200" fill="none" preserveAspectRatio="none">
            <path d="M0 200 L200 80 L350 140 L520 40 L700 120 L900 20 L1100 100 L1280 60 L1440 200Z" fill="#3B6D11" fillOpacity="0.06"/>
          </svg>
        </div>

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ background: 'linear-gradient(135deg, #3B6D11, #639922)' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M4 28 L10 12 L16 20 L22 8 L28 28Z" fill="white" fillOpacity="0.9"/>
            </svg>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-3 leading-tight tracking-tight" style={{ color: '#2C2C2A' }}>
            Andes<br/><span style={{ color: '#3B6D11' }}>Planner AI</span>
          </h1>
          <p className="text-xl mb-2 font-light" style={{ color: '#5F5E5A' }}>
            Planificación inteligente de expediciones de montañismo
          </p>
          <p className="text-base mb-10" style={{ color: '#888780' }}>
            Agente Claude con 6 herramientas · Clima en tiempo real · Google Places · AI Logs
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => user ? setStep('dashboard') : setStep('profile-1')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold text-base transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #3B6D11, #4a7a18)', boxShadow: '0 8px 24px rgba(59,109,17,0.3)' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 16 L5.5 7 L9 11.5 L12.5 4 L16 16Z" fill="white" fillOpacity="0.8"/>
              </svg>
              {user ? 'Ir al dashboard' : 'Planificar expedición'}
            </button>
            {!user && (
              <button onClick={() => { setAuthMode('signin'); setShowAuth(true); }}
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-medium text-base border transition-all hover:bg-white"
                style={{ borderColor: '#3B6D11', color: '#3B6D11' }}>
                Ver mis planes
              </button>
            )}
          </div>

          <p className="mt-4 text-sm" style={{ color: '#888780' }}>
            Ecuador · Cotopaxi (5,897m) + Chimborazo (6,268m) · Fase 2
          </p>
        </div>
      </div>

      {/* Feature strip */}
      <div className="bg-white border-t border-stone-200">
        <div className="max-w-4xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '🧠', title: 'Agente con herramientas', desc: '6 tools nativas de Claude' },
            { icon: '🏢', title: 'Google Places + catálogo', desc: 'Agencias reales verificadas' },
            { icon: '📊', title: 'AI Logs en Supabase', desc: 'Tokens · costo · latencia' },
            { icon: '🔐', title: 'Auth + historial', desc: 'Planes guardados por usuario' },
          ].map(f => (
            <div key={f.title} className="text-center">
              <div className="text-xl mb-1">{f.icon}</div>
              <div className="font-medium text-xs" style={{ color: '#2C2C2A' }}>{f.title}</div>
              <div className="text-xs mt-0.5" style={{ color: '#888780' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="py-2 text-center text-xs" style={{ background: '#f0f7e6', color: '#3B6D11' }}>
        🔬 Fase 2 · Claude Tool Use · Supabase · Google Places · Open-Meteo
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultMode={authMode} />}
    </div>
  );
}
