import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = () => !!(url && key);

let client = null;
export function getSupabase() {
  if (client) return client;
  if (!isConfigured()) return null;
  client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  return client;
}

// Auth
export async function signInAnonymous() {
  const sb = getSupabase();
  if (!sb) return { ok: false };
  const { data, error } = await sb.auth.signInAnonymously();
  return { ok: !error, uid: data?.user?.id, error: error?.message };
}

export async function signUpWithEmail(email, password) {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'Supabase indisponível' };
  const { data, error } = await sb.auth.signUp({ email, password });
  return { ok: !error, uid: data?.user?.id, email: data?.user?.email, error: error?.message };
}

export async function signInWithEmail(email, password) {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'Supabase indisponível' };
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  return { ok: !error, uid: data?.user?.id, email: data?.user?.email, error: error?.message };
}

export async function signOut() {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
}

export async function getCurrentUser() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data?.user || null;
}

// Leaderboard
export async function getLeaderboard(limit = 20) {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('leaderboard')
    .select('*')
    .order('wins', { ascending: false })
    .limit(limit);
  return error ? [] : (data || []);
}

export async function upsertLeaderboard({ uid, name, wins, losses, games, playerClass }) {
  const sb = getSupabase();
  if (!sb) return { ok: false };
  const { error } = await sb.from('leaderboard').upsert({
    user_id: uid,
    name: name || 'Herói',
    wins: wins || 0,
    losses: losses || 0,
    games: games || 0,
    player_class: playerClass || 'NEUTRAL',
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' });
  return { ok: !error, error: error?.message };
}

// User progress (cloud save)
export async function saveProgress(uid, { deckIds, stats, playerClass }) {
  const sb = getSupabase();
  if (!sb) return { ok: false };
  const { error } = await sb.from('user_progress').upsert({
    user_id: uid,
    deck_ids: deckIds || [],
    stats: stats || {},
    player_class: playerClass || null,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' });
  return { ok: !error, error: error?.message };
}

export async function loadProgress(uid) {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('user_progress')
    .select('*')
    .eq('user_id', uid)
    .maybeSingle();
  return error ? null : data;
}
