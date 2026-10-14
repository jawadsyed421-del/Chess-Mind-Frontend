import { useStore } from '../store/useStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const token = useStore.getState().account?.ownershipToken;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'X-Ownership-Token': token } : {}),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Cannot connect to ChessMind server. Make sure the backend is running.');
      }
      throw error;
    }
  }

  // Profile endpoints
  async connectProfile(platform, username, token) {
    return this.request('/profile/connect', {
      method: 'POST',
      headers: token ? { 'X-Ownership-Token': token } : {},
      body: JSON.stringify({ platform, username }),
    });
  }

  async getProfile(platform, username) {
    return this.request(`/profile/${platform}/${username}`);
  }

  // Game endpoints
  async fetchGames(platform, username, maxGames = 50) {
    return this.request('/games/fetch', {
      method: 'POST',
      body: JSON.stringify({ platform, username, max_games: maxGames }),
    });
  }

  async getGames(platform, username) {
    return this.request(`/games/list?platform=${platform}&username=${username}`);
  }

  async getGame(id) {
    return this.request(`/games/${id}`);
  }

  // Analysis endpoints
  async analyzeGame(pgn, playerColor, gameId, depth = 14) {
    return this.request('/analysis/analyze', {
      method: 'POST',
      body: JSON.stringify({
        pgn,
        player_color: playerColor,
        game_id: gameId,
        depth,
      }),
    });
  }

  async evaluatePosition(fen, depth = 14) {
    return this.request('/analysis/position', {
      method: 'POST',
      body: JSON.stringify({ fen, depth }),
    });
  }

  async getAnalysis(gameId) {
    return this.request(`/analysis/${gameId}`);
  }

  async getAnalysisStatus(gameId) {
    return this.request(`/analysis/status/${gameId}`);
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export const api = new ApiService();
export default api;
