import { NextRequest, NextResponse } from 'next/server';
import { fetchWeatherData } from '@/lib/weather';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || undefined;
  const data = await fetchWeatherData(date);
  return NextResponse.json({ weather: data });
}
