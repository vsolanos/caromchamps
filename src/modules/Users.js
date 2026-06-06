import React, { useMemo, useState } from 'react';
import { E, Card, Button, Badge, SectionTitle, EmptyState, Field, Input, Select, Stat } from '../components/ui.js';
import { formatDateTimeEs, uid } from '../lib/tournament.js';

export const PLATFORM_ROLES = [
  { id: 'SUPER_USER', label: 'Super usuario', badge: 'danger', description: 'Acceso total a todas las instancias, usuarios, seguridad, auditoría y configuración global.' },
  { id: 'USER', label: 'Usuario normal', badge: 'success', description: 'Administra su propia instancia, campeonatos, jugadores y enlaces compartidos.' },
  { id: 'VIEWER', label: 'Visualizador', badge: 'info', description: 'Consulta información compartida previamente, sin capacidad de administración.' }
];

export const USER_STATUSES = ['ACTIVO', 'PENDIENTE', 'SUSPENDIDO', 'BLOQUEADO', 'INACTIVO'];

export function normalizePlatformRole(role = 'USER') {
  const value = String(role || '').toUpperCase();
  if (['ADMIN', 'SUPER', 'SUPER_USER', 'SUPER USUARIO'].includes(value)) return 'SUPER_USER';
  if (['ORGANIZER', 'USER', 'USUARIO', 'USUARIO_NORMAL'].includes(value)) return 'USER';
  if (['VIEWER', 'VISUALIZADOR', 'READ_ONLY'].includes(value)) return 'VIEWER';
  return 'USER';
}

export function roleLabel(role = 'USER') {
  return PLATFORM_ROLES.find((item) => item.id === normalizePlatformRole(role))?.label || 'Usuario normal';
}

export function roleBadgeKind(role = 'USER') {
  return PLATFORM_ROLES.find((item) => item.id === normalizePlatformRole(role))?.badge || 'neutral';
}

export function canManageUsers(role = 'USER') {
  return normalizePlatformRole(role) === 'SUPER_USER';
}

export function ensureCurrentUserRecord(users = [], auth) {
  const userId = auth?.user?.id || 'LOCAL-USER';
  const email = auth?.profile?.email || auth?.user?.email || 'usuario@caromchamps.local';
  const role = normalizePlatformRole(auth?.profile?.role || 'USER');
  const now = formatDateTimeEs(new Date());
  const current = {
    user_id: userId,
    email,
    full_name: auth?.profile?.full_name || email,
    role,
    status: auth?.profile?.status || 'ACTIVO',
    instance_scope: role === 'SUPER_USER' ? 'GLOBAL' : 'PROPIA_INSTANCIA',
    security_level: role === 'SUPER_USER' ? 'ADMINISTRADOR_GLOBAL' : role === 'VIEWER' ? 'SOLO_LECTURA' : 'OPERADOR_PROPIO',
    mfa_enabled: false,
    shared_with_me: 0,
    owned_championships: 0,
    last_access_at: now,
    created_at: now,
    updated_at: now,
    notes: 'Usuario sincronizado desde autenticación.'
  };
  const list = Array.isArray(users) ? users : [];
  const found = list.some((item) => item.user_id === userId || String(item.email || '').toLowerCase() === String(email || '').toLowerCase());
  if (!found) return [current, ...list];
  return list.map((item) => (item.user_id === userId || String(item.email || '').toLowerCase() === String(email || '').toLowerCase()) ? {
    ...current,
    ...item,
    role: normalizePlatformRole(item.role || current.role),
    status: item.status || current.status,
    last_access_at: now,
    updated_at: now
  } : item);
}

function userInitials(user) {
  return String(user?.full_name || user?.email || 'CC').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'CC';
}

function defaultUserForm() {
  return {
    full_name: '',
    email: '',
    role: 'USER',
    status: 'ACTIVO',
    instance_scope: 'PROPIA_INSTANCIA',
    security_level: 'OPERADOR_PROPIO',
    mfa_enabled: false,
    notes: ''
  };
}

export function UserManagementModule({ users, setUsers, auth, audit }) {
  const currentRole = normalizePlatformRole(auth?.profile?.role || users?.find((item) => item.user_id === auth?.user?.id)?.role || 'USER');
  const isSuperUser = canManageUsers(currentRole);
  const [filters, setFilters] = useState({ role: 'ALL', status: 'ALL', text: '' });
  const [form, setForm] = useState(defaultUserForm());
  const [editingId, setEditingId] = useState('');
  const allUsers = ensureCurrentUserRecord(users || [], auth);
  const currentUserId = auth?.user?.id || '';
  const visibleUsers = useMemo(() => {
    const text = String(filters.text || '').toLowerCase();
    return allUsers.filter((user) => {
      const haystack = `${user.full_name || ''} ${user.email || ''} ${user.notes || ''} ${user.instance_scope || ''}`.toLowerCase();
      return (filters.role === 'ALL' || normalizePlatformRole(user.role) === filters.role)
        && (filters.status === 'ALL' || String(user.status || 'ACTIVO') === filters.status)
        && (!text || haystack.includes(text));
    });
  }, [allUsers, filters]);

  const counts = {
    total: allUsers.length,
    superUsers: allUsers.filter((user) => normalizePlatformRole(user.role) === 'SUPER_USER').length,
    normalUsers: allUsers.filter((user) => normalizePlatformRole(user.role) === 'USER').length,
    viewers: allUsers.filter((user) => normalizePlatformRole(user.role) === 'VIEWER').length
  };

  const patchForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const resetForm = () => { setForm(defaultUserForm()); setEditingId(''); };
  const startEdit = (user) => {
    setEditingId(user.user_id);
    setForm({
      full_name: user.full_name || '',
      email: user.email || '',
      role: normalizePlatformRole(user.role),
      status: user.status || 'ACTIVO',
      instance_scope: user.instance_scope || 'PROPIA_INSTANCIA',
      security_level: user.security_level || 'OPERADOR_PROPIO',
      mfa_enabled: !!user.mfa_enabled,
      notes: user.notes || ''
    });
  };

  const saveUser = () => {
    if (!isSuperUser) return alert('Solo el Super usuario puede administrar usuarios.');
    if (!form.full_name.trim()) return alert('Digite el nombre del usuario.');
    if (!form.email.trim()) return alert('Digite el correo del usuario.');
    const normalizedEmail = form.email.trim().toLowerCase();
    const now = formatDateTimeEs(new Date());
    const userId = editingId || uid('USR');
    const nextUser = {
      user_id: userId,
      full_name: form.full_name.trim(),
      email: normalizedEmail,
      role: normalizePlatformRole(form.role),
      status: form.status || 'ACTIVO',
      instance_scope: form.instance_scope || (normalizePlatformRole(form.role) === 'SUPER_USER' ? 'GLOBAL' : 'PROPIA_INSTANCIA'),
      security_level: form.security_level || 'OPERADOR_PROPIO',
      mfa_enabled: !!form.mfa_enabled,
      shared_with_me: 0,
      owned_championships: 0,
      notes: form.notes || '',
      created_at: allUsers.find((item) => item.user_id === userId)?.created_at || now,
      updated_at: now,
      last_access_at: allUsers.find((item) => item.user_id === userId)?.last_access_at || '-'
    };
    setUsers((prev) => {
      const base = ensureCurrentUserRecord(prev || [], auth);
      const exists = base.some((item) => item.user_id === userId);
      return exists ? base.map((item) => item.user_id === userId ? { ...item, ...nextUser } : item) : [nextUser, ...base];
    });
    audit?.(editingId ? 'USER_UPDATED' : 'USER_CREATED', `${nextUser.email} · ${roleLabel(nextUser.role)} · ${nextUser.status}`);
    resetForm();
  };

  const changeStatus = (userId, status) => {
    if (!isSuperUser) return;
    setUsers((prev) => ensureCurrentUserRecord(prev || [], auth).map((user) => user.user_id === userId ? { ...user, status, updated_at: formatDateTimeEs(new Date()) } : user));
    audit?.('USER_STATUS_CHANGED', `${userId} → ${status}`);
  };
  const changeRole = (userId, role) => {
    if (!isSuperUser) return;
    const normalized = normalizePlatformRole(role);
    setUsers((prev) => ensureCurrentUserRecord(prev || [], auth).map((user) => user.user_id === userId ? { ...user, role: normalized, instance_scope: normalized === 'SUPER_USER' ? 'GLOBAL' : 'PROPIA_INSTANCIA', updated_at: formatDateTimeEs(new Date()) } : user));
    audit?.('USER_ROLE_CHANGED', `${userId} → ${roleLabel(normalized)}`);
  };

  if (!isSuperUser) {
    const own = allUsers.find((item) => item.user_id === currentUserId) || allUsers[0];
    return E('div', { className: 'grid user-management-module' },
      E(Card, null,
        E(SectionTitle, { title: 'Mi usuario', subtitle: 'La gestión completa de usuarios y seguridad está reservada para Super usuario.' }),
        E('div', { className: 'user-profile-summary' },
          E('div', { className: 'user-avatar-large' }, userInitials(own)),
          E('div', null,
            E('h2', null, own?.full_name || auth?.profile?.full_name || auth?.user?.email),
            E('p', null, own?.email || auth?.user?.email),
            E('div', { className: 'toolbar' }, E(Badge, { kind: roleBadgeKind(own?.role) }, roleLabel(own?.role)), E(Badge, { kind: own?.status === 'ACTIVO' ? 'success' : 'warning' }, own?.status || 'ACTIVO'))
          )
        )
      ),
      E(Card, null,
        E('h3', null, 'Buenas prácticas aplicadas'),
        E('ul', { className: 'best-practice-list' },
          ['Roles separados por privilegio mínimo.', 'Visualizadores sin funciones administrativas.', 'Estados de usuario auditables.', 'Preparado para MFA, bloqueo, suspensión y trazabilidad.', 'Separación entre instancia propia y administración global.'].map((item) => E('li', { key: item }, item))
        )
      )
    );
  }

  return E('div', { className: 'grid user-management-module' },
    E(Card, null,
      E(SectionTitle, { title: 'Gestión de usuarios y seguridad', subtitle: 'Administración de Super usuarios, usuarios normales y visualizadores de la plataforma CaromChamps.' }),
      E('div', { className: 'grid grid-4', style: { marginTop: 14 } },
        E(Stat, { label: 'Usuarios', value: counts.total }),
        E(Stat, { label: 'Super usuarios', value: counts.superUsers }),
        E(Stat, { label: 'Usuarios normales', value: counts.normalUsers }),
        E(Stat, { label: 'Visualizadores', value: counts.viewers })
      )
    ),
    E(Card, null,
      E(SectionTitle, { title: editingId ? 'Editar usuario' : 'Crear usuario administrativo', subtitle: 'Esta sección controla el acceso funcional. La autenticación real sigue gestionándose en Supabase Auth.' }),
      E('div', { className: 'grid grid-4 user-form-grid', style: { marginTop: 14 } },
        E(Field, { label: 'Nombre completo' }, E(Input, { value: form.full_name, onChange: (event) => patchForm('full_name', event.target.value), placeholder: 'Nombre y apellidos' })),
        E(Field, { label: 'Correo' }, E(Input, { type: 'email', value: form.email, onChange: (event) => patchForm('email', event.target.value), placeholder: 'correo@dominio.com' })),
        E(Field, { label: 'Rol' }, E(Select, { value: form.role, onChange: (event) => patchForm('role', event.target.value) }, PLATFORM_ROLES.map((role) => E('option', { key: role.id, value: role.id }, role.label)))),
        E(Field, { label: 'Estado' }, E(Select, { value: form.status, onChange: (event) => patchForm('status', event.target.value) }, USER_STATUSES.map((status) => E('option', { key: status, value: status }, status)))),
        E(Field, { label: 'Instancia' }, E(Select, { value: form.instance_scope, onChange: (event) => patchForm('instance_scope', event.target.value) }, ['GLOBAL', 'PROPIA_INSTANCIA', 'COMPARTIDA'].map((value) => E('option', { key: value, value }, value)))),
        E(Field, { label: 'Nivel seguridad' }, E(Select, { value: form.security_level, onChange: (event) => patchForm('security_level', event.target.value) }, ['ADMINISTRADOR_GLOBAL', 'OPERADOR_PROPIO', 'SOLO_LECTURA', 'SUSPENDIDO'].map((value) => E('option', { key: value, value }, value)))),
        E(Field, { label: 'MFA' }, E('label', { className: 'inline-check' }, E('input', { type: 'checkbox', checked: !!form.mfa_enabled, onChange: (event) => patchForm('mfa_enabled', event.target.checked) }), ' Requerido / habilitado')),
        E(Field, { label: 'Notas' }, E(Input, { value: form.notes, onChange: (event) => patchForm('notes', event.target.value), placeholder: 'Observaciones de seguridad' }))
      ),
      E('div', { className: 'toolbar', style: { marginTop: 14 } },
        E(Button, { kind: 'success', onClick: saveUser }, editingId ? 'Guardar cambios' : 'Crear usuario'),
        E(Button, { kind: 'soft', onClick: resetForm }, 'Limpiar')
      )
    ),
    E(Card, null,
      E('div', { className: 'grid grid-4 feedback-filter-panel' },
        E(Field, { label: 'Rol' }, E(Select, { value: filters.role, onChange: (event) => setFilters({ ...filters, role: event.target.value }) }, ['ALL', ...PLATFORM_ROLES.map((role) => role.id)].map((role) => E('option', { key: role, value: role }, role === 'ALL' ? 'Todos' : roleLabel(role))))),
        E(Field, { label: 'Estado' }, E(Select, { value: filters.status, onChange: (event) => setFilters({ ...filters, status: event.target.value }) }, ['ALL', ...USER_STATUSES].map((status) => E('option', { key: status, value: status }, status === 'ALL' ? 'Todos' : status)))) ,
        E(Field, { label: 'Buscar' }, E(Input, { value: filters.text, onChange: (event) => setFilters({ ...filters, text: event.target.value }), placeholder: 'Nombre, correo, notas...' })),
        E(Field, { label: 'Gobierno' }, E('div', { className: 'security-note' }, 'Privilegio mínimo + auditoría'))
      )
    ),
    !visibleUsers.length ? E(EmptyState, { title: 'Sin usuarios', message: 'No hay usuarios que coincidan con los filtros.' }) : E(Card, null,
      E('div', { className: 'table-wrap' }, E('table', { className: 'users-table' },
        E('thead', null, E('tr', null, ['Usuario', 'Rol', 'Estado', 'Instancia', 'MFA', 'Último acceso', 'Notas', 'Acciones'].map((header) => E('th', { key: header }, header)))),
        E('tbody', null, visibleUsers.map((user) => E('tr', { key: user.user_id, className: user.user_id === currentUserId ? 'selected-row' : '' },
          E('td', null, E('div', { className: 'user-cell' }, E('div', { className: 'user-avatar-mini' }, userInitials(user)), E('div', null, E('b', null, user.full_name || '-'), E('div', { className: 'small' }, user.email || user.user_id)))),
          E('td', null, E(Select, { value: normalizePlatformRole(user.role), onChange: (event) => changeRole(user.user_id, event.target.value), disabled: user.user_id === currentUserId }, PLATFORM_ROLES.map((role) => E('option', { key: role.id, value: role.id }, role.label)))),
          E('td', null, E(Select, { value: user.status || 'ACTIVO', onChange: (event) => changeStatus(user.user_id, event.target.value), disabled: user.user_id === currentUserId }, USER_STATUSES.map((status) => E('option', { key: status, value: status }, status)))),
          E('td', null, user.instance_scope || '-'),
          E('td', null, user.mfa_enabled ? E(Badge, { kind: 'success' }, 'Sí') : E(Badge, { kind: 'warning' }, 'Pendiente')),
          E('td', null, user.last_access_at || '-'),
          E('td', null, user.notes || '-'),
          E('td', null, E('div', { className: 'toolbar' }, E(Button, { kind: 'soft', onClick: () => startEdit(user) }, 'Editar')))
        )))
      ))
    ),
    E(Card, { className: 'security-best-practices-card' },
      E(SectionTitle, { title: 'Buenas prácticas de seguridad incorporadas', subtitle: 'Lineamientos funcionales para convertir CaromChamps en una plataforma multiusuario robusta.' }),
      E('div', { className: 'grid grid-3' },
        PLATFORM_ROLES.map((role) => E('div', { key: role.id, className: 'round-card' }, E(Badge, { kind: role.badge }, role.label), E('p', null, role.description))),
        E('div', { className: 'round-card' }, E(Badge, { kind: 'info' }, 'Auditoría'), E('p', null, 'Los cambios de rol y estado se registran en Auditoría.')),
        E('div', { className: 'round-card' }, E(Badge, { kind: 'warning' }, 'RLS / Backend'), E('p', null, 'Preparado para políticas de Supabase RLS por owner_user_id, rol y estado.')),
        E('div', { className: 'round-card' }, E(Badge, { kind: 'success' }, 'Compartir'), E('p', null, 'Los usuarios normales podrán compartir campeonatos sin ceder control de su instancia.'))
      )
    )
  );
}
