import api from './api';
import { useStore } from '../store/useStore';
import { userStorage, currentUserId } from '../store/userStorage';

// Analyses a player's games with the engine in the background, so the Game analysis page
// opens instantly. Results are cached per user; the Game analysis page shares the same
// requests, so a game is never analysed twice at once.

const MAX_BACKGROUND_GAMES = 20; // newest games only, keeps browser storage small
const ANALYSIS_DEPTH = 12;
const cacheKey = id => `chessmind_analysis_${id}`;

const inflight = new Map(); // game id -> Promise of the stored result
const failed = new Set();   // games the engine could not analyse; not retried until reload
let running = false;

export function getCachedAnalysis(id) {
  try {
    const raw = userStorage.getItem(cacheKey(id));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Positions are rebuilt from the PGN, so the per-move FENs are not worth the storage.
function slim(analysis) {
  return {
    ...analysis,
    moveEvaluations: (analysis.moveEvaluations || []).map(({ fenBefore, fenAfter, bestMoveUci, ...rest }) => rest),
  };
}

// Returns the cached analysis, joins one already running, or starts a new one.
export function analyseGame(game, { force = false } = {}) {
  const id = game.platform_game_id;
  if (!force) {
    const cached = getCachedAnalysis(id);
    if (cached) return Promise.resolve(cached);
  }
  if (inflight.has(id)) return inflight.get(id);

  const hadCache = !!getCachedAnalysis(id);
  const job = (async () => {
    const res = await api.analyzeGame(game.pgn, game.player_color || 'white', id, ANALYSIS_DEPTH, force);
    if (!res?.analysis) throw new Error('The engine did not return an analysis.');
    const stored = { status: 'complete', analysis: slim(res.analysis) };
    try {
      userStorage.setItem(cacheKey(id), JSON.stringify(stored));
    } catch (e) {
      console.warn('Could not cache analysis (storage full?):', e);
    }
    // Weakness totals are only added the first time, so re-analysing never double counts.
    if (!hadCache) useStore.getState().saveGameAnalysis(id, res.analysis);
    return stored;
  })();

  inflight.set(id, job);
  const clear = () => inflight.delete(id);
  job.then(clear, clear);
  return job;
}

const needsAnalysis = g => g.pgn && !failed.has(g.platform_game_id) && !getCachedAnalysis(g.platform_game_id);

// Works through the newest unanalysed games one at a time. Safe to call repeatedly.
export async function startBackgroundAnalysis() {
  if (running) return;
  const userId = currentUserId();
  const { setBgAnalysis } = useStore.getState();
  const pendingNow = () => useStore.getState().games.slice(0, MAX_BACKGROUND_GAMES).filter(needsAnalysis);
  const total = pendingNow().length;
  if (!total) return;

  running = true;
  let done = 0;
  let misses = 0;
  setBgAnalysis({ running: true, done, total, currentId: null });
  try {
    for (;;) {
      if (currentUserId() !== userId) break; // signed out or switched account
      const next = pendingNow()[0];
      if (!next) break;
      setBgAnalysis({ running: true, done, total, currentId: next.platform_game_id });
      try {
        await analyseGame(next);
        misses = 0;
      } catch (e) {
        console.warn('Background analysis failed for', next.platform_game_id, e.message);
        failed.add(next.platform_game_id);
        if (++misses >= 3) break; // server is probably down; stop instead of hammering it
      }
      done += 1;
    }
  } finally {
    running = false;
    useStore.getState().setBgAnalysis({ running: false, done, total, currentId: null });
  }
}
