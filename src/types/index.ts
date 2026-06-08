export interface TravelerProfile {
  destination: string;
  arrivalDate: string;
  duration: number;
  groupSize: number;
  budget: number;
  currency: string;
  targetMountains: string[];
  mountainExperience: 'none' | 'hiking' | 'high_altitude' | 'expedition';
  maxAltitudeReached: number;
  fitnessLevel: 'regular' | 'good' | 'very_good' | 'athlete';
  guideRequired: boolean;
  preferredLanguage: string[];
  accommodationPrefs: string[];
  transportIncluded: boolean;
  gearIncluded: boolean;
  rescueInsurance: boolean;
  riskTolerance: 'conservative' | 'moderate' | 'high';
  medicalConditions: string;
  previousExperiences: string;
}

export interface Agency {
  id: string;
  name: string;
  location: string;
  founded: number;
  rating: number;
  reviewCount: number;
  pricePerPerson: number;
  currency: string;
  certifications: string[];
  servicesIncluded: string[];
  languages: string[];
  safetyScore: number;
  adequacyScore?: number;
  pros: string[];
  cons: string[];
  website?: string;
  phone?: string;
  isRecommended?: boolean;
  source: 'database' | 'search' | 'mock' | 'web';
}

export interface ItineraryDay {
  day: number | string;
  date?: string;
  location: string;
  altitude: number;
  activities: string[];
  accommodation: string;
  notes: string;
  isRestDay: boolean;
  isSummitDay: boolean;
  alerts?: string[];
  coords?: [number, number];
}

export interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  priority: 'essential' | 'recommended' | 'optional';
  coveredByAgency?: boolean;
  checked: boolean;
  notes?: string;
}

export interface WeatherData {
  location: string;
  altitude: number;
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  windSpeed: number;
  snowfall: number;
  weatherCode: number;
  description: string;
}

export interface GeoPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  altitude: number;
  type: 'summit' | 'refuge' | 'acclimatization' | 'city' | 'trailhead';
  description?: string;
  routeDay?: number | string;
}

export interface ExpeditionScore {
  overall: number;
  physicalRisk: number;
  acclimatizationRisk: number;
  budgetCompatibility: number;
  experienceCompatibility: number;
  climaticRisk: number;
  successProbability: number;
  preparationLevel: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  insights: Record<string, string>;
  claudeExplanation?: string;
}

export interface AiLog {
  id: string;
  plan_id?: string;
  user_id?: string;
  operation: string;
  tool_name?: string;
  model: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  estimated_cost_usd?: number;
  latency_ms?: number;
  input_preview?: string;
  output_preview?: string;
  error?: string;
  fallback_used?: boolean;
  api_calls_made?: string[];
  created_at: string;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface PlanResult {
  id: string;
  createdAt: string;
  profile: TravelerProfile;
  agencies: Agency[];
  recommendedAgency: Agency | null;
  itinerary: ItineraryDay[];
  checklist: ChecklistItem[];
  recommendation: {
    summary: string;
    totalBudget: number;
    pros: string[];
    cons: string[];
    safetyAlerts: string[];
    nextSteps: string[];
    claudeRationale: string;
  };
  weather: WeatherData[];
  chatHistory: ChatMessage[];
  score?: ExpeditionScore;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AppUser {
  id: string;
  email: string;
}

export interface SavedPlanSummary {
  id: string;
  title: string;
  destination: string;
  mountains: string[];
  durationDays: number;
  groupSize: number;
  budgetPerPerson: number;
  recommendedAgencyName: string | null;
  totalBudget: number | null;
  createdAt: string;
}

export type AppStep = 'landing' | 'dashboard' | 'profile-1' | 'profile-2' | 'analyzing' | 'results' | 'chat';
