'use client';
import { useState } from 'react';
import { useAndesStore } from '@/store';
import { isSupabaseConfigured } from '@/lib/supabase';

interface Props {
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
}

export default function AuthModal({ onClose, defaultMode = 'signin' }: Props) {
  const { setUser, setStep, setSavedPlans } = useAndesStore();
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) { setError('Completa todos los campos'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: mode, email, password, fullName }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error de autenticación');
        setLoading(false);
        return;
      }

      if (mode === 'signup') {
        setSuccess('¡Cuenta creada! Revisa tu email para confirmar.');
        setLoading(false);
        return;
      }

      // signin success
      setUser({ id: data.user.id, email: data.user.email });

      // Load saved plans
      const plansRes = await fetch(`/api/plans?userId=${data.user.id}`);
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setSavedPlans(plansData.plans || []);
      }

      setStep('dashboard');
      onClose();
    } catch {
      setError('Error de conexión');
      setLoading(false);
    }
  };

  // If Supabase not configured, show info
  if (!isSupabaseConfigured) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.4)' }}>
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-stone-200">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-bold">Autenticación</h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600">✕</button>
          </div>
          <div className="rounded-xl p-4 mb-4" style={{ background: '#faeeda' }}>
            <p className="text-sm font-medium" style={{ color: '#633806' }}>⚙️ Supabase no configurado</p>
            <p className="text-xs mt-1" style={{ color: '#633806' }}>
              Para activar login y guardar planes, configura las variables de entorno de Supabase en tu archivo <code>.env.local</code>.
            </p>
          </div>
          <p className="text-xs mb-4" style={{ color: '#888780' }}>
            Sin autenticación la plataforma funciona normalmente — los planes se guardan en tu navegador (localStorage).
          </p>
          <button onClick={() => { setStep('profile-1'); onClose(); }}
            className="w-full py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ background: '#3B6D11' }}>
            Continuar sin cuenta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-stone-200">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="text-lg font-bold">{mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
            <p className="text-xs mt-0.5" style={{ color: '#888780' }}>
              {mode === 'signin' ? 'Accede a tus planes guardados' : 'Guarda y accede a todos tus planes'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-stone-100 text-stone-400">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {success ? (
          <div className="rounded-xl p-4 text-center" style={{ background: '#f0f7e6' }}>
            <div className="text-2xl mb-2">✉️</div>
            <p className="text-sm font-medium" style={{ color: '#3B6D11' }}>{success}</p>
            <button onClick={onClose} className="mt-3 text-xs" style={{ color: '#888780' }}>Cerrar</button>
          </div>
        ) : (
          <div className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#5F5E5A' }}>Nombre completo</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Tu nombre" className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ borderColor: '#e7e5e4' }} />
              </div>
            )}
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#5F5E5A' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com" className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ borderColor: '#e7e5e4' }} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#5F5E5A' }}>Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres" className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ borderColor: '#e7e5e4' }} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>

            {error && (
              <div className="rounded-xl px-3 py-2 text-xs" style={{ background: '#fcebeb', color: '#A32D2D' }}>
                {error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading}
              className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60"
              style={{ background: '#3B6D11' }}>
              {loading ? 'Procesando...' : mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>

            <div className="text-center">
              <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
                className="text-xs" style={{ color: '#888780' }}>
                {mode === 'signin' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>

            <div className="border-t border-stone-100 pt-3">
              <button onClick={() => { setStep('profile-1'); onClose(); }}
                className="w-full py-2 rounded-xl border text-xs transition-all hover:bg-stone-50"
                style={{ borderColor: '#e7e5e4', color: '#5F5E5A' }}>
                Continuar sin cuenta (solo localStorage)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
