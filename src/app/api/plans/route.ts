import { NextRequest, NextResponse } from 'next/server';
import { savePlan, getUserPlans, getPlanById, updatePlanChat } from '@/lib/supabase';
import type { PlanResult, ChatMessage } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const planId = searchParams.get('planId');

  if (planId) {
    const plan = await getPlanById(planId);
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    return NextResponse.json({ plan });
  }

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
  const plans = await getUserPlans(userId);
  return NextResponse.json({ plans });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, plan, userId, planId, chatHistory } = body;

  if (action === 'save') {
    if (!plan || !userId) return NextResponse.json({ error: 'plan and userId required' }, { status: 400 });
    const result = await savePlan(plan as PlanResult, userId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, planId: (plan as PlanResult).id });
  }

  if (action === 'updateChat') {
    if (!planId || !chatHistory) return NextResponse.json({ error: 'planId and chatHistory required' }, { status: 400 });
    await updatePlanChat(planId, chatHistory as ChatMessage[]);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
