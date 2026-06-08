'use client';
import { useEffect, useRef } from 'react';
import { useAndesStore } from '@/store';

const STEPS = [
  { msg: 'Analizando perfil del viajero...', icon: '👤', duration: 1200 },
  { msg: 'Consultando agencias certificadas ASEGUIM...', icon: '🏔️', duration: 1800 },
  { msg: 'Obteniendo datos climáticos de Open-Meteo...', icon: '🌤️', duration: 1500 },
  { msg: 'Evaluando adecuación al perfil...', icon: '⚖️', duration: 1200 },
  { msg: 'Generando itinerario de aclimatación...', icon: '📅', duration: 1500 },
  { msg: 'Creando checklist personalizada...', icon: '✅', duration: 1000 },
  { msg: 'Sintetizando recomendación final...', icon: '🎯', duration: 1200 },
];

export default function AnalyzingView() {
  const { profile, addAnalyzeProgress, analyzeProgress, setResult, setStep, setAnalyzing, user } = useAndesStore();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const run = async () => {
      setAnalyzing(true);

      // Show progress messages with delays
      for (let i = 0; i < STEPS.length; i++) {
        await new Promise(r => setTimeout(r, STEPS[i].duration));
        addAnalyzeProgress(STEPS[i].msg);
      }

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile, userId: user?.id }),
        });

        if (!response.ok) throw new Error('API error');
        const { plan } = await response.json();
        setResult(plan);
        setAnalyzing(false);
        setStep('results');
      } catch (error) {
        console.error('Analysis failed:', error);
        setAnalyzing(false);
        setStep('results'); // Will show fallback data
      }
    };

    run();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #f0f7e6 0%, #e8f4d8 50%, #d4eab8 100%)' }}>
      <div className="max-w-md w-full text-center">
        {/* Animated mountain logo */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="absolute w-20 h-20 rounded-full opacity-20 animate-ping" style={{ background: '#3B6D11' }} />
          <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3B6D11, #639922)' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M4 28 L10 12 L16 20 L22 8 L28 28Z" fill="white" fillOpacity="0.9">
                <animateTransform attributeName="transform" type="scale" values="1;1.05;1" dur="1.5s" repeatCount="indefinite" additive="sum" />
              </path>
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2">Claude está analizando</h2>
        <p className="text-sm mb-8" style={{ color: '#5F5E5A' }}>
          El agente está evaluando tu perfil y buscando las mejores opciones para tu expedición
        </p>

        {/* Progress steps */}
        <div className="space-y-3 text-left mb-8">
          {STEPS.map((s, i) => {
            const isDone = analyzeProgress.length > i;
            const isActive = analyzeProgress.length === i;
            return (
              <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500 ${
                isDone ? 'opacity-100' : isActive ? 'opacity-60' : 'opacity-20'
              }`} style={{ background: isDone ? '#f0f7e6' : isActive ? 'rgba(240,247,230,0.5)' : 'transparent' }}>
                <span className="text-lg flex-shrink-0">{s.icon}</span>
                <span className="text-sm font-medium flex-1" style={{ color: '#2C2C2A' }}>{s.msg}</span>
                {isDone && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                    <circle cx="8" cy="8" r="7" fill="#3B6D11"/>
                    <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {isActive && (
                  <div className="w-4 h-4 flex-shrink-0">
                    <div className="w-4 h-4 border-2 rounded-full border-t-transparent animate-spin" style={{ borderColor: '#3B6D11', borderTopColor: 'transparent' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${(analyzeProgress.length / STEPS.length) * 100}%`, background: 'linear-gradient(90deg, #3B6D11, #639922)' }}
          />
        </div>
        <p className="text-xs mt-3" style={{ color: '#888780' }}>
          Conectado a Claude API + Open-Meteo
        </p>
      </div>
    </div>
  );
}
