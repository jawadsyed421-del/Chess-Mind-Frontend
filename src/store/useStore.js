import { create } from 'zustand';
import { userStorage } from './userStorage';
import { accuracyFromEvals } from '../utils/gameInsights';

// Sample demo games with real full PGNs for instant exploration
const demoGamesData = [
  {
    platform: 'chesscom',
    platform_game_id: 'demo_game_01',
    white_player: 'ChessMind_Hero',
    black_player: 'TacticalRival_1500',
    player_color: 'white',
    opponent: 'TacticalRival_1500',
    result: 'loss',
    date_played: '2026-10-08T14:30:00Z',
    time_control: '10+0',
    opening_name: 'Italian Game: Giuoco Piano',
    analysis_status: 'complete',
    white_rating: 1540,
    black_rating: 1565,
    pgn: `[Event "Live Chess"]
[Site "Chess.com"]
[Date "2026.10.08"]
[White "ChessMind_Hero"]
[Black "TacticalRival_1500"]
[Result "0-1"]
[ECO "C50"]
[Opening "Italian Game: Giuoco Piano"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Bd2 Bxd2+ 8. Nbxd2 d5 9. exd5 Nxd5 10. Qb3 Nce7 11. O-O O-O 12. Rfe1 c6 13. Ne4 Qb6 14. Nc5 Qxb3 15. Bxb3 b6 16. Nd3 Ba6 17. Nde5 Rac8 18. Rac1 Rfd8 19. h3 Kf8 20. Ng5 f6 21. Ne6+ Ke8 22. Nxd8 Kxd8 23. Nf7+ Kd7 24. Re4 Rf8 25. Rce1 Rxf7 0-1`,
  },
  {
    platform: 'lichess',
    platform_game_id: 'demo_game_02',
    white_player: 'PositionalMaster_1620',
    black_player: 'ChessMind_Hero',
    player_color: 'black',
    opponent: 'PositionalMaster_1620',
    result: 'win',
    date_played: '2026-10-07T18:15:00Z',
    time_control: '5+3',
    opening_name: "Queen's Gambit Declined",
    analysis_status: 'pending',
    white_rating: 1620,
    black_rating: 1540,
    pgn: `[Event "Rated Blitz game"]
[Site "https://lichess.org/demo02"]
[Date "2026.10.07"]
[White "PositionalMaster_1620"]
[Black "ChessMind_Hero"]
[Result "0-1"]
[ECO "D30"]
[Opening "Queen's Gambit Declined"]

1. d4 d5 2. c4 e6 3. Nf3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nc3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Bd3 Be6 12. O-O c5 13. dxc5 bxc5 14. Rc1 Nd7 15. Bb1 Nf6 16. Qc2 Rfc8 17. Rfd1 Rab8 18. b3 Bg4 19. Qe2 d4 20. h3 Bh5 21. g4 Nxg4 22. hxg4 Bxg4 23. Qd3 g6 24. exd4 cxd4 25. Rxc8+ Rxc8 26. Re1 Qf6 27. Nxd4 Rd8 28. Re4 Bf5 29. Rf4 Qg5+ 30. Qg3 Qxg3+ 31. fxg3 Bxb1 32. a4 g5 33. Rg4 f5 0-1`,
  },
  {
    platform: 'chesscom',
    platform_game_id: 'demo_game_03',
    white_player: 'ChessMind_Hero',
    black_player: 'EndgameSpecialist',
    player_color: 'white',
    opponent: 'EndgameSpecialist',
    result: 'draw',
    date_played: '2026-10-05T09:20:00Z',
    time_control: '15+10',
    opening_name: 'Ruy Lopez: Berlin Defense',
    analysis_status: 'pending',
    white_rating: 1535,
    black_rating: 1550,
    pgn: `[Event "Live Chess"]
[Site "Chess.com"]
[Date "2026.10.05"]
[White "ChessMind_Hero"]
[Black "EndgameSpecialist"]
[Result "1/2-1/2"]
[ECO "C65"]
[Opening "Ruy Lopez: Berlin Defense"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. c3 O-O 6. O-O d6 7. Nbd2 a6 8. Ba4 Ba7 9. Re1 Ne7 10. Nf1 Ng6 11. Ng3 c6 12. d4 Re8 13. h3 h6 14. Bc2 Qc7 15. Be3 Be6 16. Qd2 Rad8 17. Rad1 Bb8 18. Nf5 Bxf5 19. exf5 Ne7 20. Bxh6 gxh6 21. Qxh6 Ned5 22. c4 e4 23. cxd5 exf3 24. Qxf6 cxd5 25. Qg5+ Kf8 26. f6 1/2-1/2`,
  }
];

const initialWeaknesses = {
  tactical: [
    { id: 'forks', name: 'Fork Recognition', errorsCount: 3, practiceCount: 1, status: 'Needs Practice', color: 'var(--tactical-color)' },
    { id: 'pins', name: 'Pins & Skewers', errorsCount: 1, practiceCount: 2, status: 'Improving', color: 'var(--strategic-color)' },
    { id: 'hanging', name: 'Hanging Pieces', errorsCount: 0, practiceCount: 4, status: 'Strong', color: 'var(--accent-success)' },
  ],
  positional: [
    { id: 'pawn_struct', name: 'Pawn Structures', errorsCount: 4, practiceCount: 1, status: 'Needs Practice', color: 'var(--positional-color)' },
    { id: 'weak_sq', name: 'Weak Square Control', errorsCount: 2, practiceCount: 2, status: 'Improving', color: 'var(--strategic-color)' },
    { id: 'outposts', name: 'Open Files & Outposts', errorsCount: 0, practiceCount: 3, status: 'Strong', color: 'var(--accent-success)' },
  ],
  strategic: [
    { id: 'planning', name: 'Middlegame Planning', errorsCount: 3, practiceCount: 1, status: 'Needs Practice', color: 'var(--strategic-color)' },
    { id: 'coordination', name: 'Piece Coordination', errorsCount: 1, practiceCount: 2, status: 'Improving', color: 'var(--accent-secondary)' },
    { id: 'endgame', name: 'Endgame Technique', errorsCount: 2, practiceCount: 0, status: 'Needs Practice', color: 'var(--tactical-color)' },
  ],
};

function computeFocus(weaknesses) {
  let highestDeficit = -99;
  let topItem = null;

  for (const cat of ['tactical', 'positional', 'strategic']) {
    for (const item of weaknesses[cat] || []) {
      const deficit = (item.errorsCount || 0) * 2 - (item.practiceCount || 0);
      if (deficit > highestDeficit) {
        highestDeficit = deficit;
        topItem = item;
      }
    }
  }

  return topItem ? `${topItem.name}` : 'Tactical Fork Recognition & Pawn Structure Decisions';
}

const loadState = () => ({
  // Connected chess account
  account: JSON.parse(userStorage.getItem('chessmind_account') || 'null'),
  profile: JSON.parse(userStorage.getItem('chessmind_profile') || 'null'),
  stats: JSON.parse(userStorage.getItem('chessmind_stats') || 'null'),

  // Games
  games: JSON.parse(userStorage.getItem('chessmind_games') || '[]'),
  gamesLoading: false,

  // Weakness profile & Adaptive Learning Loop
  weaknesses: JSON.parse(userStorage.getItem('chessmind_weaknesses') || JSON.stringify(initialWeaknesses)),
  trainingHistory: JSON.parse(userStorage.getItem('chessmind_training_history') || '[]'),
  currentFocus: userStorage.getItem('chessmind_current_focus') || 'Tactical Fork Recognition & Pawn Structure Decisions',

  // Spaced-repetition review queue: { id, exercise, dueAt, step }
  reviewQueue: JSON.parse(userStorage.getItem('chessmind_review') || '[]'),

  // Background engine analysis of imported games (not persisted)
  bgAnalysis: { running: false, done: 0, total: 0, currentId: null },

  // UI state
  sidebarOpen: false,
  toasts: []
});

export const useStore = create((set, get) => ({
  ...loadState(),

  // Reload everything from the current user's storage (called on sign-in / sign-out).
  hydrate: () => set({ ...loadState(), toasts: [], sidebarOpen: false }),

  // Actions
  setAccount: (account) => {
    userStorage.setItem('chessmind_account', JSON.stringify(account));
    set({ account });
  },

  setProfile: (profile) => {
    userStorage.setItem('chessmind_profile', JSON.stringify(profile));
    set({ profile });
  },

  setStats: (stats) => {
    userStorage.setItem('chessmind_stats', JSON.stringify(stats));
    set({ stats });
  },

  setGames: (games) => {
    userStorage.setItem('chessmind_games', JSON.stringify(games));
    set({ games });
  },

  addGames: (newGames) => {
    const existing = get().games;
    const existingIds = new Set(existing.map(g => g.platform_game_id));
    const unique = newGames.filter(g => !existingIds.has(g.platform_game_id));
    const updated = [...unique, ...existing];
    userStorage.setItem('chessmind_games', JSON.stringify(updated));
    set({ games: updated });
  },

  setGamesLoading: (loading) => set({ gamesLoading: loading }),
  setBgAnalysis: (bgAnalysis) => set({ bgAnalysis }),

  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  addToast: (toast) => {
    const id = Date.now();
    set(s => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, 4000);
  },

  // Record a training attempt and update weakness progress (Adaptive Loop)
  recordTrainingAttempt: (record) => {
    const { trainingHistory, weaknesses } = get();
    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      theme: record.theme || 'Tactical',
      type: record.type || 'tactical',
      solutionSan: record.solutionSan,
      playedSan: record.playedSan,
      isCorrect: record.isCorrect,
      title: record.title || `${record.theme} Practice`,
    };

    const updatedHistory = [newEntry, ...trainingHistory];
    userStorage.setItem('chessmind_training_history', JSON.stringify(updatedHistory));

    // Update weakness scoring if correct
    const themeLower = (record.theme || '').toLowerCase();
    const typeKey = (record.type || 'tactical').toLowerCase();
    const categoryList = weaknesses[typeKey] || weaknesses.tactical;

    const updatedCategory = categoryList.map(item => {
      if (item.name.toLowerCase().includes(themeLower) || themeLower.includes(item.id)) {
        const newPractice = (item.practiceCount || 0) + (record.isCorrect ? 1 : 0);
        let newStatus = item.status;
        let newColor = item.color;

        if (newPractice >= 3 && newPractice > item.errorsCount) {
          newStatus = 'Strong';
          newColor = 'var(--accent-success)';
        } else if (newPractice > 0) {
          newStatus = 'Improving';
          newColor = 'var(--strategic-color)';
        }

        return {
          ...item,
          practiceCount: newPractice,
          status: newStatus,
          color: newColor,
        };
      }
      return item;
    });

    const updatedWeaknesses = {
      ...weaknesses,
      [typeKey]: updatedCategory,
    };

    const newFocus = computeFocus(updatedWeaknesses);

    userStorage.setItem('chessmind_weaknesses', JSON.stringify(updatedWeaknesses));
    userStorage.setItem('chessmind_current_focus', newFocus);

    set({
      trainingHistory: updatedHistory,
      weaknesses: updatedWeaknesses,
      currentFocus: newFocus,
    });
  },

  // Update game analysis and aggregate mistakes into profile
  saveGameAnalysis: (gameId, analysisResult) => {
    const { games, weaknesses } = get();
    const mistakes = analysisResult?.mistakes || [];

    // Mark game as analyzed and keep our engine accuracy for the Stats chart
    const engineAccuracy = accuracyFromEvals(analysisResult?.moveEvaluations);
    const updatedGames = games.map(g => {
      if (g.platform_game_id === gameId) {
        return { ...g, analysis_status: 'complete', engine_accuracy: engineAccuracy };
      }
      return g;
    });
    userStorage.setItem('chessmind_games', JSON.stringify(updatedGames));

    // Aggregate mistakes into weakness categories
    const updatedWeaknesses = { ...weaknesses };

    mistakes.forEach(m => {
      const typeKey = (m.type || 'tactical').toLowerCase();
      const themeLower = (m.theme || '').toLowerCase();

      if (updatedWeaknesses[typeKey]) {
        updatedWeaknesses[typeKey] = updatedWeaknesses[typeKey].map(item => {
          if (item.name.toLowerCase().includes(themeLower) || themeLower.includes(item.id)) {
            const newErrors = (item.errorsCount || 0) + 1;
            const newStatus = (item.practiceCount || 0) > newErrors ? 'Improving' : 'Needs Practice';
            return {
              ...item,
              errorsCount: newErrors,
              status: newStatus,
              color: newStatus === 'Improving' ? 'var(--strategic-color)' : 'var(--tactical-color)',
            };
          }
          return item;
        });
      }
    });

    const newFocus = computeFocus(updatedWeaknesses);

    userStorage.setItem('chessmind_weaknesses', JSON.stringify(updatedWeaknesses));
    userStorage.setItem('chessmind_current_focus', newFocus);

    set({
      games: updatedGames,
      weaknesses: updatedWeaknesses,
      currentFocus: newFocus,
    });
  },

  // Load sample demo profile for testing/evaluation
  loadDemoAccount: () => {
    const demoAccount = { platform: 'chesscom', username: 'ChessMind_Hero' };
    const demoProfile = {
      username: 'ChessMind_Hero',
      name: 'Chess Explorer',
      avatar: null,
      joined: 1640995200,
    };
    const demoStats = {
      rapid: { rating: 1540, best: 1585, wins: 142, losses: 110, draws: 24 },
      blitz: { rating: 1480, best: 1510, wins: 88, losses: 74, draws: 12 },
    };

    userStorage.setItem('chessmind_account', JSON.stringify(demoAccount));
    userStorage.setItem('chessmind_profile', JSON.stringify(demoProfile));
    userStorage.setItem('chessmind_stats', JSON.stringify(demoStats));
    userStorage.setItem('chessmind_games', JSON.stringify(demoGamesData));
    userStorage.setItem('chessmind_weaknesses', JSON.stringify(initialWeaknesses));

    set({
      account: demoAccount,
      profile: demoProfile,
      stats: demoStats,
      games: demoGamesData,
      weaknesses: initialWeaknesses,
      currentFocus: computeFocus(initialWeaknesses),
    });
  },

  // Disconnect removes the profile together with its imported games, analysis and mistakes.
  disconnect: () => {
    ['account', 'profile', 'stats', 'games', 'weaknesses', 'training_history', 'current_focus', 'review']
      .forEach(k => userStorage.removeItem(`chessmind_${k}`));
    set({
      account: null,
      profile: null,
      stats: null,
      games: [],
      weaknesses: initialWeaknesses,
      trainingHistory: [],
      reviewQueue: [],
      currentFocus: 'Tactical Fork Recognition & Pawn Structure Decisions',
    });
  },

  resetAll: () => {
    get().disconnect();
  },

  // Review queue: first-try correct schedules a later review; correct after a miss gets a harder
  // (shorter) grade; revealing the answer brings the position back soon.
  gradeReview: (exercise, grade) => {
    const DAY = 86400000;
    const intervals = [1, 3, 7, 14, 30];
    const queue = get().reviewQueue;
    const existing = queue.find(q => q.id === exercise.id);
    let step = existing?.step ?? 0;
    let dueAt;
    if (grade === 'first') {
      step = Math.min(step + 1, intervals.length - 1);
      dueAt = Date.now() + intervals[step] * DAY;
    } else if (grade === 'late') {
      step = Math.max(step - 1, 0);
      dueAt = Date.now() + intervals[step] * DAY * 0.5;
    } else {
      step = 0;
      dueAt = Date.now() + 10 * 60 * 1000;
    }
    const item = { id: exercise.id, exercise, dueAt, step };
    const next = existing ? queue.map(q => (q.id === exercise.id ? item : q)) : [...queue, item];
    userStorage.setItem('chessmind_review', JSON.stringify(next));
    set({ reviewQueue: next });
  },

  addReviewItem: (exercise) => {
    const queue = get().reviewQueue;
    if (queue.some(q => q.id === exercise.id)) return;
    const next = [...queue, { id: exercise.id, exercise, dueAt: Date.now(), step: 0 }];
    userStorage.setItem('chessmind_review', JSON.stringify(next));
    set({ reviewQueue: next });
  },
}));
