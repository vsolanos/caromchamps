-- ============================================================
-- CaromChamps v7.3.0 — Migración de seguridad de roles y RLS
-- Ejecutar en el SQL Editor de Supabase (proyecto vmcbaexkbenbesygxccu)
-- ============================================================
-- Contexto: hasta v7.2 el cliente enviaba la columna `role` en el upsert
-- de `profiles`, decidiendo en el navegador quién era SUPER_USER. Eso
-- permitía a cualquier usuario autopromoverse llamando a la API con la
-- anon key. Desde v7.3 el cliente ya no envía `role`; esta migración
-- hace que el servidor sea el único que puede asignarlo.

-- 1) Valor por defecto del rol y normalización de filas existentes.
alter table public.profiles
  alter column role set default 'USER';

update public.profiles
  set role = 'USER'
  where role is null;

-- 2) El administrador de plataforma se define AQUÍ (servidor), no en el cliente.
update public.profiles
  set role = 'SUPER_USER'
  where lower(email) = 'vsolanos@gmail.com';

-- 3) Trigger que impide que un usuario cambie su propio rol o estado.
--    Solo un SUPER_USER existente (o el service_role) puede modificar `role`.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
begin
  -- service_role (backend/SQL editor) puede todo.
  if auth.role() = 'service_role' or auth.uid() is null then
    return new;
  end if;

  select role into actor_role from public.profiles where id = auth.uid();

  if tg_op = 'INSERT' then
    -- Un usuario que crea su propio perfil nunca entra con privilegios.
    if coalesce(actor_role, '') <> 'SUPER_USER' then
      new.role := 'USER';
    end if;
    return new;
  end if;

  -- UPDATE: si quien edita no es SUPER_USER, el rol no puede cambiar.
  if coalesce(actor_role, '') <> 'SUPER_USER' and new.role is distinct from old.role then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_role on public.profiles;
create trigger trg_protect_profile_role
  before insert or update on public.profiles
  for each row execute function public.protect_profile_role();

-- 4) Función auxiliar para las políticas: comprueba si el usuario actual es
--    SUPER_USER. Es `security definer` para que NO se reevalúe la política de
--    profiles dentro de sí misma (eso causa "infinite recursion detected").
create or replace function public.is_super_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'SUPER_USER'
  );
$$;

-- 5) RLS de profiles: cada usuario solo ve/edita su propia fila;
--    los SUPER_USER pueden ver y administrar todas.
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid() or public.is_super_user());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid() or public.is_super_user());

-- 6) RLS del estado de aplicación: cada usuario solo accede a su propio blob.
alter table public.user_app_states enable row level security;

drop policy if exists "user_app_states_own" on public.user_app_states;
create policy "user_app_states_own" on public.user_app_states
  for all using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- 7) Auditoría: cada usuario solo inserta sus propios eventos y los lee.
alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_insert_own" on public.audit_logs;
create policy "audit_logs_insert_own" on public.audit_logs
  for insert with check (user_id = auth.uid());

drop policy if exists "audit_logs_select_own" on public.audit_logs;
create policy "audit_logs_select_own" on public.audit_logs
  for select using (user_id = auth.uid() or public.is_super_user());

-- ============================================================
-- PENDIENTE (deuda documentada para próximas versiones):
--  * Normalizar el blob de user_app_states en tablas reales
--    (championships, matches, players) con RLS por campeonato.
--  * Crear bucket de Storage "player-photos" y migrar las fotos
--    que hoy viajan como data-URLs dentro del estado:
--      insert into storage.buckets (id, name, public) values ('player-photos', 'player-photos', true)
--      on conflict (id) do nothing;
--    con políticas de escritura restringidas al dueño.
-- ============================================================
