import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

// Simple admin protection
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return true; // No secret set → open in dev
  const auth = req.headers.get('x-admin-secret') || req.nextUrl.searchParams.get('secret');
  return auth === secret;
}

// Mock data for when Supabase isn't configured
const MOCK_LOGS = Array.from({ length: 12 }, (_, i) => ({
  id: `mock_${i}`,
  operation: ['analyze_profile', 'tool_call', 'chat', 'tool_call'][i % 4],
  tool_name: ['analyzeProfile', 'compareAgencies', null, 'detectRisks', 'generateItinerary'][i % 5],
  model: 'claude-sonnet-4-20250514',
  prompt_tokens: Math.floor(800 + Math.random() * 2000),
  completion_tokens: Math.floor(200 + Math.random() * 800),
  total_tokens: Math.floor(1000 + Math.random() * 2800),
  estimated_cost_usd: parseFloat((Math.random() * 0.08).toFixed(6)),
  latency_ms: Math.floor(800 + Math.random() * 4000),
  error: i === 7 ? 'Timeout after 30s' : null,
  fallback_used: i === 7,
  created_at: new Date(Date.now() - i * 1000 * 60 * 15).toISOString(),
}));

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const operation = searchParams.get('operation');
  const since = searchParams.get('since'); // ISO date

  if (!isSupabaseConfigured || !supabaseAdmin) {
    // Return mock data with aggregations
    const filtered = MOCK_LOGS.filter(l => !operation || l.operation === operation);
    return NextResponse.json({
      logs: filtered.slice(0, limit),
      aggregations: computeAggregations(filtered),
      isMock: true,
    });
  }

  let query = supabaseAdmin
    .from('ai_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (operation) query = query.eq('operation', operation);
  if (since) query = query.gte('created_at', since);

  const { data: logs, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggregations query
  const { data: allLogs } = await supabaseAdmin
    .from('ai_logs')
    .select('operation,total_tokens,estimated_cost_usd,latency_ms,error,created_at')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  return NextResponse.json({
    logs: logs || [],
    aggregations: computeAggregations(allLogs || []),
    isMock: false,
  });
}

function computeAggregations(logs: any[]) {
  const total = logs.length;
  const errors = logs.filter(l => l.error).length;
  const totalTokens = logs.reduce((s, l) => s + (l.total_tokens || 0), 0);
  const totalCost = logs.reduce((s, l) => s + (l.estimated_cost_usd || 0), 0);
  const avgLatency = total > 0 ? Math.round(logs.reduce((s, l) => s + (l.latency_ms || 0), 0) / total) : 0;

  const byOperation: Record<string, number> = {};
  for (const l of logs) {
    byOperation[l.operation] = (byOperation[l.operation] || 0) + 1;
  }

  // Daily cost for last 7 days
  const dailyCost: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().split('T')[0];
    dailyCost[key] = 0;
  }
  for (const l of logs) {
    const day = l.created_at?.split('T')[0];
    if (day && dailyCost[day] !== undefined) {
      dailyCost[day] += l.estimated_cost_usd || 0;
    }
  }

  return {
    totalCalls: total,
    errorRate: total > 0 ? Math.round((errors / total) * 100) : 0,
    totalTokens,
    totalCostUsd: parseFloat(totalCost.toFixed(4)),
    avgLatencyMs: avgLatency,
    byOperation,
    dailyCost: Object.entries(dailyCost).map(([date, cost]) => ({
      date,
      cost: parseFloat(cost.toFixed(4)),
    })),
  };
}
