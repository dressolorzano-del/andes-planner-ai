# Deploy en 15 minutos — Guía paso a paso

## Lo que necesitas
- Cuenta GitHub (gratis) → github.com
- Cuenta Vercel (gratis) → vercel.com
- Tu ANTHROPIC_API_KEY → console.anthropic.com

---

## PASO 1 — Crear cuenta GitHub
1. Ve a https://github.com/signup
2. Email + contraseña + username
3. Elige plan Free
4. Verifica tu email

## PASO 2 — Subir el código a GitHub
1. En GitHub: clic en "+" arriba a la derecha → "New repository"
2. Nombre: `andes-planner-ai`
3. Privado ✓ → clic "Create repository"
4. En tu computadora, abre la terminal donde descomprimiste el .tar.gz:
```bash
cd andes-planner
git init
git add .
git commit -m "Andes Planner AI v3"
git remote add origin https://github.com/TU_USUARIO/andes-planner-ai.git
git push -u origin main
```

## PASO 3 — Crear cuenta Vercel
1. Ve a https://vercel.com
2. Clic "Sign Up" → "Continue with GitHub" (conecta la misma cuenta)
3. Autoriza Vercel en GitHub

## PASO 4 — Deploy
1. En Vercel: clic "Add New Project"
2. Selecciona el repo `andes-planner-ai`
3. Framework: Next.js (lo detecta automático)
4. En "Environment Variables" agrega:
   - Name: `ANTHROPIC_API_KEY`
   - Value: tu sk-ant-...
5. Clic "Deploy"
6. Espera ~2 minutos → ¡URL lista!

## PASO 5 — Ver la app
Vercel te da una URL tipo:
`https://andes-planner-ai-xxxx.vercel.app`

Esa URL la puedes compartir con quien quieras.

---

## Funciones disponibles sin config extra
✅ Formulario de perfil completo
✅ Análisis con Claude (agente con 6 herramientas)
✅ Comparación de agencias
✅ Itinerario de aclimatación (14 días)
✅ Checklist interactiva
✅ Mapa interactivo (OpenStreetMap)
✅ Datos climáticos en tiempo real (Open-Meteo)
✅ Score de expedición (7 dimensiones)
✅ Chat con Claude en tiempo real
✅ Exportar plan a PDF
✅ Dashboard /admin/ai-logs

## Funciones que necesitan config adicional
⬜ Login y planes guardados → agregar SUPABASE_URL + SUPABASE_ANON_KEY
⬜ Búsqueda web de agencias → agregar TAVILY_API_KEY
⬜ Buscar agencias en Google Maps → agregar GOOGLE_PLACES_API_KEY
