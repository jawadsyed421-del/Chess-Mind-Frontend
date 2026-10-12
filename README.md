# ♟️ ChessMind — Frontend Web Client

> **Personalized Chess Improvement Engine — Web & Mobile Prototype**  
> Connects to real Chess.com / Lichess profiles, analyzes games move-by-move using Stockfish 19, identifies recurring strategic, positional, and tactical errors, and generates interactive training drills directly in the browser.

---

## 🚀 Features

- **Profile Integration (`/connect`)**: Connect any public Chess.com or Lichess account without passwords. Instant game import with duplicate detection.
- **My Games Hub (`/games`)**: Full match list with opponent, opening name, match result, date, platform tag, and live search/filter.
- **Move-by-Move Analysis (`/analysis`)**: Interactive chessboard replay with dynamic Stockfish evaluation bar, mistake classification badges (Strategic, Positional, Tactical), theme detection, engine better moves, and keyboard navigation (`←` / `→`).
- **Interactive Practice Drills (`/training`)**: Recreates the user's exact mistake position from their actual games, gives instant move validation, and advances through similar tactical/positional themes.
- **Grandmaster Study (`/grandmaster`)**: Interactive GM studies (Fischer vs Spassky, Carlsen vs Anand, Kasparov, Capablanca). Try moves directly on the board and compare your decision against world champions.
- **Adaptive Player Profile (`/profile`)**: Live weakness breakdown (Forks, Pins, Pawn Structures, Weak Squares, Planning) that automatically updates from *Needs Practice* → *Improving* → *Strong* as drills are solved, with recorded training history.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite 8
- **Chess Engine & Board**: `react-chessboard` (v5) + `chess.js` (v1)
- **State Management**: `zustand` (with LocalStorage persistence)
- **Routing**: `react-router-dom` (v7)
- **Icons**: `lucide-react`
- **Styling**: Vanilla CSS Design System with dark chess aesthetics, glassmorphism, responsive `.board-two-col` grid, and mobile touch optimization.

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration (Optional)
By default, the client communicates with the backend API at `http://localhost:3001/api`.
To connect to a deployed backend service, create a `.env` file in the root:
```env
VITE_API_URL=https://your-chessmind-backend.onrender.com/api
```

### Accounts & Google sign-in (Supabase)
Real accounts, Google sign-in and private per-user data need a free Supabase project:
1. Create a project at supabase.com, then run [`supabase/user_data.sql`](supabase/user_data.sql) in **SQL Editor** (creates the table with row-level security: each user can only read/write their own rows).
2. **Authentication → Providers → Google**: enable it and paste a Google OAuth *Client ID/Secret* (Google Cloud Console → APIs & Services → Credentials → OAuth client, type "Web"). Add the callback URL shown by Supabase (`https://<project>.supabase.co/auth/v1/callback`) as an authorised redirect URI in Google.
3. **Authentication → URL Configuration**: add `http://localhost:5173` (and your deployed URL) to Redirect URLs.
4. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Project Settings → API), then restart `npm run dev`.

Without these keys the app runs in local development mode: browser-only email accounts and guests, and Google sign-in is disabled.

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 4. Build for Production
```bash
npm run build
```
Generates an optimized bundle in the `dist/` directory ready to deploy on Vercel, Netlify, Cloudflare Pages, or GitHub Pages.

---

## 🔗 Related Repositories

- **Backend API**: [ChessMind Server (Stockfish 19 Engine & Platform Sync)](https://github.com/)
