import React, { useEffect, useMemo, useState } from 'react';
import { E, Card, Button, Badge, SectionTitle, EmptyState, Field, Input, Select, Stat } from '../components/ui.js';
import { COUNTRIES, countryByIso, normalizePhone, validatePhoneByCountry } from '../lib/countries.js';
import { formatDateTimeEs, playerName, uid } from '../lib/tournament.js';
import { STORAGE_KEY } from '../data/defaults.js';
import { getPublicRegistrationPublication, listPublicRegistrationRequests, submitPublicRegistrationRequest, updatePublicRegistrationRequest, upsertPublicRegistrationPublication } from '../lib/supabase.js';

export const PUBLIC_REGISTRATION_KEY = 'caromchamps::public_championship_registrations::v7_1';
export const PUBLIC_SUBMISSIONS_KEY = 'caromchamps::public_registration_submissions::v7_1';

const ASSOCIATIONS = ['AJOBI', 'ASOBIGRIE', 'ASOBICO', 'ASOBIUM', 'ASOPZS', 'INTERNACIONAL'];
const REGISTRATION_STATUSES = ['RECIBIDA', 'VALIDADA', 'APROBADA', 'RECHAZADA', 'DUPLICADA', 'EN_REVISION'];

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || '') || fallback; } catch { return fallback; }
}
function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn('No se pudo guardar inscripción pública.', error);
    return false;
  }
}
function normalizeKey(value = '') {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '').trim();
}
function normalizedId(value = '') {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}
function emptyRegistrationForm() {
  return {
    first_name: '', last_name: '', id_type: 'CEDULA', id_number: '', country_iso: 'CR', association_code: 'AJOBI', division_level: 'PRIMERA', current_average: '0.000', email: '', phone_local: '', notes: '', accepts_terms: false
  };
}
function findExistingPlayer(players, form) {
  const id = normalizedId(form.id_number);
  const email = String(form.email || '').trim().toLowerCase();
  const name = normalizeKey(`${form.first_name} ${form.last_name}`);
  return (players || []).find((player) => {
    const playerId = normalizedId(player.id_number);
    const playerEmail = String(player.email || '').trim().toLowerCase();
    const playerNameKey = normalizeKey(playerName(player));
    return (id && playerId && id === playerId) || (email && playerEmail && email === playerEmail) || (name && playerNameKey && name === playerNameKey);
  }) || null;
}
function publicRegistrationUrl(championshipId) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/#register=${encodeURIComponent(championshipId || '')}`;
}
export function publicRegistrationRouteFromLocation() {
  try {
    const pathMatch = window.location.pathname.match(/\/register\/championship\/([^/]+)/i);
    if (pathMatch?.[1]) return decodeURIComponent(pathMatch[1]);
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return params.get('register') || '';
  } catch { return ''; }
}
function publishedRegistry() { return readJson(PUBLIC_REGISTRATION_KEY, {}); }
function submissionRegistry() { return readJson(PUBLIC_SUBMISSIONS_KEY, []); }

function compactPublicPlayer(player) {
  return {
    player_id: player.player_id,
    first_name: player.first_name,
    last_name: player.last_name,
    id_type: player.id_type,
    id_number: player.id_number,
    country_iso: player.country_iso,
    association_code: player.association_code,
    division_level: player.division_level,
    current_average: player.current_average,
    email: player.email,
    phone_e164: player.phone_e164,
    status: player.status
  };
}

function compactPublicChampionship(championship = {}) {
  return {
    championship_id: championship.championship_id,
    name: championship.name,
    venue_name: championship.venue_name,
    start_date: championship.start_date,
    end_date: championship.end_date,
    division_filter: championship.division_filter,
    championship_type: championship.championship_type || 'NORMAL',
    registration_enabled: true,
    registration_url: publicRegistrationUrl(championship.championship_id),
    registration_published_at: championship.registration_published_at || formatDateTimeEs(new Date())
  };
}

function buildPublicRegistrationPayload(championship, players = []) {
  return {
    championship: compactPublicChampionship(championship),
    players: (players || []).filter((player) => !player.status || player.status === 'ACTIVO').map(compactPublicPlayer)
  };
}

function findPublishedPayloadInAppState(championshipId) {
  if (!championshipId || typeof window === 'undefined') return null;
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index) || '';
      if (!key.startsWith(STORAGE_KEY)) continue;
      const state = readJson(key, null);
      if (!state) continue;
      const candidates = [state.championship, ...(state.championships || []).map((row) => row?.championship || row)].filter(Boolean);
      const found = candidates.find((item) => item?.championship_id === championshipId || item?.id === championshipId);
      if (!found) continue;
      const enabled = !!found.registration_enabled || String(found.registration_url || '').includes(championshipId);
      if (!enabled) continue;
      return buildPublicRegistrationPayload(found, state.players || []);
    }
  } catch (error) {
    console.warn('No se pudo resolver publicación desde estado local.', error);
  }
  return null;
}

export function resolvePublicRegistrationPayload(championshipId) {
  const id = String(championshipId || '').trim();
  if (!id) return null;
  const registry = publishedRegistry();
  if (registry[id]) return registry[id];
  return findPublishedPayloadInAppState(id);
}

export async function resolvePublicRegistrationPayloadRemote(championshipId) {
  const { data, error } = await getPublicRegistrationPublication(championshipId);
  if (data?.payload) return { payload: data.payload, error: null, source: 'SUPABASE' };
  return { payload: resolvePublicRegistrationPayload(championshipId), error, source: 'LOCAL' };
}

export function publishChampionshipRegistration({ championship, players }) {
  if (!championship?.championship_id) throw new Error('El campeonato no tiene identificador válido para publicar la inscripción.');
  const registry = publishedRegistry();
  registry[championship.championship_id] = buildPublicRegistrationPayload(championship, players);
  const saved = writeJson(PUBLIC_REGISTRATION_KEY, registry);
  if (!saved) {
    throw new Error('No fue posible guardar la publicación en el navegador. Libere espacio local o limpie la sesión local e intente nuevamente.');
  }
  return publicRegistrationUrl(championship.championship_id);
}
export function unpublishChampionshipRegistration(championshipId) {
  const registry = publishedRegistry();
  delete registry[championshipId];
  writeJson(PUBLIC_REGISTRATION_KEY, registry);
}
export function importPublicRegistrationRequests(existing = []) {
  const submissions = submissionRegistry();
  const byId = new Map();
  [...(existing || []), ...submissions].forEach((item) => {
    if (item?.registration_id && !byId.has(item.registration_id)) byId.set(item.registration_id, item);
  });
  return [...byId.values()];
}

function RegistrationForm({ payload, onSubmitted }) {
  const [form, setForm] = useState(emptyRegistrationForm());
  const [lookupDone, setLookupDone] = useState(false);
  const [message, setMessage] = useState('');
  const selectedCountry = countryByIso(form.country_iso);
  const phoneValidation = validatePhoneByCountry(form.country_iso, form.phone_local);
  const existing = useMemo(() => findExistingPlayer(payload?.players || [], form), [payload, form]);
  const patch = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const submit = async () => {
    setMessage('');
    if (!form.first_name.trim() || !form.last_name.trim()) return setMessage('Digite nombre y apellidos.');
    if (!form.id_number.trim()) return setMessage('Digite el número de identificación.');
    if (!form.email.trim()) return setMessage('Digite el correo electrónico.');
    if (!phoneValidation.valid) return setMessage(phoneValidation.message);
    if (!form.accepts_terms) return setMessage('Debe aceptar el uso de sus datos para la inscripción del campeonato.');
    const duplicate = submissionRegistry().some((item) => item.championship_id === payload.championship.championship_id && normalizedId(item.id_number) === normalizedId(form.id_number));
    const request = {
      registration_id: uid('REG'),
      championship_id: payload.championship.championship_id,
      championship_name: payload.championship.name,
      player_id: existing?.player_id || '',
      existing_player: !!existing,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      id_type: form.id_type,
      id_number: form.id_number.trim(),
      country_iso: form.country_iso,
      association_code: form.country_iso === 'CR' ? form.association_code : 'INTERNACIONAL',
      division_level: form.country_iso === 'CR' ? form.division_level : 'NA',
      current_average: Number(form.current_average || existing?.current_average || 0),
      email: form.email.trim().toLowerCase(),
      phone_e164: phoneValidation.e164,
      notes: form.notes || '',
      status: duplicate ? 'DUPLICADA' : existing ? 'VALIDADA' : 'RECIBIDA',
      source: 'PUBLIC_REGISTRATION_PAGE',
      submitted_at: formatDateTimeEs(new Date())
    };
    const next = [request, ...submissionRegistry().filter((item) => item.registration_id !== request.registration_id)];
    writeJson(PUBLIC_SUBMISSIONS_KEY, next);
    const remote = await submitPublicRegistrationRequest(request);
    if (remote.error) {
      setMessage('Inscripcion guardada localmente. No fue posible sincronizar con Supabase en este momento.');
      setLookupDone(false);
      setForm(emptyRegistrationForm());
      onSubmitted?.(request);
      return;
    }
    setMessage(duplicate ? 'Ya existe una inscripción enviada con esta identificación. Quedó marcada como duplicada para revisión.' : 'Inscripción enviada correctamente. La organización revisará la información.');
    setLookupDone(false);
    setForm(emptyRegistrationForm());
    onSubmitted?.(request);
  };
  return E(Card, { className: 'public-registration-form-card' },
    E(SectionTitle, { title: 'Formulario de inscripción', subtitle: 'Complete sus datos. Si ya existe como jugador activo, la plataforma lo reconocerá automáticamente.' }),
    E('div', { className: 'grid grid-4', style: { marginTop: 14 } },
      E(Field, { label: 'Tipo identificación' }, E(Select, { value: form.id_type, onChange: (event) => patch('id_type', event.target.value) }, ['CEDULA', 'PASAPORTE', 'OTHER'].map((value) => E('option', { key: value, value }, value)))),
      E(Field, { label: 'Número identificación' }, E(Input, { value: form.id_number, onChange: (event) => patch('id_number', event.target.value), onBlur: () => setLookupDone(true), placeholder: 'Cédula / pasaporte' })),
      E(Field, { label: 'Nombre' }, E(Input, { value: form.first_name, onChange: (event) => patch('first_name', event.target.value), placeholder: 'Nombre' })),
      E(Field, { label: 'Apellidos' }, E(Input, { value: form.last_name, onChange: (event) => patch('last_name', event.target.value), placeholder: 'Apellidos' })),
      E(Field, { label: 'País' }, E(Select, { value: form.country_iso, onChange: (event) => patch('country_iso', event.target.value) }, COUNTRIES.map((country) => E('option', { key: country.iso, value: country.iso }, country.name)))),
      form.country_iso === 'CR' ? E(Field, { label: 'Asociación' }, E(Select, { value: form.association_code, onChange: (event) => patch('association_code', event.target.value) }, ASSOCIATIONS.filter((item) => item !== 'INTERNACIONAL').map((value) => E('option', { key: value, value }, value)))) : E(Field, { label: 'Asociación' }, E(Input, { value: 'INTERNACIONAL', disabled: true })),
      E(Field, { label: 'División' }, E(Select, { value: form.division_level, onChange: (event) => patch('division_level', event.target.value), disabled: form.country_iso !== 'CR' }, ['PRIMERA', 'SEGUNDA', 'TERCERA', 'SELECTIVO', 'INTERNACIONAL', 'NA'].map((value) => E('option', { key: value, value }, value)))),
      E(Field, { label: 'Promedio actual' }, E(Input, { type: 'number', step: '0.001', min: '0', value: form.current_average, onChange: (event) => patch('current_average', event.target.value) })),
      E(Field, { label: 'Correo' }, E(Input, { type: 'email', value: form.email, onChange: (event) => patch('email', event.target.value), placeholder: 'correo@dominio.com' })),
      E(Field, { label: `Teléfono ${selectedCountry.dial}`, hint: selectedCountry.hint }, E(Input, { value: form.phone_local, onChange: (event) => patch('phone_local', normalizePhone(event.target.value)), placeholder: selectedCountry.hint })),
      E(Field, { label: 'Observaciones' }, E(Input, { value: form.notes, onChange: (event) => patch('notes', event.target.value), placeholder: 'Comentarios para la organización' })),
      E(Field, { label: 'Consentimiento' }, E('label', { className: 'inline-check' }, E('input', { type: 'checkbox', checked: form.accepts_terms, onChange: (event) => patch('accepts_terms', event.target.checked) }), ' Acepto uso de datos para esta inscripción'))
    ),
    lookupDone && existing ? E('div', { className: 'registration-detected-player' }, E(Badge, { kind: 'success' }, 'Jugador reconocido'), E('span', null, `${playerName(existing)} · ${existing.association_code || '-'} · AVG ${existing.current_average ?? '-'}`)) : null,
    form.phone_local && !phoneValidation.valid ? E('div', { className: 'auth-error' }, phoneValidation.message) : null,
    message ? E('div', { className: /correctamente|duplicada/i.test(message) ? 'auth-message' : 'auth-error' }, message) : null,
    E('div', { className: 'toolbar', style: { marginTop: 14, justifyContent: 'flex-end' } }, E(Button, { kind: 'success', onClick: submit }, 'Enviar inscripción'))
  );
}

export function PublicRegistrationPage({ championshipId }) {
  const [submitted, setSubmitted] = useState(null);
  const [payload, setPayload] = useState(() => resolvePublicRegistrationPayload(championshipId));
  const [loading, setLoading] = useState(!payload);
  useEffect(() => {
    let active = true;
    setLoading(true);
    resolvePublicRegistrationPayloadRemote(championshipId).then((result) => {
      if (!active) return;
      setPayload(result.payload);
      setLoading(false);
    });
    return () => { active = false; };
  }, [championshipId]);
  if (loading) {
    return E('div', { className: 'auth-page auth-page-premium public-registration-page' },
      E('section', { className: 'public-registration-shell' },
        E(Card, null, E(SectionTitle, { title: 'Cargando inscripcion', subtitle: 'Validando publicacion del campeonato.' }))
      )
    );
  }
  if (!payload) {
    return E('div', { className: 'auth-page auth-page-premium public-registration-page' },
      E('section', { className: 'public-registration-shell' },
        E(Card, null, E(SectionTitle, { title: 'Inscripción no disponible', subtitle: 'El campeonato no está publicado, el enlace expiró o la información pública no está disponible en este dispositivo.' }), E('p', null, 'Solicite a la organización que publique nuevamente la página de inscripción o que comparta un enlace vigente.'))
      )
    );
  }
  const championship = payload.championship;
  return E('div', { className: 'auth-page auth-page-premium public-registration-page' },
    E('section', { className: 'public-registration-shell' },
      E(Card, { className: 'public-registration-hero' },
        E('div', null, E('span', { className: 'ux-kicker' }, 'CaromChamps'), E('h1', null, 'Inscripción de campeonato'), E('p', null, 'Formulario público para inscripción de jugadores.')),
        E('div', { className: 'grid grid-4', style: { marginTop: 14 } },
          E(Stat, { label: 'Campeonato', value: championship.name }),
          E(Stat, { label: 'Sede', value: championship.venue_name || '-' }),
          E(Stat, { label: 'Fechas', value: `${championship.start_date || '-'} / ${championship.end_date || '-'}` }),
          E(Stat, { label: 'División', value: championship.division_filter || '-' })
        )
      ),
      submitted ? E(Card, null, E(Badge, { kind: 'success' }, 'Solicitud recibida'), E('p', null, `Registro: ${submitted.registration_id}. La organización revisará y confirmará su participación.`)) : null,
      E(RegistrationForm, { payload, onSubmitted: setSubmitted })
    )
  );
}

export function RegistrationModule({ championship, setChampionship, players, setPlayers, registrations, setRegistrations, auth, audit }) {
  const [filters, setFilters] = useState({ status: 'ALL', text: '' });
  const [publishedUrl, setPublishedUrl] = useState(championship.registration_url || '');
  const [publicationStatus, setPublicationStatus] = useState(() => !!resolvePublicRegistrationPayload(championship.championship_id) || !!championship.registration_enabled);
  useEffect(() => {
    const payload = resolvePublicRegistrationPayload(championship.championship_id);
    const url = publicRegistrationUrl(championship.championship_id);
    setPublicationStatus(!!payload || !!championship.registration_enabled);
    setPublishedUrl(payload || championship.registration_enabled ? (championship.registration_url || url) : '');
  }, [championship.championship_id, championship.registration_enabled, championship.registration_url]);
  useEffect(() => {
    let active = true;
    listPublicRegistrationRequests(championship.championship_id).then(({ requests: remoteRequests }) => {
      if (!active || !remoteRequests.length) return;
      setRegistrations((prev) => importPublicRegistrationRequests([...(prev || []), ...remoteRequests]));
    });
    return () => { active = false; };
  }, [championship.championship_id]);
  const requests = importPublicRegistrationRequests(registrations || []).filter((item) => item.championship_id === championship.championship_id);
  const text = String(filters.text || '').toLowerCase();
  const visible = requests.filter((item) => (filters.status === 'ALL' || item.status === filters.status) && (!text || `${item.first_name} ${item.last_name} ${item.id_number} ${item.email} ${item.notes}`.toLowerCase().includes(text)));
  const isPublished = publicationStatus;
  const counts = Object.fromEntries(REGISTRATION_STATUSES.map((status) => [status, requests.filter((item) => item.status === status).length]));

  const publish = async () => {
    try {
      const publishedAt = formatDateTimeEs(new Date());
      const publicationChampionship = { ...championship, registration_enabled: true, registration_published_at: publishedAt };
      const url = publishChampionshipRegistration({ championship: publicationChampionship, players });
      const payload = buildPublicRegistrationPayload(publicationChampionship, players);
      const remote = await upsertPublicRegistrationPublication({ userId: auth?.user?.id, championshipId: championship.championship_id, payload, isActive: true });
      setChampionship((prev) => ({ ...prev, registration_enabled: true, registration_url: url, registration_published_at: publishedAt }));
      setPublicationStatus(true);
      setPublishedUrl(url);
      audit?.('REGISTRATION_PAGE_PUBLISHED', remote.error ? `${url} (Supabase pendiente)` : url);
      try { navigator.clipboard?.writeText?.(url); } catch {}
      alert(`Página publicada y enlace copiado:\n${url}`);
    } catch (error) {
      setPublicationStatus(false);
      setPublishedUrl('');
      alert(`No se pudo publicar la inscripción. ${error.message || error}`);
    }
  };
  const unpublish = () => {
    unpublishChampionshipRegistration(championship.championship_id);
    upsertPublicRegistrationPublication({ userId: auth?.user?.id, championshipId: championship.championship_id, payload: buildPublicRegistrationPayload(championship, players), isActive: false });
    setChampionship((prev) => ({ ...prev, registration_enabled: false, registration_url: '', registration_published_at: '' }));
    setPublicationStatus(false);
    setPublishedUrl('');
    audit?.('REGISTRATION_PAGE_UNPUBLISHED', championship.championship_id);
  };
  const syncPublic = async () => {
    const { requests: remoteRequests } = await listPublicRegistrationRequests(championship.championship_id);
    setRegistrations((prev) => importPublicRegistrationRequests([...(prev || []), ...remoteRequests]));
    audit?.('REGISTRATION_PUBLIC_SYNC', 'Inscripciones públicas importadas desde almacenamiento local.');
  };
  const updateRequestStatus = (registrationId, status) => {
    const reviewedAt = formatDateTimeEs(new Date());
    setRegistrations((prev) => importPublicRegistrationRequests(prev || []).map((item) => item.registration_id === registrationId ? { ...item, status, reviewed_at: reviewedAt } : item));
    updatePublicRegistrationRequest(registrationId, { status, reviewed_at: reviewedAt });
    audit?.('REGISTRATION_STATUS_CHANGED', `${registrationId} → ${status}`);
  };
  const approve = (request) => {
    const existing = findExistingPlayer(players, request);
    const playerId = existing?.player_id || request.player_id || uid('P');
    if (!existing) {
      const player = {
        player_id: playerId,
        player_code: `JUG-${String((players || []).length + 1).padStart(4, '0')}`,
        first_name: request.first_name,
        last_name: request.last_name,
        id_type: request.id_type,
        id_number: request.id_number,
        country_iso: request.country_iso,
        association_code: request.association_code,
        division_level: request.division_level,
        previous_division_level: request.division_level,
        current_average: Number(request.current_average || 0),
        last_average: Number(request.current_average || 0),
        status: 'ACTIVO',
        is_seed: false,
        seed_number: null,
        email: request.email,
        phone_e164: request.phone_e164,
        photo_url: '',
        notes: `Creado desde inscripción pública ${request.registration_id}`,
        division_history: []
      };
      setPlayers((prev) => [player, ...(prev || [])]);
    }
    setChampionship((prev) => {
      const ids = new Set(prev.participant_ids || []);
      ids.add(playerId);
      return { ...prev, participant_ids: [...ids] };
    });
    const reviewedAt = formatDateTimeEs(new Date());
    setRegistrations((prev) => importPublicRegistrationRequests(prev || []).map((item) => item.registration_id === request.registration_id ? { ...item, status: 'APROBADA', player_id: playerId, reviewed_at: reviewedAt } : item));
    updatePublicRegistrationRequest(request.registration_id, { status: 'APROBADA', player_id: playerId, reviewed_at: reviewedAt });
    audit?.('REGISTRATION_APPROVED', `${request.first_name} ${request.last_name} · ${request.registration_id}`);
  };

  return E('div', { className: 'grid registrations-module' },
    E(Card, null,
      E(SectionTitle, { title: 'Inscripciones del campeonato', subtitle: 'Publique una página amigable para que los jugadores se registren y sincronice la información con la base de jugadores.' }),
      E('div', { className: 'grid grid-4', style: { marginTop: 14 } },
        E(Stat, { label: 'Solicitudes', value: requests.length }),
        E(Stat, { label: 'Recibidas', value: counts.RECIBIDA || 0 }),
        E(Stat, { label: 'Validadas', value: counts.VALIDADA || 0 }),
        E(Stat, { label: 'Aprobadas', value: counts.APROBADA || 0 })
      ),
      E('div', { className: 'registration-publish-panel' },
        E('div', null, E('b', null, isPublished ? 'Página publicada' : 'Página no publicada'), E('p', { className: 'small' }, isPublished ? 'Los jugadores pueden enviar solicitudes desde el enlace público.' : 'Publique el enlace cuando el campeonato esté listo para recibir inscripciones.')),
        E('div', { className: 'toolbar' },
          E(Button, { kind: 'success', onClick: publish }, isPublished ? 'Actualizar publicación' : 'Publicar inscripción'),
          isPublished ? E(Button, { kind: 'soft', onClick: () => { try { navigator.clipboard?.writeText?.(publishedUrl); } catch {} alert(publishedUrl); } }, 'Copiar link') : null,
          isPublished ? E(Button, { kind: 'danger', onClick: unpublish }, 'Despublicar') : null,
          E(Button, { kind: 'soft', onClick: syncPublic }, 'Sincronizar solicitudes')
        )
      ),
      publishedUrl ? E('div', { className: 'registration-url-box' }, publishedUrl) : null
    ),
    E(Card, null,
      E('div', { className: 'grid grid-4 feedback-filter-panel' },
        E(Field, { label: 'Estado' }, E(Select, { value: filters.status, onChange: (event) => setFilters({ ...filters, status: event.target.value }) }, ['ALL', ...REGISTRATION_STATUSES].map((status) => E('option', { key: status, value: status }, status === 'ALL' ? 'Todos' : status)))),
        E(Field, { label: 'Buscar' }, E(Input, { value: filters.text, onChange: (event) => setFilters({ ...filters, text: event.target.value }), placeholder: 'Nombre, cédula, correo...' })),
        E(Field, { label: 'Página pública' }, E(Button, { kind: 'soft', onClick: () => { if (publishedUrl) window.open(publishedUrl, '_blank'); else alert('Publique primero la página de inscripción.'); } }, 'Abrir vista pública')),
        E(Field, { label: 'Gobierno' }, E('div', { className: 'security-note' }, 'Validación humana antes de aprobar'))
      )
    ),
    !visible.length ? E(EmptyState, { title: 'Sin solicitudes de inscripción', message: 'Publique la página y use Sincronizar solicitudes para traer registros enviados.' }) : E(Card, null,
      E('div', { className: 'table-wrap' }, E('table', { className: 'registrations-table' },
        E('thead', null, E('tr', null, ['Fecha', 'Estado', 'Jugador', 'Identificación', 'Contacto', 'Origen', 'Observaciones', 'Acciones'].map((header) => E('th', { key: header }, header)))),
        E('tbody', null, visible.map((request) => E('tr', { key: request.registration_id },
          E('td', null, request.submitted_at || '-'),
          E('td', null, E(Select, { value: request.status || 'RECIBIDA', onChange: (event) => updateRequestStatus(request.registration_id, event.target.value) }, REGISTRATION_STATUSES.map((status) => E('option', { key: status, value: status }, status)))) ,
          E('td', null, E('b', null, `${request.first_name} ${request.last_name}`), E('div', { className: 'small' }, request.existing_player ? 'Jugador existente' : 'Nuevo jugador')),
          E('td', null, `${request.id_type || '-'} ${request.id_number || '-'}`, E('div', { className: 'small' }, `${request.country_iso || '-'} · ${request.association_code || '-'}`)),
          E('td', null, request.email || '-', E('div', { className: 'small' }, request.phone_e164 || '-')),
          E('td', null, E(Badge, { kind: request.existing_player ? 'success' : 'info' }, request.existing_player ? 'Base de datos' : 'Nuevo')),
          E('td', null, request.notes || '-'),
          E('td', null, E('div', { className: 'toolbar' },
            E(Button, { kind: 'success', onClick: () => approve(request), disabled: request.status === 'APROBADA' }, 'Aprobar + sincronizar'),
            E(Button, { kind: 'danger', onClick: () => updateRequestStatus(request.registration_id, 'RECHAZADA') }, 'Rechazar')
          ))
        )))
      ))
    )
  );
}
