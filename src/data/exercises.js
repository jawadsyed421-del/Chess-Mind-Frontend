// Training puzzles mined from famous and club games with Stockfish (depth 14). Each position has one clearly best
// move: every alternative is at least 2 pawns worse. `line` is the full solution, alternating the player's
// move and the opponent's forced reply.
export const puzzles = [
  {
    "id": "opera-18",
    "theme": "Tactics",
    "fen": "rn2kb1r/p3qppp/2p2n2/1p2p1B1/2B1P3/1QN5/PPP2PPP/R3K2R w KQkq - 0 10",
    "line": [
      "Nxb5"
    ],
    "gap": 2.65,
    "source": "Morphy vs Duke of Brunswick & Count Isouard, Paris 1858",
    "solutionSan": "Nxb5",
    "instruction": "Find the best move.",
    "explanation": "At first sight this gives up material, so it is easy to dismiss. The engine shows that the attack or position you get in return is worth more. The engine rates every other move at least 2.6 pawns worse, so this is the only move that keeps the advantage."
  },
  {
    "id": "opera-26",
    "theme": "Tactics",
    "fen": "4kb1r/p2rqppp/5n2/1B2p1B1/4P3/1Q6/PPP2PPP/2K4R w k - 0 14",
    "line": [
      "Rd1"
    ],
    "gap": 5.12,
    "source": "Morphy vs Duke of Brunswick & Count Isouard, Paris 1858",
    "solutionSan": "Rd1",
    "instruction": "Find the best move.",
    "explanation": "The rook goes to the open d-file, where no pawns block it. The engine rates every other move at least 5.1 pawns worse, so this is the only move that keeps the advantage."
  },
  {
    "id": "immortal-16",
    "theme": "Defence",
    "fen": "rnb1kb1r/p1pp1ppp/8/1B4qn/4Pp1N/3P4/PPP3PP/RNBQ1K1R w kq - 3 9",
    "line": [
      "Nf5",
      "g6",
      "h4"
    ],
    "gap": 2.54,
    "source": "Anderssen vs Kieseritzky, London 1851 (The Immortal Game)",
    "solutionSan": "Nf5",
    "instruction": "Find the best move.",
    "explanation": "You move the knight out of danger. On h4 it was under attack by the queen on g5. The engine rates every other move at least 2.5 pawns worse, so this is the only move that keeps the advantage."
  },
  {
    "id": "immortal-22",
    "theme": "Tactics",
    "fen": "rnb1kb1r/p2p1ppp/5n2/1p3Nq1/4PpP1/3P4/PPP4P/RNBQ1KR1 w kq - 0 12",
    "line": [
      "h4",
      "Qg6",
      "h5",
      "Nxh5",
      "gxh5"
    ],
    "gap": 2.42,
    "source": "Anderssen vs Kieseritzky, London 1851 (The Immortal Game)",
    "solutionSan": "h4",
    "instruction": "Find the best move.",
    "explanation": "The pawn now attacks the queen on g5, which has no protection, so a reply is needed. The engine rates every other move at least 2.4 pawns worse, so this is the only move that keeps the advantage."
  },
  {
    "id": "immortal-38",
    "theme": "Discovered attack",
    "fen": "rnb1k1nr/p2p1ppp/3B4/1p1NPN1P/6P1/3P1Q2/P1P5/q4Kb1 w kq - 0 20",
    "line": [
      "Ke2"
    ],
    "gap": 2.33,
    "source": "Anderssen vs Kieseritzky, London 1851 (The Immortal Game)",
    "solutionSan": "Ke2",
    "instruction": "Find the best move.",
    "explanation": "Moving the king opens a line for the bishop on d6, which now attacks the knight on b8 (a discovered attack). The engine rates every other move at least 2.3 pawns worse, so this is the only move that keeps the advantage."
  },
  {
    "id": "evergreen-33",
    "theme": "Exchanges",
    "fen": "1r2k2r/pbppnppp/1bn2N2/4P2q/Q7/B1PB1N2/P4PPP/R3R1K1 b k - 2 17",
    "line": [
      "gxf6"
    ],
    "gap": 10.93,
    "source": "Anderssen vs Dufresne, Berlin 1852 (The Evergreen Game)",
    "solutionSan": "gxf6",
    "instruction": "Find the best move.",
    "explanation": "You capture the knight on f6. It can be recaptured, but you still come out ahead in the exchange. The engine rates every other move at least 10.9 pawns worse, so this is the only move that keeps the advantage."
  },
  {
    "id": "kasparov-39",
    "theme": "Tactics",
    "fen": "bk1r3r/4qp1p/pn3np1/Nppp4/4PQ2/P1N2PPB/1PP4P/1K1R3R b - - 1 20",
    "line": [
      "Ka7"
    ],
    "gap": 3.94,
    "source": "Kasparov vs Topalov, Wijk aan Zee 1999",
    "solutionSan": "Ka7",
    "instruction": "Find the best move.",
    "explanation": "A precise, quiet move. It does not win anything at once, but every other move gives the opponent a clear improvement. The engine rates every other move at least 3.9 pawns worse, so this is the only move that keeps the advantage."
  },
  {
    "id": "kasparov-45",
    "theme": "Defence",
    "fen": "b2r3r/k3qp1p/p4np1/NppP4/3p1Q2/P4PPB/1PP4P/1K1RR3 b - - 0 23",
    "line": [
      "Qd6"
    ],
    "gap": 7.39,
    "source": "Kasparov vs Topalov, Wijk aan Zee 1999",
    "solutionSan": "Qd6",
    "instruction": "Find the best move.",
    "explanation": "You move the queen out of danger. On e7 it was under attack by the rook on e1. The queen now attacks the pawn on d5, which has no protection, so a reply is needed. The engine rates every other move at least 7.4 pawns worse, so this is the only move that keeps the advantage."
  },
  {
    "id": "kasparov-51",
    "theme": "Winning material",
    "fen": "b2r3r/4Rp1p/pk1q1np1/Np1P4/3Q4/P4PPB/1PP4P/1K6 b - - 0 26",
    "line": [
      "Kxa5"
    ],
    "gap": 2.56,
    "source": "Kasparov vs Topalov, Wijk aan Zee 1999",
    "solutionSan": "Kxa5",
    "instruction": "Find the best move.",
    "explanation": "You win a knight for free: the knight on a5 cannot be taken back, so you gain 3 points of material. The engine rates every other move at least 2.6 pawns worse, so this is the only move that keeps the advantage."
  },
  {
    "id": "kasparov-57",
    "theme": "Defence",
    "fen": "b2r3r/R4p1p/p4np1/1p1q4/kP6/P1Q2PPB/2P4P/1K6 b - - 1 29",
    "line": [
      "Bb7"
    ],
    "gap": 14.87,
    "source": "Kasparov vs Topalov, Wijk aan Zee 1999",
    "solutionSan": "Bb7",
    "instruction": "Find the best move.",
    "explanation": "You move the bishop out of danger. On a8 it was under attack by the rook on a7. The engine rates every other move at least 14.9 pawns worse, so this is the only move that keeps the advantage."
  },
  {
    "id": "kasparov-65",
    "theme": "Mating attack",
    "fen": "3r3r/1R3p1p/Q5p1/1p6/1kq5/2P2PPB/7P/1K6 b - - 0 33",
    "line": [
      "Kxc3",
      "Qa1+",
      "Kd2",
      "Qb2+",
      "Kd1"
    ],
    "gap": 6.35,
    "source": "Kasparov vs Topalov, Wijk aan Zee 1999",
    "solutionSan": "Kxc3",
    "instruction": "Find the best move.",
    "explanation": "You win a pawn for free: the pawn on c3 cannot be taken back, so you gain a pawn. You threaten checkmate with Rd1#, so the opponent has to defend immediately. The engine rates every other move at least 6.3 pawns worse, so this is the only move that keeps the advantage."
  },
  {
    "id": "kasparov-71",
    "theme": "Fork",
    "fen": "3r3r/1R3p1p/6p1/1p6/2q5/5PP1/1Q5P/1K1k1B2 b - - 5 36",
    "line": [
      "Rd2",
      "Bxc4",
      "Rxb2+",
      "Kxb2",
      "bxc4"
    ],
    "gap": 3.14,
    "source": "Kasparov vs Topalov, Wijk aan Zee 1999",
    "solutionSan": "Rd2",
    "instruction": "Find the best move.",
    "explanation": "You fork two pieces: the rook on d2 attacks the queen on b2 and the pawn on h2. The opponent can only save one of them. The rook goes to the open d-file, where no pawns block it. A rook on the seventh rank attacks pawns from behind and pins the enemy king in. The engine rates every other move at least 3.1 pawns worse, so this is the only move that keeps the advantage."
  },
  {
    "id": "byrne-21",
    "theme": "Fork",
    "fen": "r2q1rk1/pp2ppbp/1np2np1/2Q3B1/3PP1b1/2N2N2/PP3PPP/3RKB1R b K - 6 11",
    "line": [
      "Na4",
      "Qa3",
      "Nxc3",
      "bxc3",
      "Nxe4"
    ],
    "gap": 2.2,
    "source": "Byrne vs Fischer, New York 1956 (Game of the Century)",
    "solutionSan": "Na4",
    "instruction": "Find the best move.",
    "explanation": "You fork two pieces: the knight on a4 attacks the queen on c5 and the pawn on b2. The opponent can only save one of them. The engine rates every other move at least 2.2 pawns worse, so this is the only move that keeps the advantage."
  },
  {
    "id": "byrne-33",
    "theme": "Tactics",
    "fen": "r3r1k1/pp3pbp/1qp3p1/2B5/2BP2b1/Q1n2N2/P4PPP/3R1K1R b - - 3 17",
    "line": [
      "Be6",
      "Qxc3",
      "Qxc5",
      "dxc5",
      "Bxc3"
    ],
    "gap": 3.4,
    "source": "Byrne vs Fischer, New York 1956 (Game of the Century)",
    "solutionSan": "Be6",
    "instruction": "Find the best move.",
    "explanation": "The bishop now attacks the bishop on c4, which has no protection, so a reply is needed. The engine rates every other move at least 3.4 pawns worse, so this is the only move that keeps the advantage."
  },
  {
    "id": "byrne-67",
    "theme": "Tactics",
    "fen": "1Q3bk1/5p2/2p3p1/1p1bN2p/4n2P/8/r5PK/8 b - - 1 34",
    "line": [
      "Kg7"
    ],
    "gap": 2.34,
    "source": "Byrne vs Fischer, New York 1956 (Game of the Century)",
    "solutionSan": "Kg7",
    "instruction": "Find the best move.",
    "explanation": "A precise, quiet move. It does not win anything at once, but every other move gives the opponent a clear improvement. The engine rates every other move at least 2.3 pawns worse, so this is the only move that keeps the advantage."
  },
  {
    "id": "club1-38",
    "theme": "Tactics",
    "fen": "2rr1k2/p3nppp/bpp5/3nN3/3P4/1B3N1P/PP3PP1/2R1R1K1 w - - 1 20",
    "line": [
      "Ng5"
    ],
    "gap": 4.09,
    "source": "Club game: Italian Game",
    "solutionSan": "Ng5",
    "instruction": "Find the best move.",
    "explanation": "The knight now attacks the pawn on h7, which has no protection, so a reply is needed. The engine rates every other move at least 4.1 pawns worse, so this is the only move that keeps the advantage."
  },
  {
    "id": "club1-45",
    "theme": "Defence",
    "fen": "2rk4/p3nNpp/bpp2p2/3n4/3P4/1B5P/PP3PP1/2R1R1K1 b - - 1 23",
    "line": [
      "Kd7"
    ],
    "gap": 2.76,
    "source": "Club game: Italian Game",
    "solutionSan": "Kd7",
    "instruction": "Find the best move.",
    "explanation": "You protect the knight on d5, which was in danger of being captured. The engine rates every other move at least 2.8 pawns worse, so this is the only move that keeps the advantage."
  },
  {
    "id": "club2-45",
    "theme": "Tactics",
    "fen": "1rr3k1/p3qpp1/7p/2p5/3p2b1/1P1QPN2/P4P2/1BRR2K1 b - - 1 23",
    "line": [
      "Qf6",
      "Nh2",
      "Bxd1"
    ],
    "gap": 2.41,
    "source": "Club game: Queen's Gambit Declined",
    "solutionSan": "Qf6",
    "instruction": "Find the best move.",
    "explanation": "The queen now attacks the knight on f3, which has no protection, so a reply is needed. The engine rates every other move at least 2.4 pawns worse, so this is the only move that keeps the advantage."
  },
  {
    "id": "club2-53",
    "theme": "Tactics",
    "fen": "2r3k1/p4p2/5qpp/8/3N2b1/1P1Q4/P4P2/1B2R1K1 b - - 0 27",
    "line": [
      "Rd8",
      "Re4",
      "Bf5"
    ],
    "gap": 2.79,
    "source": "Club game: Queen's Gambit Declined",
    "solutionSan": "Rd8",
    "instruction": "Find the best move.",
    "explanation": "The rook goes to the open d-file, where no pawns block it. The engine rates every other move at least 2.8 pawns worse, so this is the only move that keeps the advantage."
  },
  {
    "id": "club2-61",
    "theme": "Winning material",
    "fen": "3r2k1/p4p2/6pp/5b2/3N1R2/1P4P1/P7/1B4K1 b - - 0 31",
    "line": [
      "Bxb1"
    ],
    "gap": 7.58,
    "source": "Club game: Queen's Gambit Declined",
    "solutionSan": "Bxb1",
    "instruction": "Find the best move.",
    "explanation": "You win a bishop for free: the bishop on b1 cannot be taken back, so you gain 3 points of material. The engine rates every other move at least 7.6 pawns worse, so this is the only move that keeps the advantage."
  },
  {
    "id": "evergreen-40",
    "theme": "Attack on the king",
    "fen": "1r2k1r1/pbppnp1p/1b3P2/8/Q7/B1PB1q2/P4PPP/3R2K1 w - - 0 21",
    "line": [
      "Qxd7+",
      "Kxd7",
      "Bf5+",
      "Ke8",
      "Bd7+"
    ],
    "gap": null,
    "source": "Anderssen vs Dufresne, Berlin 1852 (The Evergreen Game)",
    "solutionSan": "Qxd7+",
    "instruction": "Find the best move.",
    "explanation": "You give check, which forces the opponent to respond to the king before anything else."
  }
];

// Older name kept for imports
export const sampleExercises = puzzles;
