import Anthropic from '@anthropic-ai/sdk';
import type { TravelerProfile, PlanResult, Agency, ItineraryDay, ChecklistItem } from '@/types';
import { MOCK_AGENCIES, MOCK_ITINERARY, MOCK_CHECKLIST } from './mockData';

// Safe import — works even if supabase is not configured
async function safeLog(entry: any) {
  try {
    const { logAiCall } = await import('./supabase');
    await logAiCall(entry);
  } catch { /* Supabase not configured — silent */ }
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
const MODEL = 'claude-sonnet-4-20250514';

export const SYSTEM_PROMPT = `Eres el agente inteligente de Andes Planner AI, experto en expediciones de montañismo en los Andes ecuatorianos.

CONOCIMIENTO TÉCNICO:
- Protocolos de aclimatación: "asciende alto, duerme bajo", máx 300-500m/día sobre 3,000m
- AMS, HACE, HAPO: síntomas, criterios de descenso, medicación (Diamox, Dexametasona)
- Certificaciones: ASEGUIM (Ecuador), UIAGM/IFMGA (internacional)
- Montañas Ecuador: Cotopaxi 5,897m (glaciar activo), Chimborazo 6,268m, Illiniza Norte 5,126m, Cayambe 5,790m
- Temporadas óptimas: jun-ago y dic-feb (temporadas secas)

DETECCIÓN DE INCONSISTENCIAS:
- Presupuesto insuficiente para seguridad requerida
- Experiencia insuficiente para montañas objetivo
- Tiempo de aclimatación insuficiente
- Condición física incompatible con dificultad técnica

PERSONALIDAD: Experto de montaña. Profesional y directo. Español. Alertas de seguridad claras. Justifica con razonamiento técnico.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'analyzeProfile',
    description: 'Analiza el perfil del viajero, detecta inconsistencias y evalúa viabilidad.',
    input_schema: {
      type: 'object' as const,
      properties: {
        profileSummary: { type: 'string' },
        viabilityScore: { type: 'number' },
        inconsistencies: { type: 'array', items: { type: 'string' } },
        riskLevel: { type: 'string', enum: ['low', 'moderate', 'high', 'critical'] },
        riskFactors: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
      required: ['profileSummary', 'viabilityScore', 'inconsistencies', 'riskLevel', 'riskFactors', 'recommendations'],
    },
  },
  {
    name: 'compareAgencies',
    description: 'Evalúa y rankea las agencias según el perfil específico del viajero.',
    input_schema: {
      type: 'object' as const,
      properties: {
        rankings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              agencyId: { type: 'string' },
              adequacyScore: { type: 'number' },
              isRecommended: { type: 'boolean' },
              specificPros: { type: 'array', items: { type: 'string' } },
              specificCons: { type: 'array', items: { type: 'string' } },
              budgetFit: { type: 'string', enum: ['within', 'tight', 'over'] },
              reasoning: { type: 'string' },
            },
            required: ['agencyId', 'adequacyScore', 'isRecommended', 'specificPros', 'specificCons', 'budgetFit', 'reasoning'],
          },
        },
        recommendedAgencyId: { type: 'string' },
        selectionRationale: { type: 'string' },
      },
      required: ['rankings', 'recommendedAgencyId', 'selectionRationale'],
    },
  },
  {
    name: 'generateItinerary',
    description: 'Genera ajustes al itinerario base según el perfil.',
    input_schema: {
      type: 'object' as const,
      properties: {
        itineraryNotes: { type: 'string' },
        criticalDays: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day: { type: 'string' },
              alert: { type: 'string' },
              recommendation: { type: 'string' },
            },
          },
        },
        acclimatizationAssessment: { type: 'string' },
        goNoGoDecisionPoints: { type: 'array', items: { type: 'string' } },
      },
      required: ['itineraryNotes', 'criticalDays', 'acclimatizationAssessment', 'goNoGoDecisionPoints'],
    },
  },
  {
    name: 'generateChecklist',
    description: 'Personaliza la checklist según el perfil y agencia seleccionada.',
    input_schema: {
      type: 'object' as const,
      properties: {
        coveredByAgency: { type: 'array', items: { type: 'string' } },
        additionalItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              category: { type: 'string' },
              item: { type: 'string' },
              priority: { type: 'string', enum: ['essential', 'recommended', 'optional'] },
              notes: { type: 'string' },
            },
            required: ['id', 'category', 'item', 'priority'],
          },
        },
        priorityMessage: { type: 'string' },
      },
      required: ['coveredByAgency', 'additionalItems', 'priorityMessage'],
    },
  },
  {
    name: 'detectRisks',
    description: 'Detecta riesgos específicos y genera alertas accionables.',
    input_schema: {
      type: 'object' as const,
      properties: {
        safetyAlerts: { type: 'array', items: { type: 'string' } },
        criticalRisks: { type: 'array', items: { type: 'string' } },
        mitigations: {
          type: 'array',
          items: {
            type: 'object',
            properties: { risk: { type: 'string' }, mitigation: { type: 'string' } },
          },
        },
        overallSafetyAssessment: { type: 'string' },
      },
      required: ['safetyAlerts', 'criticalRisks', 'mitigations', 'overallSafetyAssessment'],
    },
  },
  {
    name: 'buildFinalRecommendation',
    description: 'Sintetiza todos los análisis en la recomendación final.',
    input_schema: {
      type: 'object' as const,
      properties: {
        summary: { type: 'string' },
        totalBudgetUsd: { type: 'number' },
        pros: { type: 'array', items: { type: 'string' } },
        cons: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        claudeRationale: { type: 'string' },
        confidenceLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
      },
      required: ['summary', 'totalBudgetUsd', 'pros', 'cons', 'nextSteps', 'claudeRationale', 'confidenceLevel'],
    },
  },
];

export async function analyzeProfile(
  profile: Partial<TravelerProfile>,
  agencies: Agency[] = [],
  planId?: string,
  userId?: string
): Promise<{
  agencies: Agency[];
  itinerary: ItineraryDay[];
  checklist: ChecklistItem[];
  recommendation: PlanResult['recommendation'];
  profileAnalysis: any;
}> {
  const allAgencies = agencies.length > 0 ? agencies : MOCK_AGENCIES;
  const agencyList = allAgencies.map(a =>
    `- ${a.id}: ${a.name} | $${a.pricePerPerson}/persona | ${a.certifications.join(', ')} | rating: ${a.rating}`
  ).join('\n');

  const userPrompt = `Analiza este perfil y usa las 6 herramientas en orden para construir el plan completo.

PERFIL DEL VIAJERO:
${JSON.stringify(profile, null, 2)}

AGENCIAS DISPONIBLES:
${agencyList}

Ejecuta las herramientas en este orden:
1. analyzeProfile
2. compareAgencies
3. generateItinerary
4. generateChecklist
5. detectRisks
6. buildFinalRecommendation

Sé específico para este perfil concreto.`;

  const startTime = Date.now();
  const toolResults: Record<string, any> = {};

  try {
    let messages: Anthropic.MessageParam[] = [{ role: 'user', content: userPrompt }];

    for (let round = 0; round < 12; round++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        tool_choice: { type: 'auto' },
        messages,
      });

      await safeLog({
        planId, userId, operation: 'tool_call', model: MODEL,
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        latencyMs: Date.now() - startTime,
        inputPreview: userPrompt.substring(0, 500),
        outputPreview: JSON.stringify(response.content).substring(0, 500),
      });

      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[];
      for (const block of toolUseBlocks) toolResults[block.name] = block.input;
      if (toolUseBlocks.length === 0 || response.stop_reason === 'end_turn') break;

      messages.push({ role: 'assistant', content: response.content });
      messages.push({
        role: 'user',
        content: toolUseBlocks.map(block => ({
          type: 'tool_result' as const,
          tool_use_id: block.id,
          content: JSON.stringify({ ok: true }),
        })),
      });
    }

    return buildResult(profile, allAgencies, toolResults);
  } catch (error) {
    console.error('analyzeProfile error:', error);
    return buildFallback(profile, allAgencies);
  }
}

function buildResult(profile: Partial<TravelerProfile>, agencies: Agency[], tools: Record<string, any>) {
  const compare = tools['compareAgencies'];
  const checklist = tools['generateChecklist'];
  const risks = tools['detectRisks'];
  const final = tools['buildFinalRecommendation'];
  const itineraryTool = tools['generateItinerary'];
  const profileTool = tools['analyzeProfile'];

  const scoredAgencies = agencies.map(agency => {
    const rank = compare?.rankings?.find((r: any) => r.agencyId === agency.id);
    return {
      ...agency,
      adequacyScore: rank?.adequacyScore ?? agency.safetyScore,
      isRecommended: rank?.isRecommended ?? false,
      pros: rank?.specificPros?.length ? rank.specificPros : agency.pros,
      cons: rank?.specificCons?.length ? rank.specificCons : agency.cons,
    };
  }).sort((a, b) => (b.adequacyScore || 0) - (a.adequacyScore || 0));

  const coveredIds: string[] = checklist?.coveredByAgency || [];
  const baseChecklist = MOCK_CHECKLIST.map(item => ({
    ...item,
    coveredByAgency: coveredIds.includes(item.id) || item.coveredByAgency,
  }));
  const additionalItems = (checklist?.additionalItems || []).map((i: any) => ({
    ...i, checked: false, coveredByAgency: false,
  }));

  const itinerary = MOCK_ITINERARY.map(day => {
    const critical = itineraryTool?.criticalDays?.find((c: any) => String(c.day) === String(day.day));
    return critical ? { ...day, alerts: [...(day.alerts || []), critical.alert] } : day;
  });

  const safetyAlerts = [
    ...(risks?.safetyAlerts || []),
    ...(profileTool?.inconsistencies || []).map((inc: string) => `🔍 ${inc}`),
  ].filter(Boolean);

  return {
    agencies: scoredAgencies,
    itinerary,
    checklist: [...baseChecklist, ...additionalItems],
    profileAnalysis: profileTool || null,
    recommendation: {
      summary: final?.summary || compare?.selectionRationale || 'Plan generado.',
      totalBudget: final?.totalBudgetUsd || (profile.budget || 2500) * (profile.groupSize || 2),
      pros: final?.pros || [],
      cons: final?.cons || [],
      safetyAlerts,
      nextSteps: final?.nextSteps || [],
      claudeRationale: final?.claudeRationale || compare?.selectionRationale || '',
    },
  };
}

function buildFallback(profile: Partial<TravelerProfile>, agencies: Agency[]) {
  return {
    agencies: agencies.map((a, i) => ({ ...a, adequacyScore: 9.5 - i * 0.5, isRecommended: i === 0 })),
    itinerary: MOCK_ITINERARY,
    checklist: MOCK_CHECKLIST,
    profileAnalysis: null,
    recommendation: {
      summary: 'Plan generado con datos del catálogo curado.',
      totalBudget: (profile.budget || 2500) * (profile.groupSize || 2),
      pros: ['Dentro del presupuesto', 'Guías certificados ASEGUIM', 'Equipo incluido'],
      cons: ['Verificar disponibilidad directamente con la agencia'],
      safetyAlerts: ['Monitorear SpO2 en cada refugio', 'Protocolo de descenso ante síntomas de HACE/HAPO'],
      nextSteps: ['Contactar Summit Ecuador esta semana', 'Reservar con depósito del 30%', 'Iniciar plan de entrenamiento'],
      claudeRationale: 'Summit Ecuador ofrece el mejor balance entre seguridad, servicio y precio para tu perfil.',
    },
  };
}

export async function chatWithAgent(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  profile: Partial<TravelerProfile>,
  planContext?: string,
  planId?: string,
  userId?: string
): Promise<ReadableStream> {
  const context = `CONTEXTO: experiencia=${profile.mountainExperience}, fitness=${profile.fitnessLevel}, presupuesto=$${profile.budget}/persona, montañas=${(profile.targetMountains || []).join(', ')}, grupo=${profile.groupSize} personas. ${planContext || ''}`;
  const startTime = Date.now();
  let fullResponse = '';
  let outputTokens = 0;

  const stream = await client.messages.stream({
    model: MODEL,
    max_tokens: 1200,
    system: SYSTEM_PROMPT + '\n\n' + context,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  });

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          fullResponse += chunk.delta.text;
          controller.enqueue(new TextEncoder().encode(chunk.delta.text));
        }
        if (chunk.type === 'message_delta' && chunk.usage) outputTokens = chunk.usage.output_tokens;
      }
      controller.close();
      const lastMsg = messages[messages.length - 1]?.content || '';
      await safeLog({
        planId, userId, operation: 'chat', model: MODEL,
        completionTokens: outputTokens, latencyMs: Date.now() - startTime,
        inputPreview: lastMsg.substring(0, 500), outputPreview: fullResponse.substring(0, 500),
      });
    },
  });
}
