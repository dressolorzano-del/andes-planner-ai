import type { TravelerProfile, ExpeditionScore } from '@/types';

// ── Deterministic scoring engine ──────────────────────────────────────────────

const MOUNTAIN_MIN_EXPERIENCE: Record<string, { exp: string[]; minAlt: number; fitness: string[] }> = {
  'Cotopaxi':   { exp: ['high_altitude', 'expedition'], minAlt: 4000, fitness: ['good', 'very_good', 'athlete'] },
  'Chimborazo': { exp: ['high_altitude', 'expedition'], minAlt: 5000, fitness: ['very_good', 'athlete'] },
  'Illiniza':   { exp: ['hiking', 'high_altitude', 'expedition'], minAlt: 3000, fitness: ['good', 'very_good', 'athlete'] },
  'Cayambe':    { exp: ['high_altitude', 'expedition'], minAlt: 4500, fitness: ['very_good', 'athlete'] },
};

function scorePhysicalRisk(p: Partial<TravelerProfile>): { score: number; insight: string } {
  let score = 10;
  const issues: string[] = [];

  if (p.fitnessLevel === 'regular') { score -= 3; issues.push('condición física regular'); }
  else if (p.fitnessLevel === 'good') { score -= 1; }

  const hasCoto = p.targetMountains?.includes('Cotopaxi');
  const hasChi  = p.targetMountains?.includes('Chimborazo');

  if (hasChi && p.fitnessLevel === 'regular') { score -= 2; issues.push('Chimborazo requiere fitness muy buena'); }
  if (hasChi && p.fitnessLevel === 'good')    { score -= 1; }

  if (p.groupSize && p.groupSize > 6) { score -= 1; issues.push('grupos grandes reducen flexibilidad táctica'); }

  score = Math.max(1, Math.min(10, score));
  const insight = issues.length
    ? `Factores de riesgo físico: ${issues.join(', ')}.`
    : 'Condición física compatible con los objetivos planteados.';
  return { score, insight };
}

function scoreAcclimatizationRisk(p: Partial<TravelerProfile>): { score: number; insight: string } {
  let score = 10;
  const issues: string[] = [];

  if (p.duration && p.duration < 10) { score -= 3; issues.push(`duración ${p.duration}d insuficiente para aclimatación adecuada`); }
  else if (p.duration && p.duration < 12) { score -= 1; issues.push('itinerario ajustado para aclimatación óptima'); }

  if (p.maxAltitudeReached !== undefined) {
    const hasChi = p.targetMountains?.includes('Chimborazo');
    if (hasChi && p.maxAltitudeReached < 4000) { score -= 3; issues.push('sin experiencia previa por encima de 4,000m'); }
    else if (p.maxAltitudeReached < 3000) { score -= 2; issues.push('primera exposición a altitud moderada'); }
  }

  if (p.medicalConditions && p.medicalConditions.length > 10) {
    score -= 1; issues.push('condiciones médicas declaradas requieren evaluación específica');
  }

  score = Math.max(1, Math.min(10, score));
  const insight = issues.length
    ? `Riesgos de aclimatación: ${issues.join('; ')}.`
    : 'Tiempo de aclimatación adecuado para el objetivo.';
  return { score, insight };
}

function scoreBudgetCompatibility(p: Partial<TravelerProfile>): { score: number; insight: string } {
  const mountains = p.targetMountains || [];
  const hasBoth = mountains.includes('Cotopaxi') && mountains.includes('Chimborazo');
  const minRealistic = hasBoth ? 1950 : 1200;
  const safeRecommended = hasBoth ? 2280 : 1600;

  let score = 10;
  let insight = '';

  if (!p.budget) return { score: 5, insight: 'Presupuesto no especificado.' };

  if (p.budget < minRealistic) {
    score = 2;
    insight = `⚠️ Presupuesto de $${p.budget} insuficiente para seguridad mínima. Mínimo realista: $${minRealistic}/persona con guía certificado.`;
  } else if (p.budget < safeRecommended) {
    score = 6;
    insight = `Presupuesto ajustado ($${p.budget}). Alcanza la opción básica pero limita la seguridad óptima. Recomendado: $${safeRecommended}+.`;
  } else if (p.budget < 3100) {
    score = 9;
    insight = `Presupuesto adecuado ($${p.budget}). Permite contratar agencia certificada con seguro incluido.`;
  } else {
    score = 10;
    insight = `Presupuesto premium ($${p.budget}). Permite las mejores opciones del mercado con todos los servicios.`;
  }

  return { score, insight };
}

function scoreExperienceCompatibility(p: Partial<TravelerProfile>): { score: number; insight: string } {
  let score = 10;
  const issues: string[] = [];
  const mountains = p.targetMountains || [];

  for (const mountain of mountains) {
    const key = Object.keys(MOUNTAIN_MIN_EXPERIENCE).find(k => mountain.includes(k));
    if (!key) continue;
    const req = MOUNTAIN_MIN_EXPERIENCE[key];
    if (p.mountainExperience && !req.exp.includes(p.mountainExperience)) {
      score -= 3;
      issues.push(`experiencia insuficiente para ${mountain} (requiere: ${req.exp.join(' o ')})`);
    }
    if (p.maxAltitudeReached !== undefined && p.maxAltitudeReached < req.minAlt) {
      score -= 2;
      issues.push(`altitud máxima alcanzada (${p.maxAltitudeReached}m) por debajo del mínimo para ${mountain} (${req.minAlt}m)`);
    }
    if (p.fitnessLevel && !req.fitness.includes(p.fitnessLevel)) {
      score -= 1;
      issues.push(`fitness insuficiente para ${mountain}`);
    }
  }

  score = Math.max(1, Math.min(10, score));
  const insight = issues.length
    ? `Brechas de experiencia detectadas: ${issues.join('; ')}.`
    : 'Perfil de experiencia compatible con los objetivos declarados.';
  return { score, insight };
}

function scoreClimaticRisk(p: Partial<TravelerProfile>): { score: number; insight: string } {
  if (!p.arrivalDate) return { score: 6, insight: 'Sin fecha definida — riesgo climático no evaluable.' };
  const month = new Date(p.arrivalDate).getMonth() + 1;
  const dryMonths = [6, 7, 8, 12, 1, 2];
  const transitional = [3, 5, 9, 11];
  let score: number;
  let insight: string;

  if (dryMonths.includes(month)) {
    score = 9;
    insight = `Temporada seca (mes ${month}). Condiciones óptimas para glaciares: nieve firme, visibilidad alta, viento moderado.`;
  } else if (transitional.includes(month)) {
    score = 6;
    insight = `Mes de transición (mes ${month}). Condiciones variables — ventana de cumbre más estrecha, posible precipitación.`;
  } else {
    score = 3;
    insight = `⚠️ Temporada húmeda (mes ${month}). Riesgo significativo: hielo glaseado en glaciares, visibilidad reducida, ventanas de cumbre muy cortas.`;
  }
  return { score, insight };
}

function scoreSuccessProbability(p: Partial<TravelerProfile>, sub: Omit<ExpeditionScore, 'overall' | 'successProbability' | 'riskLevel' | 'insights' | 'preparationLevel'>): { score: number; insight: string } {
  const avg = (sub.physicalRisk + sub.acclimatizationRisk + sub.experienceCompatibility + sub.climaticRisk) / 4;
  const score = Math.round(avg * 0.9 + (p.riskTolerance === 'high' ? 0.5 : 0));
  const pct = Math.round(score * 10);
  const insight = score >= 8
    ? `Alta probabilidad de éxito (~${pct}%). Perfil sólido con factores favorables alineados.`
    : score >= 6
    ? `Probabilidad moderada (~${pct}%). Con preparación adecuada y condiciones favorables es alcanzable.`
    : `Probabilidad baja (~${pct}%). Se requieren ajustes significativos en experiencia, presupuesto o timing.`;
  return { score: Math.min(10, Math.max(1, score)), insight };
}

function scorePreparationLevel(p: Partial<TravelerProfile>): { score: number; insight: string } {
  let score = 5;
  const positives: string[] = [];
  const negatives: string[] = [];

  if (p.guideRequired) { score += 1; positives.push('guía profesional previsto'); }
  if (p.rescueInsurance) { score += 1; positives.push('seguro de rescate previsto'); }
  if (p.gearIncluded) { score += 0.5; positives.push('equipo a cargo de la agencia'); }
  if (!p.medicalConditions || p.medicalConditions.length < 5) { score += 0.5; }

  if (!p.guideRequired) { score -= 2; negatives.push('sin guía certificado'); }
  if (!p.rescueInsurance) { score -= 1; negatives.push('sin seguro de rescate'); }

  score = Math.max(1, Math.min(10, Math.round(score)));
  const insight = negatives.length
    ? `Preparación mejorable: ${negatives.join(', ')}. Positivo: ${positives.join(', ') || 'ninguno declarado'}.`
    : `Preparación sólida: ${positives.join(', ')}.`;
  return { score, insight };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function calculateScore(profile: Partial<TravelerProfile>): ExpeditionScore {
  const physical       = scorePhysicalRisk(profile);
  const acclimatization = scoreAcclimatizationRisk(profile);
  const budget         = scoreBudgetCompatibility(profile);
  const experience     = scoreExperienceCompatibility(profile);
  const climatic       = scoreClimaticRisk(profile);
  const preparation    = scorePreparationLevel(profile);

  const partial = {
    physicalRisk: physical.score,
    acclimatizationRisk: acclimatization.score,
    budgetCompatibility: budget.score,
    experienceCompatibility: experience.score,
    climaticRisk: climatic.score,
    preparationLevel: preparation.score,
  };

  const success = scoreSuccessProbability(profile, partial);

  const scores = Object.values(partial);
  const overall = Math.round((scores.reduce((a, b) => a + b, 0) + success.score) / (scores.length + 1));

  const riskLevel: ExpeditionScore['riskLevel'] =
    overall >= 8 ? 'low' :
    overall >= 6 ? 'moderate' :
    overall >= 4 ? 'high' : 'critical';

  return {
    ...partial,
    successProbability: success.score,
    overall,
    riskLevel,
    insights: {
      physicalRisk:          physical.insight,
      acclimatizationRisk:   acclimatization.insight,
      budgetCompatibility:   budget.insight,
      experienceCompatibility: experience.insight,
      climaticRisk:          climatic.insight,
      successProbability:    success.insight,
      preparationLevel:      preparation.insight,
    },
  };
}

export function getRiskColor(score: number): string {
  if (score >= 8) return '#3B6D11';
  if (score >= 6) return '#639922';
  if (score >= 4) return '#BA7517';
  return '#A32D2D';
}

export function getRiskLabel(level: ExpeditionScore['riskLevel']): string {
  switch (level) {
    case 'low':      return 'Riesgo bajo';
    case 'moderate': return 'Riesgo moderado';
    case 'high':     return 'Riesgo alto';
    case 'critical': return 'Riesgo crítico';
  }
}
