import React, { useState, useRef, useEffect } from 'react';
import { SCREENS, GAME } from '../data/constants.js';
import { createGame, playCard, attackWithMinion, endTurn, selectTarget, cancelTargeting } from '../game/engine.js';
import CardView from '../components/CardView.jsx';
import StitchLayout from '../components/StitchLayout.jsx';
import Tutorial from '../components/Tutorial.jsx';
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
} from '../components/StitchUI.jsx';

function HeroPanel({ who, side, active, classId }) {
  const hpPct = Math.max(0, Math.min(100, (who.health / who.maxHealth) * 100));
  const isVampire = classId === 'VAMPIRE';
  const isHuman = classId === 'HUMAN';
  const heroTitle = side === 'enemy' ? 'Lorde Vampiro Rival' : isVampire ? 'Lorde Vampiro' : isHuman ? 'Paladino Humano' : 'Herói Neutro';
  const heroIcon = side === 'enemy' ? '🦇' : isVampire ? '🦇' : isHuman ? '⚔️' : '🛡️';
  const accentColor = side === 'enemy' ? 'var(--md-sys-color-primary)' : isVampire ? 'var(--md-sys-color-primary)' : isHuman ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-info)';
  const resourceName = isVampire ? 'Sangue' : isHuman ? 'Fé' : 'Sangue';
  const resourceIcon = isVampire ? '🩸' : isHuman ? '✨' : '🩸';

  return (
    <StitchCard variant="elevated" className="relative overflow-visible transition-all duration-300" style={{ borderColor: accentColor, boxShadow: active ? 'var(--glow-blood)' : 'var(--elevation-3)' }}>
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
        <span>{resourceIcon} {resourceName}: <b className="text-[var(--md-sys-color-secondary)]">{who.blood}</b>/{who.maxBlood}</span>
        <span>🃏 Mão: <b>{who.hand.length}</b></span>
        <span>📚 Deck: <b>{who.deck.length}</b></span>
      </div>
    </StitchCard>
  );
}

function FloatingNumbers({ animations, onCardPlay }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!animations || animations.length === 0 || !containerRef.current) return;

    animations.forEach((anim) => {
      if (anim.type === 'card_play') {
        if (onCardPlay) onCardPlay({ card: { uid: anim.cardId, name: anim.cardName, effectSymbol: anim.effectSymbol } });
        return;
      }

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
  }, [animations, onCardPlay]);

  return <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

export default function BattleScreen({ go, deckIds, onBattleEnd, playerClass, stats }) {
  const [state, setState] = useState(() => createGame(deckIds, playerClass));
  const [reported, setReported] = useState(false);
  const [cardPlayAnim, setCardPlayAnim] = useState(null);
  const [prevAnimations, setPrevAnimations] = useState([]);
  const prevStateRef = useRef(null);
  const [showTutorial, setShowTutorial] = useState(() => {
    try { return localStorage.getItem('vamort_tutorial_done') !== 'true'; } catch { return false; }
  });

  const handleTutorialComplete = () => setShowTutorial(false);

  const prevPlayerHealth = prevStateRef.current?.player?.health;
  const prevPlayerShield = prevStateRef.current?.player?.shield;
  const prevEnemyHealth = prevStateRef.current?.enemy?.health;
  const prevEnemyShield = prevStateRef.current?.enemy?.shield;
  const prevPlayerBoard = prevStateRef.current?.player?.board || [];
  const prevEnemyBoard = prevStateRef.current?.enemy?.board || [];

  useEffect(() => {
    prevStateRef.current = structuredClone(state);
  });

  useEffect(() => {
    if (state.pendingAnimations && state.pendingAnimations.length > 0) {
      const cardPlayAnims = state.pendingAnimations.filter(a => a.type === 'card_play');
      if (cardPlayAnims.length > 0) {
        setCardPlayAnim({ card: { uid: cardPlayAnims[0].cardId, name: cardPlayAnims[0].cardName, effectSymbol: cardPlayAnims[0].effectSymbol }, index: -1 });
        setTimeout(() => setCardPlayAnim(null), 800);
      }
      setPrevAnimations(state.pendingAnimations);
      setTimeout(() => setPrevAnimations([]), 0);
    }
  }, [state.pendingAnimations]);

  const p = state.player;
  const e = state.enemy;

  const doPlay = (i) => {
    const card = state.player.hand[i];
    if (card) {
      setCardPlayAnim({ card, index: i });
      setTimeout(() => setCardPlayAnim(null), 800);
    }
    setState(s => playCard(s, i));
  };
  const doAttack = (i) => setState(s => attackWithMinion(s, i));
  const doEnd = () => setState(s => endTurn(s));
  const doSelectTarget = (targetInfo) => setState(s => selectTarget(s, targetInfo));
  const doCancelTarget = () => setState(s => cancelTargeting(s));
  const restart = () => { setReported(false); setState(createGame(deckIds, playerClass)); };

  if (state.over && !reported) {
    setTimeout(() => { onBattleEnd && onBattleEnd(state.winner); setReported(true); }, 0);
  }

  const targetingValidTargets = state.targeting?.validTargets || [];
  const targetingUids = new Set(targetingValidTargets.filter(t => t.type === 'minion').map(t => t.target.uid));

  if (state.targeting && state.active === 'player' && !state.over) {
    const { validTargets, card } = state.targeting;
    return (
      <StitchLayout go={go} stats={stats} playerClass={playerClass} currentScreen={SCREENS.Battle} showDock={false}>
        <div className="fixed inset-0 bg-black/85 z-[1000] flex flex-col items-center justify-center">
          {cardPlayAnim && (
            <div className="fixed left-0 right-0 top-[8%] flex justify-center pointer-events-none z-[1200]">
              <StitchCard variant="elevated" className="text-center p-6 max-w-md" style={{ borderColor: 'var(--md-sys-color-primary)', boxShadow: 'var(--glow-blood)' }}>
                <div className="text-2xl mb-1">{cardPlayAnim.card.effectSymbol || '✨'}</div>
                <div className="font-serif text-xl text-[var(--md-sys-color-secondary)]">{cardPlayAnim.card.name}</div>
              </StitchCard>
            </div>
          )}
          <StitchModal isOpen={true} onClose={doCancelTarget} title="Escolha o Alvo" size="lg">
            <div className="text-center">
              <div className="text-4xl mb-4">{card.effectSymbol || '✨'}</div>
              <p className="text-[var(--md-sys-color-on-surface-variant)] mb-6">Selecione um alvo para <strong className="text-[var(--md-sys-color-on-surface)]">{card.name}</strong></p>
              <StitchButton variant="outlined" onClick={doCancelTarget} className="mb-4">Cancelar</StitchButton>
            </div>
            <StitchGrid columns={3} gap="md" className="mt-4">
              {validTargets.map((t, idx) => {
                if (t.type === 'hero') {
                  const who = t.target;
                  const isEnemy = t.side === 'enemy';
                  return (
                    <StitchCard key={`hero-${t.side}`} variant="elevated" hover onClick={() => doSelectTarget({ type: 'hero', side: t.side })} className="p-4 text-center" style={{ borderColor: 'var(--md-sys-color-secondary)', boxShadow: 'var(--glow-gold)' }}>
                      <div className="font-bold text-[var(--md-sys-color-secondary)] mb-2 text-sm">{isEnemy ? '🦇 Lorde Vampiro Rival' : '⚔️ Seu Herói'}</div>
                      <div className="text-2xl font-bold text-[var(--md-sys-color-error)]">{who.health} / {who.maxHealth}</div>
                      {who.shield > 0 && <div className="text-[var(--md-sys-color-success)] mt-1">🛡 Escudo {who.shield}</div>}
                    </StitchCard>
                  );
                } else if (t.type === 'minion') {
                  const m = t.target;
                  const isEnemy = t.side === 'enemy';
                  return (
                    <StitchCard key={m.uid || idx} variant="elevated" hover onClick={() => doSelectTarget({ type: 'minion', uid: m.uid, side: t.side })} className="p-4 text-center" style={{ borderColor: 'var(--md-sys-color-secondary)', boxShadow: 'var(--glow-gold)' }}>
                      <div className="font-bold text-[var(--md-sys-color-secondary)] mb-2 text-sm">{m.name}</div>
                      <div className="flex justify-between text-lg">
                        <span>⚔️ <b>{m.attack}</b></span>
                        <span>❤ <b>{m.health}</b></span>
                      </div>
                    </StitchCard>
                  );
                }
                return null;
              })}
            </StitchGrid>
          </StitchModal>
        </div>
      </StitchLayout>
    );
  }

  return (
    <StitchLayout go={go} stats={stats} playerClass={playerClass} currentScreen={SCREENS.Battle} showDock={false}>
      {showTutorial && (
        <div className="fixed inset-0 bg-black/85 z-[1200] flex flex-col items-center justify-center pointer-events-none">
          <Tutorial onComplete={handleTutorialComplete} />
        </div>
      )}
      <main className="stitch-main-without-nav flex-1 flex flex-col gap-4 max-w-[1280px] mx-auto relative px-4 py-4">
        <FloatingNumbers animations={prevAnimations} onCardPlay={({ card }) => setCardPlayAnim({ card, index: -1 })} />

        {/* Top Bar */}
        <StitchCard variant="filled" className="flex justify-between items-center px-4 py-3">
          <div className="font-serif text-lg text-[var(--md-sys-color-secondary)]">
            ⚔️ Arena Arcana — Turno {state.turn} &nbsp;|&nbsp;
            <span className={state.active === 'player' ? 'text-[var(--md-sys-color-success)]' : 'text-[var(--md-sys-color-error)]'}>
              {state.active === 'player' ? 'Seu Turno de Agir' : 'Turno do Inimigo'}
            </span>
          </div>
          <div className="flex gap-2">
            <StitchButton variant="ghost" size="sm" onClick={restart}>Reiniciar</StitchButton>
            <StitchButton variant="ghost" size="sm" onClick={() => go(SCREENS.MainMenu)}>Abandonar</StitchButton>
          </div>
        </StitchCard>

        {/* Enemy Hero */}
        <HeroPanel who={e} side="enemy" active={state.active === 'enemy'} classId={playerClass} data-hero="enemy" />

        {/* Enemy Board */}
        <StitchCard variant="filled" className="min-h-[120px]">
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-3">Campo de Batalha Inimigo</p>
          {e.board.length === 0 ? (
            <p className="text-[var(--md-sys-color-on-surface-variant)] italic text-sm">Nenhum lacaio nas fileiras adversárias.</p>
          ) : (
            <div className="flex gap-3 flex-wrap">
              {e.board.map((m, i) => {
                const prevMinion = prevEnemyBoard.find(x => x.uid === m.uid);
                const isTargetable = targetingUids.has(m.uid);
                return (
                  <div key={m.uid || i} className={`animate-card-enter animate-card-enter-delay-${(i % 10) + 1} ${isTargetable ? 'ring-2 ring-[var(--md-sys-color-secondary)]' : ''}`}>
                    <StitchMinionView
                      minion={m}
                      enemy
                      canAttack={false}
                      onClick={() => { if (state.targeting && isTargetable) doSelectTarget({ type: 'minion', uid: m.uid, side: 'enemy' }); }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </StitchCard>

        {/* Player Board */}
        <StitchCard variant="filled" className="min-h-[120px]" style={{ borderColor: 'var(--md-sys-color-secondary)' }}>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-3">Suas Tropas em Campo</p>
          {p.board.length === 0 ? (
            <p className="text-[var(--md-sys-color-on-surface-variant)] italic text-sm">Suas fileiras estão vazias. Invoque lacaios da sua mão.</p>
          ) : (
            <div className="flex gap-3 flex-wrap">
              {p.board.map((m, i) => {
                const prevMinion = prevPlayerBoard.find(x => x.uid === m.uid);
                const isTargetable = targetingUids.has(m.uid);
                return (
                  <div key={m.uid || i} className={`animate-card-enter animate-card-enter-delay-${(i % 10) + 1} ${isTargetable ? 'ring-2 ring-[var(--md-sys-color-secondary)]' : ''}`}>
                    <StitchMinionView
                      minion={m}
                      enemy={false}
                      canAttack={m.canAttack && state.active === 'player' && !state.over}
                      onClick={() => {
                        if (state.targeting) {
                          if (isTargetable) doSelectTarget({ type: 'minion', uid: m.uid, side: 'player' });
                        } else if (m.canAttack && state.active === 'player' && !state.over) {
                          doAttack(i);
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </StitchCard>

        {/* Player Hero */}
        <HeroPanel who={p} side="player" active={state.active === 'player'} classId={playerClass} data-hero="player" />

        {/* Hand */}
        <StitchCard variant="filled" style={{ borderColor: 'var(--md-sys-color-outline)' }}>
          <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
            <div className="text-sm font-bold text-[var(--md-sys-color-secondary)]">Sua Mão Tática ({p.hand.length})</div>
            <StitchButton
              variant={state.active === 'player' && !state.over ? 'gold' : 'ghost'}
              onClick={doEnd}
              disabled={state.active !== 'player' || state.over}
            >
              Passar Turno ➔
            </StitchButton>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {p.hand.map((c, i) => {
              const can = state.active === 'player' && !state.over && (c.cost ?? 0) <= p.blood;
              return (
                <div key={c.uid || i} className={`animate-card-enter animate-card-enter-delay-${(i % 10) + 1} w-[160px] flex-shrink-0`}>
                  <CardView card={c} onClick={() => doPlay(i)} disabled={!can} />
                </div>
              );
            })}
            {p.hand.length === 0 && <div className="text-[var(--md-sys-color-on-surface-variant)] italic px-4">Sem cartas na mão. Aguarde a próxima compra.</div>}
          </div>
        </StitchCard>

        {/* Battle Log */}
        <StitchCard variant="filled" className="max-h-40 overflow-y-auto">
          <p className="font-medium text-sm text-[var(--md-sys-color-secondary)] mb-2">Crônica do Confronto</p>
          {state.log.slice(-8).map((l, i) => <p key={i} className="text-xs text-[var(--md-sys-color-on-surface-variant)]">• {l}</p>)}
        </StitchCard>

        {/* Card Play Animation */}
        {cardPlayAnim && (
          <div className="fixed left-0 right-0 top-[18%] flex justify-center pointer-events-none z-[1200]">
            <StitchCard variant="elevated" className="text-center p-4" style={{ borderColor: 'var(--md-sys-color-secondary)', boxShadow: 'var(--glow-gold)' }}>
              <div className="text-2xl mb-1">{cardPlayAnim.card.effectSymbol || '✨'}</div>
              <div className="font-serif text-lg text-[var(--md-sys-color-secondary)]">{cardPlayAnim.card.name}</div>
            </StitchCard>
          </div>
        )}

        {/* Victory/Defeat Modal */}
        {state.over && (
          <StitchModal isOpen={true} onClose={() => go(SCREENS.MainMenu)} title={state.winner === 'player' ? 'Vitória Retumbante!' : 'Sucumbiu às Trevas'} size="md">
            <div className="text-center">
              <div className="text-5xl mb-4">{state.winner === 'player' ? '👑' : '💀'}</div>
              <p className="text-[var(--md-sys-color-on-surface-variant)] mb-6">
                {state.winner === 'player' ? 'Seu domínio estratégico prevaleceu sobre o adversário.' : 'Desta vez as forças adversárias foram implacáveis.'}
              </p>
              <div className="flex gap-3 justify-center">
                <StitchButton variant="gold" onClick={restart}>Jogar Novamente</StitchButton>
                <StitchButton variant="outlined" onClick={() => go(SCREENS.MainMenu)}>Voltar ao Salão</StitchButton>
              </div>
            </div>
          </StitchModal>
        )}
      </main>
    </StitchLayout>
  );
}