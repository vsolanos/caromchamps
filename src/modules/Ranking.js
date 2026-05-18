import { E, Card, Badge, SectionTitle, EmptyState } from '../components/ui.js';
import { buildFinalRankings, fmtAvg, playerName, formatDateEs } from '../lib/tournament.js';

function pointsForPosition(position, rules = []) {
  const rule = (rules || []).find((item) => Number(position) >= Number(item.from_position) && Number(position) <= Number(item.to_position));
  return rule ? Number(rule.points || 0) : 0;
}

function rankingRows(rankingChampionship, championships = []) {
  if (!rankingChampionship || rankingChampionship.championship_type !== 'RANKING') return [];
  const rules = rankingChampionship.ranking_points_rules || [];
  const associated = championships
    .filter((row) => row.id !== rankingChampionship.championship_id)
    .filter((row) => row.championship?.championship_type !== 'RANKING')
    .filter((row) => row.championship?.ranking_championship_id === rankingChampionship.championship_id);
  const map = new Map();
  associated.forEach((championshipRow) => {
    const champ = championshipRow.championship;
    const ranking = buildFinalRankings(championshipRow.players || [], championshipRow.matches || [], championshipRow.seeds || [], champ);
    ranking.forEach((item) => {
      const id = item.player?.player_id;
      if (!id) return;
      const points = pointsForPosition(item.final_position, rules);
      const current = map.get(id) || { player: item.player, championships: 0, points: 0, caroms: 0, innings: 0, wins: 0, matches: 0, details: [] };
      current.championships += 1;
      current.points += points;
      current.caroms += item.caroms || 0;
      current.innings += item.innings || 0;
      current.wins += item.wins || 0;
      current.matches += item.played || 0;
      current.details.push({ championship: champ.name, date: champ.end_date || champ.start_date, position: item.final_position, status: item.final_status, avg: item.avg, points });
      map.set(id, current);
    });
  });
  return Array.from(map.values())
    .map((row) => ({ ...row, avg: row.innings ? row.caroms / row.innings : 0 }))
    .sort((a, b) => b.points - a.points || (b.avg || 0) - (a.avg || 0) || playerName(a.player).localeCompare(playerName(b.player)))
    .map((row, index) => ({ ...row, ranking_position: index + 1 }));
}

export function RankingModule({ championship, championships }) {
  const rankingChampionships = championships.filter((row) => row.championship?.championship_type === 'RANKING');
  const activeRanking = championship.championship_type === 'RANKING'
    ? championship
    : rankingChampionships.find((row) => row.id === championship.ranking_championship_id)?.championship;
  const rows = rankingRows(activeRanking, championships);
  if (!activeRanking) {
    return E('div', { className: 'grid' }, E(EmptyState, { title: 'Sin campeonato ranking activo', message: 'Cree un campeonato de tipo Ranking o asocie un campeonato normal a un ranking desde Paso 1.' }));
  }
  const associated = championships.filter((row) => row.championship?.ranking_championship_id === activeRanking.championship_id);
  return E('div', { className: 'grid ranking-module' },
    E(Card, null,
      E(SectionTitle, { title: `Ranking · ${activeRanking.name}`, subtitle: 'Tabla acumulada por puntos según posición final de los campeonatos normales asociados.' }),
      E('div', { className: 'grid grid-4', style: { marginTop: 14 } },
        E('div', { className: 'round-card' }, E('b', null, 'Campeonatos asociados'), E('p', null, associated.length)),
        E('div', { className: 'round-card' }, E('b', null, 'Máximo ranking'), E('p', null, activeRanking.ranking_max_championships || '-')),
        E('div', { className: 'round-card' }, E('b', null, 'Jugadores con puntos'), E('p', null, rows.length)),
        E('div', { className: 'round-card' }, E('b', null, 'Fechas'), E('p', null, `${formatDateEs(activeRanking.start_date)} / ${formatDateEs(activeRanking.end_date)}`))
      )
    ),
    E(Card, null,
      rows.length ? E('div', { className: 'table-wrap' }, E('table', { className: 'ranking-table' },
        E('thead', null, E('tr', null, ['POS', 'Jugador', 'País', 'Campeonatos', 'Puntos', 'PJ', 'PG', 'CAR', 'ENT', 'AVG', 'Detalle'].map((h) => E('th', { key: h }, h)))),
        E('tbody', null, rows.map((row) => E('tr', { key: row.player.player_id },
          E('td', null, row.ranking_position),
          E('td', null, E('b', null, playerName(row.player))),
          E('td', null, row.player.country_iso || '-'),
          E('td', null, row.championships),
          E('td', null, E(Badge, { kind: 'success' }, row.points)),
          E('td', null, row.matches),
          E('td', null, row.wins),
          E('td', null, row.caroms),
          E('td', null, row.innings),
          E('td', null, fmtAvg(row.avg)),
          E('td', null, row.details.map((detail) => E('div', { className: 'small', key: `${row.player.player_id}-${detail.championship}` }, `${detail.championship}: #${detail.position} · ${detail.points} pts · AVG ${fmtAvg(detail.avg)}`)))
        )))
      )) : E(EmptyState, { title: 'Sin resultados de ranking', message: 'Asocie campeonatos normales a este ranking y finalícelos para acumular puntuaciones.' })
    )
  );
}
