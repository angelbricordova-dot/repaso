-- TareaYa · esquema completo
-- Ejecuta este archivo entero en Supabase → SQL Editor (o `supabase db push`).
-- Seguridad: cada estudiante ve solo lo suyo. El equipo (staff) ve y trabaja todas las tareas.
-- Solo el administrador ve pagos y cambia planes.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- Perfiles
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  whatsapp text not null default '',
  level text not null default 'universidad' check (level in ('bachillerato', 'diversificado', 'universidad')),
  institution text not null default '',
  career text not null default '',
  role text not null default 'student' check (role in ('student', 'staff', 'admin')),
  plan text not null default 'gratis' check (plan in ('gratis', 'basico', 'pro', 'full')),
  plan_expires_at timestamptz,
  credits integer not null default 1 check (credits >= 0),
  referral_code text unique,
  referred_by uuid references public.profiles (id) on delete set null,
  referral_rewarded boolean not null default false,
  terms_version text,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin'));
$$;

-- Código de invitación corto y legible (sin 0/O ni 1/I)
create or replace function public.new_referral_code()
returns text language plpgsql as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where referral_code = code);
  end loop;
  return code;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  ref uuid;
begin
  select id into ref from public.profiles
   where referral_code = upper(nullif(new.raw_user_meta_data ->> 'ref', ''));
  insert into public.profiles (id, email, full_name, whatsapp, level, institution, career, referral_code, referred_by, terms_version, terms_accepted_at)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'whatsapp', ''),
    case when new.raw_user_meta_data ->> 'level' in ('bachillerato', 'diversificado', 'universidad')
         then new.raw_user_meta_data ->> 'level' else 'universidad' end,
    coalesce(new.raw_user_meta_data ->> 'institution', ''),
    coalesce(new.raw_user_meta_data ->> 'career', ''),
    public.new_referral_code(),
    ref,
    new.raw_user_meta_data ->> 'terms_version',
    case when new.raw_user_meta_data ->> 'terms_version' is not null then now() end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Un estudiante no puede tocar su rol, plan, créditos ni invitaciones
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and auth.uid() is not null then
    new.role := old.role;
    new.plan := old.plan;
    new.plan_expires_at := old.plan_expires_at;
    new.credits := old.credits;
    new.email := old.email;
    new.referral_code := old.referral_code;
    new.referred_by := old.referred_by;
    new.referral_rewarded := old.referral_rewarded;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_fields on public.profiles;
create trigger protect_profile_fields before update on public.profiles
  for each row execute function public.protect_profile_fields();

alter table public.profiles enable row level security;
create policy "perfil: leer el propio o equipo" on public.profiles
  for select using (id = auth.uid() or public.is_staff());
create policy "perfil: editar el propio o admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- Tareas
-- ─────────────────────────────────────────────────────────────
create sequence if not exists public.task_number_seq start 101;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  number integer not null default nextval('public.task_number_seq') unique,
  user_id uuid not null references public.profiles (id) on delete cascade,
  level text not null check (level in ('bachillerato', 'diversificado', 'universidad')),
  subject text not null check (char_length(subject) between 1 and 80),
  task_type text not null check (task_type in ('ejercicios', 'informe', 'ensayo', 'presentacion', 'resumen', 'mapa', 'ingles', 'otro')),
  title text not null check (char_length(title) between 3 and 140),
  instructions text not null default '',
  files jsonb not null default '[]'::jsonb,
  links text[] not null default '{}',
  due_at timestamptz not null,
  urgent boolean not null default false,
  cost integer not null default 1 check (cost between 1 and 3),
  paid_with text not null check (paid_with in ('plan', 'creditos')),
  status text not null default 'recibida'
    check (status in ('recibida', 'en_proceso', 'necesita_info', 'entregada', 'corrigiendo', 'cerrada', 'cancelada')),
  assigned_to uuid references public.profiles (id) on delete set null,
  delivery_note text,
  delivery_files jsonb not null default '[]'::jsonb,
  delivered_at timestamptz,
  revision_requests integer not null default 0,
  rating integer check (rating between 1 and 5),
  rating_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_user_idx on public.tasks (user_id, created_at desc);
create index if not exists tasks_queue_idx on public.tasks (status, due_at);

alter table public.tasks enable row level security;
-- Los estudiantes leen sus tareas; crean y modifican solo a través del servidor (service role).
create policy "tareas: leer propias o equipo" on public.tasks
  for select using (user_id = auth.uid() or public.is_staff());
create policy "tareas: el equipo actualiza" on public.tasks
  for update using (public.is_staff());

-- Mensajes entre estudiante y equipo por tarea
create table if not exists public.task_messages (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  from_staff boolean not null default false,
  body text not null default '',
  files jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists task_messages_task_idx on public.task_messages (task_id, created_at);

alter table public.task_messages enable row level security;
create policy "mensajes: leer de tareas propias o equipo" on public.task_messages
  for select using (
    public.is_staff() or exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- Pagos: planes mensuales o paquetes de tareas sueltas, verificados a mano
-- ─────────────────────────────────────────────────────────────
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('plan', 'creditos')),
  plan text check (plan in ('basico', 'pro', 'full')),
  months integer not null default 1 check (months between 1 and 12),
  quantity integer not null default 0 check (quantity between 0 and 50),
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
  reviewed_at timestamptz,
  check ((kind = 'plan' and plan is not null) or (kind = 'creditos' and quantity > 0))
);
create index if not exists payments_status_idx on public.payments (status, created_at);
create unique index if not exists payments_reference_method_idx on public.payments (method, reference) where status <> 'rechazado';

alter table public.payments enable row level security;
create policy "pagos: leer propios o admin" on public.payments
  for select using (user_id = auth.uid() or public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- Ajustes (tasa BCV y datos de pago): lectura pública, edición admin
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
-- Archivos (buckets privados). Todo vive en la carpeta del estudiante: <uid>/...
-- El estudiante sube a su carpeta; el equipo lee todo y sube entregas.
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('tasks', 'tasks', false, 52428800), ('receipts', 'receipts', false, 10485760)
on conflict (id) do nothing;

create policy "archivos: subir a la carpeta propia" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('tasks', 'receipts') and (storage.foldername(name))[1] = auth.uid()::text);

create policy "archivos: el equipo sube entregas" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'tasks' and public.is_staff());

create policy "archivos: leer propios o equipo" on storage.objects
  for select to authenticated
  using (
    (bucket_id = 'tasks' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()))
    or (bucket_id = 'receipts' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()))
  );

create policy "archivos: borrar propios o admin" on storage.objects
  for delete to authenticated
  using (bucket_id in ('tasks', 'receipts') and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- Créditos (tareas sueltas, regalos, invitaciones): solo el servidor los mueve
-- ─────────────────────────────────────────────────────────────
create or replace function public.spend_credits(p_user uuid, p_amount integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  ok boolean;
begin
  update public.profiles set credits = credits - p_amount
   where id = p_user and credits >= p_amount
  returning true into ok;
  return coalesce(ok, false);
end;
$$;

create or replace function public.add_credits(p_user uuid, p_amount integer)
returns void language sql security definer set search_path = public as $$
  update public.profiles set credits = credits + p_amount where id = p_user;
$$;

revoke all on function public.spend_credits(uuid, integer) from public, anon, authenticated;
revoke all on function public.add_credits(uuid, integer) from public, anon, authenticated;
grant execute on function public.spend_credits(uuid, integer) to service_role;
grant execute on function public.add_credits(uuid, integer) to service_role;
