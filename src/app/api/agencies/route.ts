import { NextRequest, NextResponse } from 'next/server';
import { MOCK_AGENCIES } from '@/lib/mockData';
import type { Agency } from '@/types';

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Search queries for mountaineering agencies in Ecuador
const SEARCH_QUERIES = [
  'mountaineering guide agency Quito Ecuador',
  'agencia montañismo guía ASEGUIM Ecuador',
  'climbing expedition Cotopaxi Chimborazo guide',
];

interface PlacesResult {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  website?: string;
  formatted_phone_number?: string;
  opening_hours?: { open_now?: boolean };
}

async function searchGooglePlaces(query: string): Promise<PlacesResult[]> {
  if (!GOOGLE_KEY) return [];

  try {
    // Text search for businesses
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=-0.22985,-78.5249&radius=100000&key=${GOOGLE_KEY}`;
    const res = await fetch(url, { next: { revalidate: 3600 } }); // cache 1h
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

async function getPlaceDetails(placeId: string): Promise<Partial<PlacesResult>> {
  if (!GOOGLE_KEY) return {};
  try {
    const fields = 'name,formatted_address,rating,user_ratings_total,website,formatted_phone_number';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_KEY}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return {};
    const data = await res.json();
    return data.result || {};
  } catch {
    return {};
  }
}

function placesToAgency(place: PlacesResult, index: number): Agency {
  const city = place.vicinity?.split(',').pop()?.trim() ||
    place.formatted_address?.split(',')[1]?.trim() || 'Ecuador';

  return {
    id: `google_${place.place_id}`,
    name: place.name,
    location: city,
    founded: 2010, // Not available from Places API
    rating: place.rating || 4.0,
    reviewCount: place.user_ratings_total || 0,
    pricePerPerson: 0, // Not available — will show as "Consultar"
    currency: 'USD',
    certifications: [],      // Not available from Places API
    servicesIncluded: [],    // Not available from Places API
    languages: ['Español'],  // Default
    safetyScore: Math.min(9, (place.rating || 4.0) * 1.8),
    pros: [`Encontrado en Google Places`, `${place.user_ratings_total || 0} reseñas`],
    cons: ['Precio y certificaciones deben verificarse directamente'],
    website: place.website,
    phone: place.formatted_phone_number,
    isRecommended: false,
    source: 'search',
  };
}

export async function GET(req: NextRequest) {
  const hasGoogleKey = Boolean(GOOGLE_KEY);

  // Always include curated catalog
  const curatedAgencies = MOCK_AGENCIES.map(a => ({ ...a, source: 'database' as const }));

  if (!hasGoogleKey) {
    return NextResponse.json({
      agencies: curatedAgencies,
      sources: { curated: curatedAgencies.length, google: 0, total: curatedAgencies.length },
      googleKeyConfigured: false,
    });
  }

  // Fetch from Google Places (parallel queries)
  const allResults = await Promise.all(SEARCH_QUERIES.map(q => searchGooglePlaces(q)));
  const flat = allResults.flat();

  // Deduplicate by place_id
  const seen = new Set<string>();
  const unique = flat.filter(p => {
    if (seen.has(p.place_id)) return false;
    seen.add(p.place_id);
    return true;
  });

  // Filter: only real mountaineering agencies (has ratings, not generic)
  const filtered = unique.filter(p =>
    p.rating && p.rating >= 3.5 &&
    p.user_ratings_total && p.user_ratings_total >= 5
  );

  // Get details for top results (limit API calls)
  const top = filtered.slice(0, 6);
  const detailedResults = await Promise.all(
    top.map(async (p, i) => {
      const details = await getPlaceDetails(p.place_id);
      return placesToAgency({ ...p, ...details }, i);
    })
  );

  // Deduplicate with curated: remove Google results that match curated names
  const curatedNames = new Set(curatedAgencies.map(a => a.name.toLowerCase().substring(0, 15)));
  const newGoogleAgencies = detailedResults.filter(a =>
    !curatedNames.has(a.name.toLowerCase().substring(0, 15))
  );

  const combined = [...curatedAgencies, ...newGoogleAgencies];

  return NextResponse.json({
    agencies: combined,
    sources: {
      curated: curatedAgencies.length,
      google: newGoogleAgencies.length,
      total: combined.length,
    },
    googleKeyConfigured: true,
  });
}
