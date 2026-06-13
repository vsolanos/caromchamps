-- ============================================================
-- CaromChamps v7.4.0 — PII fuera del payload público de inscripciones
-- Ejecutar en el SQL Editor de Supabase (proyecto vmcbaexkbenbesygxccu)
-- ============================================================
-- Contexto: hasta v7.3 `public_registration_publications.payload` incluía
-- cédula (id_number), correo y teléfono de todos los jugadores activos, y
-- la tabla es legible con la anon key (necesario para la página pública
-- #register=<championship_id>). Cualquiera con la anon key (que viaja en
-- el bundle JS) podía descargar esa PII. Desde esta migración:
--
--   * `payload` (público) solo lleva datos no sensibles por jugador:
--     player_id, nombre, país, asociación, división, promedio y estado
--     (datos que ya aparecen en resultados/rankings públicos). Permite
--     el reconocimiento por NOMBRE en el cliente.
--   * La PII completa (cédula, correo, teléfono) vive en la nueva columna
--     `private_payload`, SIN privilegio de SELECT para anon/authenticated.
--   * El reconocimiento por CÉDULA o CORREO se hace con la RPC
--     `match_public_registration_player` (security definer), que recibe
--     el dato digitado y devuelve solo el resumen no sensible del jugador
--     coincidente, o null. Así no hay hashes descargables que se puedan
--     romper offline (una cédula de ~9 dígitos se fuerza en segundos).
--
-- El script es idempotente: puede ejecutarse varias veces sin pérdida.

-- 1) Columna privada con el directorio completo de jugadores.
alter table public.public_registration_publications
  add column if not exists private_payload jsonb not null default '{}'::jsonb;

-- 2) Migrar filas ya publicadas: copiar el payload completo a la columna
--    privada (solo si aún no se migró) y limpiar la PII del payload público.
update public.public_registration_publications
  set private_payload = jsonb_build_object('players', coalesce(payload->'players', '[]'::jsonb))
  where private_payload = '{}'::jsonb
    and payload ? 'players';

update public.public_registration_publications
  set payload = jsonb_set(
    payload,
    '{players}',
    coalesce(
      (
        select jsonb_agg(player - 'id_number' - 'id_type' - 'email' - 'phone_e164')
        from jsonb_array_elements(payload->'players') as player
      ),
      '[]'::jsonb
    )
  )
  where payload ? 'players';

-- 3) Privilegios a nivel de columna: ni anon ni authenticated pueden hacer
--    SELECT de `private_payload` (solo service_role y funciones security
--    definer). RLS sigue controlando QUÉ filas se ven; esto controla QUÉ
--    columnas. Nota: el cliente debe pedir columnas explícitas (select '*'
--    sobre esta tabla ahora devuelve "permission denied").
revoke select on table public.public_registration_publications from anon, authenticated;
grant select (championship_id, owner_user_id, payload, is_active, published_at, updated_at)
  on table public.public_registration_publications
  to anon, authenticated;

-- 4) RPC de reconocimiento por cédula o correo. Devuelve el resumen no
--    sensible del jugador coincidente en la publicación activa, o null.
--    Es un "oráculo" en línea (consulta por consulta), sin posibilidad de
--    descarga masiva ni fuerza bruta offline.
create or replace function public.match_public_registration_player(
  p_championship_id text,
  p_id_number text default '',
  p_email text default ''
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_id text := regexp_replace(upper(coalesce(p_id_number, '')), '[^A-Z0-9]', '', 'g');
  v_email text := lower(trim(coalesce(p_email, '')));
  v_match jsonb;
begin
  -- Entradas demasiado cortas o con formato inválido no consultan:
  -- encarece la enumeración trivial.
  if length(v_id) < 4 then
    v_id := '';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    v_email := '';
  end if;
  if v_id = '' and v_email = '' then
    return null;
  end if;

  select jsonb_build_object(
           'player_id', player->>'player_id',
           'first_name', player->>'first_name',
           'last_name', player->>'last_name',
           'country_iso', player->>'country_iso',
           'association_code', player->>'association_code',
           'division_level', player->>'division_level',
           'current_average', player->'current_average',
           'status', player->>'status'
         )
    into v_match
    from public.public_registration_publications pub
   cross join lateral jsonb_array_elements(coalesce(pub.private_payload->'players', '[]'::jsonb)) as player
   where pub.championship_id = p_championship_id
     and pub.is_active = true
     and (
       (v_id <> '' and regexp_replace(upper(coalesce(player->>'id_number', '')), '[^A-Z0-9]', '', 'g') = v_id)
       or (v_email <> '' and lower(trim(coalesce(player->>'email', ''))) = v_email)
     )
   limit 1;

  return v_match;
end;
$$;

revoke all on function public.match_public_registration_player(text, text, text) from public;
grant execute on function public.match_public_registration_player(text, text, text) to anon, authenticated;

-- ============================================================
-- NOTA OPERATIVA: clientes desplegados ANTES de v7.4 siguen publicando la
-- PII dentro de `payload` (y dejan `private_payload` vacío). Si se publica
-- un campeonato desde un cliente viejo después de esta migración, vuelva a
-- ejecutar el paso 2 (o este script completo) para sanear esas filas.
-- ============================================================
