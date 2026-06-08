import { NextRequest, NextResponse } from 'next/server';
import { analyzeProfile } from '@/lib/agent';
import { fetchWeatherData } from '@/lib/weather';
import { savePlan } from '@/lib/supabase';
import { calculateScore } from '@/lib/scoring';
import type { PlanResult, TravelerProfile, Agency } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { profile, userId } = await req.json() as { profile: Partial<TravelerProfile>; userId?: string };
    if (!profile) return NextResponse.json({ error: 'Profile required' }, { status: 400 });

    const planId = `plan_${Date.now()}`;

    // 1. Fetch agencies from search-agencies (Google Places + web search + curated)
    let agencies: Agency[] = [];
    try {
      const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const r = await fetch(`${base}/api/search-agencies`);
      if (r.ok) { const d = await r.json(); agencies = d.agencies || []; }
    } catch { /* fallback to MOCK in agent */ }

    // 2. Calculate score deterministically (fast, no API)
    const score = calculateScore(profile);

    // 3. Claude analysis + weather in parallel
    const [analysisResult, weatherData] = await Promise.all([
      analyzeProfile(profile, agencies, planId, userId),
      fetchWeatherData(profile.arrivalDate),
    ]);

    const recommendedAgency = analysisResult.agencies.find(a => a.isRecommended) || analysisResult.agencies[0];

    const plan: PlanResult = {
      id: planId,
      createdAt: new Date().toISOString(),
      profile: profile as TravelerProfile,
      agencies: analysisResult.agencies,
      recommendedAgency,
      itinerary: analysisResult.itinerary,
      checklist: analysisResult.checklist,
      recommendation: analysisResult.recommendation,
      weather: weatherData,
      chatHistory: [],
      score,
    };

    // 4. Persist if authenticated
    if (userId) savePlan(plan, userId).catch(e => console.error('savePlan:', e));

    return NextResponse.json({ plan, profileAnalysis: analysisResult.profileAnalysis });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed', details: String(error) }, { status: 500 });
  }
}
