'use client';
import { getRiskColor, getRiskLabel } from '@/lib/scoring';
import type { ExpeditionScore } from '@/types';

interface Props {
  score: ExpeditionScore;
  compact?: boolean;
}

const DIMENSIONS = [
  { key: 'physicalRisk',           label: 'Riesgo físico',              icon: '💪' },
  { key: 'acclimatizationRisk',    label: 'Riesgo aclimatación',        icon: '🏔️' },
  { key: 'budgetCompatibility',    label: 'Compatibilidad presupuesto', icon: '💰' },
  { key: 'experienceCompatibility',label: 'Compatibilidad experiencia', icon: '🎯' },
  { key: 'climaticRisk',           label: 'Riesgo climático',           icon: '🌤️' },
  { key: 'successProbability',     label: 'Probabilidad de éxito',      icon: '⛰️' },
  { key: 'preparationLevel',       label: 'Nivel de preparación',       icon: '🎒' },
] as const;

function ScoreBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color = getRiskColor(value);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#f1efe8' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold w-6 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

function RiskBadge({ level }: { level: ExpeditionScore['riskLevel'] }) {
  const styles: Record<string, { bg: string; color: string; dot: string }> = {
    low:      { bg: '#f0f7e6', color: '#3B6D11', dot: '#3B6D11' },
    moderate: { bg: '#faeeda', color: '#BA7517', dot: '#BA7517' },
    high:     { bg: '#fcebeb', color: '#A32D2D', dot: '#A32D2D' },
    critical: { bg: '#f7c1c1', color: '#791F1F', dot: '#A32D2D' },
  };
  const s = styles[level];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {getRiskLabel(level)}
    </span>
  );
}

export default function ExpeditionScoreCard({ score, compact = false }: Props) {
  const overallColor = getRiskColor(score.overall);

  if (compact) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-stone-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: '#888780' }}>Score de expedición</div>
            <RiskBadge level={score.riskLevel} />
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: overallColor }}>{score.overall}</div>
            <div className="text-xs" style={{ color: '#888780' }}>/ 10</div>
          </div>
        </div>
        <div className="space-y-1.5">
          {DIMENSIONS.slice(0, 4).map(d => (
            <div key={d.key} className="flex items-center gap-2">
              <span className="text-xs w-28 truncate" style={{ color: '#5F5E5A' }}>{d.icon} {d.label}</span>
              <div className="flex-1">
                <ScoreBar value={score[d.key]} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hero score */}
      <div className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${overallColor}18, ${overallColor}08)`, border: `1px solid ${overallColor}30` }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-medium mb-2" style={{ color: '#888780' }}>Score global de expedición</div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-5xl font-bold" style={{ color: overallColor }}>{score.overall}</span>
              <span className="text-xl" style={{ color: '#b4b2a9' }}>/10</span>
            </div>
            <RiskBadge level={score.riskLevel} />
          </div>
          {/* Radial visual */}
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#f1efe8" strokeWidth="8"/>
            <circle cx="40" cy="40" r="34" fill="none" stroke={overallColor} strokeWidth="8"
              strokeDasharray={`${(score.overall / 10) * 213.6} 213.6`}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
            <text x="40" y="46" textAnchor="middle" fontSize="18" fontWeight="700" fill={overallColor}>{score.overall}</text>
          </svg>
        </div>

        {score.claudeExplanation && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: `${overallColor}20` }}>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5"
                style={{ background: overallColor, color: 'white' }}>C</div>
              <p className="text-xs leading-relaxed" style={{ color: '#444441' }}>{score.claudeExplanation}</p>
            </div>
          </div>
        )}
      </div>

      {/* 7 dimensions */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100">
          <h3 className="text-sm font-semibold" style={{ color: '#2C2C2A' }}>Análisis por dimensión</h3>
        </div>
        <div className="divide-y divide-stone-100">
          {DIMENSIONS.map(d => {
            const val = score[d.key];
            const color = getRiskColor(val);
            const insight = score.insights[d.key];
            return (
              <div key={d.key} className="px-5 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{d.icon}</span>
                    <span className="text-sm font-medium" style={{ color: '#2C2C2A' }}>{d.label}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: color + '18', color }}>
                    {val}/10
                  </span>
                </div>
                <ScoreBar value={val} />
                {insight && (
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#888780' }}>{insight}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Success probability highlight */}
      <div className="rounded-2xl p-4 border" style={{ background: '#f0f7e6', borderColor: '#3B6D11' + '30' }}>
        <div className="flex items-center gap-3">
          <div className="text-2xl">⛰️</div>
          <div>
            <div className="text-sm font-semibold" style={{ color: '#3B6D11' }}>
              Probabilidad de cumbre: {score.successProbability * 10}%
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#5F5E5A' }}>
              {score.insights.successProbability}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
