import { getSupabase, isConfigured } from '../supabase.js';
import { GAME } from '../data/constants.js';
import { deterministicShuffle } from '../utils/helpers.js';

/**
 * Multiplayer Service - Handles PvP matchmaking, game state, realtime sync
 * Uses Supabase Realtime for synchronization
 * Deterministic simulation with server-authoritative validation
 */

const TURN_TIME_LIMIT = 90; // seconds
const RECONNECT_GRACE = 30; // seconds

// Generate deterministic seed from match ID + turn
function generateSeed(matchId, turn) {
  let hash = 0;
  const str = `${matchId}-${turn}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Deterministic RNG for card draws, effects
export class DeterministicRNG {
  constructor(seed) {
    this.seed = seed;
    this.state = seed;
  }
  
  next() {
    this.state = (this.state * 1664525 + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }
  
  nextInt(max) {
    return Math.floor(this.next() * max);
  }
  
  shuffle(array) {
    return deterministicShuffle([...array], this.seed);
  }
}

// Initial game state for a player
function createInitialPlayerState(deckIds, playerClass) {
  const deck = deterministicShuffle([...deckIds], generateSeed('init', Date.now()));
  const hand = deck.splice(0, 3);
  
  return {
    health: 30,
    mana: 0,
    maxMana: 0,
    hand,
    deck,
    graveyard: [],
    board: [],
    secrets: [],
    disconnected: false,
    surrender: false,
  };
}

export class MultiplayerService {
  constructor() {
    this.matchId = null;
    this.userId = null;
    this.playerNumber = null; // 0 or 1
    this.opponentId = null;
    this.channel = null;
    this.listeners = new Map();
    this.currentTurn = null;
    this.turnTimer = null;
    this.turnTimeLeft = TURN_TIME_LIMIT;
    this.seed = null;
    this.rng = null;
    this.gameState = {
      players: [{}, {}],
      turn: 0,
      phase: 'waiting', // waiting, mulligan, active, finished
      winner: null,
    };
    this.pendingActions = [];
    this.isReconnecting = false;
  }

  // ========== MATCHMAKING ==========

  async joinQueue(playerClass, deckIds, mode = 'ranked') {
    if (!isConfigured()) throw new Error('Supabase não configurado');
    
    const { data: { user } } = await getSupabase().auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');
    
    this.userId = user.id;
    
    // Check for existing active match
    const { data: existingMatch } = await getSupabase().rpc('find_active_match', { user_uuid: user.id });
    if (existingMatch) {
      await this.rejoinMatch(existingMatch);
      return { matchId: existingMatch, rejoined: true };
    }
    
    // Validate deck
    if (deckIds.length < GAME.minDeckSize || deckIds.length > GAME.maxDeckSize) {
      throw new Error(`Deck deve ter ${GAME.minDeckSize}-${GAME.maxDeckSize} cartas`);
    }
    
    // Enter queue
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase não configurado');
    const { data, error } = await sb
      .from('matchmaking_queue')
      .insert({
        user_id: user.id,
        player_class: playerClass,
        deck_ids: deckIds,
        rating: await this.getUserRating(user.id),
        status: 'searching',
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Subscribe to queue updates
    this.subscribeToQueue(data.id);
    
    return { queueId: data.id, matchId: null, rejoined: false };
  }

  async leaveQueue(queueId) {
    if (!queueId) return;
    const sb = getSupabase();
    if (!sb) return;
    await sb
      .from('matchmaking_queue')
      .update({ status: 'cancelled' })
      .eq('id', queueId);
    this.unsubscribeQueue();
  }

  async getUserRating(userId) {
    const sb = getSupabase();
    if (!sb) return 1000;
    const { data } = await sb
      .from('profiles')
      .select('rating')
      .eq('id', userId)
      .single();
    return data?.rating || 1000;
  }

  subscribeToQueue(queueId) {
    this.unsubscribeQueue();
    const sb = getSupabase();
    if (!sb) return;
    this.queueChannel = sb
      .channel(`queue:${queueId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'matchmaking_queue',
        filter: `id=eq.${queueId}`,
      }, (payload) => {
        if (payload.new.status === 'matched' && payload.new.match_id) {
          this.handleMatchFound(payload.new.match_id);
        }
      })
      .subscribe();
  }

  unsubscribeQueue() {
    if (this.queueChannel) {
      getSupabase().removeChannel(this.queueChannel);
      this.queueChannel = null;
    }
  }

  async handleMatchFound(matchId) {
    this.unsubscribeQueue();
    await this.joinMatch(matchId);
    this.emit('matchFound', { matchId });
  }

  // ========== MATCH MANAGEMENT ==========

  async joinMatch(matchId) {
    this.matchId = matchId;
    
    // Fetch match and player data
    const [{ data: match }, { data: players }] = await Promise.all([
      getSupabase().from('matches').select('*').eq('id', matchId).single(),
      getSupabase().from('match_players').select('*').eq('match_id', matchId).order('joined_at'),
    ]);
    
    if (!match || players.length !== 2) throw new Error('Partida inválida');
    
    // Determine player number
    this.playerNumber = players.findIndex(p => p.user_id === this.userId);
    this.opponentId = players[1 - this.playerNumber].user_id;
    this.seed = match.seed;
    this.rng = new DeterministicRNG(this.seed);
    
    // Initialize game state
    this.gameState = {
      players: players.map((p, i) => ({
        ...createInitialPlayerState(p.deck_ids, p.player_class),
        userId: p.user_id,
        playerClass: p.player_class,
        health: p.health,
        mana: p.mana,
        maxMana: p.max_mana,
        hand: p.hand,
        deck: p.deck,
        graveyard: p.graveyard,
        board: p.board,
        secrets: p.secrets,
        disconnected: p.disconnected,
        surrender: p.surrender,
      })),
      turn: match.turn_number,
      currentTurn: match.current_turn,
      phase: match.status === 'active' ? 'active' : 'mulligan',
      winner: match.winner_id,
    };
    
    this.currentTurn = match.current_turn;
    
    // Subscribe to realtime
    this.subscribeToMatch(matchId);
    
    // Start turn timer if active
    if (match.status === 'active' && match.turn_started_at) {
      this.startTurnTimer(match.turn_started_at);
    }
    
    this.emit('matchJoined', { match, playerNumber: this.playerNumber });
    return { match, playerNumber: this.playerNumber };
  }

  async rejoinMatch(matchId) {
    this.isReconnecting = true;
    await this.joinMatch(matchId);
    this.isReconnecting = false;
    this.emit('reconnected', { matchId });
  }

  subscribeToMatch(matchId) {
    this.unsubscribeMatch();
    
    const sb = getSupabase();
    if (!sb) return;
    this.channel = sb
      .channel(`match:${matchId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${matchId}`,
      }, (payload) => this.handleMatchUpdate(payload))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'match_players',
        filter: `match_id=eq.${matchId}`,
      }, (payload) => this.handlePlayerUpdate(payload))
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'match_actions',
        filter: `match_id=eq.${matchId}`,
      }, (payload) => this.handleAction(payload.new))
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.emit('connected', { matchId });
        } else if (status === 'CHANNEL_ERROR') {
          this.emit('connectionError', { matchId });
        }
      });
  }

  unsubscribeMatch() {
    if (this.channel) {
      getSupabase().removeChannel(this.channel);
      this.channel = null;
    }
    this.clearTurnTimer();
  }

  // ========== EVENT HANDLERS ==========

  handleMatchUpdate(payload) {
    const match = payload.new;
    if (!match) return;
    
    if (match.status === 'active' && this.gameState.phase !== 'active') {
      this.gameState.phase = 'active';
      this.startTurnTimer(match.turn_started_at);
      this.emit('gameStart', { match });
    }
    
    if (match.current_turn !== this.currentTurn) {
      this.currentTurn = match.current_turn;
      this.gameState.currentTurn = match.current_turn;
      this.gameState.turn = match.turn_number;
      this.startTurnTimer(match.turn_started_at);
      this.emit('turnChanged', { 
        currentTurn: match.current_turn, 
        turnNumber: match.turn_number,
        isMyTurn: match.current_turn === this.userId,
      });
    }
    
    if (match.status === 'finished') {
      this.clearTurnTimer();
      this.gameState.phase = 'finished';
      this.gameState.winner = match.winner_id;
      this.emit('gameEnd', { 
        winner: match.winner_id, 
        resultData: match.result_data,
        isVictory: match.winner_id === this.userId,
      });
    }
  }

  handlePlayerUpdate(payload) {
    const player = payload.new;
    if (!player) return;
    
    const idx = player.user_id === this.userId ? this.playerNumber : 1 - this.playerNumber;
    const gamePlayer = this.gameState.players[idx];
    
    // Update local state from server
    Object.assign(gamePlayer, {
      health: player.health,
      mana: player.mana,
      maxMana: player.max_mana,
      hand: player.hand,
      deck: player.deck,
      graveyard: player.graveyard,
      board: player.board,
      secrets: player.secrets,
      disconnected: player.disconnected,
      surrender: player.surrender,
    });
    
    this.emit('playerStateChanged', { playerIndex: idx, player: gamePlayer });
  }

  handleAction(action) {
    // Server-validated action - apply to local state
    if (action.server_validated) {
      this.applyAction(action);
      this.emit('actionValidated', { action });
    }
  }

  // ========== ACTIONS (Client sends, Server validates) ==========

  async sendAction(actionType, actionData) {
    if (!this.matchId || !this.userId) throw new Error('Não em partida');
    if (this.gameState.phase !== 'active') throw new Error('Jogo não ativo');
    if (this.currentTurn !== this.userId) throw new Error('Não é seu turno');
    
    const action = {
      match_id: this.matchId,
      user_id: this.userId,
      turn_number: this.gameState.turn,
      action_type: actionType,
      action_data: actionData,
    };
    
    // Optimistic update
    this.applyAction(action);
    
    // Send to server for validation
    const { error } = await getSupabase().from('match_actions').insert(action);
    if (error) {
      // Revert on error
      this.revertOptimisticAction(actionType, actionData);
      throw error;
    }
  }

  applyAction(action) {
    const me = this.gameState.players[this.playerNumber];
    const opponent = this.gameState.players[1 - this.playerNumber];
    
    switch (action.action_type) {
      case 'play_card': {
        const { cardId, instanceId, position, target } = action.action_data;
        const cardIndex = me.hand.indexOf(cardId);
        if (cardIndex === -1) return false;
        
        // Remove from hand, add to board
        me.hand.splice(cardIndex, 1);
        me.board.push({
          cardId,
          instanceId,
          position, // 0-4
          attack: action.action_data.baseAttack,
          health: action.action_data.baseHealth,
          effects: [],
          canAttack: false,
          justPlayed: true,
        });
        me.mana -= action.action_data.cost;
        break;
      }
      case 'attack': {
        const { attackerInstanceId, targetInstanceId } = action.action_data;
        const attacker = me.board.find(c => c.instanceId === attackerInstanceId);
        const target = opponent.board.find(c => c.instanceId === targetInstanceId) || opponent;
        
        if (!attacker || attacker.canAttack === false) return false;
        
        // Deal damage
        if (target.instanceId) {
          target.health -= attacker.attack;
          if (target.health <= 0) {
            opponent.board = opponent.board.filter(c => c.instanceId !== targetInstanceId);
            opponent.graveyard.push(target.cardId);
          }
        } else {
          target.health -= attacker.attack;
        }
        attacker.canAttack = false;
        break;
      }
      case 'end_turn': {
        this.endTurnLocal();
        break;
      }
      case 'concede': {
        me.surrender = true;
        this.gameState.phase = 'finished';
        this.gameState.winner = opponent.userId;
        break;
      }
      case 'draw_card': {
        if (me.deck.length > 0) {
          const drawn = me.deck.pop();
          me.hand.push(drawn);
        }
        break;
      }
    }
    return true;
  }

  revertOptimisticAction(actionType, actionData) {
    // In practice, would need full state rollback
    // For now, request full sync from server
    this.requestStateSync();
  }

  async requestStateSync() {
    const sb = getSupabase();
    if (!sb) return;
    const { data: players } = await sb
      .from('match_players')
      .select('*')
      .eq('match_id', this.matchId)
      .order('joined_at');
    
    if (players) {
      players.forEach((p, i) => {
        Object.assign(this.gameState.players[i], {
          health: p.health,
          mana: p.mana,
          maxMana: p.max_mana,
          hand: p.hand,
          deck: p.deck,
          graveyard: p.graveyard,
          board: p.board,
          secrets: p.secrets,
          disconnected: p.disconnected,
          surrender: p.surrender,
        });
      });
      this.emit('stateSynced', { players: this.gameState.players });
    }
  }

  endTurnLocal() {
    // Apply end-of-turn effects
    const me = this.gameState.players[this.playerNumber];
    me.board.forEach(minion => { minion.canAttack = true; minion.justPlayed = false; });
    
    // Send end_turn action
    this.sendAction('end_turn', {});
  }

  // ========== TURN TIMER ==========

  startTurnTimer(turnStartedAt) {
    this.clearTurnTimer();
    const elapsed = (Date.now() - new Date(turnStartedAt).getTime()) / 1000;
    this.turnTimeLeft = Math.max(0, TURN_TIME_LIMIT - elapsed);
    
    this.turnTimer = setInterval(() => {
      this.turnTimeLeft--;
      this.emit('turnTimer', { timeLeft: this.turnTimeLeft });
      
      if (this.turnTimeLeft <= 0) {
        this.clearTurnTimer();
        // Auto-end turn on timeout
        if (this.currentTurn === this.userId) {
          this.sendAction('end_turn', { timeout: true });
        }
      }
    }, 1000);
  }

  clearTurnTimer() {
    if (this.turnTimer) {
      clearInterval(this.turnTimer);
      this.turnTimer = null;
    }
  }

  // ========== PUBLIC ACTIONS ==========

  async playCard(cardId, instanceId, position, cardData) {
    return this.sendAction('play_card', {
      cardId,
      instanceId,
      position,
      cost: cardData.cost,
      baseAttack: cardData.attack,
      baseHealth: cardData.health,
    });
  }

  async attack(attackerInstanceId, targetInstanceId) {
    return this.sendAction('attack', { attackerInstanceId, targetInstanceId });
  }

  async endTurn() {
    return this.sendAction('end_turn', {});
  }

  async concede() {
    return this.sendAction('concede', {});
  }

  async sendEmote(emoteId) {
    return this.sendAction('emote', { emoteId });
  }

  // ========== EVENT SYSTEM ==========

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    const list = this.listeners.get(event);
    if (list) {
      const idx = list.indexOf(callback);
      if (idx > -1) list.splice(idx, 1);
    }
  }

  emit(event, data) {
    const list = this.listeners.get(event);
    if (list) list.forEach(cb => cb(data));
  }

  // ========== STATE GETTERS ==========

  getMyState() {
    return this.gameState.players[this.playerNumber];
  }

  getOpponentState() {
    return this.gameState.players[1 - this.playerNumber];
  }

  getGameState() {
    return {
      ...this.gameState,
      isMyTurn: this.currentTurn === this.userId,
      turnTimeLeft: this.turnTimeLeft,
      playerNumber: this.playerNumber,
    };
  }

  // ========== CLEANUP ==========

  destroy() {
    this.clearTurnTimer();
    this.unsubscribeMatch();
    this.unsubscribeQueue();
    this.listeners.clear();
    this.matchId = null;
    this.userId = null;
  }

  // ========== PRIVATE/FRIENDLY MATCHES ==========

  /**
   * Create a private match with a shareable code
   * Returns a match code that can be shared with a friend
   */
  async createPrivateMatch(playerClass, deckIds, mode = 'friendly') {
    if (!isConfigured()) throw new Error('Supabase não configurado');
    
    const { data: { user } } = await getSupabase().auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');
    
    this.userId = user.id;
    
    // Validate deck
    if (deckIds.length < GAME.minDeckSize || deckIds.length > GAME.maxDeckSize) {
      throw new Error(`Deck deve ter ${GAME.minDeckSize}-${GAME.maxDeckSize} cartas`);
    }
    
    // Generate a short match code (6 chars)
    const matchCode = this.generateMatchCode();
    const seed = generateSeed(matchCode, 0);
    
    const { data: match, error } = await getSupabase()
      .from('matches')
      .insert({
        status: 'waiting',
        mode: mode,
        current_turn: null,
        turn_number: 0,
        seed: seed,
        // Store the match code for joining
        result_data: { matchCode, isPrivate: true },
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Add creator as first player
    const { error: playerError } = await getSupabase()
      .from('match_players')
      .insert({
        match_id: match.id,
        user_id: user.id,
        player_class: playerClass,
        deck_ids: deckIds,
        health: GAME.initialHealth,
        mana: 0,
        max_mana: 0,
        hand: [],
        deck: deckIds,
        graveyard: [],
        board: [],
        secrets: [],
      });
    
    if (playerError) {
      // Cleanup match if player insert fails
      await getSupabase().from('matches').delete().eq('id', match.id);
      throw playerError;
    }
    
    // Subscribe to wait for opponent
    this.matchId = match.id;
    this.subscribeToMatch(match.id);
    
    // Wait for second player to join
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.unsubscribeMatch();
        reject(new Error('Tempo esgotado - nenhum oponente entrou'));
      }, 5 * 60 * 1000); // 5 min timeout
      
      const unsub = this.on('playerJoined', async ({ players }) => {
        if (players.length === 2) {
          clearTimeout(timeout);
          unsub();
          // Start the match
          await this.startPrivateMatch(match.id);
          resolve({ matchId: match.id, matchCode, match });
        }
      });
      
      // Also listen for match status change
      const unsubMatch = this.on('matchUpdate', ({ status }) => {
        if (status === 'active') {
          clearTimeout(timeout);
          unsub();
          unsubMatch();
          resolve({ matchId: match.id, matchCode, match });
        }
      });
    });
  }

  /**
   * Join a private match using a match code
   */
  async joinPrivateMatch(matchCode, playerClass, deckIds) {
    if (!isConfigured()) throw new Error('Supabase não configurado');
    
    const { data: { user } } = await getSupabase().auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');
    
    this.userId = user.id;
    
    // Validate deck
    if (deckIds.length < GAME.minDeckSize || deckIds.length > GAME.maxDeckSize) {
      throw new Error(`Deck deve ter ${GAME.minDeckSize}-${GAME.maxDeckSize} cartas`);
    }
    
    // Find match by code in result_data
    const { data: matches, error } = await getSupabase()
      .from('matches')
      .select('*')
      .eq('status', 'waiting')
      .eq('mode', 'friendly');
    
    if (error) throw error;
    
    const match = matches?.find(m => m.result_data?.matchCode === matchCode && m.result_data?.isPrivate);
    
    if (!match) {
      throw new Error('Código de partida inválido ou expirado');
    }
    
    // Check if match already has 2 players
    const { data: players } = await getSupabase()
      .from('match_players')
      .select('*')
      .eq('match_id', match.id);
    
    if (players && players.length >= 2) {
      throw new Error('Partida já está cheia');
    }
    
    // Add as second player
    const { error: playerError } = await getSupabase()
      .from('match_players')
      .insert({
        match_id: match.id,
        user_id: user.id,
        player_class: playerClass,
        deck_ids: deckIds,
        health: GAME.initialHealth,
        mana: 0,
        max_mana: 0,
        hand: [],
        deck: deckIds,
        graveyard: [],
        board: [],
        secrets: [],
      });
    
    if (playerError) throw playerError;
    
    // Join the match
    await this.joinMatch(match.id);
    
    // Notify creator that opponent joined
    await getSupabase()
      .from('matches')
      .update({ 
        status: 'active',
        started_at: new Date().toISOString(),
        current_turn: match.id, // Will be set properly in startPrivateMatch
      })
      .eq('id', match.id);
    
    this.emit('playerJoined', { players: [...(players || []), { user_id: user.id }] });
    
    return { matchId: match.id, match };
  }

  /**
   * Start the private match (called when both players joined)
   */
  async startPrivateMatch(matchId) {
    // Determine first turn randomly using seed
    const { data: match } = await getSupabase()
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();
    
    const { data: players } = await getSupabase()
      .from('match_players')
      .select('*')
      .eq('match_id', matchId)
      .order('joined_at');
    
    if (!match || !players || players.length !== 2) return;
    
    // Use seed to determine first player
    const rng = new DeterministicRNG(match.seed);
    const firstPlayerIndex = rng.nextInt(2);
    const firstPlayerId = players[firstPlayerIndex].user_id;
    
    // Initialize hands (draw 3 cards each)
    for (const player of players) {
      const shuffledDeck = deterministicShuffle([...player.deck_ids], generateSeed(match.seed + player.user_id, 0));
      const hand = shuffledDeck.splice(0, 3);
      
      await getSupabase()
        .from('match_players')
        .update({
          hand: hand,
          deck: shuffledDeck,
        })
        .eq('id', player.id);
    }
    
    // Update match status
    await getSupabase()
      .from('matches')
      .update({
        status: 'active',
        current_turn: firstPlayerId,
        turn_number: 1,
        turn_started_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
      })
      .eq('id', matchId);
    
    // Re-fetch and rejoin to get updated state
    await this.joinMatch(matchId);
  }

  /**
   * Generate a short 6-character match code
   */
  generateMatchCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  /**
   * Cancel a private match (only creator can)
   */
  async cancelPrivateMatch(matchId) {
    if (!this.matchId || this.matchId !== matchId) return;
    
    await getSupabase()
      .from('matches')
      .update({ status: 'abandoned' })
      .eq('id', matchId);
    
    this.unsubscribeMatch();
    this.matchId = null;
  }
}

// Singleton instance
export const multiplayer = new MultiplayerService();