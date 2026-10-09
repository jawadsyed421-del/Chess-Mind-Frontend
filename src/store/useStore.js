import { create } from 'zustand';

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

export const useStore = create((set, get) => ({
  // Connected chess account
  account: JSON.parse(localStorage.getItem('chessmind_account') || 'null'),
  profile: JSON.parse(localStorage.getItem('chessmind_profile') || 'null'),
  stats: JSON.parse(localStorage.getItem('chessmind_stats') || 'null'),

  // Games
  games: JSON.parse(localStorage.getItem('chessmind_games') || JSON.stringify(demoGamesData)),
  gamesLoading: false,

  // Weakness profile & Adaptive Learning Loop
  weaknesses: JSON.parse(localStorage.getItem('chessmind_weaknesses') || JSON.stringify(initialWeaknesses)),
  trainingHistory: JSON.parse(localStorage.getItem('chessmind_training_history') || '[]'),
  currentFocus: localStorage.getItem('chessmind_current_focus') || 'Tactical Fork Recognition & Pawn Structure Decisions',

  // UI state
  sidebarOpen: false,
  toasts: [],

  // Actions
  setAccount: (account) => {
    localStorage.setItem('chessmind_account', JSON.stringify(account));
    set({ account });
  },

  setProfile: (profile) => {
    localStorage.setItem('chessmind_profile', JSON.stringify(profile));
    set({ profile });
  },

  setStats: (stats) => {
    localStorage.setItem('chessmind_stats', JSON.stringify(stats));
    set({ stats });
  },

  setGames: (games) => {
    localStorage.setItem('chessmind_games', JSON.stringify(games));
    set({ games });
  },

  addGames: (newGames) => {
    const existing = get().games;
    const existingIds = new Set(existing.map(g => g.platform_game_id));
    const unique = newGames.filter(g => !existingIds.has(g.platform_game_id));
    const updated = [...unique, ...existing];
    localStorage.setItem('chessmind_games', JSON.stringify(updated));
    set({ games: updated });
  },

  setGamesLoading: (loading) => set({ gamesLoading: loading }),

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
    localStorage.setItem('chessmind_training_history', JSON.stringify(updatedHistory));

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

    localStorage.setItem('chessmind_weaknesses', JSON.stringify(updatedWeaknesses));
    localStorage.setItem('chessmind_current_focus', newFocus);

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

    // Mark game as analyzed
    const updatedGames = games.map(g => {
      if (g.platform_game_id === gameId) {
        return { ...g, analysis_status: 'complete' };
      }
      return g;
    });
    localStorage.setItem('chessmind_games', JSON.stringify(updatedGames));

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

    localStorage.setItem('chessmind_weaknesses', JSON.stringify(updatedWeaknesses));
    localStorage.setItem('chessmind_current_focus', newFocus);

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

    localStorage.setItem('chessmind_account', JSON.stringify(demoAccount));
    localStorage.setItem('chessmind_profile', JSON.stringify(demoProfile));
    localStorage.setItem('chessmind_stats', JSON.stringify(demoStats));
    localStorage.setItem('chessmind_games', JSON.stringify(demoGamesData));
    localStorage.setItem('chessmind_weaknesses', JSON.stringify(initialWeaknesses));

    set({
      account: demoAccount,
      profile: demoProfile,
      stats: demoStats,
      games: demoGamesData,
      weaknesses: initialWeaknesses,
      currentFocus: computeFocus(initialWeaknesses),
    });
  },

  disconnect: () => {
    localStorage.removeItem('chessmind_account');
    localStorage.removeItem('chessmind_profile');
    localStorage.removeItem('chessmind_stats');
    set({
      account: null,
      profile: null,
      stats: null,
    });
  },
}));
