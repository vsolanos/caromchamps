import React, { useEffect, useState } from 'react';
import appPackage from '../package.json';
import { E, Card, Button, Badge, Stat } from './components/ui.js';
import { PlayerHistoryModal } from './components/PlayerHistory.js';
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

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function Header({ championship, tab, setTab }) {
  const tabs = [
    ['championships', 'Campeonatos', '🏆'], ['dashboard', 'Dashboard', '⌂'], ['players', 'Jugadores', '👤'], ['setup', 'Campeonato', '⚙'], ['groups', 'Grupos', '▦'],
    ['schedule', 'Calendario', '📅'], ['matches', 'Partidas', '●'], ['ko', 'Llaves', '⑂'], ['reports', 'Reportes', '▤'],
    ['config', 'Configuración', '⚙'], ['admin', 'Mantenimiento', '🛠'], ['officials', 'Árbitros', '♟'], ['close', 'Cierre', '✓'], ['audit', 'Auditoría', '◎']
  ];
  return E('header', { className: 'header' },
    E('div', { className: 'brand-block' },
      E('img', { className: 'brand-logo-main', src: '/assets/asobigrie-logo.jpg', alt: 'ASOBIGRIE' }),
      E('div', { className: 'brand-copy' },
        E('div', { className: 'brand-title' }, 'CaromChamps'),
        E('div', { className: 'brand-subtitle' }, 'Control de Campeonatos'),
        E('div', { className: 'brand-secondary' }, E('img', { src: '/assets/fecobi-logo.jpg', alt: 'FECOBI' }), E('span', null, 'FECOBI / ASOBIGRIE'))
      )
    ),
    E('nav', { className: 'tabs' }, tabs.map(([id, label, icon]) => E('button', { key: id, onClick: () => setTab(id), className: `tab ${tab === id ? 'active' : ''}` }, E('span', { className: 'tab-icon' }, icon), E('span', null, label))))
  );
}

function TopBar({ championship }) {
  return E('div', { className: 'topbar' },
    E('div', null,
      E('h1', { className: 'header-title' }, championship.name),
      E('div', { className: 'header-meta' },
        E(Badge, { kind: 'info' }, championship.status),
        E(Badge, null, championship.play_mode),
        E(Badge, { kind: 'success' }, championship.division_filter),
        E(Badge, { kind: 'neutral' }, championship.championship_id)
      )
    ),
    E('div', { className: 'topbar-user' },
      E('span', { className: 'notification-pill' }, '3'),
      E('div', { className: 'avatar placeholder' }, 'VS'),
      E('div', null, E('b', null, 'Administrador'), E('div', { className: 'small' }, 'CaromChamps'))
    )
  );
}

function formatAppVersion(version) {
  const normalized = String(version || '0.0.0').trim();
  return normalized.endsWith('.0') ? normalized.slice(0, -2) : normalized;
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

export default function App() {
  window.ReactRuntime = React;
  const saved = loadState();
  const initialChampionship = saved?.championship || DEFAULT_CHAMPIONSHIP;
  const [players, setPlayers] = useState(saved?.players ? mergeDefaultPlayers(saved.players, DEFAULT_PLAYERS) : DEFAULT_PLAYERS.map(normalizeLegacyPlayerData));
  const [championship, setChampionship] = useState(initialChampionship);
  const [groups, setGroups] = useState(saved?.groups || []);
  const [matches, setMatches] = useState(saved?.matches || []);
  const [seeds, setSeeds] = useState(saved?.seeds || []);
  const [items, setItems] = useState(saved?.items || []);
  const [tab, setTab] = useState('dashboard');
  const [activeId, setActiveId] = useState(saved?.activeId || initialChampionship.championship_id);
  const [championships, setChampionships] = useState(saved?.championships || [makeChampionshipSnapshot(initialChampionship, saved?.groups || [], saved?.matches || [], saved?.seeds || [])]);
  const [historyPlayerId, setHistoryPlayerId] = useState('');


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
    setChampionships((prev) => {
      const snapshot = makeChampionshipSnapshot(championship, groups, matches, seeds);
      const exists = prev.some((row) => row.id === championship.championship_id);
      return exists ? prev.map((row) => row.id === championship.championship_id ? { ...row, ...snapshot } : row) : [...prev, snapshot];
    });
  }, [championship, groups, matches, seeds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ players, championship, groups, matches, seeds, items, championships, activeId }));
    } catch (error) {
      console.warn('No fue posible guardar el estado local. Revise tamaño de fotografías o almacenamiento del navegador.', error);
    }
  }, [players, championship, groups, matches, seeds, items, championships, activeId]);

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
    localStorage.removeItem(STORAGE_KEY);
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

  const shared = { championship, setChampionship, players, setPlayers, groups, setGroups, matches, setMatches, seeds, setSeeds, audit };
  const uiTheme = championship.global_settings?.ui_theme === 'light' ? 'light' : 'dark';

  return E('div', { className: `app-shell theme-${uiTheme}` },
    E(Header, { championship, tab, setTab }),
    E('main', { className: 'main' },
      E(TopBar, { championship }),
      E(Card, null,
        E('div', { className: 'toolbar' },
          E(Button, { onClick: runFullDemo, kind: 'success' }, 'Demo completa'),
          E(Button, { onClick: () => { setMatches(autoFillMatches(matches, 'quick-fill')); audit('QUICK_RESULTS', 'Resultados rápidos aplicados.'); }, kind: 'success' }, 'Resultados rápidos'),
          E(Button, { onClick: clearOnlyResults, kind: 'warning' }, 'Limpiar resultados'),
          E(Button, { onClick: resetDemo, kind: 'danger' }, 'Reiniciar demo')
        )
      ),
      tab === 'dashboard' && E(Dashboard, { championship, players, groups, matches, seeds, championships }),
      tab === 'championships' && E(ChampionshipsModule, { championships, activeId, loadChampionship, createChampionship, duplicateChampionship, deleteChampionship, championship, groups, matches, seeds }),
      tab === 'players' && E(PlayersModule, shared),
      tab === 'setup' && E(SetupModule, { championship, setChampionship, players }),
      tab === 'groups' && E(GroupsModule, shared),
      tab === 'schedule' && E(ScheduleModule, { championship, setChampionship, players, matches, setMatches, seeds, audit }),
      tab === 'matches' && E(CaptureModule, { championship, players, matches, setMatches, audit }),
      tab === 'ko' && E(BracketModule, { championship, players, matches, setMatches, seeds, audit }),
      tab === 'reports' && E(ReportsModule, { players, matches, groups, seeds, championship }),
      tab === 'config' && E(ConfigurationModule, { championship, setChampionship }),
      tab === 'admin' && E(MaintenanceModule, { championship, setChampionship }),
      tab === 'officials' && E(OfficialsModule, { championship, setChampionship, players, matches }),
      tab === 'close' && E(CloseTournamentModule, { championship, setChampionship, players, setPlayers, matches, setMatches, seeds, audit }),
      tab === 'audit' && E(AuditModule, { items })
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
