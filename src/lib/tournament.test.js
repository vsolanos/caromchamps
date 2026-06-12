import { describe, it, expect } from 'vitest';
import {
  num,
  fmtAvg,
  playerName,
  uid,
  parseTableGroupBlock,
  validateChampionship,
  getPhaseRule,
  generateGroups,
  makeMatch,
  roundRobinPattern,
  generateRoundRobinMatches,
  validateMatch,
  completeMatch,
  autoFillMatches,
  buildStats,
  groupStandings,
  qualify,
  isMagicQualifierCount,
  nearestLowerMagic,
  roundForSize,
  roundDisplayName,
  nextRoundLabel,
  seedPairOrder,
  calculateTotalQualifiers,
  getEligiblePlayers,
  shuffle
} from './tournament.js';
import { DEFAULT_CHAMPIONSHIP } from '../data/defaults.js';

function makePlayer(id, first, last, overrides = {}) {
  return {
    player_id: id,
    first_name: first,
    last_name: last,
    status: 'ACTIVO',
    division_level: 'PRIMERA',
    country_iso: 'CR',
    association_code: 'ASO1',
    current_average: 1,
    is_seed: false,
    seed_number: null,
    ...overrides
  };
}

function makePlayers(count, overridesByIndex = {}) {
  return Array.from({ length: count }, (_, i) =>
    makePlayer(`P-${i + 1}`, `Nombre${i + 1}`, `Apellido${i + 1}`, overridesByIndex[i] || {})
  );
}

function championship(overrides = {}) {
  return { ...DEFAULT_CHAMPIONSHIP, participant_ids: [], participant_seeds: {}, ...overrides };
}

describe('helpers básicos', () => {
  it('num convierte valores y respeta fallback', () => {
    expect(num('5')).toBe(5);
    expect(num('abc', 7)).toBe(7);
    expect(num('', 3)).toBe(0);
    expect(num(null)).toBe(0);
  });

  it('fmtAvg formatea promedios a 3 decimales y N/A', () => {
    expect(fmtAvg(1.23456)).toBe('1.235');
    expect(fmtAvg(null)).toBe('N/A');
    expect(fmtAvg(undefined)).toBe('N/A');
    expect(fmtAvg(NaN)).toBe('N/A');
  });

  it('playerName arma nombre completo y maneja nulos', () => {
    expect(playerName({ first_name: 'Ana', last_name: 'Mora' })).toBe('Ana Mora');
    expect(playerName(null)).toBe('N/D');
  });

  it('uid genera identificadores únicos con prefijo', () => {
    const a = uid('X');
    const b = uid('X');
    expect(a).toMatch(/^X-/);
    expect(a).not.toBe(b);
  });

  it('shuffle es determinístico con la misma semilla', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(shuffle(items, 'semilla')).toEqual(shuffle(items, 'semilla'));
    expect(shuffle(items, 'semilla')).not.toEqual(items);
  });
});

describe('parseTableGroupBlock', () => {
  it('acepta 0 como grupo completo en una mesa', () => {
    const result = parseTableGroupBlock('0', 4);
    expect(result.blockSize).toBe(0);
    expect(result.fixedGroupTable).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('acepta bloque simple dentro de rango', () => {
    const result = parseTableGroupBlock('2', 4);
    expect(result.blockSize).toBe(2);
    expect(result.tableDistribution).toBe(1);
    expect(result.errors).toEqual([]);
  });

  it('acepta distribución como 4D2', () => {
    const result = parseTableGroupBlock('4D2', 4);
    expect(result.blockSize).toBe(4);
    expect(result.tableDistribution).toBe(2);
    expect(result.normalized).toBe('4D2');
    expect(result.errors).toEqual([]);
  });

  it('rechaza formato que inicia con D', () => {
    const result = parseTableGroupBlock('D2', 4);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rechaza bloque mayor a 6', () => {
    const result = parseTableGroupBlock('7', 4);
    expect(result.errors.some((e) => e.includes('entre 0 y 6'))).toBe(true);
  });

  it('rechaza bloque menor que la distribución', () => {
    const result = parseTableGroupBlock('2D3', 4);
    expect(result.errors.some((e) => e.includes('mayor o igual'))).toBe(true);
  });

  it('rechaza distribución mayor que mesas activas', () => {
    const result = parseTableGroupBlock('4D4', 2);
    expect(result.errors.some((e) => e.includes('mesas activas'))).toBe(true);
  });
});

describe('validateChampionship', () => {
  it('acepta el campeonato por defecto con suficientes jugadores', () => {
    const players = makePlayers(20);
    expect(validateChampionship(championship(), players)).toEqual([]);
  });

  it('rechaza nombre vacío y tamaño de grupo inválido', () => {
    const errors = validateChampionship(championship({ name: ' ', preferred_group_size: 2 }), makePlayers(20));
    expect(errors.some((e) => e.includes('Nombre'))).toBe(true);
    expect(errors.some((e) => e.includes('Tamaño de grupo'))).toBe(true);
  });

  it('rechaza clasificados por grupo mayor que el tamaño de grupo', () => {
    const errors = validateChampionship(championship({ qualifiers_per_group: 9 }), makePlayers(20));
    expect(errors.some((e) => e.includes('no puede superar'))).toBe(true);
  });

  it('rechaza total de clasificados mayor que jugadores', () => {
    const errors = validateChampionship(championship({ total_qualifiers_f2: 99 }), makePlayers(20));
    expect(errors.some((e) => e.includes('supera jugadores'))).toBe(true);
  });
});

describe('getPhaseRule', () => {
  it('usa la regla exacta de fase y ronda', () => {
    const rule = getPhaseRule(championship(), 'KO', 'QF');
    expect(rule.duration_minutes).toBe(90);
    expect(rule.target_points).toBe(40);
  });

  it('cae a valores del campeonato si no hay regla', () => {
    const champ = championship({ phase_rules: [], target_points: 30, innings_limit: 25, match_duration_minutes: 45 });
    const rule = getPhaseRule(champ, 'KO', 'F');
    expect(rule.target_points).toBe(30);
    expect(rule.innings_limit).toBe(25);
    expect(rule.duration_minutes).toBe(45);
  });
});

describe('getEligiblePlayers', () => {
  it('filtra por división y estado activo', () => {
    const players = makePlayers(4, {
      2: { status: 'INACTIVO' },
      3: { division_level: 'SEGUNDA' }
    });
    const eligible = getEligiblePlayers(championship({ division_filter: 'PRIMERA' }), players);
    expect(eligible.map((p) => p.player_id)).toEqual(['P-1', 'P-2']);
  });

  it('normaliza jugadores extranjeros como INTERNACIONAL', () => {
    const players = makePlayers(2, { 1: { country_iso: 'MX' } });
    const eligible = getEligiblePlayers(championship({ division_filter: 'INTERNACIONAL', championship_scope: 'INTERNACIONAL' }), players);
    const foreign = eligible.find((p) => p.player_id === 'P-2');
    expect(foreign.association_code).toBe('INTERNACIONAL');
    expect(foreign.division_level).toBe('NA');
  });
});

describe('generateGroups', () => {
  it('crea grupos balanceados según tamaño preferido', () => {
    const players = makePlayers(10);
    const groups = generateGroups(championship({ preferred_group_size: 4 }), players);
    expect(groups.length).toBe(3);
    const sizes = groups.map((g) => g.players.length).sort();
    expect(sizes).toEqual([3, 3, 4]);
    const assigned = groups.flatMap((g) => g.players.map((p) => p.player_id));
    expect(new Set(assigned).size).toBe(10);
  });

  it('es determinístico con la misma semilla', () => {
    const players = makePlayers(12);
    const champ = championship({ preferred_group_size: 4, random_seed: 'TEST-1' });
    const a = generateGroups(champ, players).map((g) => g.players.map((p) => p.player_id));
    const b = generateGroups(champ, players).map((g) => g.players.map((p) => p.player_id));
    expect(a).toEqual(b);
  });

  it('coloca cabezas de serie fijas en su grupo', () => {
    const players = makePlayers(8, {
      0: { is_seed: true, seed_number: 1 },
      1: { is_seed: true, seed_number: 2 }
    });
    const champ = championship({
      preferred_group_size: 4,
      group_generation_mode: 'SEEDED_RANDOM_COUNTRY_SPREAD',
      participant_seeds: { 'P-1': 1, 'P-2': 2 }
    });
    const groups = generateGroups(champ, players);
    expect(groups[0].players.some((p) => p.player_id === 'P-1')).toBe(true);
    expect(groups[1].players.some((p) => p.player_id === 'P-2')).toBe(true);
  });

  it('SNAKE_DRAFT reparte en serpiente por promedio', () => {
    const players = makePlayers(4, {
      0: { current_average: 4 },
      1: { current_average: 3 },
      2: { current_average: 2 },
      3: { current_average: 1 }
    });
    const groups = generateGroups(championship({ preferred_group_size: 2, group_generation_mode: 'SNAKE_DRAFT' }), players);
    expect(groups[0].players.map((p) => p.player_id)).toEqual(['P-1', 'P-4']);
    expect(groups[1].players.map((p) => p.player_id)).toEqual(['P-2', 'P-3']);
  });
});

describe('roundRobinPattern', () => {
  it.each([3, 4, 5, 6, 7, 8])('genera todas las parejas exactamente una vez para %i jugadores', (size) => {
    const rounds = roundRobinPattern(size);
    const seen = new Set();
    rounds.forEach((round) => {
      const inRound = new Set();
      round.forEach(([a, b]) => {
        const key = [Math.min(a, b), Math.max(a, b)].join('-');
        expect(seen.has(key)).toBe(false);
        seen.add(key);
        expect(inRound.has(a)).toBe(false);
        expect(inRound.has(b)).toBe(false);
        inRound.add(a);
        inRound.add(b);
      });
    });
    expect(seen.size).toBe((size * (size - 1)) / 2);
  });
});

describe('makeMatch y generateRoundRobinMatches', () => {
  it('makeMatch aplica reglas de fase y estado inicial', () => {
    const [p1, p2] = makePlayers(2);
    const match = makeMatch(championship(), p1, p2);
    expect(match.match_id).toMatch(/^M-G-/);
    expect(match.phase).toBe('GROUPS');
    expect(match.match_status).toBe('CREATED');
    expect(match.applied_target_points).toBe(40);
    expect(match.applied_closure_type).toBe('CON_CIERRE');
  });

  it('genera todas las partidas de round robin con numeración consecutiva', () => {
    const players = makePlayers(4);
    const groups = generateGroups(championship({ preferred_group_size: 4 }), players);
    const matches = generateRoundRobinMatches(championship(), groups);
    expect(matches.length).toBe(6);
    expect(matches.map((m) => m.match_number)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('validateMatch', () => {
  const baseMatch = {
    phase: 'GROUPS',
    caroms_p1: '40',
    caroms_p2: '30',
    innings_p1: '25',
    innings_p2: '25',
    s1_p1: '5',
    s2_p1: '3',
    s1_p2: '4',
    s2_p2: '2',
    penalties_p1: '',
    penalties_p2: '',
    applied_closure_type: 'CON_CIERRE'
  };

  it('acepta una partida válida de grupos', () => {
    expect(validateMatch(baseMatch, championship())).toEqual([]);
  });

  it('exige entradas mayores a cero con control de promedio', () => {
    const errors = validateMatch({ ...baseMatch, innings_p1: '0' }, championship());
    expect(errors.some((e) => e.includes('Entradas'))).toBe(true);
  });

  it('no exige entradas si el control de promedio está apagado', () => {
    const errors = validateMatch({ ...baseMatch, innings_p1: '0', innings_p2: '0' }, championship({ average_control_enabled: false }));
    expect(errors.some((e) => e.includes('Entradas'))).toBe(false);
  });

  it('CON_CIERRE requiere entradas iguales', () => {
    const errors = validateMatch({ ...baseMatch, innings_p2: '24' }, championship());
    expect(errors.some((e) => e.includes('entradas iguales'))).toBe(true);
  });

  it('SIN_CIERRE permite máximo una entrada de diferencia', () => {
    const match = { ...baseMatch, applied_closure_type: 'SIN_CIERRE', innings_p1: '25', innings_p2: '23' };
    const errors = validateMatch(match, championship());
    expect(errors.some((e) => e.includes('diferencia máxima'))).toBe(true);
  });

  it('rechaza serie S2 mayor que S1 y S1 mayor que carambolas', () => {
    const errors = validateMatch({ ...baseMatch, s2_p1: '9', s1_p1: '5' }, championship());
    expect(errors.some((e) => e.includes('S2 J1'))).toBe(true);
    const errors2 = validateMatch({ ...baseMatch, s1_p1: '99' }, championship());
    expect(errors2.some((e) => e.includes('S1 J1'))).toBe(true);
  });

  it('no permite penales en fase de grupos', () => {
    const errors = validateMatch({ ...baseMatch, penalties_p1: '1' }, championship());
    expect(errors.some((e) => e.includes('penales'))).toBe(true);
  });

  it('empate eliminatorio requiere penales diferentes', () => {
    const match = { ...baseMatch, phase: 'KO', caroms_p2: '40', penalties_p1: '1', penalties_p2: '1' };
    const errors = validateMatch(match, championship());
    expect(errors.some((e) => e.includes('Empate eliminatorio'))).toBe(true);
  });
});

describe('completeMatch', () => {
  const base = { player1_id: 'P-1', player2_id: 'P-2', phase: 'GROUPS', penalties_p1: '', penalties_p2: '' };

  it('asigna ganador por carambolas', () => {
    expect(completeMatch({ ...base, caroms_p1: '40', caroms_p2: '30' }).winner_id).toBe('P-1');
    expect(completeMatch({ ...base, caroms_p1: '20', caroms_p2: '30' }).winner_id).toBe('P-2');
  });

  it('empate en grupos queda sin ganador', () => {
    const done = completeMatch({ ...base, caroms_p1: '30', caroms_p2: '30' });
    expect(done.winner_id).toBe('');
    expect(done.match_status).toBe('COMPLETED');
  });

  it('empate eliminatorio se define por penales', () => {
    const done = completeMatch({ ...base, phase: 'KO', caroms_p1: '30', caroms_p2: '30', penalties_p1: '2', penalties_p2: '1' });
    expect(done.winner_id).toBe('P-1');
  });
});

describe('buildStats y clasificación', () => {
  it('asigna 2 puntos por victoria, 1 por empate y 0 por derrota', () => {
    const players = makePlayers(3);
    const champ = championship();
    const win = completeMatch({
      player1_id: 'P-1', player2_id: 'P-2', phase: 'GROUPS',
      caroms_p1: '40', caroms_p2: '20', innings_p1: '20', innings_p2: '20',
      s1_p1: '5', s2_p1: '2', s1_p2: '3', s2_p2: '1', penalties_p1: '', penalties_p2: ''
    });
    const draw = completeMatch({
      player1_id: 'P-2', player2_id: 'P-3', phase: 'GROUPS',
      caroms_p1: '25', caroms_p2: '25', innings_p1: '20', innings_p2: '20',
      s1_p1: '4', s2_p1: '2', s1_p2: '4', s2_p2: '2', penalties_p1: '', penalties_p2: ''
    });
    const stats = buildStats([win, draw], players, champ);
    const byId = Object.fromEntries(stats.map((row) => [row.player.player_id, row]));
    expect(byId['P-1'].points).toBe(2);
    expect(byId['P-2'].points).toBe(1);
    expect(byId['P-3'].points).toBe(1);
    expect(byId['P-1'].avg).toBeCloseTo(2.0, 3);
    expect(stats[0].player.player_id).toBe('P-1');
  });

  it('qualify selecciona directos y extras según configuración', () => {
    const players = makePlayers(8);
    const champ = championship({
      preferred_group_size: 4,
      qualifiers_per_group: 2,
      extra_qualifier_position: 3,
      extra_qualifiers_count: 1
    });
    const groups = generateGroups(champ, players);
    const matches = autoFillMatches(generateRoundRobinMatches(champ, groups), 'test-seed');
    const standings = groupStandings(groups, matches, champ);
    const seeds = qualify(standings, champ);
    expect(seeds.length).toBe(5);
    expect(seeds.filter((s) => s.type === 'DIRECT').length).toBe(4);
    expect(seeds.filter((s) => s.type === 'EXTRA').length).toBe(1);
    expect(seeds.map((s) => s.seed_position)).toEqual([1, 2, 3, 4, 5]);
    const ids = seeds.map((s) => s.player.player_id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('llaves y números mágicos', () => {
  it('calculateTotalQualifiers suma directos y extras', () => {
    expect(calculateTotalQualifiers(championship({ qualifiers_per_group: 2, extra_qualifiers_count: 2 }), 7)).toBe(16);
  });

  it('isMagicQualifierCount y nearestLowerMagic', () => {
    expect(isMagicQualifierCount(16)).toBe(true);
    expect(isMagicQualifierCount(20)).toBe(false);
    expect(nearestLowerMagic(20)).toBe(16);
    expect(nearestLowerMagic(4)).toBe(null);
  });

  it('roundForSize y roundDisplayName', () => {
    expect(roundForSize(16)).toBe('R16');
    expect(roundForSize(8)).toBe('QF');
    expect(roundForSize(4)).toBe('SF');
    expect(roundForSize(2)).toBe('F');
    expect(roundForSize(32)).toBe('R32');
    expect(roundDisplayName('QF')).toBe('Cuartos de final');
  });

  it('nextRoundLabel avanza en la secuencia', () => {
    expect(nextRoundLabel('QF')).toBe('SF');
    expect(nextRoundLabel('SF')).toBe('F');
    expect(nextRoundLabel('F')).toBe(null);
  });

  it('seedPairOrder genera el cruce clásico 1 vs último', () => {
    const pairs = seedPairOrder(8);
    expect(pairs[0]).toEqual([1, 8]);
    const all = pairs.flat().sort((a, b) => a - b);
    expect(all).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(seedPairOrder(7)).toEqual([]);
  });
});
