import React, { useEffect, useRef, useState } from 'react';
import appPackage from '../package.json';
import { E, Card, Button, Badge, Stat } from './components/ui.js';
import { PlayerHistoryModal } from './components/PlayerHistory.js';
import { AuthGate } from './components/AuthGate.js';
import { SharedChampionshipView } from './components/SharedView.js';
import { ProfileSettings } from './components/ProfileSettings.js';
import { createChampionshipShare, loadUserAppState, saveUserAppState } from './lib/supabase.js';
import { DEFAULT_CHAMPIONSHIP, DEFAULT_PLAYERS, STORAGE_KEY } from './data/defaults.js';
import { autoFillMatches, clearResults, generateFullKnockoutDemo, generateGroups, generateRoundRobinMatches, groupStandings, qualify, scheduleMatches, uid, getEligiblePlayers, makeChampionshipSnapshot, formatDateTimeEs, matchCode, matchDetailedScore, matchDisplayStatus, matchPlayerStats, matchRoundLabel, playerName, roundDisplayName, fmtAvg } from './lib/tournament.js';
import { ChampionshipsModule } from './modules/Championships.js';
import { PlayersModule } from './modules/Players.js';
import { SetupModule } from './modules/Setup.js';
import { GroupsModule } from './modules/Groups.js';
import { CaptureModule } from './modules/Capture.js';
import { ScheduleModule } from './modules/Schedule.js';
import { BracketModule } from './modules/Bracket.js';
import { ReportsModule } from './modules/Reports.js';
import { MaintenanceModule } from './modules/Maintenance.js';
import { ConfigurationModule } from './modules/Configuration.js';
import { OfficialsModule } from './modules/Officials.js';
import { CloseTournamentModule } from './modules/CloseTournament.js';
import { AuditModule } from './modules/Audit.js';
import { RankingModule } from './modules/Ranking.js';

function loadState(storageKey = STORAGE_KEY, fallbackKey = '') {
  try {
    const raw = localStorage.getItem(storageKey) || (fallbackKey ? localStorage.getItem(fallbackKey) : '');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function userStorageKey(user) {
  return `${STORAGE_KEY}::user::${user?.id || 'anonymous'}`;
}

function sharedTokenFromLocation() {
  const match = window.location.pathname.match(/\/shared\/championship\/([^/]+)/i);
  return match?.[1] || '';
}

const RANKING_BLOCKED_TABS = new Set(['groups', 'schedule', 'matches', 'ko', 'reports', 'officials', 'close']);
const UX_MODE_KEY = 'caromchamps::ux_mode::v5_9';

const NAV_TABS = [
  ['championships', 'Campeonatos', '🏆'], ['dashboard', 'Dashboard', '⌂'], ['players', 'Jugadores', '👤'], ['setup', 'Campeonato', '⚙'], ['groups', 'Grupos', '▦'],
  ['schedule', 'Calendario', '📅'], ['matches', 'Partidas', '●'], ['ko', 'Llaves', '⑂'], ['reports', 'Reportes', '▤'], ['ranking', 'Ranking', '★'],
  ['config', 'Configuración', '⚙'], ['profile', 'Perfil', '☻'], ['admin', 'Mantenimiento', '🛠'], ['officials', 'Árbitros', '♟'], ['close', 'Cierre', '✓'], ['audit', 'Auditoría', '◎']
];

const GUIDED_NAV_GROUPS = [
  { id: 'start', label: 'Inicio', hint: 'Estado general', tabs: ['dashboard', 'championships'] },
  { id: 'prepare', label: 'Preparar', hint: 'Datos y reglas', tabs: ['players', 'setup', 'groups'] },
  { id: 'operate', label: 'Operar', hint: 'Agenda y captura', tabs: ['schedule', 'matches'] },
  { id: 'results', label: 'Resultados', hint: 'Llaves y reportes', tabs: ['ko', 'reports', 'ranking', 'close'] },
  { id: 'admin', label: 'Administración', hint: 'Soporte y control', tabs: ['config', 'profile', 'admin', 'officials', 'audit'] }
];

function getTabMeta(id) {
  const found = NAV_TABS.find(([tabId]) => tabId === id);
  return found || [id, id, '•'];
}

function visibleTabsForChampionship(championship) {
  const isRanking = (championship?.championship_type || 'NORMAL') === 'RANKING';
  return isRanking ? NAV_TABS.filter(([id]) => !RANKING_BLOCKED_TABS.has(id)) : NAV_TABS;
}

function Header({ championship, tab, setTab, collapsed, setCollapsed, auth, uxMode, setUxMode }) {
  const isRankingChampionship = (championship?.championship_type || 'NORMAL') === 'RANKING';
  const tabs = visibleTabsForChampionship(championship);
  const visibleIds = new Set(tabs.map(([id]) => id));
  const navigate = (id) => setTab(id);
  const isGuided = uxMode === 'guided';

  if (isGuided) {
    return E('header', { className: `header guided-header ${collapsed ? 'collapsed' : ''}` },
      E('div', { className: 'brand-block guided-brand' },
        E('img', { className: 'brand-logo-main', src: '/assets/asobigrie-logo.jpg', alt: 'ASOBIGRIE' }),
        E('div', { className: 'brand-copy' },
          E('div', { className: 'brand-title' }, 'CaromChamps'),
          E('div', { className: 'brand-subtitle' }, isRankingChampionship ? 'Centro de Ranking' : 'Centro de Operación'),
          E('div', { className: 'brand-secondary' }, E('img', { src: '/assets/fecobi-logo.jpg', alt: 'FECOBI' }), E('span', null, 'UX guiada v5.9'))
        )
      ),
      E('div', { className: 'menu-toolbar' },
        E(Button, { onClick: () => setCollapsed(!collapsed), kind: 'soft', title: collapsed ? 'Expandir menú' : 'Contraer menú' }, collapsed ? '☰' : '⇤ Contraer'),
        E(Button, { onClick: () => setUxMode('classic'), kind: 'soft', title: 'Volver temporalmente a la interface anterior' }, collapsed ? '↩' : 'Interface clásica')
      ),
      E('nav', { className: 'tabs guided-tabs', 'aria-label': 'Navegación por flujo de trabajo' },
        GUIDED_NAV_GROUPS.map((group) => {
          const groupTabs = group.tabs.map(getTabMeta).filter(([id]) => visibleIds.has(id));
          if (!groupTabs.length) return null;
          const activeGroup = groupTabs.some(([id]) => id === tab);
          return E('section', { key: group.id, className: `guided-nav-group ${activeGroup ? 'active' : ''}` },
            E('div', { className: 'guided-nav-group-title' },
              E('b', null, group.label),
              E('span', null, group.hint)
            ),
            groupTabs.map(([id, label, icon]) => E('button', { key: id, onClick: () => navigate(id), className: `tab ${tab === id ? 'active' : ''}`, title: label }, E('span', { className: 'tab-icon' }, icon), E('span', { className: 'tab-label' }, label)))
          );
        })
      ),
      E('div', { className: 'side-profile-actions' },
        E(Button, { onClick: () => navigate('profile'), kind: tab === 'profile' ? 'primary' : 'soft', title: 'Ajustes de perfil' }, collapsed ? '☻' : 'Perfil'),
        E(Button, { onClick: auth?.signOut, kind: 'danger', title: 'Cerrar sesión' }, collapsed ? '⏻' : 'Cerrar sesión')
      )
    );
  }

  return E('header', { className: `header ${collapsed ? 'collapsed' : ''}` },
    E('div', { className: 'brand-block' },
      E('img', { className: 'brand-logo-main', src: '/assets/asobigrie-logo.jpg', alt: 'ASOBIGRIE' }),
      E('div', { className: 'brand-copy' },
        E('div', { className: 'brand-title' }, 'CaromChamps'),
        E('div', { className: 'brand-subtitle' }, 'Control de Campeonatos'),
        E('div', { className: 'brand-secondary' }, E('img', { src: '/assets/fecobi-logo.jpg', alt: 'FECOBI' }), E('span', null, 'FECOBI / ASOBIGRIE'))
      )
    ),
    E('div', { className: 'menu-toolbar' },
      E(Button, { onClick: () => setCollapsed(!collapsed), kind: 'soft', title: collapsed ? 'Expandir menú' : 'Contraer menú' }, collapsed ? '☰' : '⇤ Contraer'),
      E(Button, { onClick: () => setUxMode('guided'), kind: 'soft', title: 'Probar nueva interface guiada' }, collapsed ? '✨' : 'Nueva interface')
    ),
    E('nav', { className: 'tabs' }, tabs.map(([id, label, icon]) => E('button', { key: id, onClick: () => navigate(id), className: `tab ${tab === id ? 'active' : ''}`, title: label }, E('span', { className: 'tab-icon' }, icon), E('span', { className: 'tab-label' }, label)))),
    E('div', { className: 'side-profile-actions' },
      E(Button, { onClick: () => navigate('profile'), kind: tab === 'profile' ? 'primary' : 'soft', title: 'Ajustes de perfil' }, collapsed ? '☻' : 'Perfil'),
      E(Button, { onClick: auth?.signOut, kind: 'danger', title: 'Cerrar sesión' }, collapsed ? '⏻' : 'Cerrar sesión')
    )
  );
}

function TopBar({ championship, auth, setTab, uxMode, setUxMode }) {
  const isGuided = uxMode === 'guided';
  return E('div', { className: `topbar ${isGuided ? 'guided-topbar' : ''}` },
    E('div', null,
      E('h1', { className: 'header-title' }, championship.name),
      E('div', { className: 'header-meta' },
        E(Badge, { kind: 'info' }, championship.status),
        E(Badge, null, championship.play_mode),
        E(Badge, { kind: 'success' }, championship.division_filter),
        E(Badge, { kind: (championship.championship_type || 'NORMAL') === 'RANKING' ? 'warning' : 'neutral' }, championship.championship_type || 'NORMAL'),
        E(Badge, { kind: 'neutral' }, championship.championship_id)
      )
    ),
    E('div', { className: 'topbar-user' },
      E('button', { type: 'button', className: `ux-switch ${isGuided ? 'guided' : 'classic'}`, onClick: () => setUxMode(isGuided ? 'classic' : 'guided'), title: isGuided ? 'Usar interface anterior' : 'Probar interface guiada' },
        E('span', null, isGuided ? '✨ UX guiada' : '↩ Clásica'),
        E('small', null, isGuided ? 'Cambiar a clásica' : 'Cambiar a nueva')
      ),
      E('span', { className: 'notification-pill' }, '3'),
      E('div', { className: 'avatar placeholder' }, (auth?.profile?.full_name || auth?.user?.email || 'CC').slice(0, 2).toUpperCase()),
      E('div', null, E('b', null, auth?.profile?.full_name || auth?.user?.email || 'Usuario'), E('div', { className: 'small' }, `${auth?.profile?.role || 'ORGANIZER'} · ${auth?.profile?.email || auth?.user?.email || ''}`)),
      E(Button, { onClick: () => setTab('profile'), kind: 'soft' }, 'Perfil'), E(Button, { onClick: auth?.signOut, kind: 'soft' }, 'Salir')
    )
  );
}

function formatAppVersion(version) {
  const normalized = String(version || '0.0.0').trim();
  return normalized.endsWith('.0') ? normalized.slice(0, -2) : normalized;
}


class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('CaromChamps runtime error', error, info);
  }
  render() {
    if (this.state.error) {
      return E('div', { className: 'app-error-boundary' },
        E(Card, { className: 'app-error-card' },
          E('h1', null, 'CaromChamps encontró un problema al cargar la aplicación'),
          E('p', null, 'Se evitó que la pantalla quedara completamente en blanco. Copie el detalle técnico si necesita soporte.'),
          E('pre', null, String(this.state.error?.message || this.state.error)),
          E('div', { className: 'toolbar' },
            E(Button, { kind: 'primary', onClick: () => window.location.reload() }, 'Recargar'),
            E(Button, { kind: 'soft', onClick: async () => { try { localStorage.clear(); sessionStorage.clear(); } catch {} window.location.href = '/'; } }, 'Limpiar sesión local')
          )
        )
      );
    }
    return this.props.children;
  }
}


function normalizePlayerNameKey(player) {
  return `${player?.first_name || ''} ${player?.last_name || ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}


const FORCED_INTERNATIONAL_PLAYERS = {
  'tirso gonzalez': { country_iso: 'DO', association_code: 'INTERNACIONAL', id_type: 'PASAPORTE' },
  'marcos valencia': { country_iso: 'PA', association_code: 'INTERNACIONAL', id_type: 'PASAPORTE' },
  'william pitty': { country_iso: 'PA', association_code: 'INTERNACIONAL', id_type: 'PASAPORTE' },
  'carlos nunez': { country_iso: 'PA', association_code: 'INTERNACIONAL', id_type: 'PASAPORTE' },
  'ricardo espinoza': { country_iso: 'PA', association_code: 'INTERNACIONAL', id_type: 'PASAPORTE' },
  'victor espinoza': { country_iso: 'PA', association_code: 'INTERNACIONAL', id_type: 'PASAPORTE' },
  'rafael bardayan': { country_iso: 'PA', association_code: 'INTERNACIONAL', id_type: 'PASAPORTE' },
  'julio atencio': { country_iso: 'PA', association_code: 'INTERNACIONAL', id_type: 'PASAPORTE' },
  'daniel acosta': { country_iso: 'PA', association_code: 'INTERNACIONAL', id_type: 'PASAPORTE' },
  'faustino murillo': { country_iso: 'PA', association_code: 'INTERNACIONAL', id_type: 'PASAPORTE' },
  'carlos patino': { country_iso: 'PA', association_code: 'INTERNACIONAL', id_type: 'PASAPORTE' },
  'pablo beltran': { country_iso: 'PA', association_code: 'INTERNACIONAL', id_type: 'PASAPORTE' }
};

function normalizeLegacyPlayerData(player) {
  const source = String(player?.source_association_label || player?.association_code || '').trim().toUpperCase();
  const forced = FORCED_INTERNATIONAL_PLAYERS[normalizePlayerNameKey(player).replace(/([a-z])([A-Z])/g, '$1 $2')] || FORCED_INTERNATIONAL_PLAYERS[`${player?.first_name || ''} ${player?.last_name || ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()];
  const mappedAssociation = forced?.association_code || (source === 'S.J.' || source === 'C.R.' || source === 'CR' ? 'AJOBI'
    : source === 'ALAJ' ? 'ASOBIGRIE'
      : source === 'P' ? 'INTERNACIONAL'
        : player?.association_code);
  const isPanama = forced?.country_iso === 'PA' || source === 'P' || (mappedAssociation === 'INTERNACIONAL' && player?.country_iso === 'PA');
  const isDominican = forced?.country_iso === 'DO';
  const cleanedNotes = String(player?.notes || '')
    .replace(/\s*·\s*Código fuente:\s*(S\.J\.|C\.R\.|CR|ALAJ|P)/gi, '')
    .replace(/Código fuente:\s*(S\.J\.|C\.R\.|CR|ALAJ|P)/gi, '')
    .trim();
  return {
    ...player,
    association_code: mappedAssociation || player?.association_code || 'AJOBI',
    country_iso: forced?.country_iso || (isPanama ? 'PA' : (player?.country_iso || 'CR')),
    id_type: (isPanama || isDominican) ? 'PASAPORTE' : (player?.id_type || 'CEDULA'),
    division_level: (isPanama || isDominican) ? 'NA' : (player?.division_level || 'PRIMERA'),
    previous_division_level: (isPanama || isDominican) ? 'NA' : (player?.previous_division_level || player?.division_level || 'PRIMERA'),
    source_association_label: '',
    notes: cleanedNotes || player?.notes || ''
  };
}

function mergeDefaultPlayers(savedPlayers = [], defaultPlayers = []) {
  const normalizedSaved = savedPlayers.map(normalizeLegacyPlayerData);
  const existingKeys = new Set(normalizedSaved.map(normalizePlayerNameKey));
  const nextPlayers = [...normalizedSaved];
  defaultPlayers.forEach((player) => {
    const key = normalizePlayerNameKey(player);
    if (!existingKeys.has(key)) {
      nextPlayers.push(player);
      existingKeys.add(key);
    }
  });
  return nextPlayers;
}


function championshipStage(championship, groups, matches, seeds) {
  const type = championship?.championship_type || 'NORMAL';
  if (type === 'RANKING') return 'RANKING';
  const completed = matches.filter((m) => m.match_status === 'COMPLETED').length;
  const koMatches = matches.filter((m) => m.phase === 'KO');
  const finalDone = koMatches.some((m) => matchRoundLabel(m) === 'Final' && m.match_status === 'COMPLETED');
  if ((championship.status || '').includes('COMPLETED')) return 'COMPLETED';
  if ((championship.status || '').includes('FINALIZED') || finalDone) return 'FINALIZED';
  if (koMatches.length) return 'KO_IN_PROGRESS';
  if (seeds.length) return 'GROUPS_CLOSED';
  if (groups.length && matches.length && completed < matches.length) return 'GROUPS_IN_PROGRESS';
  if (groups.length && matches.length) return 'GROUPS_READY';
  if (players.length) return 'CONFIGURATION';
  return 'DRAFT';
}

function nextActionForStage(stage, isRanking) {
  if (isRanking) return { title: 'Revisar ranking acumulado', description: 'Asocie campeonatos normales cerrados y genere la tabla de posiciones.', tab: 'ranking', label: 'Ir a Ranking' };
  const map = {
    DRAFT: { title: 'Completar datos del campeonato', description: 'Defina sede, fechas, reglas, fases y parámetros básicos.', tab: 'setup', label: 'Completar campeonato' },
    CONFIGURATION: { title: 'Generar grupos', description: 'Revise jugadores elegibles y genere la fase de grupos.', tab: 'groups', label: 'Ir a Grupos' },
    GROUPS_READY: { title: 'Generar agenda o capturar resultados', description: 'Programe mesas/horarios o inicie captura de partidas.', tab: 'schedule', label: 'Ir a Calendario' },
    GROUPS_IN_PROGRESS: { title: 'Completar resultados de grupos', description: 'Capture partidas pendientes y valide standings.', tab: 'matches', label: 'Capturar partidas' },
    GROUPS_CLOSED: { title: 'Generar llaves', description: 'Los clasificados están listos para crear eliminación directa.', tab: 'ko', label: 'Ir a Llaves' },
    KO_IN_PROGRESS: { title: 'Completar fase KO', description: 'Revise la ronda activa y capture resultados hasta la Final.', tab: 'ko', label: 'Continuar Llaves' },
    FINALIZED: { title: 'Generar acta y cerrar campeonato', description: 'Revise ranking final, reportes y cierre administrativo.', tab: 'close', label: 'Ir a Cierre' },
    COMPLETED: { title: 'Campeonato cerrado', description: 'Genere reportes oficiales o comparta resultados.', tab: 'reports', label: 'Ver Reportes' }
  };
  return map[stage] || map.DRAFT;
}

function buildUxAlerts(championship, players, groups, matches, seeds) {
  const alerts = [];
  const isRanking = (championship?.championship_type || 'NORMAL') === 'RANKING';
  const completed = matches.filter((m) => m.match_status === 'COMPLETED').length;
  const pending = Math.max(0, matches.length - completed);
  if (isRanking) {
    alerts.push({ kind: 'info', text: 'Modo Ranking: no genera grupos, partidas ni llaves propias; consume campeonatos normales asociados.' });
    return alerts;
  }
  if (!groups.length) alerts.push({ kind: 'warning', text: 'Aún no hay grupos generados.' });
  if (matches.length && pending) alerts.push({ kind: 'warning', text: `${pending} partidas pendientes de completar.` });
  if (groups.length && seeds.length < Number(championship.total_qualifiers_f2 || 0)) alerts.push({ kind: 'danger', text: `Clasificados actuales: ${seeds.length}/${championship.total_qualifiers_f2}.` });
  if (!players.some((p) => p.status === 'ACTIVO')) alerts.push({ kind: 'danger', text: 'No hay jugadores activos disponibles.' });
  if (!alerts.length) alerts.push({ kind: 'success', text: 'No se detectan alertas críticas en el flujo actual.' });
  return alerts;
}

function RankingModeBanner({ championship, championships }) {
  if ((championship?.championship_type || 'NORMAL') !== 'RANKING') return null;
  const associated = championships.filter((row) => row.championship?.ranking_championship_id === championship.championship_id && row.championship?.championship_type !== 'RANKING');
  const closed = associated.filter((row) => ['FINALIZED', 'COMPLETED'].some((status) => String(row.championship?.status || '').includes(status))).length;
  return E(Card, { className: 'ux-ranking-banner' },
    E('div', null,
      E('h2', null, 'Campeonato tipo Ranking'),
      E('p', null, 'Este campeonato no requiere asociación manual de jugadores. Los jugadores y puntos se calculan desde los campeonatos normales asociados.')
    ),
    E('div', { className: 'ux-ranking-banner-stats' },
      E(Stat, { label: 'Campeonatos asociados', value: associated.length }),
      E(Stat, { label: 'Cerrados', value: closed }),
      E(Stat, { label: 'Pendientes', value: associated.length - closed })
    )
  );
}

function WorkflowStepper({ stage, setTab, isRanking }) {
  const normalSteps = [
    ['CONFIGURATION', 'Configurar', 'setup'],
    ['GROUPS_READY', 'Grupos', 'groups'],
    ['GROUPS_IN_PROGRESS', 'Captura', 'matches'],
    ['GROUPS_CLOSED', 'Clasificar', 'groups'],
    ['KO_IN_PROGRESS', 'Llaves', 'ko'],
    ['FINALIZED', 'Cierre', 'close']
  ];
  const rankingSteps = [['RANKING', 'Reglas Ranking', 'setup'], ['RANKING', 'Asociados', 'championships'], ['RANKING', 'Tabla Ranking', 'ranking'], ['RANKING', 'PDF Ranking', 'ranking']];
  const steps = isRanking ? rankingSteps : normalSteps;
  const activeIndex = isRanking ? 2 : Math.max(0, steps.findIndex(([key]) => key === stage));
  return E('div', { className: 'ux-stepper' }, steps.map(([key, label, tabId], index) => E('button', { key: `${key}-${label}`, type: 'button', onClick: () => setTab(tabId), className: `ux-step ${index <= activeIndex ? 'done' : ''} ${index === activeIndex ? 'active' : ''}` },
    E('span', null, index + 1),
    E('b', null, label)
  )));
}

function UxActionCenter({ championship, players, groups, matches, seeds, championships, setTab }) {
  const isRanking = (championship?.championship_type || 'NORMAL') === 'RANKING';
  const stage = championshipStage(championship, groups, matches, seeds);
  const action = nextActionForStage(stage, isRanking);
  const alerts = buildUxAlerts(championship, players, groups, matches, seeds);
  return E(Card, { className: 'ux-action-center' },
    E('div', { className: 'ux-action-main' },
      E('span', { className: 'ux-kicker' }, isRanking ? 'Centro de ranking' : 'Siguiente paso recomendado'),
      E('h2', null, action.title),
      E('p', null, action.description),
      E('div', { className: 'toolbar' },
        E(Button, { kind: 'primary', onClick: () => setTab(action.tab) }, action.label),
        !isRanking ? E(Button, { kind: 'soft', onClick: () => setTab('reports') }, 'Catálogo de reportes') : E(Button, { kind: 'soft', onClick: () => setTab('championships') }, 'Ver asociados')
      )
    ),
    E('div', { className: 'ux-alert-list' }, alerts.map((alert, index) => E('div', { key: index, className: `ux-alert ux-alert-${alert.kind}` }, alert.text)))
  );
}

function UxReportCatalog({ setTab, isRanking }) {
  const reports = isRanking ? [
    ['Ranking acumulado', 'Tabla oficial de posiciones por PRG y detalle por campeonato.', 'ranking'],
    ['Detalle por campeonato', 'PRG, CAR, ENT, AVG y posición por evento asociado.', 'ranking']
  ] : [
    ['Grupos', 'Conformación, posiciones y clasificados.', 'groups'],
    ['Partidas', 'Control operativo y resultados capturados.', 'matches'],
    ['Llaves', 'Bracket tabular, continuo y Face to Face.', 'ko'],
    ['Acta final', 'Cierre deportivo y administrativo.', 'close']
  ];
  return E(Card, { className: 'ux-report-catalog' },
    E('div', { className: 'section-title' }, E('h2', null, 'Catálogo de reportes'), E('p', null, 'Acceso guiado a reportes según el tipo y estado del campeonato.')),
    E('div', { className: 'ux-report-grid' }, reports.map(([title, description, tabId]) => E('button', { key: title, type: 'button', className: 'ux-report-card', onClick: () => setTab(tabId) },
      E('b', null, title),
      E('span', null, description)
    )))
  );
}

function UxScheduleBoardPreview({ matches }) {
  const scheduled = matches.filter((m) => m.scheduled_at || m.table_number).slice(0, 12);
  const tables = [...new Set(scheduled.map((m) => m.table_number || 'Mesa'))].slice(0, 4);
  if (!scheduled.length) return E(Card, { className: 'ux-board-preview' }, E('h2', null, 'Agenda por mesa'), E('p', { className: 'small' }, 'Cuando exista calendario generado, aquí se mostrará una vista rápida tipo tablero por mesa y hora.'));
  return E(Card, { className: 'ux-board-preview' },
    E('h2', null, 'Agenda por mesa'),
    E('div', { className: 'ux-board-grid', style: { '--ux-board-cols': tables.length || 1 } },
      tables.map((table) => E('div', { key: table, className: 'ux-board-col' },
        E('b', null, table),
        scheduled.filter((m) => (m.table_number || 'Mesa') === table).slice(0, 4).map((m) => E('span', { key: m.match_id }, `${matchCode(m)} · ${matchDisplayStatus(m)}`))
      ))
    )
  );
}

function UxCloseChecklist({ championship, matches, seeds }) {
  const koMatches = matches.filter((m) => m.phase === 'KO');
  const allCompleted = matches.length > 0 && matches.every((m) => m.match_status === 'COMPLETED');
  const hasFinal = koMatches.some((m) => matchRoundLabel(m) === 'Final');
  const finalDone = koMatches.some((m) => matchRoundLabel(m) === 'Final' && m.match_status === 'COMPLETED');
  const items = [
    ['Partidas completas', allCompleted],
    ['Clasificados generados', seeds.length >= Number(championship.total_qualifiers_f2 || 0)],
    ['Final creada', hasFinal],
    ['Final completada', finalDone],
    ['Acta / cierre disponible', allCompleted && finalDone]
  ];
  return E(Card, { className: 'ux-close-checklist' },
    E('h2', null, 'Checklist de cierre'),
    E('div', { className: 'ux-checklist' }, items.map(([label, ok]) => E('div', { key: label, className: `ux-check ${ok ? 'ok' : 'pending'}` }, E('span', null, ok ? '✓' : '•'), E('b', null, label))))
  );
}

function UxGuidedDashboard({ championship, players, groups, matches, seeds, championships, setTab }) {
  const completed = matches.filter((m) => m.match_status === 'COMPLETED').length;
  const pending = Math.max(0, matches.length - completed);
  const active = players.filter((p) => p.status === 'ACTIVO').length;
  const isRanking = (championship?.championship_type || 'NORMAL') === 'RANKING';
  const stage = championshipStage(championship, groups, matches, seeds);
  const runningVersion = formatAppVersion(appPackage.version);
  return E('div', { className: 'grid ux-dashboard' },
    E(RankingModeBanner, { championship, championships }),
    E(UxActionCenter, { championship, players, groups, matches, seeds, championships, setTab }),
    E(WorkflowStepper, { stage, setTab, isRanking }),
    E('div', { className: 'grid grid-6 ux-stat-strip' },
      E(Stat, { label: 'Versión', value: `v${runningVersion}`, hint: 'Interface guiada disponible' }),
      E(Stat, { label: 'Jugadores activos', value: active }),
      E(Stat, { label: 'Grupos', value: groups.length || '-' }),
      E(Stat, { label: 'Partidas', value: matches.length, hint: `${completed} completas · ${pending} pendientes` }),
      E(Stat, { label: 'Clasificados', value: seeds.length || '-', hint: `Objetivo ${championship.total_qualifiers_f2}` }),
      E(Stat, { label: 'Estado UX', value: isRanking ? 'Ranking' : stage })
    ),
    E('div', { className: 'grid grid-2' },
      E(UxReportCatalog, { setTab, isRanking }),
      E(UxCloseChecklist, { championship, matches, seeds })
    ),
    E(UxScheduleBoardPreview, { matches })
  );
}

function UxContextPanel({ championship, championships, tab, setTab }) {
  const isRanking = (championship?.championship_type || 'NORMAL') === 'RANKING';
  const tabMeta = getTabMeta(tab);
  const tips = isRanking ? [
    'Los jugadores se agregan automáticamente desde campeonatos normales asociados.',
    'Los menús de grupos, agenda, partidas y llaves se ocultan para evitar errores de operación.',
    'Use Ranking para consultar tabla, detalle por campeonato y PDF oficial.'
  ] : [
    'Use el flujo Preparar → Operar → Resultados → Cierre para reducir errores.',
    'Genere reportes desde el catálogo o desde cada módulo según el momento del campeonato.',
    'Antes de cerrar, revise partidas completas, clasificados y final completada.'
  ];
  return E(Card, { className: `ux-context-panel ${isRanking ? 'ranking' : 'normal'}` },
    E('div', null,
      E('span', { className: 'ux-kicker' }, isRanking ? 'Modo Ranking explicado' : 'Guía contextual'),
      E('h2', null, `${tabMeta[2]} ${tabMeta[1]}`),
      E('p', null, isRanking ? 'Este campeonato consolida puntos desde otros campeonatos. No requiere selección directa de jugadores.' : 'Interface guiada activa: mantiene los mismos módulos y agrega orientación operacional.')
    ),
    E('ul', null, tips.map((tip) => E('li', { key: tip }, tip))),
    E('div', { className: 'toolbar' },
      isRanking ? E(Button, { kind: 'primary', onClick: () => setTab('ranking') }, 'Ir a Ranking') : E(Button, { kind: 'soft', onClick: () => setTab('dashboard') }, 'Centro de control'),
      isRanking ? E(Button, { kind: 'soft', onClick: () => setTab('championships') }, 'Campeonatos asociados') : E(Button, { kind: 'soft', onClick: () => setTab('reports') }, 'Reportes')
    )
  );
}

function Dashboard({ championship, players, groups, matches, seeds, championships }) {
  const completed = matches.filter((m) => m.match_status === 'COMPLETED').length;
  const pending = matches.length - completed;
  const active = players.filter((p) => p.status === 'ACTIVO').length;
  const koCount = matches.filter((m) => m.phase === 'KO').length;
  const groupSizes = groups.length ? groups.map((g) => g.players.length).join(' / ') : 'Sin grupos';
  const runningVersion = formatAppVersion(appPackage.version);
  const releaseTitle = `CaromChamps v${runningVersion} · Bracket, grupos y reportes institucionales`;
  const releaseSummary = `Versión activa v${runningVersion}: gestión de campeonatos múltiples, captura avanzada, Reporte 5, cierre deportivo/administrativo, llaves tabulares y continuas, ranking final y exportaciones institucionales CSV/PDF. Instancia inicial FECOBI / ASOBIGRIE.`;
  return E('div', { className: 'grid' },
    E('div', { className: 'grid grid-6' },
      E(Stat, { label: 'Campeonatos', value: championships.length || 1 }),
      E(Stat, { label: 'Jugadores activos', value: active }),
      E(Stat, { label: 'Grupos', value: groups.length || '-', hint: groupSizes }),
      E(Stat, { label: 'Partidas', value: matches.length, hint: `${completed} completadas · ${pending} pendientes` }),
      E(Stat, { label: 'Clasificados', value: seeds.length || '-', hint: `Objetivo ${championship.total_qualifiers_f2}` }),
      E(Stat, { label: 'KO', value: koCount || '-', hint: championship.status })
    ),
    E(Card, null,
      E('h2', null, releaseTitle),
      E('p', { className: 'small' }, releaseSummary),
      E('div', { className: 'grid grid-4', style: { marginTop: 14 } },
        E('div', { className: 'round-card' }, E('b', null, 'Cierre: '), 'FINALIZED / COMPLETED'),
        E('div', { className: 'round-card' }, E('b', null, 'Reporte 5: '), 'Sugerencia + confirmación'),
        E('div', { className: 'round-card' }, E('b', null, 'Captura: '), 'validación + masivo'),
        E('div', { className: 'round-card' }, E('b', null, 'Reportes: '), 'Grupo, bracket, ranking, acta')
      )
    )
  );
}

function cloneChampionship(championship, suffix = 'COPIA') {
  const nextId = `CH-${uid('NEW').slice(4, 10).toUpperCase()}`;
  return { ...championship, championship_id: nextId, name: `${championship.name} ${suffix}`, status: 'DRAFT', closed_at: '', closed_by: '', finalized_at: '', finalized_by: '', division_movements_confirmed: false, confirmation_note: '' };
}

function AppShell({ auth }) {
  window.ReactRuntime = React;
  const storageKey = userStorageKey(auth?.user);
  const saved = loadState(storageKey, auth?.profile?.role === 'ADMIN' ? STORAGE_KEY : '');
  const initialChampionship = saved?.championship || DEFAULT_CHAMPIONSHIP;
  const [players, setPlayers] = useState(saved?.players ? mergeDefaultPlayers(saved.players, DEFAULT_PLAYERS) : DEFAULT_PLAYERS.map(normalizeLegacyPlayerData));
  const [championship, setChampionship] = useState(initialChampionship);
  const [groups, setGroups] = useState(saved?.groups || []);
  const [matches, setMatches] = useState(saved?.matches || []);
  const [seeds, setSeeds] = useState(saved?.seeds || []);
  const [items, setItems] = useState(saved?.items || []);
  const [tab, setTab] = useState('dashboard');
  const [menuCollapsed, setMenuCollapsed] = useState(false);
  const [activeId, setActiveId] = useState(saved?.activeId || initialChampionship.championship_id);
  const [championships, setChampionships] = useState(saved?.championships || [makeChampionshipSnapshot(initialChampionship, saved?.groups || [], saved?.matches || [], saved?.seeds || [])]);
  const [historyPlayerId, setHistoryPlayerId] = useState('');
  const [uxMode, setUxModeState] = useState(() => {
    try { return localStorage.getItem(UX_MODE_KEY) || 'guided'; } catch { return 'guided'; }
  });
  const setUxMode = (mode) => {
    const next = mode === 'classic' ? 'classic' : 'guided';
    setUxModeState(next);
    try { localStorage.setItem(UX_MODE_KEY, next); } catch {}
  };
  const [syncStatus, setSyncStatus] = useState('Sincronización local activa');
  const [remoteReady, setRemoteReady] = useState(false);
  const didLoadRemote = useRef(false);
  const isRankingChampionship = (championship?.championship_type || 'NORMAL') === 'RANKING';

  useEffect(() => {
    if (isRankingChampionship && RANKING_BLOCKED_TABS.has(tab)) setTab('ranking');
  }, [isRankingChampionship, tab]);


  useEffect(() => {
    const handler = (event) => {
      const target = event.target?.closest?.('.player-history-trigger');
      if (!target) return;
      const playerId = target.getAttribute('data-player-id');
      if (!playerId) return;
      event.preventDefault();
      event.stopPropagation();
      setHistoryPlayerId(playerId);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    if (!auth?.user?.id || didLoadRemote.current) return;
    didLoadRemote.current = true;
    loadUserAppState(auth.user.id).then(({ state, error }) => {
      if (error) {
        setSyncStatus(`Sincronización local activa. Supabase: ${error.message}`);
        setRemoteReady(true);
        return;
      }
      if (!state) {
        setSyncStatus('Sincronizado localmente. Pendiente primera copia en Supabase.');
        setRemoteReady(true);
        return;
      }
      setPlayers(state.players ? mergeDefaultPlayers(state.players, DEFAULT_PLAYERS) : DEFAULT_PLAYERS.map(normalizeLegacyPlayerData));
      setChampionship(state.championship || DEFAULT_CHAMPIONSHIP);
      setGroups(state.groups || []);
      setMatches(state.matches || []);
      setSeeds(state.seeds || []);
      setItems(state.items || []);
      setChampionships(state.championships || [makeChampionshipSnapshot(state.championship || DEFAULT_CHAMPIONSHIP, state.groups || [], state.matches || [], state.seeds || [])]);
      setActiveId(state.activeId || state.championship?.championship_id || DEFAULT_CHAMPIONSHIP.championship_id);
      setSyncStatus('Datos cargados desde Supabase.');
      setRemoteReady(true);
    });
  }, [auth?.user?.id]);

  useEffect(() => {
    setChampionships((prev) => {
      const snapshot = makeChampionshipSnapshot(championship, groups, matches, seeds);
      const exists = prev.some((row) => row.id === championship.championship_id);
      return exists ? prev.map((row) => row.id === championship.championship_id ? { ...row, ...snapshot } : row) : [...prev, snapshot];
    });
  }, [championship, groups, matches, seeds]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ players, championship, groups, matches, seeds, items, championships, activeId }));
    } catch (error) {
      console.warn('No fue posible guardar el estado local. Revise tamaño de fotografías o almacenamiento del navegador.', error);
    }
  }, [players, championship, groups, matches, seeds, items, championships, activeId, storageKey]);

  useEffect(() => {
    if (!auth?.user?.id || !remoteReady) return;
    const state = { players, championship, groups, matches, seeds, items, championships, activeId };
    const timer = setTimeout(() => {
      saveUserAppState(auth.user.id, state).then(({ error }) => {
        setSyncStatus(error ? `No sincronizado con Supabase: ${error.message}` : `Sincronizado con Supabase · ${formatDateTimeEs(new Date())}`);
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [players, championship, groups, matches, seeds, items, championships, activeId, auth?.user?.id, remoteReady]);

  const audit = (type, detail) => setItems((prev) => [{ id: uid('A'), type, detail, timestamp: formatDateTimeEs(new Date()), championship_id: championship.championship_id }, ...prev]);

  const loadChampionship = (id) => {
    const row = championships.find((item) => item.id === id);
    if (!row) return;
    setChampionship(row.championship);
    setGroups(row.groups || []);
    setMatches(row.matches || []);
    setSeeds(row.seeds || []);
    setActiveId(id);
    setTab('dashboard');
  };

  const createChampionship = () => {
    const next = cloneChampionship(DEFAULT_CHAMPIONSHIP, 'Nuevo');
    setChampionship(next);
    setGroups([]);
    setMatches([]);
    setSeeds([]);
    setActiveId(next.championship_id);
    setItems((prev) => [{ id: uid('A'), type: 'CHAMPIONSHIP_CREATED', detail: `Creado ${next.name}`, timestamp: formatDateTimeEs(new Date()), championship_id: next.championship_id }, ...prev]);
    setTab('setup');
  };

  const duplicateChampionship = () => {
    const next = cloneChampionship(championship, 'Copia');
    setChampionship(next);
    setGroups([]);
    setMatches([]);
    setSeeds([]);
    setActiveId(next.championship_id);
    setItems((prev) => [{ id: uid('A'), type: 'CHAMPIONSHIP_DUPLICATED', detail: `Duplicado desde ${championship.name}`, timestamp: formatDateTimeEs(new Date()), championship_id: next.championship_id }, ...prev]);
    setTab('setup');
  };

  const deleteChampionship = (id) => {
    if (id === activeId) return alert('No se puede eliminar el campeonato activo. Abra otro campeonato primero.');
    if (!window.confirm('¿Eliminar campeonato y todos sus datos locales?')) return;
    setChampionships(championships.filter((row) => row.id !== id));
  };

  const resetDemo = () => {
    localStorage.removeItem(storageKey);
    setPlayers(DEFAULT_PLAYERS);
    setChampionship(DEFAULT_CHAMPIONSHIP);
    setGroups([]);
    setMatches([]);
    setSeeds([]);
    setActiveId(DEFAULT_CHAMPIONSHIP.championship_id);
    setChampionships([makeChampionshipSnapshot(DEFAULT_CHAMPIONSHIP, [], [], [])]);
    setItems([{ id: uid('A'), type: 'RESET', detail: 'Demo reiniciada', timestamp: formatDateTimeEs(new Date()) }]);
    setTab('dashboard');
  };

  const runFullDemo = () => {
    const enrolled = getEligiblePlayers(championship, players);
    const count = Math.ceil(enrolled.length / Number(championship.preferred_group_size || 4));
    const cfg = { ...championship, total_qualifiers_f2: count * Number(championship.qualifiers_per_group || 0) + Number(championship.extra_qualifiers_count || 0), status: 'DEMO_READY' };
    const generatedGroups = generateGroups(cfg, enrolled);
    const groupMatches = autoFillMatches(generateRoundRobinMatches(cfg, generatedGroups), `${cfg.random_seed}-full-demo`);
    const qualified = qualify(groupStandings(generatedGroups, groupMatches), cfg);
    const koMatches = generateFullKnockoutDemo(cfg, qualified, groupMatches.length + 1, `${cfg.random_seed}-full-demo-ko`);
    const allMatches = scheduleMatches(cfg, [...groupMatches, ...koMatches]);
    setChampionship(cfg);
    setGroups(generatedGroups);
    setMatches(allMatches);
    setSeeds(qualified);
    setItems((prev) => [{ id: uid('A'), type: 'FULL_DEMO', detail: 'Flujo completo generado con resultados, clasificados, bracket y agenda.', timestamp: formatDateTimeEs(new Date()), championship_id: cfg.championship_id }, ...prev]);
    setTab('dashboard');
  };

  const clearOnlyResults = () => {
    setMatches(clearResults(matches));
    audit('CLEAR_RESULTS', 'Resultados borrados.');
  };

  const shareChampionship = async (rowId = activeId) => {
    const row = championships.find((item) => item.id === rowId) || makeChampionshipSnapshot(championship, groups, matches, seeds);
    const snapshot = { ...row, players, championship: row.championship || championship, groups: row.groups || groups, matches: row.matches || matches, seeds: row.seeds || seeds };
    const { data, error } = await createChampionshipShare({ userId: auth?.user?.id, championshipSnapshot: snapshot });
    if (error) { alert(`No fue posible generar el enlace: ${error.message}`); return; }
    const link = `${window.location.origin}/shared/championship/${data.token}`;
    try { await navigator.clipboard.writeText(link); } catch {}
    audit('SHARE_CREATED', `Enlace compartido generado para ${snapshot.name || championship.name}`);
    alert(`Enlace copiado para compartir:
${link}`);
  };

  const shared = { championship, setChampionship, players, setPlayers, groups, setGroups, matches, setMatches, seeds, setSeeds, audit };
  const uiTheme = championship.global_settings?.ui_theme === 'dark' ? 'dark' : 'light';
  if (typeof window !== 'undefined') window.__CAROMCHAMPS_LANGUAGE__ = championship.global_settings?.language || 'es';

  return E('div', { className: `app-shell theme-${uiTheme} ${menuCollapsed ? 'menu-collapsed' : ''} ux-mode-${uxMode}` },
    E(Header, { championship, tab, setTab, collapsed: menuCollapsed, setCollapsed: setMenuCollapsed, auth, uxMode, setUxMode }),
    E('main', { className: 'main' },
      E(TopBar, { championship, auth, setTab, uxMode, setUxMode }),
      uxMode === 'guided' ? E(UxContextPanel, { championship, championships, tab, setTab }) : null,
      !isRankingChampionship ? E(Card, null,
        E('div', { className: 'toolbar' },
          E(Button, { onClick: runFullDemo, kind: 'success' }, 'Demo completa'),
          E(Button, { onClick: () => { setMatches(autoFillMatches(matches, 'quick-fill')); audit('QUICK_RESULTS', 'Resultados rápidos aplicados.'); }, kind: 'success' }, 'Resultados rápidos'),
          E(Button, { onClick: clearOnlyResults, kind: 'warning' }, 'Limpiar resultados'),
          E(Button, { onClick: resetDemo, kind: 'danger' }, 'Reiniciar demo')
        )
      ) : null,
      E('div', { className: 'sync-status' }, syncStatus),
      tab === 'dashboard' && (uxMode === 'guided' ? E(UxGuidedDashboard, { championship, players, groups, matches, seeds, championships, setTab }) : E(Dashboard, { championship, players, groups, matches, seeds, championships })),
      tab === 'championships' && E(ChampionshipsModule, { championships, activeId, loadChampionship, createChampionship, duplicateChampionship, deleteChampionship, championship, groups, matches, seeds, shareChampionship }),
      tab === 'players' && E(PlayersModule, shared),
      tab === 'setup' && E(SetupModule, { championship, setChampionship, players, championships, activeId }),
      tab === 'groups' && E(GroupsModule, shared),
      tab === 'schedule' && E(ScheduleModule, { championship, setChampionship, players, matches, setMatches, seeds, audit }),
      tab === 'matches' && E(CaptureModule, { championship, players, matches, setMatches, audit }),
      tab === 'ko' && E(BracketModule, { championship, players, matches, setMatches, seeds, audit }),
      tab === 'reports' && E(ReportsModule, { players, matches, groups, seeds, championship }),
      tab === 'ranking' && E(RankingModule, { championship, championships, players }),
      tab === 'config' && E(ConfigurationModule, { championship, setChampionship }),
      tab === 'admin' && E(MaintenanceModule, { championship, setChampionship }),
      tab === 'officials' && E(OfficialsModule, { championship, setChampionship, players, matches }),
      tab === 'close' && E(CloseTournamentModule, { championship, setChampionship, players, setPlayers, matches, setMatches, seeds, audit }),
      tab === 'audit' && E(AuditModule, { items }),
      tab === 'profile' && E(ProfileSettings, { auth, onProfileUpdated: auth?.updateProfile })
    ),
    historyPlayerId ? E(PlayerHistoryModal, {
      player: players.find((p) => p.player_id === historyPlayerId),
      players,
      matches,
      championship,
      championships,
      onClose: () => setHistoryPlayerId('')
    }) : null
  );
}

export default function App() {
  return E(AppErrorBoundary, null,
    E(AuthGate, { render: (auth) => {
      const token = sharedTokenFromLocation();
      if (token) return E(SharedChampionshipView, { token, auth });
      return E(AppShell, { key: auth.user?.id, auth });
    } })
  );
}
