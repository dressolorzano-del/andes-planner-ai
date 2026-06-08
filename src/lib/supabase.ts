import type { PlanResult, ChatMessage } from '@/types';

// ── Client setup ──────────────────────────────────────────────────────────────
const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  || '';
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceRole  = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnon;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnon);

let _supabase: any = null;
let _supabaseAdmin: any = null;

async function getClient() {
  if (!isSupabaseConfigured) return null;
  if (_supabase) return _supabase;
  const { createClient } = await import('@supabase/supabase-js');
  _supabase = createClient(supabaseUrl, supabaseAnon, { auth: { persistSession: true, autoRefreshToken: true } });
  return _supabase;
}

async function getAdminClient() {
  if (!isSupabaseConfigured) return null;
  if (_supabaseAdmin) return _supabaseAdmin;
  const { createClient } = await import('@supabase/supabase-js');
  _supabaseAdmin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  return _supabaseAdmin;
}

// Exported for direct use in client components
export const supabase = isSupabaseConfigured ? null : null; // lazy via getClient()
export const supabaseAdmin = null; // lazy via getAdminClient()

// ── AUTH ─────────────────────────────────────────────────────────────────────
export async function signUp(email: string, password: string, fullName?: string) {
  const client = await getClient();
  if (!client) return { user: null, error: 'Supabase not configured' };
  const { data, error } = await client.auth.signUp({
    email, password,
    options: { data: { full_name: fullName || email.split('@')[0] } },
  });
  return { user: data.user, error: error?.message || null };
}

export async function signIn(email: string, password: string) {
  const client = await getClient();
  if (!client) return { user: null, session: null, error: 'Supabase not configured' };
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  return { user: data.user, session: data.session, error: error?.message || null };
}

export async function signOut() {
  const client = await getClient();
  if (!client) return;
  await client.auth.signOut();
}

export async function getSession() {
  const client = await getClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

export async function getUser() {
  const client = await getClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user;
}

// ── PLANS ────────────────────────────────────────────────────────────────────
export async function savePlan(plan: PlanResult, userId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminClient();
  if (!admin) return { ok: false, error: 'Supabase not configured' };

  const title = [(plan.profile.targetMountains || []).join(' + '),
    plan.profile.arrivalDate ? `· ${new Date(plan.profile.arrivalDate).toLocaleDateString('es-EC', { month: 'short', year: 'numeric' })}` : '',
  ].join(' ').trim() || 'Plan Ecuador';

  const { error } = await admin.from('plans').upsert({
    id: plan.id, user_id: userId, title,
    destination: plan.profile.destination || 'Ecuador',
    mountains: plan.profile.targetMountains || [],
    duration_days: plan.profile.duration,
    group_size: plan.profile.groupSize,
    budget_per_person: plan.profile.budget,
    profile: plan.profile,
    agencies: plan.agencies,
    recommended_agency: plan.recommendedAgency,
    itinerary: plan.itinerary,
    checklist: plan.checklist,
    recommendation: plan.recommendation,
    weather: plan.weather,
    score: (plan as any).score || null,
    chat_history: plan.chatHistory || [],
    updated_at: new Date().toISOString(),
  });
  if (error) { console.error('savePlan error:', error); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function updatePlanChat(planId: string, chatHistory: ChatMessage[]): Promise<void> {
  const admin = await getAdminClient();
  if (!admin) return;
  await admin.from('plans').update({ chat_history: chatHistory, updated_at: new Date().toISOString() }).eq('id', planId);
}

export async function getUserPlans(userId: string): Promise<SavedPlanSummary[]> {
  const admin = await getAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from('plans')
    .select('id,title,destination,mountains,duration_days,group_size,budget_per_person,recommended_agency,recommendation,created_at')
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
  if (error) return [];
  return (data || []).map((row: any) => ({
    id: row.id, title: row.title, destination: row.destination,
    mountains: row.mountains || [], durationDays: row.duration_days,
    groupSize: row.group_size, budgetPerPerson: row.budget_per_person,
    recommendedAgencyName: (row.recommended_agency as any)?.name || null,
    totalBudget: (row.recommendation as any)?.totalBudget || null,
    createdAt: row.created_at,
  }));
}

export async function getPlanById(planId: string): Promise<PlanResult | null> {
  const admin = await getAdminClient();
  if (!admin) return null;
  const { data, error } = await admin.from('plans').select('*').eq('id', planId).single();
  if (error || !data) return null;
  return {
    id: data.id, createdAt: data.created_at, profile: data.profile,
    agencies: data.agencies || [], recommendedAgency: data.recommended_agency,
    itinerary: data.itinerary || [], checklist: data.checklist || [],
    recommendation: data.recommendation, weather: data.weather || [],
    chatHistory: data.chat_history || [],
  };
}

// ── AI LOGS ──────────────────────────────────────────────────────────────────
export interface AiLogEntry {
  planId?: string; userId?: string;
  operation: 'analyze_profile' | 'chat' | 'tool_call';
  toolName?: string; model?: string;
  promptTokens?: number; completionTokens?: number; totalTokens?: number;
  latencyMs?: number; inputPreview?: string; outputPreview?: string; error?: string;
}

const COST_PER_M_INPUT  = 3.0;
const COST_PER_M_OUTPUT = 15.0;

export function estimateCost(promptTokens = 0, completionTokens = 0): number {
  return (promptTokens / 1_000_000) * COST_PER_M_INPUT + (completionTokens / 1_000_000) * COST_PER_M_OUTPUT;
}

export async function logAiCall(entry: AiLogEntry): Promise<void> {
  const cost = estimateCost(entry.promptTokens, entry.completionTokens);
  console.log(`[AI] ${entry.operation}${entry.toolName ? ':' + entry.toolName : ''} | tokens:${entry.totalTokens} | $${cost.toFixed(5)} | ${entry.latencyMs}ms`);
  const admin = await getAdminClient();
  if (!admin) return;
  await admin.from('ai_logs').insert({
    plan_id: entry.planId, user_id: entry.userId, operation: entry.operation,
    tool_name: entry.toolName, model: entry.model || 'claude-sonnet-4-20250514',
    prompt_tokens: entry.promptTokens, completion_tokens: entry.completionTokens,
    total_tokens: entry.totalTokens, estimated_cost_usd: cost,
    latency_ms: entry.latencyMs, input_preview: entry.inputPreview?.substring(0, 500),
    output_preview: entry.outputPreview?.substring(0, 500), error: entry.error,
  });
}

export interface SavedPlanSummary {
  id: string; title: string; destination: string; mountains: string[];
  durationDays: number; groupSize: number; budgetPerPerson: number;
  recommendedAgencyName: string | null; totalBudget: number | null; createdAt: string;
}
