import { create } from 'zustand';
import { useStore } from './useStore';
import { supabase, supabaseEnabled, pullUserData, flushUserData } from '../services/supabase';
import { userStorage, clearUserData, purgeLegacyData, loadCloudRows, currentUser } from './userStorage';

purgeLegacyData();

export { supabase, supabaseEnabled };
export const googleIsLive = supabaseEnabled;

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

async function hash(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const readSettings = () => { try { return JSON.parse(userStorage.getItem('chessmind_settings')) || {}; } catch { return {}; } };

const defaultSettings = { dailyGoal: 5, theme: 'dark', boardTheme: 'classic', sounds: true };

const SETUP_MESSAGE = 'Sign-in is not set up yet: the app needs its Supabase keys (see README → "Accounts & Google sign-in").';

/**
 * Accounts:
 *  - Supabase configured  -> real accounts (email/password + Google OAuth). Data syncs to the user's private rows.
 *  - Not configured       -> local, browser-only email accounts and guests (development only). Google is disabled.
 */
export const useAuth = create((set, get) => ({
  users: read('chessmind_users', []),
  user: read('chessmind_user', null), // { id, email, name, provider, cloud }
  settings: { ...defaultSettings, ...readSettings() },
  sessionVersion: Number(localStorage.getItem('chessmind_session_version') || 1),
  authReady: !supabaseEnabled,

  _login(user) {
    const sessionVersion = get().sessionVersion;
    localStorage.setItem('chessmind_user', JSON.stringify({ ...user, sessionVersion }));
    set({ user: { ...user, sessionVersion }, settings: { ...defaultSettings, ...readSettings() } });
    useStore.getState().hydrate();
  },

  // Called once at startup: restores the Supabase session (including the return from Google) and keeps it in sync.
  async initAuth() {
    if (!supabase) return;
    const apply = async session => {
      if (!session) {
        if (get().user?.cloud) {
          localStorage.removeItem('chessmind_user');
          set({ user: null, settings: { ...defaultSettings } });
          useStore.getState().hydrate();
        }
        return;
      }
      const u = session.user;
      const same = get().user?.id === u.id;
      try { loadCloudRows(u.id, await pullUserData()); } catch (e) { console.error('Cloud load failed', e); }
      get()._login({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Player',
        provider: u.app_metadata?.provider || 'email',
        cloud: true,
      });
      if (same) useStore.getState().hydrate();
    };
    const { data } = await supabase.auth.getSession();
    await apply(data.session);
    set({ authReady: true });
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') apply(session);
    });
  },

  async signUp({ email, password, name }) {
    email = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email address.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');

    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name?.trim() || email.split('@')[0] }, emailRedirectTo: window.location.origin },
      });
      if (error) throw new Error(error.message);
      if (!data.session) {
        // No session means Supabase still requires email confirmation. Try signing in directly.
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          throw new Error(
            /confirm/i.test(signInError.message)
              ? 'Account created, but Supabase still requires email confirmation. Turn off "Confirm email" in Supabase (Authentication → Sign In / Providers → Email), then sign in.'
              : signInError.message
          );
        }
      }
      return; // initAuth's listener completes the sign-in
    }

    const { users, user } = get();
    if (users.some(u => u.email === email)) throw new Error('An account with this email already exists. Sign in instead.');
    const record = {
      id: user?.provider === 'guest' ? user.id : crypto.randomUUID(), // guest keeps the same data
      email,
      name: name?.trim() || email.split('@')[0],
      passwordHash: await hash(password),
      provider: 'email',
    };
    const next = [...users, record];
    localStorage.setItem('chessmind_users', JSON.stringify(next));
    set({ users: next });
    get()._login({ id: record.id, email, name: record.name, provider: 'email' });
  },

  async signIn({ email, password }) {
    email = email.trim().toLowerCase();
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Incorrect email or password.' : error.message);
      return;
    }
    const record = get().users.find(u => u.email === email);
    if (!record || !record.passwordHash || record.passwordHash !== (await hash(password))) {
      throw new Error('Incorrect email or password.');
    }
    get()._login({ id: record.id, email, name: record.name, provider: record.provider });
  },

  // Real Google OAuth through Supabase: Google's own account chooser opens, and the user authenticates there.
  async signInWithGoogle(redirectTo) {
    if (!supabase) throw new Error(SETUP_MESSAGE);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${redirectTo || '/'}`, queryParams: { prompt: 'select_account' } },
    });
    if (error) throw new Error(error.message);
  },

  loginWithLichess(username) {
    get()._login({ id: `lichess:${username.toLowerCase()}`, email: null, name: username, provider: 'lichess' });
  },

  continueAsGuest() {
    get()._login({ id: `guest:${crypto.randomUUID()}`, email: null, name: 'Guest', provider: 'guest' });
  },

  async signOut() {
    await flushUserData().catch(() => {});
    if (supabase) await supabase.auth.signOut().catch(() => {});
    localStorage.removeItem('chessmind_user');
    set({ user: null, settings: { ...defaultSettings } });
    useStore.getState().hydrate();
  },

  // Password change signs out other devices.
  async setPassword({ current, next }) {
    if (next.length < 6) throw new Error('Password must be at least 6 characters.');
    if (supabase) {
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw new Error(error.message);
      await supabase.auth.signOut({ scope: 'others' });
      return;
    }
    const { user, users } = get();
    const record = users.find(u => u.id === user.id);
    if (!record) throw new Error('Password sign-in is not available for this account.');
    if (record.passwordHash && record.passwordHash !== (await hash(current || ''))) {
      throw new Error('Current password is incorrect.');
    }
    record.passwordHash = await hash(next);
    localStorage.setItem('chessmind_users', JSON.stringify(users));
    get().signOutOtherDevices();
  },

  async signOutOtherDevices() {
    if (supabase) {
      await supabase.auth.signOut({ scope: 'others' });
      return;
    }
    const sessionVersion = get().sessionVersion + 1;
    localStorage.setItem('chessmind_session_version', String(sessionVersion));
    const user = { ...get().user, sessionVersion };
    localStorage.setItem('chessmind_user', JSON.stringify(user));
    set({ sessionVersion, user });
  },

  async updateProfile(patch) {
    const { user, users } = get();
    const updated = { ...user, ...patch };
    localStorage.setItem('chessmind_user', JSON.stringify(updated));
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...patch };
      localStorage.setItem('chessmind_users', JSON.stringify(users));
    }
    set({ user: updated });
    if (supabase && user.cloud && patch.name) await supabase.auth.updateUser({ data: { full_name: patch.name } });
  },

  updateSettings(patch) {
    const settings = { ...get().settings, ...patch };
    userStorage.setItem('chessmind_settings', JSON.stringify(settings));
    set({ settings });
  },

  // Deletes the user's stored data. (Removing the Supabase login itself requires a server-side admin call.)
  async deleteAccount() {
    const { user, users } = get();
    if (supabase && user.cloud) {
      await supabase.from('user_data').delete().eq('user_id', user.id);
      await supabase.auth.signOut().catch(() => {});
    }
    const next = users.filter(u => u.id !== user.id);
    clearUserData(user.id);
    localStorage.setItem('chessmind_users', JSON.stringify(next));
    localStorage.removeItem('chessmind_user');
    set({ users: next, user: null, settings: { ...defaultSettings } });
    useStore.getState().hydrate();
  },
}));
