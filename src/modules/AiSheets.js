import { useEffect, useMemo, useState } from 'react';
import { E, Card, Button, Input, Select, Field, SectionTitle, Badge, EmptyState, Stat } from '../components/ui.js';
import { detectMatchCodeFromFileName, detectMatchCodeFromQr, listScoreSheetAttachments, saveScoreSheetAttachment, readTextIfPossible, dataUrlToFile } from '../lib/scoreSheets.js';
import { completeMatchAdvanced, fmtAvg, matchCode, matchDetailedScore, matchRoundLabel, playerName, usesAverageControl, validateMatch, num } from '../lib/tournament.js';

const ACCEPTED_AI_FILES = 'image/*,.pdf,.PDF,.png,.jpg,.jpeg,.webp,.bmp,.gif,.tif,.tiff,.txt,.csv,.json';
const CONFIDENCE_HIGH = 0.85;
const CONFIDENCE_MEDIUM = 0.62;

function normalizeText(value = '') {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function confidenceLabel(value) {
  const n = Number(value || 0);
  if (n >= CONFIDENCE_HIGH) return ['Alta', 'success'];
  if (n >= CONFIDENCE_MEDIUM) return ['Media', 'warning'];
  return ['Baja', 'danger'];
}

function extractionStatus(result) {
  if (result.duplicate) return 'Duplicada';
  if (!result.match_id) return 'Sin partida detectada';
  if (result.match_already_completed) return 'Partida finalizada · requiere confirmación';
  if ((result.confidence || 0) >= CONFIDENCE_HIGH && result.parsed?.caroms_p1 !== '' && result.parsed?.caroms_p2 !== '') return 'Lista para guardar';
  return 'Requiere revisión';
}

function defaultParsed() {
  return {
    caroms_p1: '', caroms_p2: '', innings_p1: '', innings_p2: '', s1_p1: '', s1_p2: '', s2_p1: '', s2_p2: '',
    result_type: 'NORMAL', winner_id: '', official: '', observations: ''
  };
}

function parseJsonPayload(text) {
  const raw = String(text || '').trim();
  if (!raw || !/^[[{]/.test(raw)) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function pickNumber(obj, keys) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && value !== '') return String(value);
  }
  return '';
}

function normalizeAiPayload(payload = {}) {
  const root = payload.score || payload.result || payload;
  const parsed = defaultParsed();
  parsed.caroms_p1 = pickNumber(root, ['caroms_p1', 'carambolas_p1', 'caroms1', 'carambolas1', 'p1_caroms', 'j1_carambolas']);
  parsed.caroms_p2 = pickNumber(root, ['caroms_p2', 'carambolas_p2', 'caroms2', 'carambolas2', 'p2_caroms', 'j2_carambolas']);
  parsed.innings_p1 = pickNumber(root, ['innings_p1', 'entradas_p1', 'innings1', 'entradas1', 'p1_innings', 'j1_entradas']);
  parsed.innings_p2 = pickNumber(root, ['innings_p2', 'entradas_p2', 'innings2', 'entradas2', 'p2_innings', 'j2_entradas']);
  parsed.s1_p1 = pickNumber(root, ['s1_p1', 'sm1_p1', 'sm1_j1', 'p1_sm1']);
  parsed.s1_p2 = pickNumber(root, ['s1_p2', 'sm1_p2', 'sm1_j2', 'p2_sm1']);
  parsed.s2_p1 = pickNumber(root, ['s2_p1', 'sm2_p1', 'sm2_j1', 'p1_sm2']);
  parsed.s2_p2 = pickNumber(root, ['s2_p2', 'sm2_p2', 'sm2_j2', 'p2_sm2']);
  parsed.result_type = root.match_result_type || root.tipo_resultado || root.result_type || 'NORMAL';
  parsed.winner_id = root.winner_id || root.ganador_id || '';
  parsed.official = root.official || root.arbitro || root.capturista || '';
  parsed.observations = root.observations || root.observaciones || '';
  return parsed;
}

function inferWinnerId(match, parsed) {
  if (parsed.winner_id) return parsed.winner_id;
  const c1 = num(parsed.caroms_p1, NaN);
  const c2 = num(parsed.caroms_p2, NaN);
  if (Number.isFinite(c1) && Number.isFinite(c2)) {
    if (c1 > c2) return match?.player1_id || '';
    if (c2 > c1) return match?.player2_id || '';
  }
  return '';
}

function findMatchByPlayerNames(payload = {}, matches = [], playerMap = {}) {
  const p1 = normalizeText(payload.player1_name || payload.jugador1 || payload.player_1 || '');
  const p2 = normalizeText(payload.player2_name || payload.jugador2 || payload.player_2 || '');
  if (!p1 && !p2) return null;
  return matches.find((match) => {
    const a = normalizeText(playerName(playerMap[match.player1_id]));
    const b = normalizeText(playerName(playerMap[match.player2_id]));
    return (p1 && p2 && ((a.includes(p1) && b.includes(p2)) || (a.includes(p2) && b.includes(p1))))
      || (p1 && (a.includes(p1) || b.includes(p1)))
      || (p2 && (a.includes(p2) || b.includes(p2)));
  }) || null;
}

function resolveMatchFromPayload(payload = {}, matches = [], playerMap = {}) {
  const explicitId = payload.match_id || payload.partida_id || payload.id_partida || '';
  if (explicitId) {
    const found = matches.find((match) => match.match_id === explicitId);
    if (found) return { match: found, method: 'AI_MATCH_ID' };
  }
  const rawCode = payload.match_code || payload.codigo_partida || payload.code || '';
  if (rawCode) {
    const normalizedCode = String(rawCode).toUpperCase().match(/P[-_\s]?(\d{1,4})/);
    const code = normalizedCode ? `P-${String(Number(normalizedCode[1])).padStart(3, '0')}` : String(rawCode).toUpperCase();
    const found = matches.find((match) => matchCode(match) === code);
    if (found) return { match: found, method: 'AI_MATCH_CODE' };
  }
  const byNames = findMatchByPlayerNames(payload, matches, playerMap);
  return byNames ? { match: byNames, method: 'AI_PLAYER_NAMES' } : { match: null, method: 'AI_UNMATCHED' };
}

async function callAiEndpoint(endpoint, files, championship, matches, players) {
  const context = {
    championship: { championship_id: championship.championship_id, name: championship.name, average_control_enabled: championship.average_control_enabled !== false },
    matches: matches.map((match) => ({
      match_id: match.match_id,
      match_code: matchCode(match),
      group_name: match.group_name || '',
      round: matchRoundLabel(match),
      player1_id: match.player1_id,
      player2_id: match.player2_id,
      player1_name: playerName(players.find((player) => player.player_id === match.player1_id)),
      player2_name: playerName(players.find((player) => player.player_id === match.player2_id))
    }))
  };
  const form = new FormData();
  files.forEach((file) => form.append('files', file, file.name));
  form.append('context', JSON.stringify(context));
  const response = await fetch(endpoint, { method: 'POST', body: form });
  if (!response.ok) throw new Error(`Endpoint IA respondió ${response.status}`);
  const data = await response.json();
  return Array.isArray(data) ? data : (data.results || data.items || []);
}

async function localAnalyzeFile(file, matches, playerMap) {
  const code = detectMatchCodeFromFileName(file.name);
  let match = code ? matches.find((item) => matchCode(item) === code) : null;
  let method = match ? 'LOCAL_FILENAME' : 'LOCAL_PENDING';
  const qr = await detectMatchCodeFromQr(file);
  if (!match && qr.matchId) { match = matches.find((item) => item.match_id === qr.matchId) || null; method = match ? 'LOCAL_QR' : method; }
  if (!match && qr.code) { match = matches.find((item) => matchCode(item) === qr.code) || null; method = match ? 'LOCAL_QR' : method; }
  const text = await readTextIfPossible(file);
  const json = parseJsonPayload(text);
  const payload = json ? (Array.isArray(json) ? json[0] : json) : {};
  const parsed = normalizeAiPayload(payload);
  if (!match && payload) {
    const resolved = resolveMatchFromPayload(payload, matches, playerMap);
    match = resolved.match;
    if (match) method = resolved.method;
  }
  const hasStructuredScore = Boolean(parsed.caroms_p1 || parsed.caroms_p2 || parsed.s1_p1 || parsed.s1_p2 || parsed.s2_p1 || parsed.s2_p2 || parsed.innings_p1 || parsed.innings_p2);
  const isPdf = /pdf/i.test(file.type || '') || /\.pdf$/i.test(file.name || '');
  const confidence = match ? (hasStructuredScore ? 0.78 : 0.55) : 0.25;
  const observations = isPdf && !json ? 'PDF detectado. Para extraer cada página como imagen y leer escritura manuscrita se requiere endpoint IA/OCR configurado.' : (parsed.observations || 'Lectura local: QR/código/nombre de archivo y textos estructurados.');
  return [{
    id: `AI-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    file_name: file.name,
    file_type: file.type || 'application/octet-stream',
    source_page: isPdf ? 'PDF completo' : 'Imagen/archivo único',
    match_id: match?.match_id || '',
    match_code: match ? matchCode(match) : (code || qr.code || ''),
    method,
    confidence,
    parsed: { ...parsed, observations },
    endpoint: false,
    duplicate: false,
    attachment_id: '',
    status: ''
  }];
}

function resultPatch(match, result, avgEnabled) {
  const parsed = result.parsed || defaultParsed();
  const patch = {
    caroms_p1: parsed.caroms_p1,
    caroms_p2: parsed.caroms_p2,
    s1_p1: parsed.s1_p1,
    s1_p2: parsed.s1_p2,
    s2_p1: parsed.s2_p1,
    s2_p2: parsed.s2_p2,
    match_result_type: parsed.result_type || 'NORMAL',
    winner_id: inferWinnerId(match, parsed),
    assigned_official: parsed.official || match.assigned_official || '',
    ai_sheet_imported: true,
    ai_sheet_confidence: result.confidence,
    ai_sheet_source_file: result.file_name,
    ai_sheet_imported_at: new Date().toISOString()
  };
  if (avgEnabled) {
    patch.innings_p1 = parsed.innings_p1;
    patch.innings_p2 = parsed.innings_p2;
  }
  return patch;
}

function rowKind(status) {
  if (/guardada/i.test(status)) return 'success';
  if (/duplicada/i.test(status)) return 'warning';
  if (/sin partida|error/i.test(status)) return 'danger';
  if (/lista/i.test(status)) return 'success';
  return 'warning';
}

export function AiSheetsModule({ championship, setChampionship, players, matches, setMatches, audit }) {
  const [results, setResults] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [endpointDraft, setEndpointDraft] = useState(championship.global_settings?.ai_sheet_endpoint_url || '');
  const [uploadNote, setUploadNote] = useState('');
  const playerMap = Object.fromEntries(players.map((player) => [player.player_id, player]));
  const avgEnabled = usesAverageControl(championship);
  const endpoint = endpointDraft.trim();
  const saveEndpoint = () => {
    if (!setChampionship) return;
    setChampionship({ ...championship, global_settings: { ...(championship.global_settings || {}), ai_sheet_endpoint_url: endpointDraft.trim() } });
    audit?.('AI_ENDPOINT_UPDATED', endpointDraft.trim() ? 'Endpoint IA/OCR actualizado.' : 'Endpoint IA/OCR eliminado.');
  };

  useEffect(() => {
    setEndpointDraft(championship.global_settings?.ai_sheet_endpoint_url || '');
  }, [championship.championship_id, championship.global_settings?.ai_sheet_endpoint_url]);

  useEffect(() => {
    listScoreSheetAttachments(championship.championship_id).then(setAttachments).catch(() => setAttachments([]));
  }, [championship.championship_id]);

  const refreshAttachments = () => listScoreSheetAttachments(championship.championship_id).then(setAttachments).catch(() => setAttachments([]));
  const updateResult = (id, patch) => setResults((prev) => prev.map((row) => {
    if (row.id !== id) return row;
    const next = { ...row, ...patch };
    return { ...next, status: patch.status || extractionStatus(next) };
  }));
  const updateParsed = (id, key, value) => setResults((prev) => prev.map((row) => {
    if (row.id !== id) return row;
    const next = { ...row, parsed: { ...(row.parsed || defaultParsed()), [key]: value } };
    return { ...next, status: extractionStatus(next) };
  }));

  const buildResultFromPayload = (payload, originalFile) => {
    const resolved = resolveMatchFromPayload(payload, matches, playerMap);
    const match = resolved.match;
    const parsed = normalizeAiPayload(payload);
    const confidence = Number(payload.confidence ?? payload.confianza ?? (match ? 0.88 : 0.45));
    const pageImage = payload.page_image_data_url || payload.pageImageDataUrl || payload.image_data_url || '';
    return {
      id: `AI-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file: originalFile,
      pageFile: pageImage ? dataUrlToFile(pageImage, `${match ? matchCode(match) : 'planilla'}-pagina-${payload.page_number || payload.page || 1}.png`, 'image/png') : null,
      file_name: payload.file_name || originalFile?.name || 'archivo_ia',
      file_type: originalFile?.type || 'application/octet-stream',
      source_page: payload.page_number || payload.page ? `Página ${payload.page_number || payload.page}` : (originalFile?.type?.includes('pdf') ? 'PDF procesado por IA' : 'Imagen'),
      match_id: match?.match_id || '',
      match_code: match ? matchCode(match) : (payload.match_code || payload.codigo_partida || ''),
      method: resolved.method,
      confidence,
      parsed,
      endpoint: true,
      duplicate: false,
      attachment_id: '',
      status: ''
    };
  };

  const attachDetectedFile = async (result) => {
    const match = matches.find((item) => item.match_id === result.match_id);
    if (!match || result.attachment_id) return result;
    const duplicate = attachments.some((record) => record.match_id === match.match_id && record.file_name === result.file_name && record.file_size === (result.file?.size || result.pageFile?.size || 0));
    const fileToStore = result.pageFile || result.file;
    if (!fileToStore) return { ...result, duplicate };
    if (duplicate) return { ...result, duplicate, status: 'Duplicada' };
    const record = await saveScoreSheetAttachment({
      championshipId: championship.championship_id,
      match,
      matchCode: matchCode(match),
      file: fileToStore,
      method: result.method || 'AI_ASSOCIATED',
      ocrStatus: result.endpoint ? 'AI_REVIEW_READY' : 'AI_LOCAL_REVIEW',
      ocrData: result.parsed,
      confidence: result.confidence,
      sourcePage: result.source_page,
      parentFileName: result.pageFile ? result.file_name : '',
      extractedImage: Boolean(result.pageFile)
    });
    return { ...result, attachment_id: record.id, duplicate: false };
  };

  const processFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setProcessing(true);
    setUploadNote('Procesando archivos con lectura inteligente...');
    try {
      let rows = [];
      if (endpoint) {
        const payloadRows = await callAiEndpoint(endpoint, files, championship, matches, players);
        rows = payloadRows.map((payload) => {
          const original = files.find((file) => file.name === payload.file_name || file.name === payload.parent_file_name) || files[0];
          return buildResultFromPayload(payload, original);
        });
        if (!rows.length) rows = (await Promise.all(files.map((file) => localAnalyzeFile(file, matches, playerMap)))).flat();
      } else {
        rows = (await Promise.all(files.map((file) => localAnalyzeFile(file, matches, playerMap)))).flat();
      }
      const attachedRows = [];
      for (const row of rows) {
        const attached = await attachDetectedFile({ ...row, status: extractionStatus(row), match_already_completed: matches.some((match) => match.match_id === row.match_id && ['COMPLETED', 'LOCKED'].includes(match.match_status)) });
        attachedRows.push({ ...attached, status: extractionStatus(attached) });
      }
      await refreshAttachments();
      setResults((prev) => [...attachedRows, ...prev]);
      const associated = attachedRows.filter((row) => row.match_id).length;
      const pending = attachedRows.length - associated;
      setUploadNote(`${files.length} archivo(s) recibido(s). ${associated} lectura(s) asociada(s) a partidas. ${pending} pendiente(s) de asociación/revisión.`);
      audit?.('AI_SHEETS_PROCESSED', `${files.length} archivo(s) procesado(s). Asociados: ${associated}. Pendientes: ${pending}.`);
    } catch (error) {
      setUploadNote(`Error en procesamiento IA: ${error.message}`);
      audit?.('AI_SHEETS_ERROR', error.message);
    } finally {
      setProcessing(false);
      event.target.value = '';
    }
  };

  const applyResult = (result, force = false) => {
    const match = matches.find((item) => item.match_id === result.match_id);
    if (!match) return alert('Debe asociar una partida antes de guardar el resultado.');
    const alreadyCompleted = ['COMPLETED', 'LOCKED'].includes(match.match_status);
    if (alreadyCompleted && !force && !window.confirm(`${matchCode(match)} ya tiene resultado. ¿Desea actualizarlo con la lectura IA y dejar auditoría?`)) return;
    const patched = { ...match, ...resultPatch(match, result, avgEnabled) };
    const completed = completeMatchAdvanced(patched);
    const errors = validateMatch(completed, championship);
    if (errors.length) {
      updateResult(result.id, { status: 'Requiere revisión', validation_errors: errors });
      return alert(errors.join('\n'));
    }
    setMatches((prev) => prev.map((item) => item.match_id === match.match_id ? completed : item));
    updateResult(result.id, { status: 'Guardada', applied_at: new Date().toISOString(), validation_errors: [] });
    audit?.('AI_SHEET_RESULT_APPLIED', `${matchCode(match)} · ${result.file_name} · Confianza ${Math.round((result.confidence || 0) * 100)}%.`);
  };

  const approveReliable = () => {
    const candidates = results.filter((row) => row.match_id && (row.confidence || 0) >= CONFIDENCE_HIGH && !/guardada/i.test(row.status) && !['COMPLETED', 'LOCKED'].includes(matches.find((match) => match.match_id === row.match_id)?.match_status || ''));
    if (!candidates.length) return alert('No hay lecturas de alta confianza pendientes para aprobación masiva.');
    candidates.forEach((row) => applyResult(row, true));
  };

  const matchOptions = matches.map((match) => E('option', { key: match.match_id, value: match.match_id }, `${matchCode(match)} · ${match.group_name || matchRoundLabel(match)} · ${playerName(playerMap[match.player1_id])} vs ${playerName(playerMap[match.player2_id])}`));
  const stats = useMemo(() => ({
    total: results.length,
    ready: results.filter((row) => /lista/i.test(row.status)).length,
    review: results.filter((row) => /revisión|sin partida|finalizada/i.test(row.status)).length,
    saved: results.filter((row) => /guardada/i.test(row.status)).length
  }), [results]);

  return E('div', { className: 'grid ai-sheets-module' },
    E(Card, { className: 'ai-sheets-hero' },
      E(SectionTitle, { title: 'Planillas IA · Importación inteligente', subtitle: 'Carga masiva de PDF o imágenes para identificar partida, leer marcador final, asociar evidencia y proponer resultados con revisión humana.' }),
      E('div', { className: 'grid grid-4', style: { marginTop: 14 } },
        E(Stat, { label: 'Lecturas en bandeja', value: stats.total }),
        E(Stat, { label: 'Listas para guardar', value: stats.ready }),
        E(Stat, { label: 'Requieren revisión', value: stats.review }),
        E(Stat, { label: 'Guardadas', value: stats.saved })
      ),
      E('div', { className: 'ai-sheets-flow' }, ['Subir archivos', 'Procesar con IA', 'Revisar resultados', 'Resolver conflictos', 'Guardar resultados'].map((label, index) => E('div', { key: label, className: 'ai-flow-step' }, E('span', null, index + 1), E('b', null, label))))
    ),
    E(Card, null,
      E('div', { className: 'grid grid-3' },
        E(Field, { label: 'Endpoint IA/OCR seguro', hint: 'Opcional. Debe ser un Cloudflare Worker/backend que reciba files + context y retorne JSON estructurado.' }, E('div', { className: 'ai-endpoint-row' }, E(Input, { value: endpointDraft, onChange: (e) => setEndpointDraft(e.target.value), placeholder: 'https://.../api/score-sheets/read' }), E(Button, { kind: 'soft', onClick: saveEndpoint }, 'Guardar endpoint'))),
        E(Field, { label: 'Cargar PDF o imágenes', hint: 'Acepta carga masiva. Si el PDF trae varias planillas, el endpoint IA debe devolver una fila por página/partida.' }, E('label', { className: `btn primary ai-upload-button ${processing ? 'disabled' : ''}` }, processing ? 'Procesando...' : 'Seleccionar archivos', E('input', { type: 'file', multiple: true, accept: ACCEPTED_AI_FILES, disabled: processing, onChange: processFiles })) ),
        E(Field, { label: 'Acciones' }, E('div', { className: 'toolbar' }, E(Button, { kind: 'success', onClick: approveReliable }, 'Aprobar confiables'), E(Button, { kind: 'soft', onClick: () => setResults([]) }, 'Limpiar bandeja')))
      ),
      uploadNote ? E('div', { className: 'ai-upload-note' }, uploadNote) : null,
      E('div', { className: 'ai-sheets-recommendation' },
        E('b', null, 'Reglas aplicadas: '),
        E('span', null, avgEnabled ? 'Control de promedios activo: se leerán carambolas, entradas, SM1, SM2, ganador y tipo de resultado.' : 'Control de promedios desactivado: se ignoran entradas, pero se conservan carambolas, SM1, SM2, ganador y tipo de resultado.')
      )
    ),
    !results.length ? E(EmptyState, { title: 'Sin archivos procesados', message: 'Suba planillas firmadas en PDF o imagen. La lectura local identifica QR/código de partida; la lectura manuscrita requiere endpoint IA/OCR configurado.' }) : E(Card, { className: 'ai-review-card' },
      E(SectionTitle, { title: 'Bandeja de revisión IA', subtitle: 'Revise, corrija y apruebe resultados antes de impactar las partidas oficiales.' }),
      E('div', { className: 'table-wrap ai-sheets-table-wrap' }, E('table', { className: 'ai-sheets-table' },
        E('thead', null, E('tr', null, ['Archivo', 'Partida detectada', 'Marcador', avgEnabled ? 'Entradas' : 'Entradas', 'SM1 / SM2', 'Resultado / Ganador', 'Confianza', 'Estado', 'Acción'].map((header) => E('th', { key: header }, header)))),
        E('tbody', null, results.map((row) => {
          const match = matches.find((item) => item.match_id === row.match_id);
          const [label, kind] = confidenceLabel(row.confidence);
          const parsed = row.parsed || defaultParsed();
          return E('tr', { key: row.id, className: `ai-status-row ai-status-${rowKind(row.status)}` },
            E('td', null,
              E('b', null, row.file_name),
              E('div', { className: 'small' }, row.source_page || '-'),
              row.attachment_id ? E(Badge, { kind: 'success' }, 'Evidencia asociada') : E(Badge, { kind: row.match_id ? 'warning' : 'danger' }, row.match_id ? 'Pendiente adjunto' : 'Sin adjunto')
            ),
            E('td', null, E(Select, { value: row.match_id || '', onChange: async (e) => {
              const matchId = e.target.value;
              const selectedMatch = matches.find((item) => item.match_id === matchId);
              let next = { ...row, match_id: matchId, match_code: selectedMatch ? matchCode(selectedMatch) : '', method: row.method === 'LOCAL_PENDING' ? 'MANUAL_REVIEW_MATCH' : row.method };
              if (selectedMatch && !next.attachment_id) next = await attachDetectedFile(next);
              updateResult(row.id, next);
              await refreshAttachments();
            } }, E('option', { value: '' }, 'Seleccionar partida'), matchOptions), match ? E('div', { className: 'small' }, `${playerName(playerMap[match.player1_id])} vs ${playerName(playerMap[match.player2_id])}`) : null),
            E('td', null, E('div', { className: 'ai-two-inputs' }, E(Input, { type: 'number', value: parsed.caroms_p1, onChange: (e) => updateParsed(row.id, 'caroms_p1', e.target.value), placeholder: 'Car J1' }), E(Input, { type: 'number', value: parsed.caroms_p2, onChange: (e) => updateParsed(row.id, 'caroms_p2', e.target.value), placeholder: 'Car J2' }))),
            E('td', null, avgEnabled ? E('div', { className: 'ai-two-inputs' }, E(Input, { type: 'number', value: parsed.innings_p1, onChange: (e) => updateParsed(row.id, 'innings_p1', e.target.value), placeholder: 'Ent J1' }), E(Input, { type: 'number', value: parsed.innings_p2, onChange: (e) => updateParsed(row.id, 'innings_p2', e.target.value), placeholder: 'Ent J2' })) : E(Badge, { kind: 'neutral' }, 'Ignoradas')),
            E('td', null, E('div', { className: 'ai-series-grid' }, E(Input, { type: 'number', value: parsed.s1_p1, onChange: (e) => updateParsed(row.id, 's1_p1', e.target.value), placeholder: 'SM1 J1' }), E(Input, { type: 'number', value: parsed.s1_p2, onChange: (e) => updateParsed(row.id, 's1_p2', e.target.value), placeholder: 'SM1 J2' }), E(Input, { type: 'number', value: parsed.s2_p1, onChange: (e) => updateParsed(row.id, 's2_p1', e.target.value), placeholder: 'SM2 J1' }), E(Input, { type: 'number', value: parsed.s2_p2, onChange: (e) => updateParsed(row.id, 's2_p2', e.target.value), placeholder: 'SM2 J2' }))),
            E('td', null, E('div', { className: 'ai-result-stack' },
              E(Select, { value: parsed.result_type || 'NORMAL', onChange: (e) => updateParsed(row.id, 'result_type', e.target.value) }, ['NORMAL', 'PENALTIES', 'WALKOVER', 'ADMINISTRATIVE_WIN', 'WITHDRAWAL'].map((type) => E('option', { key: type, value: type }, type))),
              E(Select, { value: parsed.winner_id || inferWinnerId(match, parsed) || '', onChange: (e) => updateParsed(row.id, 'winner_id', e.target.value) }, E('option', { value: '' }, 'Auto'), match ? E('option', { value: match.player1_id }, playerName(playerMap[match.player1_id])) : null, match ? E('option', { value: match.player2_id }, playerName(playerMap[match.player2_id])) : null),
              E('div', { className: 'small' }, match ? matchDetailedScore({ ...match, ...resultPatch(match, row, avgEnabled) }, championship) : '-')
            )),
            E('td', null, E(Badge, { kind }, `${label} · ${Math.round((row.confidence || 0) * 100)}%`), E('div', { className: 'small' }, row.method || '-')),
            E('td', null, E(Badge, { kind: rowKind(row.status) }, row.status || extractionStatus(row)), row.validation_errors?.length ? E('div', { className: 'small danger-text' }, row.validation_errors.join(' · ')) : null),
            E('td', null, E('div', { className: 'toolbar ai-row-actions' }, E(Button, { kind: 'success', onClick: () => applyResult(row) }, 'Guardar'), E(Button, { kind: 'soft', onClick: () => updateResult(row.id, { status: 'Requiere revisión' }) }, 'Revisar')))
          );
        }))
      ))
    ),
    E(Card, null,
      E(SectionTitle, { title: 'Historial de evidencias asociadas', subtitle: 'Archivos guardados en IndexedDB y vinculados a partidas del campeonato activo.' }),
      !attachments.length ? E(EmptyState, { title: 'Sin evidencias cargadas', message: 'Los archivos detectados se asociarán automáticamente a la partida correspondiente.' }) : E('div', { className: 'score-sheet-attachment-list ai-attachment-history' }, attachments.slice(0, 40).map((record) => E('div', { key: record.id, className: 'score-sheet-attachment-item' },
        E('a', { href: record.data_url, download: record.file_name, target: '_blank', rel: 'noreferrer' }, `${record.match_code || 'Sin código'} · ${record.file_name}`),
        E(Badge, { kind: record.confidence >= CONFIDENCE_HIGH ? 'success' : 'neutral' }, record.confidence ? `${Math.round(record.confidence * 100)}%` : record.ocr_status || 'Adjunto'),
        E('span', { className: 'small' }, record.source_page || record.association_method || '-')
      )))
    )
  );
}
