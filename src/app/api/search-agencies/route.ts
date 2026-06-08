import { NextRequest, NextResponse } from 'next/server';
import { MOCK_AGENCIES } from '@/lib/mockData';
import { searchMountaineeringAgencies, deduplicateResults } from '@/lib/webSearch';
import type { Agency } from '@/types';

// Simple in-memory cache (resets on cold start)
let cache: { agencies: Agency[]; at: number } | null = null;
const CACHE_TTL = 1000 * 60 * 30; // 30 min

export async function GET(req: NextRequest) {
  const hasTavily = Boolean(process.env.TAVILY_API_KEY);
  const hasSerper = Boolean(process.env.SERPER_API_KEY);
  const hasWebSearch = hasTavily || hasSerper;

  // Cache hit
  if (cache && Date.now() - cache.at < CACHE_TTL) {
    return NextResponse.json({ agencies: cache.agencies, cached: true, webSearchEnabled: hasWebSearch });
  }

  const curated = MOCK_AGENCIES.map(a => ({ ...a, source: 'database' as const }));

  if (!hasWebSearch) {
    return NextResponse.json({
      agencies: curated,
      sources: { curated: curated.length, web: 0 },
      webSearchEnabled: false,
    });
  }

  try {
    // Parallel: web search + return curated immediately merged
    const searchResults = await searchMountaineeringAgencies();
    const flat = deduplicateResults(searchResults);

    // Use Claude to parse search results into structured agencies
    // Only if we got actual results
    let webAgencies: Agency[] = [];

    if (flat.length > 0) {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

      const prompt = `Analiza estos resultados de búsqueda web sobre agencias de montañismo en Ecuador.
Extrae las agencias REALES que encuentres (ignora blogs, artículos, directorios genéricos).

RESULTADOS DE BÚSQUEDA:
${flat.slice(0, 12).map((r, i) => `[${i+1}] ${r.title}\nURL: ${r.url}\n${r.snippet}`).join('\n\n')}

Responde SOLO con JSON válido, sin markdown:
{
  "agencies": [
    {
      "id": "web_slug_nombre",
      "name": "Nombre de la agencia",
      "location": "Ciudad, Ecuador",
      "website": "https://...",
      "certifications": ["ASEGUIM", "UIAGM"],
      "languages": ["Español", "Inglés"],
      "servicesIncluded": ["Guía certificado", "..."],
      "rating": 4.5,
      "reviewCount": 0,
      "pricePerPerson": 0,
      "pros": ["Pro específico extraído del texto"],
      "cons": ["Con específico si aplica"],
      "notes": "Extracto relevante sobre la agencia"
    }
  ]
}

Reglas:
- Solo incluye agencias reales con nombre identificable
- Máximo 4 agencias
- Si no hay agencias reales claras, devuelve {"agencies": []}
- pricePerPerson: 0 si no está en el texto`;

      try {
        const response = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);

        webAgencies = (parsed.agencies || []).map((a: any): Agency => ({
          id: a.id || `web_${Date.now()}`,
          name: a.name || 'Agencia sin nombre',
          location: a.location || 'Ecuador',
          founded: 2010,
          rating: a.rating || 4.0,
          reviewCount: a.reviewCount || 0,
          pricePerPerson: a.pricePerPerson || 0,
          currency: 'USD',
          certifications: a.certifications || [],
          servicesIncluded: a.servicesIncluded || [],
          languages: a.languages || ['Español'],
          safetyScore: 7.5,
          pros: a.pros || ['Encontrada via búsqueda web'],
          cons: a.cons || ['Precio y detalles deben verificarse'],
          website: a.website,
          source: 'web',
          isRecommended: false,
        }));
      } catch (parseErr) {
        console.warn('Claude parsing failed:', parseErr);
      }
    }

    // Merge: curated first, then non-duplicate web agencies
    const curatedNames = new Set(curated.map(a => a.name.toLowerCase().substring(0, 12)));
    const newWeb = webAgencies.filter(a => !curatedNames.has(a.name.toLowerCase().substring(0, 12)));
    const combined = [...curated, ...newWeb];

    cache = { agencies: combined, at: Date.now() };

    return NextResponse.json({
      agencies: combined,
      sources: { curated: curated.length, web: newWeb.length, total: combined.length },
      webSearchEnabled: true,
    });
  } catch (error) {
    console.error('search-agencies error:', error);
    return NextResponse.json({ agencies: curated, error: String(error), webSearchEnabled: false });
  }
}
