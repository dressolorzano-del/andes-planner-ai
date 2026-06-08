-- ============================================================
-- ANDES PLANNER AI — Supabase Schema
-- Ejecutar en: app.supabase.com → SQL Editor → New Query
-- ============================================================

-- 1. PROFILES (extiende auth.users)
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text not null,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 2. PLANS
create table if not exists public.plans (
  id                  text primary key,                            -- plan_<timestamp>
  user_id             uuid references public.profiles(id) on delete cascade,
  title               text not null,                              -- "Cotopaxi + Chimborazo · Ago 2025"
  destination         text not null default 'Ecuador',
  mountains           text[] not null default '{}',
  duration_days       int,
  group_size          int,
  budget_per_person   int,
  profile             jsonb not null,                             -- TravelerProfile completo
  agencies            jsonb not null default '[]'::jsonb,        -- Agency[]
  recommended_agency  jsonb,                                      -- Agency | null
  itinerary           jsonb not null default '[]'::jsonb,        -- ItineraryDay[]
  checklist           jsonb not null default '[]'::jsonb,        -- ChecklistItem[]
  recommendation      jsonb not null,                            -- recommendation object
  weather             jsonb default '[]'::jsonb,                 -- WeatherData[]
  chat_history        jsonb default '[]'::jsonb,                 -- ChatMessage[]
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- 3. AI LOGS — tabla de evaluación de calidad y costo
create table if not exists public.ai_logs (
  id                  uuid default gen_random_uuid() primary key,
  plan_id             text references public.plans(id) on delete cascade,
  user_id             uuid references public.profiles(id) on delete set null,
  operation           text not null,    -- 'analyze_profile' | 'chat' | 'tool_call'
  tool_name           text,             -- 'analyzeProfile' | 'compareAgencies' | etc.
  model               text not null default 'claude-sonnet-4-20250514',
  prompt_tokens       int,
  completion_tokens   int,
  total_tokens        int,
  estimated_cost_usd  numeric(10, 6),   -- costo estimado en USD
  latency_ms          int,              -- tiempo de respuesta en ms
  input_preview       text,             -- primeros 500 chars del prompt
  output_preview      text,             -- primeros 500 chars de la respuesta
  error               text,             -- si hubo error
  created_at          timestamptz default now()
);

-- 4. ROW LEVEL SECURITY
alter table public.profiles  enable row level security;
alter table public.plans     enable row level security;
alter table public.ai_logs   enable row level security;

-- Profiles: cada usuario ve y edita solo el suyo
create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Plans: cada usuario ve y gestiona solo los suyos
create policy "plans_own" on public.plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- AI Logs: lectura solo del propio usuario
create policy "ai_logs_own_read" on public.ai_logs
  for select using (auth.uid() = user_id);

-- AI Logs: inserción permitida (desde server con service_role key)
create policy "ai_logs_insert" on public.ai_logs
  for insert with check (true);

-- 5. TRIGGER: crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. FUNCIÓN: updated_at automático
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger plans_updated_at    before update on public.plans    for each row execute procedure public.handle_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.handle_updated_at();

-- 7. ÍNDICES
create index if not exists idx_plans_user_id    on public.plans(user_id);
create index if not exists idx_plans_created    on public.plans(created_at desc);
create index if not exists idx_logs_plan_id     on public.ai_logs(plan_id);
create index if not exists idx_logs_created     on public.ai_logs(created_at desc);
create index if not exists idx_logs_operation   on public.ai_logs(operation);

-- 8. VISTA: resumen de costos por plan (útil para el dashboard de evaluación)
create or replace view public.plan_cost_summary as
select
  l.plan_id,
  count(*)                       as total_calls,
  sum(l.total_tokens)            as total_tokens,
  sum(l.estimated_cost_usd)      as total_cost_usd,
  avg(l.latency_ms)              as avg_latency_ms,
  min(l.created_at)              as first_call,
  max(l.created_at)              as last_call
from public.ai_logs l
group by l.plan_id;
