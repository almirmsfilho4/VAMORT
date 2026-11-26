import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SCREENS, GAME } from '../data/constants.js';
import StitchLayout from '../components/StitchLayout.jsx';
import { multiplayer } from '../services/multiplayer.js';
import { getStitchAsset } from '../data/stitchAssets.js';
import {
  StitchButton,
  StitchCard,
  StitchProgress,
  StitchHeroPanel,
  StitchMinionView,
  StitchFloatingNumber,
  StitchModal,
  StitchDivider,
  StitchGrid,
  StitchBadge,
  StitchStat,
  StitchIconButton,
  StitchCardRelic,
} from '../components/StitchUI.jsx';

// Reuse animation component from BattleScreen
function FloatingNumbers({ animations, containerRef }) {
  useEffect(() => {
    if (!animations || animations.length === 0 || !containerRef.current) return;

    animations.forEach((anim) => {
      let rect = null;

      if (anim.isHero) {
        const heroSelector = anim.side === 'player' ? '[data-hero="player"]' : '[data-hero="enemy"]';
        const el = containerRef.current.querySelector(heroSelector);
        if (el) rect = el.getBoundingClientRect();
      } else if (anim.uid) {
        const minionEl = containerRef.current.querySelector(`[data-minion="${anim.uid}"]`);
        if (minionEl) rect = minionEl.getBoundingClientRect();
      }

      if (!rect) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2 - containerRect.left;
      const y = rect.top - containerRect.top;

      const el = document.createElement('div');
      let className = 'stitch-floating-number pointer-events-none';
      let text = '';

      switch (anim.type) {
        case 'damage':
          className += ' damage';
          text = anim.amount;
          break;
        case 'heal':
          className += ' heal';
          text = `+${anim.amount}`;
          break;
        case 'buff_attack':
          className += ' buff';
          text = `⚔+${anim.amount}`;
          break;
        case 'buff_health':
          className += ' heal';
          text = anim.isShield ? `🛡+${anim.amount}` : `❤+${anim.amount}`;
          break;
        case 'shield_break':
          className += ' damage';
          text = `🛡-${anim.amount}`;
          break;
        case 'divine_shield_break':
          className += ' damage';
          text = '🛡️✨';
          break;
      }

      if (!text) return;

      el.className = className;
      el.style.cssText = `left:${x}px;top:${y}px;font-family:var(--font-serif);font-weight:900;font-size:1.3rem;z-index:100;`;
      el.textContent = text;
      containerRef.current.appendChild(el);

      setTimeout(() => el.remove(), 1000);
    });
  }, [animations, containerRef]);

  return <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

function HeroPanel({ who, side, active, classId, isPvP }) {
  const hpPct = Math.max(0, Math.min(100, (who.health / who.maxHealth) * 100));
  const isVampire = classId === 'VAMPIRE';
  const isHuman = classId === 'HUMAN';
  const heroTitle = side === 'enemy' ? 'Oponente' : isVampire ? 'Lorde Vampiro' : isHuman ? 'Paladino Humano' : 'Herói Neutro';
  const heroIcon = side === 'enemy' ? '🦇' : isVampire ? '🦇' : isHuman ? '⚔️' : '🛡️';
  const accentColor = side === 'enemy' ? 'var(--md-sys-color-primary)' : isVampire ? 'var(--md-sys-color-primary)' : isHuman ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-info)';
  const resourceName = isVampire ? 'Sangue' : isHuman ? 'Fé' : 'Sangue';
  const resourceIcon = isVampire ? '🩸' : isHuman ? '✨' : '🩸';

  return (
    <StitchCard variant="elevated" className="relative overflow-visible transition-all duration-300" style={{ borderColor: accentColor, boxShadow: active ? '0 0 24px rgba(230,25,75,0.4)' : 'var(--elevation-3)' }} data-hero={side}>
      {active && <div className="absolute -top-2 -right-2 bg-[var(--md-sys-color-secondary)] text-[var(--md-sys-color-on-secondary)] text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">⚡ Turno Ativo</div>}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 font-semibold text-lg" style={{ color: accentColor, textShadow: `0 0 12px ${accentColor}` }}>
          <span aria-hidden="true">{heroIcon}</span>
          {heroTitle}
        </div>
      </div>

      <div className="flex justify-between items-center mb-2">
        <span className="text-[var(--md-sys-color-on-surface)]">❤ Vitalidade: <b className="text-[var(--md-sys-color-error)]">{who.health}</b> / {who.maxHealth}</span>
        {who.shield > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-[var(--md-sys-color-success)]/20 border border-[var(--md-sys-color-success)] text-[var(--md-sys-color-success)] text-xs font-bold">
            🛡 Escudo {who.shield}
          </span>
        )}
      </div>
      <StitchProgress value={who.health} max={who.maxHealth} variant="primary" className="h-2.5" />
      <div className="mt-3 flex gap-4 text-sm text-[var(--md-sys-color-on-surface-variant)]">
        <span>{resourceIcon} {resourceName}: <b className="text-[var(--md-sys-color-secondary)]">{who.mana}</b>/{who.maxMana}</span>
        <span>🃏 Mão: <b>{who.hand.length}</b></span>
        <span>📚 Deck: <b>{who.deck.length}</b></span>
      </div>
    </StitchCard>
  );
}

export default function PvPBattleScreen({ go, matchId, stats, playerClass, deckIds }) {
  const [gameState, setGameState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [myTurn, setMyTurn] = useState(false);
  const [turnTimeLeft, setTurnTimeLeft] = useState(90);
  const [animations, setAnimations] = useState([]);
  const [cardPlayAnim, setCardPlayAnim] = useState(null);
  const [targeting, setTargeting] = useState(null);
  const [error, setError] = useState(null);
  const [reconnecting, setReconnecting] = useState(false);
  const containerRef = useRef(null);
  const prevStateRef = useRef(null);
  const unsubs = useRef([]);

  // Initialize multiplayer connection
  useEffect(() => {
    const unsubMatchJoined = multiplayer.on('matchJoined', ({ match, playerNumber }) => {
      setGameState(multiplayer.getGameState());
      setConnected(true);
      setMyTurn(match.current_turn === multiplayer.userId);
      setReconnecting(false);
    });

    const unsubGameStart = multiplayer.on('gameStart', () => {
      setGameState(multiplayer.getGameState());
    });

    const unsubTurnChanged = multiplayer.on('turnChanged', ({ currentTurn, turnNumber, isMyTurn }) => {
      setGameState(multiplayer.getGameState());
      setMyTurn(isMyTurn);
    });

    const unsubPlayerStateChanged = multiplayer.on('playerStateChanged', () => {
      setGameState(multiplayer.getGameState());
    });

    const unsubActionValidated = multiplayer.on('actionValidated', ({ action }) => {
      // Trigger animations based on action
      if (action.action_type === 'play_card') {
        setCardPlayAnim({ 
          card: { uid: action.action_data.instanceId, name: action.action_data.cardName, effectSymbol: action.action_data.effectSymbol } 
        });
        setTimeout(() => setCardPlayAnim(null), 800);
      }
      // Add floating number animations
      setAnimations(prev => [...prev, ...generateAnimations(action)]);
    });

    const unsubGameEnd = multiplayer.on('gameEnd', ({ winner, isVictory, resultData }) => {
      setGameState(multiplayer.getGameState());
      showEndModal(isVictory, resultData);
    });

    const unsubTurnTimer = multiplayer.on('turnTimer', ({ timeLeft }) => {
      setTurnTimeLeft(timeLeft);
    });

    const unsubConnected = multiplayer.on('connected', () => {
      setConnected(true);
      setReconnecting(false);
    });

    const unsubConnectionError = multiplayer.on('connectionError', () => {
      setConnected(false);
    });

    const unsubReconnected = multiplayer.on('reconnected', () => {
      setGameState(multiplayer.getGameState());
      setConnected(true);
      setReconnecting(false);
    });

    const unsubStateSynced = multiplayer.on('stateSynced', () => {
      setGameState(multiplayer.getGameState());
    });

    unsubs.current = [
      unsubMatchJoined, unsubGameStart, unsubTurnChanged, unsubPlayerStateChanged,
      unsubActionValidated, unsubGameEnd, unsubTurnTimer, unsubConnected,
      unsubConnectionError, unsubReconnected, unsubStateSynced
    ];

    // Join the match
    multiplayer.joinMatch(matchId).catch(err => {
      setError(err.message);
    });

    return () => {
      unsubs.current.forEach(unsub => unsub());
      multiplayer.destroy();
    };
  }, [matchId]);

  // Track previous state for animations
  useEffect(() => {
    if (gameState) prevStateRef.current = structuredClone(gameState);
  }, [gameState]);

  // Generate animations from action
  const generateAnimations = (action) => {
    const anims = [];
    const data = action.action_data;
    
    switch (action.action_type) {
      case 'attack':
        anims.push({
          type: 'damage',
          amount: data.damage || 0,
          uid: data.targetInstanceId,
          side: data.targetSide,
        });
        break;
      case 'play_card':
        anims.push({
          type: 'card_play',
          cardId: data.cardId,
          cardName: data.cardName,
          effectSymbol: data.effectSymbol,
        });
        break;
    }
    return anims;
  };

  const showEndModal = (isVictory, resultData) => {
    // Could use StitchModal here
  };

  // Action handlers
  const handlePlayCard = async (cardIndex, card) => {
    if (!myTurn) return;
    try {
      setCardPlayAnim({ card: { uid: card.instanceId || card.id, name: card.name, effectSymbol: card.effectSymbol } });
      await multiplayer.playCard(card.id, card.instanceId || `inst_${Date.now()}`, 0, card);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAttack = async (attackerIndex, attacker) => {
    if (!myTurn) return;
    try {
      await multiplayer.attack(attacker.instanceId, null); // target handled by targeting system
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEndTurn = async () => {
    if (!myTurn) return;
    try {
      await multiplayer.endTurn();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConcede = async () => {
    try {
      await multiplayer.concede();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!gameState) {
    return (
      <StitchLayout go={go} stats={stats} playerClass={playerClass} currentScreen={SCREENS.Battle} showNav={false}>
        <div className="flex h-screen items-center justify-center">
          <StitchCard variant="filled" className="text-center p-8">
            <div className="animate-pulse text-6xl mb-4">⚔️</div>
            <h2 className="font-serif text-2xl mb-2">Conectando à Partida...</h2>
            <StitchProgress variant="secondary" className="w-64 mx-auto" />
            {reconnecting && <p className="mt-4 text-[var(--md-sys-color-tertiary)]">Reconectando...</p>}
          </StitchCard>
        </div>
      </StitchLayout>
    );
  }

  const myState = gameState.players[gameState.playerNumber];
  const opponentState = gameState.players[1 - gameState.playerNumber];
  const isMyTurn = gameState.isMyTurn;

  return (
    <StitchLayout go={go} stats={stats} playerClass={playerClass} currentScreen={SCREENS.Battle} showNav={false}>
      <main className="stitch-main-without-nav flex-1 flex flex-col gap-4 max-w-[1280px] mx-auto relative px-4 py-4">
        <FloatingNumbers animations={animations} containerRef={containerRef} />

        {/* Top Bar */}
        <StitchCard variant="filled" className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="font-serif text-lg text-[var(--md-sys-color-secondary)]">
              ⚔️ Partida Ranqueada — Turno {gameState.turn} &nbsp;|&nbsp;
              <span className={isMyTurn ? 'text-[var(--md-sys-color-success)]' : 'text-[var(--md-sys-color-error)]'}>
                {isMyTurn ? 'Seu Turno' : 'Turno do Oponente'}
              </span>
            </div>
            <StitchProgress value={turnTimeLeft} max={90} variant={isMyTurn ? 'primary' : 'secondary'} className="w-48 h-1.5" />
          </div>
          <div className="flex gap-2">
            <StitchButton variant="ghost" size="sm" onClick={handleConcede} className="text-[var(--md-sys-color-error)]">
              <span className="material-symbols-outlined">flag</span> Render-se
            </StitchButton>
          </div>
        </StitchCard>

        {/* Connection Status */}
        {!connected && (
          <StitchBadge variant="primary" className="self-center animate-pulse">
            <span className="material-symbols-outlined align-middle">wifi_off</span> Reconectando...
          </StitchBadge>
        )}

        {/* Error Toast */}
        {error && (
          <StitchCard variant="outlined" className="border-[var(--md-sys-color-error)] bg-[var(--md-sys-color-error-container)]/20 fixed top-20 left-4 right-4 z-50">
            <div className="flex items-center gap-3 p-3">
              <span className="material-symbols-outlined text-[var(--md-sys-color-error)]">error</span>
              <span className="text-[var(--md-sys-color-on-error-container)]">{error}</span>
              <StitchIconButton icon="close" size="sm" onClick={() => setError(null)} className="ml-auto" />
            </div>
          </StitchCard>
        )}

        {/* Opponent Hero */}
        <HeroPanel who={opponentState} side="enemy" active={!isMyTurn} classId={playerClass} isPvP />

        {/* Opponent Board */}
        <StitchCard variant="filled" className="min-h-[120px]">
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-3">Campo do Oponente</p>
          {opponentState.board.length === 0 ? (
            <p className="text-[var(--md-sys-color-on-surface-variant)] italic text-sm">Nenhum lacaio nas fileiras adversárias.</p>
          ) : (
            <div className="flex gap-3 flex-wrap">
              {opponentState.board.map((m, i) => (
                <div key={m.instanceId || i} className="animate-card-enter">
                  <StitchMinionView
                    minion={m}
                    enemy
                    canAttack={false}
                  />
                </div>
              ))}
            </div>
          )}
        </StitchCard>

        {/* Player Board */}
        <StitchCard variant="filled" className="min-h-[120px]" style={{ borderColor: 'var(--md-sys-color-secondary)' }}>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-3">Suas Tropas</p>
          {myState.board.length === 0 ? (
            <p className="text-[var(--md-sys-color-on-surface-variant)] italic text-sm">Suas fileiras estão vazias. Invoque lacaios da sua mão.</p>
          ) : (
            <div className="flex gap-3 flex-wrap">
              {myState.board.map((m, i) => (
                <div key={m.instanceId || i} className="animate-card-enter">
                  <StitchMinionView
                    minion={m}
                    enemy={false}
                    canAttack={m.canAttack && isMyTurn}
                    onClick={() => m.canAttack && isMyTurn && handleAttack(i, m)}
                  />
                </div>
              ))}
            </div>
          )}
        </StitchCard>

        {/* Player Hero */}
        <HeroPanel who={myState} side="player" active={isMyTurn} classId={playerClass} isPvP />

        {/* Hand */}
        <StitchCard variant="filled" style={{ borderColor: isMyTurn ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-outline)' }}>
          <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
            <div className="text-sm font-bold text-[var(--md-sys-color-secondary)]">Sua Mão ({myState.hand.length})</div>
            <StitchButton
              variant={isMyTurn ? 'gold' : 'ghost'}
              onClick={handleEndTurn}
              disabled={!isMyTurn}
              leftIcon="arrow_forward"
            >
              Passar Turno
            </StitchButton>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {myState.hand.map((cardId, i) => {
              // Would need card data from cards.json
              const card = { id: cardId, name: `Card ${cardId}`, cost: 1, attack: 1, health: 1, effectSymbol: '✨' }; // placeholder
              const can = isMyTurn && (card.cost ?? 0) <= myState.mana;
              return (
                <div key={cardId} className="animate-card-enter w-[160px] flex-shrink-0">
                  <StitchCardRelic 
                    card={card} 
                    onClick={() => handlePlayCard(i, card)}
                    disabled={!can}
                  />
                </div>
              );
            })}
            {myState.hand.length === 0 && <div className="text-[var(--md-sys-color-on-surface-variant)] italic px-4">Sem cartas na mão. Aguarde a próxima compra.</div>}
          </div>
        </StitchCard>

        {/* Card Play Animation */}
        {cardPlayAnim && (
          <div className="fixed left-0 right-0 top-[18%] flex justify-center pointer-events-none z-[1200]">
            <StitchCard variant="elevated" className="text-center p-4" style={{ borderColor: 'var(--md-sys-color-secondary)', boxShadow: '0 0 24px rgba(250,188,77,0.4)' }}>
              <div className="text-2xl mb-1">{cardPlayAnim.card.effectSymbol || '✨'}</div>
              <div className="font-serif text-lg text-[var(--md-sys-color-secondary)]">{cardPlayAnim.card.name}</div>
            </StitchCard>
          </div>
        )}

        {/* Victory/Defeat Modal */}
        {gameState.phase === 'finished' && (
          <StitchModal isOpen={true} onClose={() => go(SCREENS.MainMenu)} title={gameState.winner === multiplayer.userId ? 'Vitória!' : 'Derrota'} size="md">
            <div className="text-center">
              <div className="text-5xl mb-4">{gameState.winner === multiplayer.userId ? '👑' : '💀'}</div>
              <p className="text-[var(--md-sys-color-on-surface-variant)] mb-6">
                {gameState.winner === multiplayer.userId ? 'Sua estratégia prevaleceu!' : 'Desta vez o oponente foi superior.'}
              </p>
              <StitchButton variant="gold" onClick={() => go(SCREENS.MainMenu)}>Voltar ao Salão</StitchButton>
            </div>
          </StitchModal>
        )}
      </main>
    </StitchLayout>
  );
}