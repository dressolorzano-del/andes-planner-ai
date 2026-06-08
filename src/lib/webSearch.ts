import type { WebSearchResult } from '@/types';

const TAVILY_KEY = process.env.TAVILY_API_KEY;
const SERPER_KEY = process.env.SERPER_API_KEY;

// ── Tavily ────────────────────────────────────────────────────────────────────
async function searchTavily(query: string): Promise<WebSearchResult[]> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TAVILY_KEY,
      query,
      search_depth: 'basic',
      max_results: 8,
      include_answer: false,
    }),
  });
  if (!res.ok) throw new Error(`Tavily ${res.status}`);
  const data = await res.json();
  return (data.results || []).map((r: any) => ({
    title: r.title || '',
    url: r.url || '',
    snippet: r.content || r.snippet || '',
    source: new URL(r.url).hostname,
  }));
}

// ── Serper ────────────────────────────────────────────────────────────────────
async function searchSerper(query: string): Promise<WebSearchResult[]> {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': SERPER_KEY! },
    body: JSON.stringify({ q: query, num: 8, gl: 'ec', hl: 'es' }),
  });
  if (!res.ok) throw new Error(`Serper ${res.status}`);
  const data = await res.json();
  return (data.organic || []).map((r: any) => ({
    title: r.title || '',
    url: r.link || '',
    snippet: r.snippet || '',
    source: r.displayLink || new URL(r.link).hostname,
  }));
}

// ── Public search function ────────────────────────────────────────────────────
export interface AgencySearchResult {
  results: WebSearchResult[];
  source: 'tavily' | 'serper' | 'fallback';
  query: string;
}

const SEARCH_QUERIES = [
  'agencia montañismo certificada ASEGUIM Cotopaxi Chimborazo Ecuador 2024',
  'mountaineering guide agency Ecuador Cotopaxi certified UIAGM review',
  'guía montaña Ecuador expedición Chimborazo precio servicio incluido',
];

export async function searchMountaineeringAgencies(): Promise<AgencySearchResult[]> {
  if (!TAVILY_KEY && !SERPER_KEY) {
    return [{ results: [], source: 'fallback', query: '' }];
  }

  const results: AgencySearchResult[] = [];

  for (const query of SEARCH_QUERIES) {
    try {
      if (TAVILY_KEY) {
        const r = await searchTavily(query);
        results.push({ results: r, source: 'tavily', query });
      } else if (SERPER_KEY) {
        const r = await searchSerper(query);
        results.push({ results: r, source: 'serper', query });
      }
    } catch (err) {
      console.warn(`Search failed for "${query}":`, err);
      // Try alternate provider
      try {
        if (TAVILY_KEY && SERPER_KEY) {
          const r = await searchSerper(query);
          results.push({ results: r, source: 'serper', query });
        }
      } catch { /* ignore */ }
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }

  return results.length > 0 ? results : [{ results: [], source: 'fallback', query: '' }];
}

export function deduplicateResults(allResults: AgencySearchResult[]): WebSearchResult[] {
  const seen = new Set<string>();
  const unique: WebSearchResult[] = [];
  for (const batch of allResults) {
    for (const r of batch.results) {
      const key = r.url.replace(/https?:\/\//, '').replace(/\/$/, '');
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(r);
      }
    }
  }
  return unique;
}
