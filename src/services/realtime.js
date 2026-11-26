/**
 * Supabase Realtime Service
 * Provides real-time subscriptions for tournaments, clan wars, and matches
 */

import { getSupabase } from '../supabase.js';

class RealtimeService {
  constructor() {
    this.channels = new Map();
  }

  // Subscribe to tournament match updates
  subscribeToTournamentMatches(tournamentId, callback) {
    const sb = getSupabase();
    if (!sb) return null;

    const channel = sb
      .channel(`tournament:${tournamentId}:matches`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tournament_matches',
        filter: `tournament_id=eq.${tournamentId}`,
      }, (payload) => {
        callback(payload);
      })
      .subscribe();

    this.channels.set(`tournament:${tournamentId}`, channel);
    return channel;
  }

  // Subscribe to clan war updates
  subscribeToClanWar(warId, callback) {
    const sb = getSupabase();
    if (!sb) return null;

    const channel = sb
      .channel(`clanwar:${warId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'clan_wars',
        filter: `id=eq.${warId}`,
      }, (payload) => {
        callback(payload);
      })
      .subscribe();

    this.channels.set(`clanwar:${warId}`, channel);
    return channel;
  }

  // Subscribe to clan war battles
  subscribeToClanWarBattles(warId, callback) {
    const sb = getSupabase();
    if (!sb) return null;

    const channel = sb
      .channel(`clanwar:${warId}:battles`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'clan_war_battles',
        filter: `war_id=eq.${warId}`,
      }, (payload) => {
        callback(payload);
      })
      .subscribe();

    this.channels.set(`clanwar:${warId}:battles`, channel);
    return channel;
  }

  // Unsubscribe from a channel
  unsubscribe(key) {
    const channel = this.channels.get(key);
    if (channel) {
      const sb = getSupabase();
      if (sb) sb.removeChannel(channel);
      this.channels.delete(key);
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.channels.forEach((channel, key) => {
      const sb = getSupabase();
      if (sb) sb.removeChannel(channel);
    });
    this.channels.clear();
  }
}

let instance = null;

export function getRealtimeService() {
  if (!instance) {
    instance = new RealtimeService();
  }
  return instance;
}

export default RealtimeService;