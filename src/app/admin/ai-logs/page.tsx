'use client';
import { useEffect, useState } from 'react';

interface LogEntry {
  id: string;
  operation: string;
  tool_name?: string;
  model: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  estimated_cost_usd?: number;
  latency_ms?: number;
  input_preview?: string;
  output_preview?: string;
  error?: string;
  fallback_used?: boolean;
  created_at: string;
}

interface Aggregations {
  totalCalls: number;
  errorRate: number;
  totalTokens: number;
  totalCostUsd: number;
  avgLatencyMs: number;
  byOperation: Record<string, number>;
  dailyCost: Array<{ date: string; cost: number }>;
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-stone-200">
      <div className="text-xs font-medium mb-1" style={{ color: '#888780' }}>{label}</div>
      <div className="text-2xl font-bold" style={{ color: color || '#2C2C2A' }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: '#b4b2a9' }}>{sub}</div>}
    </div>
  );
}

function MiniBarChart({ data }: { data: Array<{ date: string; cost: number }> }) {
  const max = Math.max(...data.map(d => d.cost), 0.001);
  return (
    <div className="bg-white rounded-2xl p-4 border border-stone-200">
      <div className="text-xs font-semibold mb-3" style={{ color: '#2C2C2A' }}>Costo diario (7 días)</div>
      <div className="flex items-end gap-1 h-16">
        {data.map((d, i) => {
          const pct = (d.cost / max) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                ${d.cost.toFixed(4)}
              </div>
              <div className="w-full rounded-t transition-all"
                style={{ height: `${Math.max(pct, 4)}%`, background: '#3B6D11', minHeight: 2 }} />
              <div className="text-xs" style={{ color: '#b4b2a9', fontSize: 9 }}>
                {d.date.split('-').slice(1).join('/')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OperationBadge({ op }: { op: string }) {
  const styles: Record<string, string> = {
    analyze_profile: '#3B6D11',
    tool_call:       '#0F6E56',
    chat:            '#185FA5',
  };
  const color = styles[op] || '#888780';
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: color + '18', color }}>
      {op}
    </span>
  );
}

export default function AiLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [agg, setAgg] = useState<Aggregations | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [isMock, setIsMock] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/logs?limit=100')
      .then(r => r.json())
      .then(data => {
        setLogs(data.logs || []);
        setAgg(data.aggregations);
        setIsMock(data.isMock);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    !filter ||
    l.operation.includes(filter) ||
    l.tool_name?.includes(filter) ||
    l.model.includes(filter) ||
    l.error?.includes(filter)
  );

  return (
    <div className="min-h-screen" style={{ background: '#f8fdf4' }}>
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#3B6D11' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 10 L4 4 L6 7 L8 2 L10 10Z" fill="white" fillOpacity="0.9"/></svg>
              </div>
              <span className="text-sm font-semibold" style={{ color: '#2C2C2A' }}>Andes Planner AI</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#f0f7e6', color: '#3B6D11' }}>Admin</span>
            </div>
            <h1 className="text-lg font-bold" style={{ color: '#2C2C2A' }}>Observabilidad IA</h1>
          </div>
          <div className="flex items-center gap-2">
            {isMock && (
              <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: '#faeeda', color: '#BA7517' }}>
                ⚠️ Datos de ejemplo (Supabase no configurado)
              </span>
            )}
            <button onClick={() => window.location.reload()}
              className="text-xs px-3 py-1.5 rounded-lg border transition-all hover:bg-stone-50"
              style={{ borderColor: '#e7e5e4', color: '#5F5E5A' }}>
              Actualizar
            </button>
            <a href="/" className="text-xs px-3 py-1.5 rounded-lg border transition-all hover:bg-stone-50"
              style={{ borderColor: '#e7e5e4', color: '#5F5E5A' }}>
              ← App
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* KPIs */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1,2,3,4,5].map(i => <div key={i} className="rounded-2xl h-20 shimmer-bg" />)}
          </div>
        ) : agg && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KpiCard label="Total llamadas" value={agg.totalCalls.toLocaleString()} sub="últimos 7 días" />
            <KpiCard label="Tokens usados" value={agg.totalTokens.toLocaleString()} sub="input + output" color="#0F6E56" />
            <KpiCard label="Costo total" value={`$${agg.totalCostUsd.toFixed(4)}`} sub="USD estimado" color="#BA7517" />
            <KpiCard label="Latencia promedio" value={`${agg.avgLatencyMs}ms`} sub="p50" color="#185FA5" />
            <KpiCard
              label="Tasa de error"
              value={`${agg.errorRate}%`}
              sub={agg.errorRate === 0 ? 'Sin errores ✓' : 'Revisar logs'}
              color={agg.errorRate > 5 ? '#A32D2D' : '#3B6D11'}
            />
          </div>
        )}

        {/* Charts row */}
        {agg && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <MiniBarChart data={agg.dailyCost} />
            </div>
            <div className="bg-white rounded-2xl p-4 border border-stone-200">
              <div className="text-xs font-semibold mb-3" style={{ color: '#2C2C2A' }}>Por operación</div>
              <div className="space-y-2">
                {Object.entries(agg.byOperation).sort((a,b) => b[1]-a[1]).map(([op, count]) => {
                  const total = Object.values(agg.byOperation).reduce((s,c) => s+c, 0);
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={op}>
                      <div className="flex justify-between mb-1">
                        <OperationBadge op={op} />
                        <span className="text-xs" style={{ color: '#888780' }}>{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-1 rounded-full" style={{ background: '#f1efe8' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#3B6D11' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Logs table */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold" style={{ color: '#2C2C2A' }}>Registro de llamadas</h2>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#f0f7e6', color: '#3B6D11' }}>
                {filtered.length} registros
              </span>
            </div>
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filtrar por operación, tool, error..."
              className="px-3 py-1.5 rounded-lg border text-xs w-56"
              style={{ borderColor: '#e7e5e4' }}
            />
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: '#888780' }}>Cargando logs...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: '#fafaf9' }}>
                    {['Timestamp', 'Operación', 'Tool', 'Modelo', 'Tokens', 'Costo', 'Latencia', 'Estado'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-medium" style={{ color: '#888780' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(log => (
                    <>
                      <tr key={log.id}
                        className="border-t border-stone-100 hover:bg-stone-50 cursor-pointer transition-colors"
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                        <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: '#888780' }}>
                          {new Date(log.created_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="px-4 py-2.5"><OperationBadge op={log.operation} /></td>
                        <td className="px-4 py-2.5" style={{ color: '#5F5E5A' }}>{log.tool_name || '—'}</td>
                        <td className="px-4 py-2.5" style={{ color: '#5F5E5A' }}>
                          {log.model.replace('claude-', 'C-').replace('-20250514', '')}
                        </td>
                        <td className="px-4 py-2.5 font-medium" style={{ color: '#2C2C2A' }}>
                          {log.total_tokens?.toLocaleString() || '—'}
                        </td>
                        <td className="px-4 py-2.5" style={{ color: '#BA7517' }}>
                          {log.estimated_cost_usd ? `$${log.estimated_cost_usd.toFixed(5)}` : '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <span style={{ color: (log.latency_ms || 0) > 5000 ? '#A32D2D' : '#3B6D11' }}>
                            {log.latency_ms ? `${(log.latency_ms / 1000).toFixed(1)}s` : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {log.error ? (
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#fcebeb', color: '#A32D2D' }}>Error</span>
                          ) : log.fallback_used ? (
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#faeeda', color: '#BA7517' }}>Fallback</span>
                          ) : (
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#f0f7e6', color: '#3B6D11' }}>OK</span>
                          )}
                        </td>
                      </tr>
                      {expandedId === log.id && (
                        <tr key={`${log.id}-expanded`} className="border-t border-stone-100">
                          <td colSpan={8} className="px-4 py-3" style={{ background: '#fafaf9' }}>
                            <div className="grid grid-cols-2 gap-4">
                              {log.input_preview && (
                                <div>
                                  <div className="text-xs font-medium mb-1" style={{ color: '#5F5E5A' }}>Input (preview)</div>
                                  <pre className="text-xs p-2 rounded-lg overflow-auto max-h-24 whitespace-pre-wrap"
                                    style={{ background: '#f1efe8', color: '#444441' }}>
                                    {log.input_preview}
                                  </pre>
                                </div>
                              )}
                              {log.output_preview && (
                                <div>
                                  <div className="text-xs font-medium mb-1" style={{ color: '#5F5E5A' }}>Output (preview)</div>
                                  <pre className="text-xs p-2 rounded-lg overflow-auto max-h-24 whitespace-pre-wrap"
                                    style={{ background: '#f1efe8', color: '#444441' }}>
                                    {log.output_preview}
                                  </pre>
                                </div>
                              )}
                              {log.error && (
                                <div className="col-span-2">
                                  <div className="text-xs font-medium mb-1" style={{ color: '#A32D2D' }}>Error</div>
                                  <pre className="text-xs p-2 rounded-lg" style={{ background: '#fcebeb', color: '#A32D2D' }}>
                                    {log.error}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="p-8 text-center text-sm" style={{ color: '#888780' }}>
                  No hay logs que coincidan con el filtro.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
