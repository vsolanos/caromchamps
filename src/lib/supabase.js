import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://vmcbaexkbenbesygxccu.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_BWGED1ADRTDK0paUbTTvGw_xCospIjZ';
export const ADMIN_EMAIL = 'vsolanos@gmail.com';
export const APP_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'https://caromchamps.com';

function withTimeout(promise, label = 'Operación Supabase', ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} excedió el tiempo de espera.`)), ms))
  ]);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export function isAdminEmail(email = '') {
  return String(email || '').trim().toLowerCase() === ADMIN_EMAIL;
}

export function safeProfileRole(profile, user) {
  if (profile?.role) return profile.role;
  return isAdminEmail(user?.email) ? 'SUPER_USER' : 'USER';
}

export async function ensureUserProfile(user, metadata = {}) {
  if (!user?.id) return { profile: null, error: null };
  const email = String(user.email || '').toLowerCase();
  // El rol NO se envía desde el cliente: lo asigna y protege la base de datos
  // (ver docs/supabase_migration_v7_3.sql). Aquí solo se usa como fallback visual.
  const payload = {
    id: user.id,
    email,
    full_name: metadata.full_name || user.user_metadata?.full_name || user.user_metadata?.name || email,
    country_iso: metadata.country_iso || user.user_metadata?.country_iso || 'CR',
    phone_country_code: metadata.phone_country_code || user.user_metadata?.phone_country_code || '+506',
    phone_local: metadata.phone_local || user.user_metadata?.phone_local || '',
    avatar_url: metadata.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
    status: 'ACTIVE',
    updated_at: new Date().toISOString()
  };
  const localFallback = () => ({ ...payload, role: safeProfileRole(null, user) });
  try {
    const { data, error } = await withTimeout(
      supabase.from('profiles').upsert(payload, { onConflict: 'id' }).select().single(),
      'Carga/creación de perfil'
    );
    if (error) return { profile: localFallback(), error };
    return { profile: data || localFallback(), error: null };
  } catch (error) {
    console.warn('No fue posible sincronizar el perfil en Supabase; se usará perfil local de sesión.', error);
    return { profile: localFallback(), error };
  }
}

export async function loadUserAppState(userId) {
  if (!userId) return { state: null, error: null };
  try {
    const { data, error } = await withTimeout(
      supabase.from('user_app_states').select('state, updated_at').eq('owner_user_id', userId).maybeSingle(),
      'Carga de estado de usuario'
    );
    return { state: data?.state || null, updated_at: data?.updated_at || null, error };
  } catch (error) {
    console.warn('No fue posible cargar estado remoto; se usará estado local.', error);
    return { state: null, error };
  }
}

export async function saveUserAppState(userId, state, expectedUpdatedAt = null) {
  if (!userId) return { error: null, conflict: false, updatedAt: null };
  try {
    // Antes de sobrescribir, verifica que nadie haya guardado desde otra
    // sesión/dispositivo después de nuestra última lectura (last-write-wins
    // silencioso era el comportamiento anterior y podía perder datos).
    if (expectedUpdatedAt) {
      const { data: current, error: readError } = await withTimeout(
        supabase.from('user_app_states').select('updated_at').eq('owner_user_id', userId).maybeSingle(),
        'Verificación de estado remoto'
      );
      if (!readError && current?.updated_at && current.updated_at !== expectedUpdatedAt) {
        return {
          error: new Error('Los datos en la nube cambiaron desde otra sesión o dispositivo.'),
          conflict: true,
          remoteUpdatedAt: current.updated_at,
          updatedAt: null
        };
      }
    }
    const updatedAt = new Date().toISOString();
    const { error } = await withTimeout(
      supabase.from('user_app_states').upsert({ owner_user_id: userId, state, updated_at: updatedAt }, { onConflict: 'owner_user_id' }),
      'Guardado de estado de usuario'
    );
    return { error, conflict: false, updatedAt: error ? null : updatedAt };
  } catch (error) {
    console.warn('No fue posible guardar estado remoto; se conserva estado local.', error);
    return { error, conflict: false, updatedAt: null };
  }
}

export async function createChampionshipShare({ userId, championshipSnapshot }) {
  const token = crypto?.randomUUID ? crypto.randomUUID() : `share-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const { data, error } = await supabase
    .from('championship_shares')
    .insert({
      token,
      owner_user_id: userId,
      championship_id: championshipSnapshot?.id || championshipSnapshot?.championship?.championship_id || '',
      championship_name: championshipSnapshot?.name || championshipSnapshot?.championship?.name || 'Campeonato compartido',
      snapshot: championshipSnapshot,
      access_mode: 'ACTIVE_USERS_WITH_LINK',
      is_active: true
    })
    .select()
    .single();
  return { data, error };
}

export async function getChampionshipShare(token) {
  const { data, error } = await supabase
    .from('championship_shares')
    .select('*')
    .eq('token', token)
    .eq('is_active', true)
    .maybeSingle();
  return { data, error };
}

export async function auditCloudEvent(userId, type, detail) {
  if (!userId) return;
  try {
    await withTimeout(supabase.from('audit_logs').insert({ user_id: userId, type, detail }), 'Auditoría', 5000);
  } catch (error) {
    console.warn('No fue posible registrar auditoría remota.', error);
  }
}
export async function upsertPublicRegistrationPublication({ userId, championshipId, payload, isActive = true }) {
  if (!championshipId) return { data: null, error: new Error('Campeonato sin identificador para publicar inscripcion.') };
  try {
    const { data, error } = await withTimeout(
      supabase.from('public_registration_publications').upsert({
        championship_id: championshipId,
        owner_user_id: userId || null,
        payload,
        is_active: isActive,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'championship_id' }).select().single(),
      'Publicacion de inscripcion',
      8000
    );
    return { data, error };
  } catch (error) {
    console.warn('No fue posible publicar inscripcion en Supabase.', error);
    return { data: null, error };
  }
}

export async function getPublicRegistrationPublication(championshipId) {
  if (!championshipId) return { data: null, error: null };
  try {
    const { data, error } = await withTimeout(
      supabase.from('public_registration_publications').select('payload, is_active, updated_at').eq('championship_id', championshipId).eq('is_active', true).maybeSingle(),
      'Lectura de publicacion de inscripcion',
      8000
    );
    return { data, error };
  } catch (error) {
    console.warn('No fue posible leer publicacion de inscripcion desde Supabase.', error);
    return { data: null, error };
  }
}

export async function submitPublicRegistrationRequest(request) {
  if (!request?.registration_id || !request?.championship_id) return { data: null, error: new Error('Solicitud de inscripcion incompleta.') };
  try {
    const { data, error } = await withTimeout(
      supabase.from('public_registration_requests').insert({
        registration_id: request.registration_id,
        championship_id: request.championship_id,
        payload: request,
        status: request.status || 'RECIBIDA',
        submitted_at: new Date().toISOString()
      }).select().single(),
      'Envio de solicitud de inscripcion',
      8000
    );
    return { data, error };
  } catch (error) {
    console.warn('No fue posible enviar inscripcion publica a Supabase.', error);
    return { data: null, error };
  }
}

export async function listPublicRegistrationRequests(championshipId) {
  if (!championshipId) return { requests: [], error: null };
  try {
    const { data, error } = await withTimeout(
      supabase.from('public_registration_requests').select('registration_id, championship_id, payload, status, submitted_at, reviewed_at').eq('championship_id', championshipId).order('submitted_at', { ascending: false }),
      'Lectura de solicitudes de inscripcion',
      8000
    );
    const requests = (data || []).map((row) => ({
      ...(row.payload || {}),
      registration_id: row.registration_id,
      championship_id: row.championship_id,
      status: row.status || row.payload?.status || 'RECIBIDA',
      submitted_at: row.payload?.submitted_at || row.submitted_at,
      reviewed_at: row.payload?.reviewed_at || row.reviewed_at || ''
    }));
    return { requests, error };
  } catch (error) {
    console.warn('No fue posible cargar solicitudes de inscripcion desde Supabase.', error);
    return { requests: [], error };
  }
}

export async function updatePublicRegistrationRequest(registrationId, patch = {}) {
  if (!registrationId) return { error: null };
  try {
    const { data: current, error: readError } = await withTimeout(
      supabase.from('public_registration_requests').select('payload').eq('registration_id', registrationId).maybeSingle(),
      'Lectura de solicitud de inscripcion',
      8000
    );
    if (readError) return { error: readError };
    const nextPayload = { ...(current?.payload || {}), ...patch };
    const updatePayload = {
      payload: nextPayload,
      status: patch.status || nextPayload.status || 'RECIBIDA'
    };
    if (patch.reviewed_at) updatePayload.reviewed_at = new Date().toISOString();
    const { error } = await withTimeout(
      supabase.from('public_registration_requests').update(updatePayload).eq('registration_id', registrationId),
      'Actualizacion de solicitud de inscripcion',
      8000
    );
    return { error };
  } catch (error) {
    console.warn('No fue posible actualizar solicitud de inscripcion en Supabase.', error);
    return { error };
  }
}
