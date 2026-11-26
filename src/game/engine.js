import cards from '../data/hv_cards.json' with { type: 'json' };
import { GAME, FACTIONS } from '../data/constants.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function expandDeck(deckIds) {
  const map = Object.fromEntries(cards.map(c => [c.id, c]));
  const list = [];
  for (const id of deckIds) {
    if (map[id]) list.push({ ...map[id], uid: id + '_' + Math.random().toString(36).slice(2, 8) });
  }
  return shuffle(list);
}

function draw(state, who, n = 1) {
  const p = state[who];
  for (let i = 0; i < n; i++) {
    if (p.deck.length === 0) {
      // Fatigue damage
      p.fatigue = (p.fatigue || 0) + 1;
      damageHero(state, who, p.fatigue, 'Fadiga');
      continue;
    }
    if (p.hand.length >= GAME.maxHandSize) {
      p.deck.shift();
      state.log.push(`${p.name}: mão cheia, carta perdida.`);
      continue;
    }
    p.hand.push(p.deck.shift());
  }
}

function hasKeyword(entity, keyword) {
  return entity.keywords && entity.keywords.includes(keyword);
}

function createMinion(card) {
  return {
    uid: card.uid,
    name: card.name,
    attack: card.attack ?? 1,
    health: card.health ?? 1,
    maxHealth: card.health ?? 1,
    baseAttack: card.attack ?? 1,
    baseHealth: card.health ?? 1,
    canAttack: false,
    hasAttacked: false,
    faction: card.faction,
    keywords: [...(card.keywords || [])],
    effects: card.effects ? structuredClone(card.effects) : {},
    isMinion: true,
    silenced: false,
    enchantments: [],
  };
}

function createHero(playerClass) {
  const isVampire = playerClass === 'VAMPIRE';
  const isHuman = playerClass === 'HUMAN';

  return {
    name: isVampire ? 'Lorde Vampiro' : isHuman ? 'Paladino Humano' : 'Herói Neutro',
    classId: playerClass || 'NEUTRAL',
    health: GAME.initialHealth,
    maxHealth: GAME.initialHealth,
    blood: 1,
    maxBlood: 1,
    shield: 0,
    fatigue: 0,
    resourceName: isVampire ? 'Sangue' : isHuman ? 'Fé' : 'Sangue',
    resourceIcon: isVampire ? '🩸' : isHuman ? '✨' : '🩸',
    accentColor: isVampire ? '#dc2626' : isHuman ? '#f59e0b' : '#a78bfa',
    isHero: true,
  };
}

function filterCardsByClass(classId) {
  if (classId === 'VAMPIRE') {
    return cards.filter(c => c.faction === 'VAMPIRE' || c.faction === 'NEUTRAL');
  }
  if (classId === 'HUMAN') {
    return cards.filter(c => c.faction === 'HUMAN' || c.faction === 'NEUTRAL');
  }
  return cards;
}

// Animation event types
const ANIM_TYPE = {
  DAMAGE: 'damage',
  HEAL: 'heal',
  BUFF_ATTACK: 'buff_attack',
  BUFF_HEALTH: 'buff_health',
  SHIELD_BREAK: 'shield_break',
  DIVINE_SHIELD_BREAK: 'divine_shield_break',
  HERO_SHAKE: 'hero_shake',
  CARD_PLAY: 'card_play',
};

function pushAnim(state, anim) {
  if (!state.pendingAnimations) state.pendingAnimations = [];
  state.pendingAnimations.push(anim);
}

function normalizeDifficulty(value) {
  const difficulty = String(value || 'normal').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (difficulty === 'easy' || difficulty === 'facil') return 'easy';
  if (difficulty === 'hard' || difficulty === 'dificil') return 'hard';
  return 'normal';
}

export function createGame(playerDeckIds, playerClass, options = {}) {
  const settings = options && typeof options === 'object' ? options : {};
  const difficulty = normalizeDifficulty(settings.difficulty);
  const enemyClass = settings.enemyClass === 'HUMAN' ? 'HUMAN' : 'VAMPIRE';
  const mode = typeof settings.mode === 'string' ? settings.mode : 'standard';
  const hero = createHero(playerClass);
  const enemyHero = createHero(enemyClass);
  const allowedCards = filterCardsByClass(hero.classId);
  const allowedIds = allowedCards.map(c => c.id);

  const fallback = allowedIds.length > 0 ? allowedIds : cards.map(c => c.id);
  const pIds = (playerDeckIds && playerDeckIds.length >= 10 ? playerDeckIds : fallback).slice(0, GAME.maxDeckSize);

  const enemyAllowed = filterCardsByClass(enemyClass).map(c => c.id);
  const eIds = shuffle(enemyAllowed).slice(0, GAME.maxDeckSize);

  const state = {
    turn: 1,
    active: 'player',
    over: false,
    winner: null,
    difficulty,
    mode,
    enemyClass,
    playerClass: hero.classId,
    deckIds: pIds,
    log: ['A batalha começou! Heróis & Vampiros se enfrentam.'],
    pendingTriggers: [],
    pendingAnimations: [],
    targeting: null, // { card, effectIndex, validTargets, controller, source }
    player: {
      ...hero,
      deck: expandDeck(pIds), hand: [], board: [], grave: [], classId: hero.classId,
    },
    enemy: {
      ...enemyHero,
      deck: expandDeck(eIds), hand: [], board: [], grave: [], classId: enemyClass,
    },
  };
  draw(state, 'player', 4);
  draw(state, 'enemy', 4);
  return state;
}

// Core damage/heal functions
function damageHero(state, who, amount, source = null) {
  const target = state[who];
  let dmg = amount;
  if (target.shield > 0) {
    const absorbed = Math.min(target.shield, dmg);
    target.shield -= absorbed;
    dmg -= absorbed;
    if (absorbed > 0) state.log.push(`${target.name} absorveu ${absorbed} de dano com escudo.`);
    pushAnim(state, { type: ANIM_TYPE.SHIELD_BREAK, side: who, amount: absorbed });
  }
  if (dmg > 0) {
    target.health -= dmg;
    state.log.push(`${target.name} sofreu ${dmg} de dano${source ? ` (${source})` : ''}.`);
    pushAnim(state, { type: ANIM_TYPE.DAMAGE, side: who, amount: dmg, source, isHero: true });
    pushAnim(state, { type: ANIM_TYPE.HERO_SHAKE, side: who });
  }
  checkEnd(state);
  return dmg;
}

function damageMinion(state, minion, amount, source = null, attacker = null) {
  let dmg = amount;
  if (minion.shield > 0) {
    const absorbed = Math.min(minion.shield, dmg);
    minion.shield -= absorbed;
    dmg -= absorbed;
    pushAnim(state, { type: ANIM_TYPE.SHIELD_BREAK, side: 'minion', uid: minion.uid, amount: absorbed });
  }
  if (minion.keywords.includes('divineShield') && dmg > 0) {
    minion.keywords = minion.keywords.filter(k => k !== 'divineShield');
    state.log.push(`${minion.name} bloqueou o dano com Escudo Divino!`);
    pushAnim(state, { type: ANIM_TYPE.DIVINE_SHIELD_BREAK, side: 'minion', uid: minion.uid });
    dmg = 0;
  }
  if (dmg > 0) {
    minion.health -= dmg;
    state.log.push(`${minion.name} sofreu ${dmg} de dano${source ? ` (${source})` : ''}.`);
    pushAnim(state, { type: ANIM_TYPE.DAMAGE, side: 'minion', uid: minion.uid, amount: dmg, source });
  }
  // Lifesteal on attacker (if minion damaged)
  if (attacker && dmg > 0 && hasKeyword(attacker, 'lifesteal')) {
    const controller = state.player.board.includes(attacker) ? 'player' : 'enemy';
    healHero(state, controller, dmg);
    state.log.push(`${attacker.name} curou seu herói em ${dmg} (Roubo de Vida).`);
  }
  return dmg;
}

function healHero(state, who, amount) {
  const target = state[who];
  const before = target.health;
  target.health = Math.min(target.maxHealth, target.health + amount);
  const actual = target.health - before;
  if (actual > 0) {
    state.log.push(`${target.name} curou ${actual} de vida.`);
    pushAnim(state, { type: ANIM_TYPE.HEAL, side: who, amount: actual, isHero: true });
  }
}

function healMinion(state, minion, amount) {
  const before = minion.health;
  minion.health = Math.min(minion.maxHealth, minion.health + amount);
  const actual = minion.health - before;
  if (actual > 0) {
    pushAnim(state, { type: ANIM_TYPE.HEAL, side: 'minion', uid: minion.uid, amount: actual });
  }
  return actual;
}

function silenceMinion(minion) {
  minion.keywords = [];
  minion.silenced = true;
  minion.attack = minion.baseAttack;
  minion.health = Math.min(minion.health, minion.maxHealth);
}

function checkEnd(s) {
  if (s.enemy.health <= 0) { s.over = true; s.winner = 'player'; s.log.push('Vitória! O inimigo foi derrotado.'); }
  else if (s.player.health <= 0) { s.over = true; s.winner = 'enemy'; s.log.push('Derrota... seu herói caiu.'); }
}

function destroyMinion(state, side, minion) {
  const board = state[side].board;
  const index = board.findIndex(m => m.uid === minion.uid);
  if (index === -1) return false;
  board.splice(index, 1);
  state.log.push(`${minion.name} foi destruído.`);
  triggerDeathrattle(state, minion, side);
  return true;
}

function buffMinion(minion, effect) {
  const atkGain = effect.attack ?? effect.stats?.attack ?? 0;
  const hpGain = effect.health ?? effect.stats?.health ?? 0;
  minion.attack += atkGain;
  minion.health += hpGain;
  minion.maxHealth += hpGain;
  minion.baseAttack += atkGain;
  minion.baseHealth += hpGain;
  if (effect.taunt && !hasKeyword(minion, 'taunt')) minion.keywords.push('taunt');
  if (effect.rush) {
    if (!hasKeyword(minion, 'rush')) minion.keywords.push('rush');
    minion.canAttack = true;
    minion.hasAttacked = false;
  }
}

function logMinionBuff(state, minion, effect) {
  const atkGain = effect.attack ?? effect.stats?.attack ?? 0;
  const hpGain = effect.health ?? effect.stats?.health ?? 0;
  state.log.push(`${minion.name} ganhou +${atkGain}/+${hpGain}.`);
  if (atkGain > 0) pushAnim(state, { type: ANIM_TYPE.BUFF_ATTACK, side: 'minion', uid: minion.uid, amount: atkGain });
  if (hpGain > 0) pushAnim(state, { type: ANIM_TYPE.BUFF_HEALTH, side: 'minion', uid: minion.uid, amount: hpGain });
}

// Effect system - structured effects replace descHas parsing
function applyEffect(state, effect, controller, sourceCard) {
  const p = state[controller];
  const e = controller === 'player' ? state.enemy : state.player;
  const opponent = controller === 'player' ? 'enemy' : 'player';

  switch (effect.type) {
    case 'gainBlood':
      p.blood = Math.min(p.maxBlood, p.blood + effect.value);
      state.log.push(`Você ganhou ${effect.value} de ${p.resourceName}.`);
      break;
    case 'healHero':
      healHero(state, controller, effect.value);
      break;
    case 'healAll':
      healHero(state, controller, effect.value);
      p.board.forEach(m => healMinion(state, m, effect.value));
      state.log.push(`Todos os seus personagens curaram ${effect.value} de vida.`);
      pushAnim(state, { type: ANIM_TYPE.HEAL, side: controller, amount: effect.value, isHero: true });
      break;
    case 'damageHero':
      damageHero(state, opponent, effect.value, sourceCard?.name);
      break;
    case 'damageEnemyMinion':
      if (e.board.length > 0) {
        const target = e.board[0];
        damageMinion(state, target, effect.value, sourceCard?.name);
        if (target.health <= 0) {
          const idx = e.board.indexOf(target);
          e.board.splice(idx, 1);
          state.log.push(`${target.name} foi destruído.`);
          triggerDeathrattle(state, target, opponent);
        }
      }
      break;
    case 'damageAll':
      // Damage all enemy minions
      [...e.board].forEach(m => {
        damageMinion(state, m, effect.value, sourceCard?.name);
        if (m.health <= 0) {
          const idx = e.board.indexOf(m);
          e.board.splice(idx, 1);
          state.log.push(`${m.name} foi destruído.`);
          triggerDeathrattle(state, m, opponent);
        }
      });
      // Also damage enemy hero
      damageHero(state, opponent, effect.value, sourceCard?.name);
      break;
    case 'silence':
      if (e.board.length > 0) {
        silenceMinion(e.board[0]);
        state.log.push(`${e.board[0].name} foi silenciado.`);
      }
      break;
    case 'summon':
      const template = cards.find(c => c.id === effect.cardId);
      if (template) {
        for (let i = 0; i < (effect.count || 1); i++) {
          if (p.board.length >= GAME.maxBoardSize) break;
          const minion = createMinion({ ...template, uid: template.id + '_' + Math.random().toString(36).slice(2, 8) });
          p.board.push(minion);
        }
        state.log.push(`Invocou ${effect.count || 1} ${template.name}.`);
      }
      break;
    case 'buffLastMinion':
      const lastMinion = p.board[p.board.length - 1];
      if (lastMinion && effect.stats) {
        const atkGain = effect.stats.attack || 0;
        const hpGain = effect.stats.health || 0;
        lastMinion.attack += atkGain;
        lastMinion.health += hpGain;
        lastMinion.maxHealth += hpGain;
        lastMinion.baseAttack += atkGain;
        lastMinion.baseHealth += hpGain;
        state.log.push(`${lastMinion.name} ganhou +${atkGain}/+${hpGain}.`);
        if (atkGain > 0) pushAnim(state, { type: ANIM_TYPE.BUFF_ATTACK, side: 'minion', uid: lastMinion.uid, amount: atkGain });
        if (hpGain > 0) pushAnim(state, { type: ANIM_TYPE.BUFF_HEALTH, side: 'minion', uid: lastMinion.uid, amount: hpGain });
      }
      break;
    case 'setHandCost':
      p.hand.forEach(c => c.cost = effect.cost);
      state.log.push(`Cartas na mão agora custam ${effect.cost}.`);
      break;
    case 'giveDivineShield':
      let targets = [];
      if (effect.target === 'all') {
        targets = [...p.board];
      } else if (effect.target === 'single' || effect.target === undefined) {
        // Give to the last minion played (most recent on board)
        const lastMinion = p.board[p.board.length - 1];
        if (lastMinion) targets = [lastMinion];
      }
      targets.forEach(m => {
        if (!m.keywords.includes('divineShield')) m.keywords.push('divineShield');
      });
      if (targets.length > 0) state.log.push(`Escudo Divino concedido.`);
      break;
    case 'draw':
      draw(state, controller, effect.count);
      break;
    case 'gainArmor':
      p.shield += effect.value;
      state.log.push(`Você ganhou ${effect.value} de escudo.`);
      pushAnim(state, { type: ANIM_TYPE.BUFF_HEALTH, side: controller, amount: effect.value, isShield: true });
      break;
    default:
      console.warn('Unknown effect:', effect);
  }
}

function triggerBattlecry(state, card, controller) {
  if (!card.effects || !card.effects.battlecry) return;
  card.effects.battlecry.forEach(effect => applyEffect(state, effect, controller, card));
}

function triggerDeathrattle(state, minion, controller) {
  if (!minion.effects || !minion.effects.deathrattle) return;
  minion.effects.deathrattle.forEach(effect => applyEffect(state, effect, controller, minion));
}

function canAttackMinion(minion) {
  return minion.canAttack && !minion.hasAttacked;
}

function hasTaunt(board) {
  return board.some(m => m.keywords && m.keywords.includes('taunt'));
}

function getTauntTargets(board) {
  return board.filter(m => m.keywords && m.keywords.includes('taunt'));
}

function canTarget(minion, attacker) {
  if (minion.keywords.includes('flying') && !attacker.keywords.includes('flying')) {
    return false;
  }
  if (minion.keywords.includes('stealth')) {
    return false;
  }
  return true;
}

function getValidTargets(board, attacker) {
  const tauntTargets = getTauntTargets(board);
  const validTargets = tauntTargets.length > 0 ? tauntTargets : board;
  return validTargets.filter(t => canTarget(t, attacker));
}

function getSpellTargets(state, effect, controller) {
  const p = state[controller];
  const e = controller === 'player' ? state.enemy : state.player;
  
  switch (effect.targetType) {
    case 'enemyHero':
      return [{ type: 'hero', target: e, side: 'enemy' }];
    case 'friendlyHero':
      return [{ type: 'hero', target: p, side: 'player' }];
    case 'enemyMinion':
      return e.board.map(m => ({ type: 'minion', target: m, index: e.board.indexOf(m), side: 'enemy' }));
    case 'friendlyMinion':
      return p.board.map(m => ({ type: 'minion', target: m, index: p.board.indexOf(m), side: 'player' }));
    case 'anyMinion':
      return [...p.board, ...e.board].map((m, i) => ({ 
        type: 'minion', 
        target: m, 
        index: i,
        side: i < p.board.length ? 'player' : 'enemy'
      }));
    default:
      return [];
  }
}

function applyTargetedEffect(state, effect, controller, sourceCard, selectedTarget) {
  const p = state[controller];
  const e = controller === 'player' ? state.enemy : state.player;
  const opponent = controller === 'player' ? 'enemy' : 'player';

  switch (effect.type) {
    case 'damageHero':
      damageHero(state, opponent, effect.value, sourceCard?.name);
      break;
    case 'healHero':
      healHero(state, controller, effect.value);
      break;
    case 'healAll':
      healHero(state, controller, effect.value);
      p.board.forEach(m => healMinion(state, m, effect.value));
      state.log.push(`Todos os seus personagens curaram ${effect.value} de vida.`);
      pushAnim(state, { type: ANIM_TYPE.HEAL, side: controller, amount: effect.value, isHero: true });
      break;
    case 'damageEnemyMinion':
      if (selectedTarget && selectedTarget.type === 'minion') {
        const targetSide = selectedTarget.side || opponent;
        const targetState = targetSide === 'player' ? state.player : state.enemy;
        damageMinion(state, selectedTarget.target, effect.value, sourceCard?.name);
        if (selectedTarget.target.health <= 0) {
          const idx = targetState.board.indexOf(selectedTarget.target);
          if (idx !== -1) {
            targetState.board.splice(idx, 1);
            state.log.push(`${selectedTarget.target.name} foi destruído.`);
            triggerDeathrattle(state, selectedTarget.target, targetSide);
          }
        }
      }
      break;
    case 'damageAll':
      [...e.board].forEach(m => {
        damageMinion(state, m, effect.value, sourceCard?.name);
        if (m.health <= 0) {
          const idx = e.board.indexOf(m);
          e.board.splice(idx, 1);
          state.log.push(`${m.name} foi destruído.`);
          triggerDeathrattle(state, m, opponent);
        }
      });
      damageHero(state, opponent, effect.value, sourceCard?.name);
      break;
    case 'silence':
      if (selectedTarget && selectedTarget.type === 'minion') {
        silenceMinion(selectedTarget.target);
        state.log.push(`${selectedTarget.target.name} foi silenciado.`);
      }
      break;
    case 'summon':
      const template = cards.find(c => c.id === effect.cardId);
      if (template) {
        for (let i = 0; i < (effect.count || 1); i++) {
          if (p.board.length >= GAME.maxBoardSize) break;
          const minion = createMinion({ ...template, uid: template.id + '_' + Math.random().toString(36).slice(2, 8) });
          p.board.push(minion);
        }
        state.log.push(`Invocou ${effect.count || 1} ${template.name}.`);
      }
      break;
    case 'buffLastMinion':
      const lastMinion = p.board[p.board.length - 1];
      if (lastMinion && effect.stats) {
        const atkGain = effect.stats.attack || 0;
        const hpGain = effect.stats.health || 0;
        lastMinion.attack += atkGain;
        lastMinion.health += hpGain;
        lastMinion.maxHealth += hpGain;
        lastMinion.baseAttack += atkGain;
        lastMinion.baseHealth += hpGain;
        state.log.push(`${lastMinion.name} ganhou +${atkGain}/+${hpGain}.`);
        if (atkGain > 0) pushAnim(state, { type: ANIM_TYPE.BUFF_ATTACK, side: 'minion', uid: lastMinion.uid, amount: atkGain });
        if (hpGain > 0) pushAnim(state, { type: ANIM_TYPE.BUFF_HEALTH, side: 'minion', uid: lastMinion.uid, amount: hpGain });
      }
      break;
    case 'setHandCost':
      p.hand.forEach(c => c.cost = effect.cost);
      state.log.push(`Cartas na mão agora custam ${effect.cost}.`);
      break;
    case 'giveDivineShield':
      let targets = [];
      if (effect.target === 'all') {
        targets = [...p.board];
      } else if (effect.target === 'single' || effect.target === undefined) {
        if (selectedTarget && selectedTarget.type === 'minion') {
          targets = [selectedTarget.target];
        } else {
          const lastMinion = p.board[p.board.length - 1];
          if (lastMinion) targets = [lastMinion];
        }
      }
      targets.forEach(m => {
        if (!m.keywords.includes('divineShield')) m.keywords.push('divineShield');
      });
      if (targets.length > 0) state.log.push(`Escudo Divino concedido.`);
      break;
    case 'draw':
      draw(state, controller, effect.count);
      break;
    case 'gainBlood':
      p.blood = Math.min(p.maxBlood, p.blood + effect.value);
      state.log.push(`Você ganhou ${effect.value} de ${p.resourceName}.`);
      break;
    case 'gainArmor':
      p.shield += effect.value;
      state.log.push(`Você ganhou ${effect.value} de escudo.`);
      pushAnim(state, { type: ANIM_TYPE.BUFF_HEALTH, side: controller, amount: effect.value, isShield: true });
      break;
    default:
      console.warn('Unknown effect:', effect);
  }
}

export function playCard(state, handIndex, selectedTarget = null) {
  if (state.over || state.active !== 'player') return state;
  const s = structuredClone(state);
  const p = s.player, e = s.enemy;
  const card = p.hand[handIndex];
  if (!card) return state;
  const cost = card.cost ?? 0;
  if (p.blood < cost) { s.log.push(`${p.resourceName} insuficiente para jogar ${card.name}.`); return s; }
  p.blood -= cost;
  p.hand.splice(handIndex, 1);

  if (card.type === 'MINION') {
    if (p.board.length >= GAME.maxBoardSize) {
      s.log.push('Mesa cheia! Não pode invocar mais lacaios.');
      return s;
    }
    const minion = createMinion(card);
    if (hasKeyword(card, 'rush')) {
      minion.canAttack = true;
      minion.hasAttacked = false;
    }
    if (hasKeyword(card, 'charge')) {
      minion.canAttack = true;
      minion.hasAttacked = false;
    }
    p.board.push(minion);
    s.log.push(`Você jogou ${card.name}.`);
    pushAnim(s, { type: ANIM_TYPE.CARD_PLAY, cardId: card.uid, cardName: card.name, effectSymbol: card.effectSymbol });
    triggerBattlecry(s, card, 'player');
  } else if (card.effects?.onPlay) {
    // Check if any effect needs targeting
    const needsTargeting = card.effects.onPlay.some(eff => eff.targetType && eff.targetType !== 'none');
    
    if (needsTargeting && !selectedTarget) {
      // Return state with targeting mode
      const firstTargetingEffect = card.effects.onPlay.find(eff => eff.targetType && eff.targetType !== 'none');
      const validTargets = getSpellTargets(s, firstTargetingEffect, 'player');
      
      s.targeting = {
        card,
        effectIndex: card.effects.onPlay.indexOf(firstTargetingEffect),
        validTargets,
        controller: 'player',
        source: card,
      };
      // Put card back in hand since we didn't actually play it yet
      p.hand.splice(handIndex, 0, card);
      p.blood += cost;
      return s;
    }
    
    s.log.push(`Você jogou ${card.name}.`);
    pushAnim(s, { type: ANIM_TYPE.CARD_PLAY, cardId: card.uid, cardName: card.name, effectSymbol: card.effectSymbol });
    
    // Apply all effects
    card.effects.onPlay.forEach((effect, idx) => {
      if (effect.targetType && effect.targetType !== 'none') {
        // Use selectedTarget for the first targeting effect, auto-target for others
        let target;
        if (idx === 0 && selectedTarget) {
          target = selectedTarget;
        } else if (effect.targetType === 'enemyHero') {
          target = { type: 'hero', target: e, side: 'enemy' };
        } else if (effect.targetType === 'friendlyHero') {
          target = { type: 'hero', target: p, side: 'player' };
        } else if (effect.targetType === 'enemyMinion' && e.board.length > 0) {
          target = { type: 'minion', target: e.board[0], index: 0, side: 'enemy' };
        } else if (effect.targetType === 'friendlyMinion' && p.board.length > 0) {
          target = { type: 'minion', target: p.board[0], index: 0, side: 'player' };
        } else {
          target = null;
        }
        if (target) applyTargetedEffect(s, effect, 'player', card, target);
      } else {
        applyEffect(s, effect, 'player', card);
      }
    });
  }

  checkEnd(s);
  return s;
}

export function selectTarget(state, targetInfo) {
  if (state.over || state.active !== 'player' || !state.targeting) return state;
  const s = structuredClone(state);
  const { card, effectIndex, validTargets, controller, source } = s.targeting;
  const p = s.player;
  
  // Find the selected target
  const selectedTarget = validTargets.find(t => 
    (t.type === 'hero' && targetInfo.type === 'hero' && t.side === targetInfo.side) ||
    (t.type === 'minion' && t.target.uid === targetInfo.uid)
  );
  
  if (!selectedTarget) return state;
  
  // Pay cost and remove card from hand
  const cardIndex = p.hand.findIndex(c => c.uid === card.uid);
  if (cardIndex !== -1) {
    const cost = card.cost ?? 0;
    if (p.blood >= cost) {
      p.blood -= cost;
      p.hand.splice(cardIndex, 1);
      s.log.push(`Você jogou ${card.name}.`);
    } else {
      return state;
    }
  }
  
  // Apply all effects
  card.effects.onPlay.forEach((effect, idx) => {
    if (effect.targetType && effect.targetType !== 'none') {
      let target;
      if (idx === 0) {
        // Resolve selectedTarget to actual object in current state
        if (selectedTarget.type === 'hero') {
          target = { type: 'hero', target: selectedTarget.side === 'player' ? p : s.enemy, side: selectedTarget.side };
        } else if (selectedTarget.type === 'minion') {
          const targetState = selectedTarget.side === 'player' ? p : s.enemy;
          const targetMinion = targetState.board.find(m => m.uid === selectedTarget.uid);
          if (targetMinion) {
            target = { type: 'minion', target: targetMinion, side: selectedTarget.side };
          }
        }
      } else {
        target = effect.targetType === 'enemyHero' ? { type: 'hero', target: s.enemy, side: 'enemy' } :
                 effect.targetType === 'friendlyHero' ? { type: 'hero', target: p, side: 'player' } :
                 effect.targetType === 'enemyMinion' && s.enemy.board.length > 0 ? { type: 'minion', target: s.enemy.board[0], index: 0, side: 'enemy' } :
                 effect.targetType === 'friendlyMinion' && p.board.length > 0 ? { type: 'minion', target: p.board[0], index: 0, side: 'player' } :
                 null;
      }
      if (target) applyTargetedEffect(s, effect, controller, card, target);
    } else {
      applyEffect(s, effect, controller, card);
    }
  });
  
  // Clear targeting
  s.targeting = null;
  pushAnim(s, { type: ANIM_TYPE.CARD_PLAY, cardId: card.uid, cardName: card.name, effectSymbol: card.effectSymbol });
  checkEnd(s);
  return s;
}

export function cancelTargeting(state) {
  if (!state.targeting) return state;
  const s = structuredClone(state);
  s.targeting = null;
  return s;
}

export function attackWithMinion(state, minionIndex) {
  if (state.over || state.active !== 'player') return state;
  const s = structuredClone(state);
  const p = s.player, e = s.enemy;
  const attacker = p.board[minionIndex];
  if (!attacker || !canAttackMinion(attacker)) return state;

  attacker.canAttack = false;
  attacker.hasAttacked = true;

  let target = null;
  let targetIsEnemyHero = false;

  if (e.board.length > 0) {
    const validTargets = getValidTargets(e.board, attacker);
    if (validTargets.length > 0) {
      target = validTargets[0];
    }
  }

  if (!target) {
    targetIsEnemyHero = true;
    damageHero(s, 'enemy', attacker.attack, attacker.name);
  } else {
    const targetIndex = e.board.findIndex(m => m.uid === target.uid);
    if (targetIndex === -1) return s;

    // Combat damage
    const attackerAttack = attacker.attack;
    const targetAttack = target.attack || 0;

    damageMinion(s, target, attackerAttack, attacker.name, attacker);
    damageMinion(s, attacker, targetAttack, target.name, target);

    if (target.health <= 0) {
      s.log.push(`${target.name} foi destruído.`);
      e.board.splice(targetIndex, 1);
      triggerDeathrattle(s, target, 'enemy');
    }
    if (attacker.health <= 0) {
      s.log.push(`${attacker.name} foi destruído.`);
      p.board.splice(minionIndex, 1);
      triggerDeathrattle(s, attacker, 'player');
    }
  }

  checkEnd(s);
  return s;
}

export function endTurn(state) {
  if (state.over || state.active !== 'player') return state;
  let s = structuredClone(state);
  s.active = 'enemy';
  s.log.push('Turno do inimigo.');
  s = enemyTurn(s);
  if (!s.over) {
    s.turn += 1;
    s.active = 'player';
    const p = s.player;
    p.maxBlood = Math.min(10, p.maxBlood + 1);
    p.blood = p.maxBlood;
    p.board.forEach(m => { m.canAttack = true; m.hasAttacked = false; });
    draw(s, 'player', 1);
    s.log.push(`Seu turno ${s.turn}. (+1 ${p.resourceName}, comprou 1 carta)`);
  }
  return s;
}

function enemyTurn(s) {
  const e = s.enemy, p = s.player;
  const diff = s.difficulty || 'normal';
  
  e.maxBlood = Math.min(10, e.maxBlood + 1);
  e.blood = e.maxBlood;
  e.board.forEach(m => { m.canAttack = true; m.hasAttacked = false; });
  draw(s, 'enemy', 1);

  // ===== AI: Play cards with tactical evaluation =====
  let played = true; let safety = 0;
  while (played && safety < 15) {
    safety++; played = false;
    const affordable = e.hand
      .map((c, i) => ({ card: c, index: i, cost: c.cost ?? 0 }))
      .filter(x => x.cost <= e.blood);
    
    if (affordable.length === 0) break;

    // Score each playable card based on difficulty
    const scored = affordable.map(({ card, index, cost }) => ({
      card, index, cost,
      score: scoreCardPlay(card, s, diff)
    })).sort((a, b) => b.score - a.score);

    const best = scored[0];
    if (best.score <= 0) break; // No good plays

    const { card, index, cost } = best;
    e.blood -= cost;
    e.hand.splice(index, 1);
    s.log.push(`Inimigo jogou ${card.name}.`);
    
    if (card.type === 'MINION') {
      if (e.board.length < GAME.maxBoardSize) {
        const minion = createMinion(card);
        e.board.push(minion);
        triggerBattlecry(s, card, 'enemy');
      }
    } else if (card.effects?.onPlay) {
      // Handle targeted effects for AI
      card.effects.onPlay.forEach((effect, idx) => {
        if (effect.targetType && effect.targetType !== 'none') {
          const targets = getSpellTargets(s, effect, 'enemy');
          const bestTarget = selectBestTarget(targets, effect, s, diff);
          if (bestTarget) applyTargetedEffect(s, effect, 'enemy', card, bestTarget);
        } else {
          applyEffect(s, effect, 'enemy', card);
        }
      });
    }
    played = true;
  }

  // ===== AI: Attack phase with tactical targeting =====
  for (let i = 0; i < e.board.length; i++) {
    const m = e.board[i];
    if (!m || !canAttackMinion(m)) continue;

    if (p.board.length > 0) {
      const validTargets = getValidTargets(p.board, m);
      const bestTarget = selectBestAttackTarget(validTargets, m, s, diff);
      if (bestTarget) {
        const targetIndex = p.board.findIndex(t => t.uid === bestTarget.uid);
        if (targetIndex !== -1) {
          const attackerAttack = m.attack;
          const targetAttack = bestTarget.attack || 0;

          damageMinion(s, bestTarget, attackerAttack, m.name, m);
          damageMinion(s, m, targetAttack, bestTarget.name, bestTarget);

          if (bestTarget.health <= 0) {
            p.board.splice(targetIndex, 1);
            s.log.push(`${bestTarget.name} foi destruído.`);
            i--;
            triggerDeathrattle(s, bestTarget, 'player');
          }
          if (m.health <= 0) {
            e.board.splice(e.board.indexOf(m), 1);
            s.log.push(`${m.name} inimigo foi destruído.`);
            i--;
            triggerDeathrattle(s, m, 'enemy');
          } else {
            m.canAttack = false;
            m.hasAttacked = true;
          }
        }
      }
    } else {
      // Face damage - check lethal first
      const isLethal = m.attack >= p.health;
      damageHero(s, 'player', m.attack, m.name);
      m.canAttack = false;
      m.hasAttacked = true;
      if (hasKeyword(m, 'lifesteal')) {
        healHero(s, 'enemy', m.attack);
        s.log.push(`${m.name} curou o inimigo (Roubo de Vida).`);
      }
    }
    checkEnd(s); if (s.over) return s;
  }
  checkEnd(s);
  return s;
}

// Score card play value for AI
function scoreCardPlay(card, s, diff) {
  const e = s.enemy, p = s.player;
  let score = 0;
  
  if (card.type === 'MINION') {
    // Base value: stats per cost
    const atk = card.attack ?? 1;
    const hp = card.health ?? 1;
    const cost = card.cost ?? 1;
    score = (atk + hp) / cost * 10;
    
    // Keywords
    const kw = card.keywords || [];
    if (kw.includes('taunt')) score += 15; // Taunt is very valuable
    if (kw.includes('divineShield')) score += 10;
    if (kw.includes('lifesteal')) score += 12;
    if (kw.includes('rush') || kw.includes('charge')) score += 8;
    if (kw.includes('flying')) score += 5;
    if (kw.includes('stealth')) score += 8;
    
    // Battlecry value
    if (card.effects?.battlecry) {
      card.effects.battlecry.forEach(eff => {
        if (eff.type === 'damageEnemyMinion' || eff.type === 'damageAll') score += 20;
        if (eff.type === 'healHero') score += 10;
        if (eff.type === 'draw') score += 15;
        if (eff.type === 'summon') score += 18;
        if (eff.type === 'silence') score += 12;
      });
    }
    
    // Board space penalty
    if (e.board.length >= GAME.maxBoardSize - 1) score *= 0.5;
  } else {
    // Spell value
    const cost = card.cost ?? 1;
    if (card.effects?.onPlay) {
      card.effects.onPlay.forEach(eff => {
        if (eff.type === 'damageHero') score += eff.value * 2;
        if (eff.type === 'damageEnemyMinion') score += 15;
        if (eff.type === 'damageAll') score += 25;
        if (eff.type === 'healHero') score += eff.value;
        if (eff.type === 'draw') score += 10;
        if (eff.type === 'silence') score += 8;
      });
    }
    score = Math.max(score, 5); // Minimum spell value
    score = score / cost * 8;
  }
  
  // Difficulty adjustments
  if (diff === 'easy') score *= 0.7;
  if (diff === 'hard') score *= 1.3;
  
  return score;
}

// Select best attack target based on tactical value
function selectBestAttackTarget(targets, attacker, s, diff) {
  if (!targets.length) return null;
  
  const p = s.player;
  const canGoFace = p.board.length === 0 || !targets.some(t => t.keywords.includes('taunt'));
  
  // Score each target
  const scored = targets.map(t => {
    let score = 0;
    const atk = attacker.attack;
    const tAtk = t.attack || 0;
    const tHp = t.health;
    const kw = t.keywords || [];
    
    // Lethal check - always prioritize lethal on enemy hero if possible
    if (canGoFace && atk >= p.health) return { target: t, score: 1000 };
    
    // Trade value: kill without dying
    if (atk >= tHp && tAtk < attacker.health) score += 30; // Favorable trade
    if (atk >= tHp && tAtk >= attacker.health) score += 15; // Even trade
    if (atk < tHp && tAtk >= attacker.health) score -= 20; // Bad trade
    if (atk < tHp && tAtk < attacker.health) score += 5; // Ping
    
    // Keyword priorities
    if (kw.includes('taunt')) score += 10; // Must kill taunt
    if (kw.includes('divineShield')) score -= 10; // Shield wastes damage
    if (kw.includes('stealth')) score -= 5;
    if (kw.includes('lifesteal')) score += 5; // Deny healing
    if (kw.includes('flying') && !attacker.keywords.includes('flying')) return { target: t, score: -1000 };
    
    // Board control - prefer killing bigger threats
    score += Math.min(tAtk, 10);
    
    return { target: t, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  return scored[0].score > -500 ? scored[0].target : targets[0];
}

// Select best target for spells
function selectBestTarget(targets, effect, s, diff) {
  if (!targets.length) return null;
  
  const e = s.enemy, p = s.player;
  const isEnemyTarget = targets[0]?.side === 'enemy';
  
  const scored = targets.map(t => {
    let score = 0;
    const unit = t.target;
    
    if (t.type === 'hero') {
      if (effect.type === 'damageHero' || effect.type === 'damageAll') {
        score = isEnemyTarget ? unit.health * 3 : -unit.health * 2;
      }
      if (effect.type === 'healHero') score = isEnemyTarget ? -100 : unit.maxHealth - unit.health;
    } else if (t.type === 'minion') {
      const kw = unit.keywords || [];
      if (effect.type === 'damageEnemyMinion' || effect.type === 'damageAll') {
        if (effect.value >= unit.health) score += 30; // Lethal
        if (kw.includes('taunt')) score += 15;
        if (kw.includes('divineShield')) score -= 10;
        if (kw.includes('lifesteal')) score += 5;
        score += unit.attack; // Threat value
      }
      if (effect.type === 'silence') {
        if (kw.length > 0) score += 20;
      }
      if (effect.type === 'healAll' || effect.type === 'healHero') {
        if (unit.health < unit.maxHealth) score += (unit.maxHealth - unit.health) * 2;
      }
      if (effect.type === 'giveDivineShield') {
        if (!kw.includes('divineShield') && unit.attack > 2) score += 15;
      }
    }
    return { target: t, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  return scored[0].score > -100 ? scored[0].target : targets[0];
}

export { cards as allCards, filterCardsByClass, createHero, getValidTargets, triggerDeathrattle, hasKeyword, healMinion, damageMinion, damageHero, healHero, applyEffect, applyTargetedEffect, scoreCardPlay, selectBestAttackTarget, selectBestTarget, normalizeDifficulty, draw };