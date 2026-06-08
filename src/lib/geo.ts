import type { GeoPoint } from '@/types';

export const ECUADOR_POINTS: GeoPoint[] = [
  { id: 'quito',       name: 'Quito',                    lat: -0.1807,  lng: -78.4678, altitude: 2850, type: 'city',             description: 'Capital — base de operaciones', routeDay: '1–2' },
  { id: 'pasochoa',    name: 'Pasochoa (4,200m)',        lat: -0.4917,  lng: -78.4583, altitude: 4200, type: 'acclimatization',  description: 'Primera aclimatación', routeDay: 3 },
  { id: 'illiniza-n',  name: 'Illiniza Norte (5,126m)',  lat: -0.9644,  lng: -78.7147, altitude: 5126, type: 'summit',           description: 'Cumbre de aclimatación — sin glaciar', routeDay: '4–5' },
  { id: 'ref-nhor',    name: 'Refugio Nuevos Horizontes',lat: -0.9589,  lng: -78.7133, altitude: 4800, type: 'refuge',           description: 'Noche pre-cumbre Illiniza', routeDay: 4 },
  { id: 'quilotoa',    name: 'Laguna Quilotoa (3,914m)', lat: -0.8589,  lng: -78.9001, altitude: 3914, type: 'acclimatization',  description: 'Descanso activo', routeDay: '6–7' },
  { id: 'latacunga',   name: 'Latacunga (2,758m)',       lat: -0.9331,  lng: -78.6167, altitude: 2758, type: 'city',             description: 'Base logística Cotopaxi' },
  { id: 'cotopaxi-base', name: 'Parque Nacional Cotopaxi', lat: -0.6700, lng: -78.4350, altitude: 3800, type: 'trailhead',      description: 'Entrada al parque nacional', routeDay: 8 },
  { id: 'ref-ribas',   name: 'Refugio José Ribas (4,800m)', lat: -0.6833, lng: -78.4367, altitude: 4800, type: 'refuge',         description: 'Base para cumbre Cotopaxi', routeDay: 8 },
  { id: 'cotopaxi',    name: 'Cotopaxi (5,897m)',        lat: -0.6851,  lng: -78.4365, altitude: 5897, type: 'summit',           description: '⛰ CUMBRE — salida 00:00h', routeDay: 9 },
  { id: 'riobamba',    name: 'Riobamba (2,754m)',        lat: -1.6636,  lng: -78.6543, altitude: 2754, type: 'city',             description: 'Recuperación post-Cotopaxi', routeDay: '10–11' },
  { id: 'ref-carrel',  name: 'Refugio Carrel (4,800m)', lat: -1.4696,  lng: -78.8182, altitude: 4800, type: 'refuge',           description: 'Primer refugio Chimborazo' },
  { id: 'ref-whymper', name: 'Refugio Whymper (5,000m)', lat: -1.4686, lng: -78.8175, altitude: 5000, type: 'refuge',           description: 'Base para cumbre Chimborazo', routeDay: 12 },
  { id: 'chimborazo',  name: 'Chimborazo (6,268m)',     lat: -1.4669,  lng: -78.8172, altitude: 6268, type: 'summit',           description: '⛰ CUMBRE — punto más lejano del centro de la Tierra', routeDay: 13 },
];

export const ROUTE_SEGMENTS: Array<{ from: string; to: string; color: string; dashed?: boolean }> = [
  { from: 'quito',        to: 'pasochoa',     color: '#3B6D11' },
  { from: 'pasochoa',     to: 'illiniza-n',   color: '#3B6D11' },
  { from: 'illiniza-n',   to: 'quilotoa',     color: '#639922', dashed: true },
  { from: 'quilotoa',     to: 'latacunga',    color: '#639922' },
  { from: 'latacunga',    to: 'ref-ribas',    color: '#BA7517' },
  { from: 'ref-ribas',    to: 'cotopaxi',     color: '#A32D2D' },
  { from: 'cotopaxi',     to: 'riobamba',     color: '#639922', dashed: true },
  { from: 'riobamba',     to: 'ref-whymper',  color: '#BA7517' },
  { from: 'ref-whymper',  to: 'chimborazo',   color: '#A32D2D' },
];

export const MAP_CENTER: [number, number] = [-1.0, -78.6];
export const MAP_ZOOM = 8;

export function getPointsByDay(days: string[] | number[]): GeoPoint[] {
  return ECUADOR_POINTS.filter(p => p.routeDay !== undefined);
}

export function getPointColor(type: GeoPoint['type']): string {
  switch (type) {
    case 'summit':          return '#A32D2D';
    case 'refuge':          return '#BA7517';
    case 'acclimatization': return '#0F6E56';
    case 'city':            return '#3B6D11';
    case 'trailhead':       return '#639922';
    default:                return '#888780';
  }
}

export function getTypeLabel(type: GeoPoint['type']): string {
  switch (type) {
    case 'summit':          return 'Cumbre';
    case 'refuge':          return 'Refugio';
    case 'acclimatization': return 'Aclimatación';
    case 'city':            return 'Ciudad';
    case 'trailhead':       return 'Trailhead';
    default:                return type;
  }
}
