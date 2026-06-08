import type { WeatherData } from '@/types';
import { MOCK_WEATHER } from './mockData';

// Coordinates for key locations
const LOCATIONS = {
  quito: { lat: -0.1807, lon: -78.4678, altitude: 2850, name: 'Quito' },
  cotopaxi: { lat: -0.6851, lon: -78.4365, altitude: 5897, name: 'Cotopaxi Cumbre' },
  chimborazo: { lat: -1.4669, lon: -78.8172, altitude: 6268, name: 'Chimborazo Cumbre' },
  latacunga: { lat: -0.9331, lon: -78.6167, altitude: 2758, name: 'Latacunga' },
  riobamba: { lat: -1.6636, lon: -78.6543, altitude: 2754, name: 'Riobamba' },
};

const WMO_CODES: Record<number, string> = {
  0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado',
  3: 'Nublado', 45: 'Niebla', 48: 'Niebla con escarcha',
  51: 'Llovizna ligera', 61: 'Lluvia ligera', 63: 'Lluvia moderada',
  71: 'Nevada ligera', 73: 'Nevada moderada', 75: 'Nevada intensa',
  80: 'Chubascos', 85: 'Neviscas', 95: 'Tormenta eléctrica',
};

export async function fetchWeatherData(startDate?: string): Promise<WeatherData[]> {
  // Open-Meteo is free, no API key needed
  const baseDate = startDate ? new Date(startDate) : new Date();
  const endDate = new Date(baseDate);
  endDate.setDate(endDate.getDate() + 14);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  try {
    const results: WeatherData[] = [];

    for (const [key, loc] of Object.entries(LOCATIONS)) {
      if (key === 'latacunga' || key === 'riobamba') continue; // Only fetch key locations

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,snowfall_sum,weathercode&forecast_days=14&timezone=America/Guayaquil`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
      
      const data = await response.json();
      
      // Get average conditions for the period
      const daily = data.daily;
      const avgMax = daily.temperature_2m_max.reduce((a: number, b: number) => a + b, 0) / daily.temperature_2m_max.length;
      const avgMin = daily.temperature_2m_min.reduce((a: number, b: number) => a + b, 0) / daily.temperature_2m_min.length;
      const avgPrecip = daily.precipitation_sum.reduce((a: number, b: number) => a + b, 0) / daily.precipitation_sum.length;
      const avgWind = daily.windspeed_10m_max.reduce((a: number, b: number) => a + b, 0) / daily.windspeed_10m_max.length;
      const avgSnow = daily.snowfall_sum.reduce((a: number, b: number) => a + b, 0) / daily.snowfall_sum.length;
      const mostCommonCode = daily.weathercode.sort((a: number, b: number) =>
        daily.weathercode.filter((v: number) => v === a).length - daily.weathercode.filter((v: number) => v === b).length
      ).pop();

      // Adjust for altitude (temperature decreases ~6.5°C per 1000m)
      const altitudeDiff = (loc.altitude - 2850) / 1000;
      const tempAdjust = altitudeDiff * 6.5;

      results.push({
        location: loc.name,
        altitude: loc.altitude,
        date: `${formatDate(baseDate)} al ${formatDate(endDate)}`,
        tempMax: Math.round((avgMax - tempAdjust) * 10) / 10,
        tempMin: Math.round((avgMin - tempAdjust * 1.2) * 10) / 10,
        precipitation: Math.round(avgPrecip * 10) / 10,
        windSpeed: Math.round(avgWind + altitudeDiff * 10),
        snowfall: Math.round(avgSnow * 10) / 10,
        weatherCode: mostCommonCode || 1,
        description: WMO_CODES[mostCommonCode] || 'Condiciones variables',
      });
    }

    return results.length > 0 ? results : MOCK_WEATHER;
  } catch (error) {
    console.warn('Open-Meteo fetch failed, using mock data:', error);
    return MOCK_WEATHER;
  }
}

export function getWeatherAdvice(weather: WeatherData[]): string[] {
  const advice: string[] = [];
  
  const summit = weather.find(w => w.altitude > 5000);
  if (summit) {
    if (summit.windSpeed > 60) advice.push('⚠️ Vientos extremos esperados en cumbre — consultar ventana de cumbre con guía');
    if (summit.precipitation > 20) advice.push('⚠️ Alta precipitación prevista — riesgo de condiciones en glaciar');
    if (summit.tempMin < -20) advice.push('⚠️ Temperatura extrema en cumbre (-20°C o menos) — capas adicionales obligatorias');
    if (summit.windSpeed < 40 && summit.precipitation < 10) advice.push('✅ Condiciones generalmente favorables para el período seleccionado');
  }
  
  return advice;
}
