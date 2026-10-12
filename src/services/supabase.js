import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const looksReal = v => Boolean(v) && !/your_|placeholder|xxxx/i.test(v);

// The anon key is public by design; row-level security (supabase/user_data.sql) protects each user's rows.
export const supabase = looksReal(url) && looksReal(anonKey) ? createClient(url, anonKey) : null;
export const supabaseEnabled = Boolean(supabase);

/** Per-user key/value cloud storage backed by the `user_data` table (RLS: users see only their own rows). */
export async function pullUserData() {
  if (!supabase) return {};
  const { data, error } = await supabase.from('user_data').select('key, value');
  if (error) throw error;
  return Object.fromEntries((data || []).map(r => [r.key, r.value]));
}

const pending = new Map();
let timer = null;

export function pushUserData(key, value) {
  if (!supabase) return;
  pending.set(key, value);
  clearTimeout(timer);
  timer = setTimeout(flushUserData, 600);
}

export async function flushUserData() {
  if (!supabase || pending.size === 0) return;
  const { data } = await supabase.auth.getSession();
  const uid = data?.session?.user?.id;
  if (!uid) return;
  const batch = [...pending.entries()];
  pending.clear();
  const upserts = batch.filter(([, v]) => v !== null).map(([key, value]) => ({ user_id: uid, key, value, updated_at: new Date().toISOString() }));
  const deletes = batch.filter(([, v]) => v === null).map(([k]) => k);
  if (upserts.length) await supabase.from('user_data').upsert(upserts, { onConflict: 'user_id,key' });
  if (deletes.length) await supabase.from('user_data').delete().in('key', deletes);
}
