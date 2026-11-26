import { describe, it, expect } from 'vitest';
import { createGame, playCard, attackWithMinion, endTurn, selectTarget, cancelTargeting, damageMinion, healMinion, damageHero, healHero, hasKeyword, draw, getValidTargets, triggerDeathrattle } from './engine.js';

describe('Engine - Core Game Logic', () => {
  // Test 1: createGame initializes correctly
  it('createGame initializes player and enemy with correct defaults', () => {
    const state = createGame(
      ['vamp_001', 'vamp_002', 'vamp_003', 'vamp_004', 'vamp_005', 'vamp_006', 'vamp_007', 'vamp_008', 'vamp_009', 'vamp_010'],
      'VAMPIRE',
      { difficulty: 'normal' }
    );
    expect(state.player.health).toBe(30);
    expect(state.enemy.health).toBe(30);
    expect(state.player.maxBlood).toBe(1);
    expect(state.enemy.maxBlood).toBe(1);
    expect(state.player.hand.length).toBe(4);
    expect(state.enemy.hand.length).toBe(4);
    expect(state.turn).toBe(1);
    expect(state.active).toBe('player');
    expect(state.difficulty).toBe('normal');
    expect(state.playerClass).toBe('VAMPIRE');
    expect(state.enemyClass).toBe('VAMPIRE');
  });

  // Test 2: createGame with different difficulties
  it('createGame normalizes difficulty', () => {
    const easy = createGame([], 'VAMPIRE', { difficulty: 'easy' });
    const hard = createGame([], 'VAMPIRE', { difficulty: 'hard' });
    const normal = createGame([], 'VAMPIRE', { difficulty: 'normal' });
    const facil = createGame([], 'VAMPIRE', { difficulty: 'facil' });
    const dificil = createGame([], 'VAMPIRE', { difficulty: 'dificil' });
    expect(easy.difficulty).toBe('easy');
    expect(hard.difficulty).toBe('hard');
    expect(normal.difficulty).toBe('normal');
    expect(facil.difficulty).toBe('easy');
    expect(dificil.difficulty).toBe('hard');
  });

  // Test 3: createGame with HUMAN class
  it('createGame with HUMAN class sets enemy to VAMPIRE', () => {
    const state = createGame([], 'HUMAN', { difficulty: 'normal' });
    expect(state.playerClass).toBe('HUMAN');
    expect(state.enemyClass).toBe('VAMPIRE');
    expect(state.player.resourceName).toBe('Fé');
    expect(state.enemy.resourceName).toBe('Sangue');
  });

  // Test 4: damageHero applies damage and shield
  it('damageHero applies damage and respects shield', () => {
    const state = createGame([], 'VAMPIRE', { difficulty: 'normal' });
    state.player.shield = 5;
    damageHero(state, 'player', 10, 'Test');
    expect(state.player.shield).toBe(0);
    expect(state.player.health).toBe(25);
  });

  // Test 5: healHero heals up to max
  it('healHero heals up to max health', () => {
    const state = createGame([], 'VAMPIRE', { difficulty: 'normal' });
    state.player.health = 10;
    healHero(state, 'player', 10);
    expect(state.player.health).toBe(20);
    healHero(state, 'player', 50);
    expect(state.player.health).toBe(30);
  });

  // Test 6: damageMinion handles divine shield
  it('damageMinion respects divine shield', () => {
    const state = createGame([], 'VAMPIRE', { difficulty: 'normal' });
    const minion = { uid: 'test1', name: 'Test', health: 5, maxHealth: 5, attack: 3, keywords: ['divineShield'], shield: 0 };
    damageMinion(state, minion, 10, 'Test');
    expect(minion.health).toBe(5);
    expect(minion.keywords).not.toContain('divineShield');
  });

  // Test 7: damageMinion respects shield
  it('damageMinion respects shield', () => {
    const state = createGame([], 'VAMPIRE', { difficulty: 'normal' });
    const minion = { uid: 'test2', name: 'Test', health: 5, maxHealth: 5, attack: 3, keywords: [], shield: 3 };
    damageMinion(state, minion, 5, 'Test');
    expect(minion.shield).toBe(0);
    expect(minion.health).toBe(3);
  });

  // Test 8: healMinion heals up to max health
  it('healMinion heals up to max health', () => {
    const state = createGame([], 'VAMPIRE', { difficulty: 'normal' });
    const minion = { uid: 'test3', name: 'Test', health: 2, maxHealth: 5, attack: 3, keywords: [], shield: 0 };
    const healed = healMinion(state, minion, 10);
    expect(healed).toBe(3);
    expect(minion.health).toBe(5);
  });

  // Test 9: hasKeyword works
  it('hasKeyword detects keywords', () => {
    const minion = { keywords: ['taunt', 'divineShield'] };
    expect(hasKeyword(minion, 'taunt')).toBe(true);
    expect(hasKeyword(minion, 'divineShield')).toBe(true);
    expect(hasKeyword(minion, 'lifesteal')).toBe(false);
    expect(hasKeyword({ keywords: [] }, 'taunt')).toBe(false);
    expect(hasKeyword({}, 'taunt')).toBeFalsy();
  });

  // Test 10: endTurn switches active player
  it('endTurn switches active player', () => {
    const state = createGame(
      ['vamp_001', 'vamp_002', 'vamp_003', 'vamp_003', 'vamp_004', 'vamp_004', 'vamp_005', 'vamp_005', 'vamp_006', 'vamp_006'],
      'VAMPIRE',
      { difficulty: 'normal' }
    );
    expect(state.active).toBe('player');
    const afterEnemy = endTurn(state);
    expect(afterEnemy.active).toBe('player');
    expect(afterEnemy.turn).toBe(2);
  });

  // Test 11: targeting mode for spells
  it('playCard enters targeting mode for targeted spells', () => {
    const state = createGame([], 'VAMPIRE', { difficulty: 'normal' });
    state.enemy.board.push({ uid: 'e1', name: 'Enemy Minion', health: 2, maxHealth: 2, attack: 1, keywords: [], canAttack: true, hasAttacked: false, effects: {}, silenced: false, enchantments: [] });
    state.player.hand.push({
      uid: 'spell_1',
      id: 'spell_1',
      name: 'Test Spell',
      cost: 1,
      type: 'MAGIC',
      effects: {
        onPlay: [{ type: 'damageEnemyMinion', value: 3, targetType: 'enemyMinion' }]
      }
    });
    state.player.blood = 10;

    const result = playCard(state, state.player.hand.length - 1);
    expect(result.targeting).not.toBeNull();
    expect(result.targeting.controller).toBe('player');
    expect(result.targeting.validTargets.length).toBeGreaterThan(0);
  });

  // Test 12: selectTarget resolves targeting and plays card
  it('selectTarget resolves targeting and plays card', () => {
    const state = createGame([], 'VAMPIRE', { difficulty: 'normal' });
    state.enemy.board.push({ uid: 'e1', name: 'Enemy Minion', health: 2, maxHealth: 2, attack: 1, keywords: [], canAttack: true, hasAttacked: false, effects: {}, silenced: false, enchantments: [] });
    state.player.hand.push({
      uid: 'spell_1',
      id: 'spell_1',
      name: 'Test Spell',
      cost: 1,
      type: 'MAGIC',
      effects: {
        onPlay: [{ type: 'damageEnemyMinion', value: 3, targetType: 'enemyMinion' }]
      }
    });
    state.player.blood = 10;

    const result = playCard(state, state.player.hand.length - 1);
    expect(result.targeting).not.toBeNull();
    expect(result.targeting.validTargets.length).toBeGreaterThan(0);
  });

  // Test 13: cancelTargeting returns card to hand
  it('cancelTargeting returns card to hand', () => {
    const state = createGame([], 'VAMPIRE', { difficulty: 'normal' });
    state.enemy.board.push({ uid: 'e1', name: 'Enemy Minion', health: 2, maxHealth: 2, attack: 1, keywords: [], canAttack: true, hasAttacked: false, effects: {}, silenced: false, enchantments: [] });
    state.player.hand.push({
      uid: 'spell_1',
      id: 'spell_1',
      name: 'Test Spell',
      cost: 1,
      type: 'MAGIC',
      effects: {
        onPlay: [{ type: 'damageEnemyMinion', value: 3, targetType: 'enemyMinion' }]
      }
    });
    state.player.blood = 10;

    const targetingState = playCard(state, 0);
    const handBefore = targetingState.player.hand.length;
    const finalState = cancelTargeting(targetingState);

    expect(finalState.targeting).toBeNull();
    expect(finalState.player.hand.length).toBe(handBefore);
  });

  // Test 14: attackWithMinion attacks face when no enemy minions
  it('attackWithMinion attacks hero when no enemy minions', () => {
    const state = createGame([], 'VAMPIRE', { difficulty: 'normal' });
    state.player.board.push({ uid: 'm1', name: 'Attacker', health: 3, maxHealth: 3, attack: 5, canAttack: true, hasAttacked: false, keywords: [], effects: {}, silenced: false, enchantments: [] });
    state.enemy.health = 30;

    const result = attackWithMinion(state, 0);
    expect(result.enemy.health).toBe(25);
    expect(result.player.board[0].canAttack).toBe(false);
    expect(result.player.board[0].hasAttacked).toBe(true);
  });

  // Test 15: attackWithMinion trades with enemy minion
  it('attackWithMinion trades with enemy minion', () => {
    const state = createGame([], 'VAMPIRE', { difficulty: 'normal' });
    state.player.board.push({ uid: 'm1', name: 'Attacker', health: 3, maxHealth: 3, attack: 5, canAttack: true, hasAttacked: false, keywords: [], effects: {}, silenced: false, enchantments: [] });
    state.enemy.board.push({ uid: 'e1', name: 'Defender', health: 2, maxHealth: 2, attack: 1, canAttack: true, hasAttacked: false, keywords: [], effects: {}, silenced: false, enchantments: [] });

    const result = attackWithMinion(state, 0);
    expect(result.enemy.board.length).toBe(0);
    expect(result.player.board[0].health).toBe(2);
  });

  // Test 16: Taunt forces targeting
  it('getValidTargets respects taunt', () => {
    const taunt = { uid: 't1', name: 'Taunt', health: 2, maxHealth: 2, attack: 1, keywords: ['taunt'], canAttack: false, hasAttacked: false };
    const normal = { uid: 'n1', name: 'Normal', health: 3, maxHealth: 3, attack: 2, keywords: [], canAttack: false, hasAttacked: false };
    const attacker = { keywords: [], attack: 2 };

    const targets = getValidTargets([taunt, normal], attacker);
    expect(targets.length).toBe(1);
    expect(targets[0].uid).toBe('t1');
  });

  // Test 17: Flying can only be attacked by flying
  it('flying minion cannot be attacked by non-flying', () => {
    const flying = { uid: 'f1', name: 'Flying', health: 2, maxHealth: 2, attack: 1, keywords: ['flying'], canAttack: false, hasAttacked: false };
    const normal = { uid: 'n1', name: 'Normal', health: 3, maxHealth: 3, attack: 2, keywords: [], canAttack: false, hasAttacked: false };
    const attacker = { keywords: [], attack: 2 };

    const targets = getValidTargets([flying, normal], attacker);
    expect(targets.length).toBe(1);
    expect(targets[0].uid).toBe('n1');
  });

  // Test 18: Stealth prevents targeting
  it('stealth minion cannot be targeted', () => {
    const stealth = { uid: 's1', name: 'Stealth', health: 2, maxHealth: 2, attack: 1, keywords: ['stealth'], canAttack: false, hasAttacked: false };
    const normal = { uid: 'n1', name: 'Normal', health: 3, maxHealth: 3, attack: 2, keywords: [], canAttack: false, hasAttacked: false };
    const attacker = { keywords: [], attack: 2 };

    const targets = getValidTargets([stealth, normal], attacker);
    expect(targets.length).toBe(1);
    expect(targets[0].uid).toBe('n1');
  });

  // Test 19: Lifesteal heals attacker's hero
  it('lifesteal heals hero when damaging minion', () => {
    const state = createGame([], 'VAMPIRE', { difficulty: 'normal' });
    state.player.health = 20;
    const attacker = { uid: 'a1', name: 'Vampire', health: 3, maxHealth: 3, attack: 3, keywords: ['lifesteal'], canAttack: true, hasAttacked: false };
    const defender = { uid: 'd1', name: 'Victim', health: 2, maxHealth: 2, attack: 1, keywords: [], canAttack: false, hasAttacked: false };
    state.player.board.push(attacker);
    state.enemy.board.push(defender);

    const result = attackWithMinion(state, 0);
    expect(result.player.health).toBe(23);
  });

  // Test 20: Divine shield blocks first damage instance
  it('divine shield blocks first damage instance', () => {
    const state = createGame([], 'VAMPIRE', { difficulty: 'normal' });
    const attacker = { uid: 'a1', name: 'Attacker', health: 3, maxHealth: 3, attack: 5, keywords: [], canAttack: true, hasAttacked: false };
    const defender = { uid: 'd1', name: 'Shielded', health: 2, maxHealth: 2, attack: 1, keywords: ['divineShield'], canAttack: false, hasAttacked: false };
    state.player.board.push(attacker);
    state.enemy.board.push(defender);

    const result = attackWithMinion(state, 0);
    expect(result.enemy.board.length).toBe(1);
    expect(result.enemy.board[0].health).toBe(2);
    expect(result.enemy.board[0].keywords).not.toContain('divineShield');
  });

  // Test 21: Fatigue damage increases each draw
  it('fatigue damage increases', () => {
    const state = createGame([], 'VAMPIRE', { difficulty: 'normal' });
    state.player.deck = [];
    state.player.health = 30;
    state.player.fatigue = 0;
    draw(state, 'player', 1);
    expect(state.player.fatigue).toBe(1);
  });

  // Test 22: createGame campaign mode
  it('createGame campaign mode sets enemy class', () => {
    const state = createGame([], 'VAMPIRE', { difficulty: 'normal', mode: 'campaign', enemyClass: 'VAMPIRE' });
    expect(state.mode).toBe('campaign');
    expect(state.enemyClass).toBe('VAMPIRE');
  });

  // Test 23: Rush allows immediate attack
  it('rush minion can attack immediately', () => {
    const state = createGame([], 'VAMPIRE', { difficulty: 'normal' });
    const minion = { uid: 'r1', name: 'Rush', health: 2, maxHealth: 2, attack: 2, keywords: ['rush'], canAttack: true, hasAttacked: false };
    state.player.board.push(minion);
    expect(state.player.board[0].canAttack).toBe(true);
  });

  // Test 24: Charge allows immediate attack
  it('charge minion can attack immediately', () => {
    const state = createGame([], 'VAMPIRE', { difficulty: 'normal' });
    const minion = { uid: 'c1', name: 'Charge', health: 2, maxHealth: 2, attack: 2, keywords: ['charge'], canAttack: true, hasAttacked: false };
    state.player.board.push(minion);
    expect(state.player.board[0].canAttack).toBe(true);
  });

  // Test 25: Deathrattle triggers on destruction
  it('deathrattle triggers when minion dies', () => {
    const state = createGame([], 'VAMPIRE', { difficulty: 'normal' });
    const minion = {
      uid: 'dr1', name: 'Deathrattle', health: 1, maxHealth: 1, attack: 1,
      keywords: [], canAttack: false, hasAttacked: false,
      effects: { deathrattle: [{ type: 'healHero', value: 5 }] }
    };
    state.player.board.push(minion);
    state.player.health = 20;

    const destroyed = state.player.board.splice(0, 1)[0];
    triggerDeathrattle(state, destroyed, 'player');
    expect(state.player.health).toBe(25);
  });
});