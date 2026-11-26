/**
 * Clan Wars Service
 * Manages clan war creation, matchmaking, scoring, and results
 */

import { getSupabase } from '../supabase.js';

export async function createClanWar(clanId, opponentClanId) {
  const sb = getSupabase();
  if (!sb) return null;
  
  try {
    const { data, error } = await sb.from('clan_wars').insert({
      clan_id: clanId,
      opponent_clan_id: opponentClanId,
      status: 'pending',
      clan_score: 0,
      opponent_score: 0,
      started_at: null,
      ended_at: null,
    }).select().single();
    
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('Erro ao criar guerra de clã:', e);
    return null;
  }
}

export async function startClanWar(warId) {
  const sb = getSupabase();
  if (!sb) return false;
  
  try {
    const { error } = await sb.from('clan_wars').update({
      status: 'active',
      started_at: new Date().toISOString(),
    }).eq('id', warId);
    
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Erro ao iniciar guerra:', e);
    return false;
  }
}

export async function recordClanWarBattle(warId, winnerClanId, score) {
  const sb = getSupabase();
  if (!sb) return false;
  
  try {
    const { data: war } = await sb.from('clan_wars').select('*').eq('id', warId).single();
    if (!war) return false;
    
    const isClanWinner = winnerClanId === war.clan_id;
    const updateData = isClanWinner
      ? { clan_score: war.clan_score + score }
      : { opponent_score: war.opponent_score + score };
    
    const { error } = await sb.from('clan_wars').update(updateData).eq('id', warId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Erro ao registrar batalha:', e);
    return false;
  }
}

export async function endClanWar(warId) {
  const sb = getSupabase();
  if (!sb) return null;
  
  try {
    const { data: war } = await sb.from('clan_wars').select('*').eq('id', warId).single();
    if (!war) return null;
    
    const winnerId = war.clan_score > war.opponent_score ? war.clan_id : war.opponent_clan_id;
    
    const { data, error } = await sb.from('clan_wars').update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      winner_id: winnerId,
    }).eq('id', warId).select().single();
    
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('Erro ao finalizar guerra:', e);
    return null;
  }
}

export async function getClanWars(clanId) {
  const sb = getSupabase();
  if (!sb) return [];
  
  try {
    const { data } = await sb
      .from('clan_wars')
      .select(`
        *,
        clan:clan_id(id, name, tag),
        opponent:opponent_clan_id(id, name, tag)
      `)
      .or(`clan_id.eq.${clanId},opponent_clan_id.eq.${clanId}`)
      .order('created_at', { ascending: false });
    
    return data || [];
  } catch (e) {
    console.error('Erro ao carregar guerras:', e);
    return [];
  }
}

export async function getActiveClanWar(clanId) {
  const sb = getSupabase();
  if (!sb) return null;
  
  try {
    const { data } = await sb
      .from('clan_wars')
      .select(`
        *,
        clan:clan_id(id, name, tag),
        opponent:opponent_clan_id(id, name, tag)
      `)
      .or(`clan_id.eq.${clanId},opponent_clan_id.eq.${clanId}`)
      .eq('status', 'active')
      .limit(1)
      .single();
    
    return data;
  } catch (e) {
    return null;
  }
}

export default {
  createClanWar,
  startClanWar,
  recordClanWarBattle,
  endClanWar,
  getClanWars,
  getActiveClanWar,
};