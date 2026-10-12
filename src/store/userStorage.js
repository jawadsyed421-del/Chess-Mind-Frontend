// Per-user browser storage. Every key is suffixed with the signed-in user's id, so two people
// using the same browser never see each other's games, progress or settings.
// When Supabase is configured, every write is also saved to that user's private cloud rows.
import { pushUserData } from '../services/supabase';

const AUTH_KEY = 'chessmind_user';

export function currentUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY));
  } catch {
    return null;
  }
}

export const currentUserId = () => currentUser()?.id || null;

const scoped = key => `${key}@${currentUserId() || 'anon'}`;
const cloud = () => currentUser()?.cloud === true; // guests and local-only accounts are not synced

export const userStorage = {
  getItem: key => localStorage.getItem(scoped(key)),
  setItem: (key, value) => {
    localStorage.setItem(scoped(key), value);
    if (cloud()) pushUserData(key, value);
  },
  removeItem: key => {
    localStorage.removeItem(scoped(key));
    if (cloud()) pushUserData(key, null);
  },
};

// Writes already-downloaded cloud rows into this browser's storage for the given user.
export function loadCloudRows(userId, rows) {
  Object.entries(rows).forEach(([key, value]) => localStorage.setItem(`${key}@${userId}`, value));
}

// Removes all data stored for one user id in this browser.
export function clearUserData(userId) {
  Object.keys(localStorage)
    .filter(k => k.endsWith(`@${userId}`))
    .forEach(k => localStorage.removeItem(k));
}

// Older versions stored data under shared, unscoped keys. Drop it so it can't leak to another user.
export function purgeLegacyData() {
  Object.keys(localStorage)
    .filter(k => k.startsWith('chessmind_') && !k.includes('@') && !['chessmind_users', 'chessmind_user', 'chessmind_session_version'].includes(k))
    .forEach(k => localStorage.removeItem(k));
}
