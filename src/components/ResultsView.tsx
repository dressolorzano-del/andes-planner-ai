'use client';
import { useState, useEffect, lazy, Suspense } from 'react';
import { useAndesStore } from '@/store';
import AgenciesTab from './tabs/AgenciesTab';
import ItineraryTab from './tabs/ItineraryTab';
import ChecklistTab from './tabs/ChecklistTab';
import RecommendationTab from './tabs/RecommendationTab';
import WeatherTab from './tabs/WeatherTab';
import ChatPanel from './ChatPanel';
import ExpeditionScoreCard from './ExpeditionScoreCard';

// Lazy load map to avoid SSR issues with Leaflet
const MapView = lazy(() => import('./MapView'));

const TABS = [
  { id: 'recommendation', label: 'Recomendación', icon: '🎯' },
  { id: 'score',          label: 'Score',          icon: '📊' },
  { id: 'agencies',       label: 'Agencias',       icon: '🏢' },
  { id: 'map',            label: 'Mapa',           icon: '🗺️' },
  { id: 'itinerary',      label: 'Itinerario',     icon: '📅' },
  { id: 'checklist',      label: 'Checklist',      icon: '✅' },
  { id: 'weather',        label: 'Clima',          icon: '🌤️' },
];

export default function ResultsView() {
  const { setStep, result, profile, reset, user } = useAndesStore();
  const [activeTab, setActiveTab] = useState('recommendation');
  const [showChat, setShowChat] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [savedToDb, setSavedToDb] = useState(false);

  useEffect(() => {
    if (!result || !user || savedToDb) return;
    setSavedToDb(true);
    fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', plan: result, userId: user.id }),
    }).catch(err => console.error('Auto-save failed:', err));
  }, [result, user]);

  const handleExport = async () => {
    if (!result) return;
    setIsExporting(true);
    try {
      const { generatePDF } = await import('@/lib/pdfExport');
      await generatePDF(result);
    } catch (e) { console.error('PDF error:', e); }
    finally { setIsExporting(false); }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fdf4' }}>
      <header className="sticky top-0 z-20 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#3B6D11' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 14 L5 6 L8 10 L11 4 L14 14Z" fill="white" fillOpacity="0.9"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: '#2C2C2A' }}>Andes Planner AI</div>
              <div className="text-xs flex items-center gap-2" style={{ color: '#888780' }}>
                <span>{profile.targetMountains?.join(' + ')} · {profile.groupSize}p · ${profile.budget?.toLocaleString()}/p</span>
                {result?.score && (
                  <span className="px-1.5 py-0.5 rounded text-xs font-medium"
                    style={{ background: '#f0f7e6', color: '#3B6D11' }}>
                    Score: {result.score.overall}/10
                  </span>
                )}
                {user && savedToDb && <span style={{ color: '#3B6D11' }}>· ✓ Guardado</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
              style={{ borderColor: showChat ? '#3B6D11' : '#e7e5e4', color: showChat ? '#3B6D11' : '#5F5E5A', background: showChat ? '#f0f7e6' : 'white' }}>
              💬 {showChat ? 'Cerrar' : 'Claude'}
            </button>
            <button onClick={handleExport} disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-60"
              style={{ background: '#3B6D11' }}>
              {isExporting ? '...' : '↓ PDF'}
            </button>
            <a href="/admin/ai-logs" target="_blank"
              className="text-xs px-2.5 py-1.5 rounded-lg border transition-all hover:bg-stone-50"
              style={{ borderColor: '#e7e5e4', color: '#888780' }} title="AI Logs">
              📊
            </a>
            <button onClick={() => user ? setStep('dashboard') : reset()}
              className="text-xs px-3 py-1.5 rounded-lg border transition-all hover:bg-stone-50"
              style={{ borderColor: '#e7e5e4', color: '#888780' }}>
              {user ? 'Mis planes' : 'Nuevo'}
            </button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 flex gap-0.5 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-all"
              style={activeTab === tab.id
                ? { borderBottomColor: '#3B6D11', color: '#3B6D11' }
                : { borderBottomColor: 'transparent', color: '#5F5E5A' }}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className={`flex-1 flex gap-4 max-w-5xl mx-auto w-full px-4 py-6`}>
        <div className={showChat ? 'flex-1 min-w-0' : 'w-full'}>
          {activeTab === 'recommendation' && <RecommendationTab />}
          {activeTab === 'score' && result?.score && (
            <ExpeditionScoreCard score={result.score} />
          )}
          {activeTab === 'score' && !result?.score && (
            <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm" style={{ color: '#888780' }}>Score no disponible para este plan.</p>
            </div>
          )}
          {activeTab === 'agencies' && <AgenciesTab />}
          {activeTab === 'map' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Mapa de expedición</h2>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#e1f5ee', color: '#0F6E56' }}>
                  OpenStreetMap · Sin API key
                </span>
              </div>
              <Suspense fallback={
                <div className="rounded-2xl h-96 shimmer-bg flex items-center justify-center">
                  <span className="text-sm" style={{ color: '#5F5E5A' }}>Cargando mapa...</span>
                </div>
              }>
                <MapView weather={result?.weather} />
              </Suspense>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Puntos en ruta', value: '13', icon: '📍' },
                  { label: 'Cumbres', value: '2', icon: '⛰️' },
                  { label: 'Refugios', value: '4', icon: '🏠' },
                  { label: 'Altitud máx.', value: '6,268m', icon: '📈' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-xl p-3 border border-stone-200 text-center">
                    <div className="text-lg">{s.icon}</div>
                    <div className="text-sm font-bold" style={{ color: '#2C2C2A' }}>{s.value}</div>
                    <div className="text-xs" style={{ color: '#888780' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'itinerary' && <ItineraryTab />}
          {activeTab === 'checklist' && <ChecklistTab />}
          {activeTab === 'weather' && <WeatherTab />}
        </div>
        {showChat && (
          <div className="w-80 flex-shrink-0">
            <ChatPanel />
          </div>
        )}
      </div>
    </div>
  );
}
