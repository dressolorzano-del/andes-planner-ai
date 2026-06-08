import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Andes Planner AI — Expediciones Inteligentes',
  description: 'Planifica tu expedición de montañismo en los Andes con inteligencia artificial',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* Leaflet CSS loaded from CDN — avoids webpack SSR conflicts */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="bg-stone-50 min-h-screen">{children}</body>
    </html>
  );
}
