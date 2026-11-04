-- Repaso · esquema inicial
-- Ejecuta este archivo completo en Supabase → SQL Editor (o con `supabase db push`).
-- Cada usuario solo ve lo suyo (Row Level Security). Los administradores ven todo.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- Perfiles
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  university text not null default '',
  career text not null default '',
  semester text not null default '',
  phone text not null default '',
  role text not null default 'student' check (role in ('student', 'admin')),
  plan text not null default 'gratis' check (plan in ('gratis', 'repaso', 'repaso_plus')),
  plan_expires_at timestamptz,
  terms_version text,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- ¿El usuario actual es administrador? (security definer evita recursión en las políticas)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Crea el perfil al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, university, career, terms_version, terms_accepted_at)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'university', ''),
    coalesce(new.raw_user_meta_data ->> 'career', ''),
    new.raw_user_meta_data ->> 'terms_version',
    case when new.raw_user_meta_data ->> 'terms_version' is not null then now() end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Un estudiante no puede cambiarse el rol ni el plan a sí mismo
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and auth.uid() is not null then
    new.role := old.role;
    new.plan := old.plan;
    new.plan_expires_at := old.plan_expires_at;
    new.email := old.email;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_fields on public.profiles;
create trigger protect_profile_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

alter table public.profiles enable row level security;
create policy "perfil: leer el propio o admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "perfil: editar el propio o admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- Materias
-- ─────────────────────────────────────────────────────────────
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  exam_date date,
  created_at timestamptz not null default now()
);
create index if not exists subjects_user_idx on public.subjects (user_id);

alter table public.subjects enable row level security;
create policy "materias: dueño o admin" on public.subjects
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- Materiales (lo que sube el estudiante) y su kit de estudio
-- ─────────────────────────────────────────────────────────────
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  title text not null check (char_length(title) between 1 and 140),
  kind text not null check (kind in ('pdf', 'slides', 'doc', 'image', 'audio', 'video', 'text')),
  storage_path text,
  files jsonb not null default '[]'::jsonb,
  mime_type text,
  size_bytes bigint,
  source_text text,
  duration_seconds integer,
  status text not null default 'pending' check (status in ('pending', 'processing', 'ready', 'error')),
  error text,
  kit jsonb,
  progress jsonb not null default '{}'::jsonb,
  ai_model text,
  tokens_in integer,
  tokens_out integer,
  created_at timestamptz not null default now(),
  processing_started_at timestamptz,
  processed_at timestamptz
);
create index if not exists materials_user_idx on public.materials (user_id, created_at desc);
create index if not exists materials_subject_idx on public.materials (subject_id);

alter table public.materials enable row level security;
create policy "materiales: dueño o admin" on public.materials
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- Tutor (conversación por material)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.tutor_messages (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists tutor_material_idx on public.tutor_messages (material_id, created_at);

alter table public.tutor_messages enable row level security;
create policy "tutor: dueño o admin" on public.tutor_messages
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- Envíos al equipo ("no entendí esta clase")
-- ─────────────────────────────────────────────────────────────
create table if not exists public.help_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null check (char_length(subject) between 1 and 120),
  topic text not null check (char_length(topic) between 1 and 200),
  details text not null default '',
  links text[] not null default '{}',
  files jsonb not null default '[]'::jsonb,
  exam_date date,
  status text not null default 'recibido' check (status in ('recibido', 'en_revision', 'respondido', 'cerrado')),
  admin_response text,
  response_files jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  responded_at timestamptz
);
create index if not exists help_requests_user_idx on public.help_requests (user_id, created_at desc);
create index if not exists help_requests_status_idx on public.help_requests (status, created_at);

alter table public.help_requests enable row level security;
create policy "envíos: leer propio o admin" on public.help_requests
  for select using (user_id = auth.uid() or public.is_admin());
create policy "envíos: crear propio" on public.help_requests
  for insert with check (user_id = auth.uid());
create policy "envíos: solo admin edita" on public.help_requests
  for update using (public.is_admin());
create policy "envíos: borrar propio o admin" on public.help_requests
  for delete using (user_id = auth.uid() or public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- Pagos (Pago Móvil, Binance, Zelle, efectivo) verificados a mano
-- ─────────────────────────────────────────────────────────────
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan text not null check (plan in ('repaso', 'repaso_plus')),
  months integer not null default 1 check (months between 1 and 12),
  amount_usd numeric(10, 2) not null,
  amount_bs numeric(14, 2),
  rate_bs numeric(14, 4),
  method text not null check (method in ('pago_movil', 'binance', 'zelle', 'efectivo')),
  reference text not null check (char_length(reference) between 3 and 80),
  payer_name text not null default '',
  payer_id_doc text not null default '',
  payer_phone text not null default '',
  receipt_path text,
  status text not null default 'pendiente' check (status in ('pendiente', 'aprobado', 'rechazado')),
  admin_note text,
  reviewed_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists payments_status_idx on public.payments (status, created_at);
create unique index if not exists payments_reference_method_idx on public.payments (method, reference) where status <> 'rechazado';

alter table public.payments enable row level security;
create policy "pagos: leer propio o admin" on public.payments
  for select using (user_id = auth.uid() or public.is_admin());
create policy "pagos: crear propio pendiente" on public.payments
  for insert with check (user_id = auth.uid() and status = 'pendiente');
create policy "pagos: solo admin edita" on public.payments
  for update using (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- Ajustes de la app (tasa BCV, datos de pago). Lectura pública, edición admin.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;
create policy "ajustes: lectura pública" on public.app_settings for select using (true);
create policy "ajustes: admin escribe" on public.app_settings
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.app_settings (key, value) values
  ('rate', '{"bs_per_usd": 0, "source": "BCV", "updated": null}'::jsonb),
  ('payment_methods', '{
     "pago_movil": {"bank": "", "phone": "", "id_doc": "", "holder": ""},
     "binance": {"pay_id": "", "email": ""},
     "zelle": {"email": "", "holder": ""}
   }'::jsonb)
on conflict (key) do nothing;

-- ─────────────────────────────────────────────────────────────
-- Almacenamiento (buckets privados; cada usuario escribe en su carpeta <uid>/...)
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('materials', 'materials', false, 52428800),
  ('requests', 'requests', false, 52428800),
  ('receipts', 'receipts', false, 10485760)
on conflict (id) do nothing;

create policy "archivos: subir a la carpeta propia" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('materials', 'requests', 'receipts')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "archivos: leer los propios o admin" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('materials', 'requests', 'receipts')
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "archivos: borrar los propios o admin" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('materials', 'requests', 'receipts')
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "archivos: admin sube respuestas" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'requests' and public.is_admin());
