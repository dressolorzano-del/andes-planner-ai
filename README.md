# 🏔️ Andes Planner AI

**Plataforma inteligente de planificación de expediciones de montañismo**  
*Prueba interna de capacidades Claude — Anthropic*

---

## ¿Qué es esto?

Andes Planner AI es un MVP funcional que demuestra el uso de Claude como motor inteligente en una plataforma compleja. El caso de uso es la planificación de expediciones de montañismo en Ecuador (Cotopaxi + Chimborazo).

**No es una demo visual.** Es una aplicación real con:
- Agente Claude analizando perfiles y generando recomendaciones
- Datos climáticos en vivo desde Open-Meteo (sin API key)
- Chat con streaming en tiempo real con Claude
- Exportación de planes a PDF
- Estado persistente en localStorage

---

## Stack tecnológico

| Capa | Tecnología | Propósito |
|---|---|---|
| Frontend | Next.js 14 + TypeScript | SSR, routing, componentes de servidor |
| Estilos | Tailwind CSS | Utilidades CSS |
| Estado | Zustand (con persist) | Estado global + localStorage |
| IA Core | Claude claude-sonnet-4-20250514 (Anthropic SDK) | Análisis, recomendaciones, chat |
| Clima | Open-Meteo API | Datos meteorológicos gratuitos, sin key |
| PDF | jsPDF + jspdf-autotable | Exportación del plan completo |
| Deploy | Vercel (recomendado) | Zero-config para Next.js |

---

## Arquitectura

```
Browser → Next.js (App Router)
            ├── /              → LandingView
            ├── ProfileForm    → Multi-step form (2 pasos)
            ├── AnalyzingView  → Pantalla de carga con progreso
            └── ResultsView    → 5 tabs + ChatPanel

API Routes (Edge/Node)
├── POST /api/analyze     → Claude analyzeProfile() + Open-Meteo
├── POST /api/chat        → Claude streaming chat
└── GET  /api/weather     → Open-Meteo forecast

Lib
├── agent.ts      → Claude SDK wrapper, prompts, analyzeProfile(), chatWithAgent()
├── weather.ts    → Open-Meteo integration con fallback a mock data
├── mockData.ts   → Catálogo de agencias, itinerario base, checklist base
└── pdfExport.ts  → jsPDF generation

Store (Zustand)
└── index.ts      → step, profile, result, chatMessages, analyzeProgress
```

---

## Estructura de carpetas

```
andes-planner/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout + metadata
│   │   ├── page.tsx            # Router de vistas (step-based)
│   │   ├── globals.css         # Fonts, variables CSS, animaciones
│   │   └── api/
│   │       ├── analyze/route.ts   # POST → análisis de perfil con Claude
│   │       ├── chat/route.ts      # POST → chat streaming con Claude
│   │       └── weather/route.ts   # GET → datos de Open-Meteo
│   ├── components/
│   │   ├── LandingView.tsx     # Hero page de entrada
│   │   ├── ProfileForm.tsx     # Formulario multi-step (2 pasos)
│   │   ├── AnalyzingView.tsx   # Pantalla de análisis con progreso
│   │   ├── ResultsView.tsx     # Contenedor de tabs + header
│   │   ├── ChatPanel.tsx       # Panel de chat con streaming
│   │   └── tabs/
│   │       ├── RecommendationTab.tsx
│   │       ├── AgenciesTab.tsx
│   │       ├── ItineraryTab.tsx
│   │       ├── ChecklistTab.tsx
│   │       └── WeatherTab.tsx
│   ├── lib/
│   │   ├── agent.ts            # Claude SDK + prompts del agente
│   │   ├── weather.ts          # Open-Meteo + fallback
│   │   ├── mockData.ts         # Datos curados: agencias, itinerario, checklist
│   │   └── pdfExport.ts        # Generación de PDF con jsPDF
│   ├── store/
│   │   └── index.ts            # Zustand store con persistencia
│   └── types/
│       └── index.ts            # Todos los tipos TypeScript
├── .env.example                # Template de variables de entorno
├── .env.local                  # TU archivo local (no comittear)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Setup en 5 minutos

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local y agregar tu ANTHROPIC_API_KEY

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Abrir en el navegador
open http://localhost:3000
```

**Solo necesitas `ANTHROPIC_API_KEY`** para el flujo completo. Open-Meteo es gratuito y público.

---

## Variables de entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Sí | API key de Anthropic (console.anthropic.com) |
| `GOOGLE_PLACES_API_KEY` | ⬜ No | Para búsqueda real de agencias (futuro) |
| `NEXT_PUBLIC_SUPABASE_URL` | ⬜ No | Para persistencia en base de datos (futuro) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ⬜ No | Para persistencia en base de datos (futuro) |

---

## Cómo funciona el agente

### 1. Análisis de perfil (`POST /api/analyze`)
```
Perfil del usuario → Claude (claude-sonnet-4-20250514)
                         ↓
Claude evalúa: presupuesto, experiencia, riesgo, requerimientos
                         ↓
Claude puntúa cada agencia (0–10 por adecuación al perfil)
                         ↓
Claude genera: recomendación + pros/cons + alertas de seguridad
                         ↓
Open-Meteo: datos climáticos de Quito + Cotopaxi + Chimborazo
                         ↓
PlanResult completo → Estado de la app (Zustand + localStorage)
```

### 2. Chat con streaming (`POST /api/chat`)
```
Mensaje del usuario → Claude (stream mode)
                           ↓
Claude tiene contexto: perfil + plan generado + historial
                           ↓
Respuesta en streaming → ReadableStream → TextDecoder en UI
                           ↓
Texto aparece token a token en el chat panel
```

### 3. Fallback automático
Si Claude API falla o no hay key → datos mock del catálogo curado

---

## Partes reales vs. mockeadas

| Componente | Estado | Descripción |
|---|---|---|
| Claude API (análisis) | ✅ Real | Usa claude-sonnet-4-20250514 real |
| Claude API (chat) | ✅ Real | Streaming en tiempo real |
| Open-Meteo (clima) | ✅ Real | API pública, sin key necesaria |
| Catálogo de agencias | 📋 Curado | 3 agencias reales + datos verificados |
| Itinerario base | 📋 Curado | 10 etapas validadas por protocolos de altitud |
| Checklist base | 📋 Curado | 26 ítems basados en estándares ASEGUIM |
| Google Places | ⬜ Futuro | Necesita API key de Google |
| Supabase (DB) | ⬜ Futuro | Necesita proyecto de Supabase |
| Autenticación | ⬜ Futuro | Login/registro de usuarios |

---

## Roadmap de implementación

### Fase 1 — MVP funcional (actual) ✅
- [x] Formulario de perfil multi-paso
- [x] Análisis con Claude API
- [x] Datos climáticos en vivo (Open-Meteo)
- [x] Comparativa de agencias con scoring Claude
- [x] Itinerario de aclimatación
- [x] Checklist interactiva
- [x] Chat con agente (streaming)
- [x] Exportación a PDF
- [x] Persistencia en localStorage

### Fase 2 — Datos reales (2–3 semanas)
- [ ] Google Places API para búsqueda real de agencias
- [ ] Supabase para persistencia de planes en DB
- [ ] Autenticación con Supabase Auth
- [ ] Dashboard de historial de planes
- [ ] Evaluación de calidad: tabla AI Logs (prompt, tokens, latencia, costo)

### Fase 3 — Expansión (1–2 meses)
- [ ] Nuevos destinos: Perú (Ausangate, Huascarán), Bolivia (Huayna Potosí)
- [ ] Claude con herramienta de búsqueda web nativa
- [ ] Notificaciones de condiciones climáticas
- [ ] Compartir planes con otros usuarios
- [ ] App móvil (React Native)

---

## Costo estimado de Claude API

Por planificación completa (análisis + hasta 10 mensajes de chat):

| Componente | Tokens aprox. | Costo approx. |
|---|---|---|
| Análisis de perfil | ~2,500 tokens | ~$0.015 |
| Chat (10 mensajes) | ~5,000 tokens | ~$0.030 |
| **Total por sesión** | ~7,500 tokens | **~$0.045** |

Para 500 planificaciones internas: ~$22.50 USD

---

## Despliegue en Vercel

```bash
# Instalar CLI de Vercel
npm i -g vercel

# Desplegar
vercel

# Configurar variables de entorno en el dashboard de Vercel:
# Settings → Environment Variables → ANTHROPIC_API_KEY
```

---

## Propósito de esta prueba interna

Este MVP demuestra que el patrón:

```
Formulario de perfil → Análisis Claude → Comparación de opciones 
→ Plan estructurado → Checklist → Recomendación → Chat de soporte
```

Es directamente replicable en:
- Selección de proveedores B2B
- Onboarding de clientes (SaaS)
- Planificación de eventos corporativos
- Comparación de servicios financieros
- Cualquier vertical donde "un experto analiza tu situación y te da opciones"

---

*Andes Planner AI · Prueba interna · Confidencial*
