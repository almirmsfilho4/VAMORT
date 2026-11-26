import React, { useState, useRef, useEffect } from 'react';
import { FACTION_LABEL, TYPE_LABEL } from '../data/constants.js';

/* Constants for design system classes */
export const SCALE_PRESS = 'scale-press';
export const TABULAR_NUMS = 'tabular-nums';
export const TEXT_BALANCE = 'text-balance';

const KEYWORD_LABELS = {
  taunt: 'Provocação',
  divineShield: 'Escudo Divino',
  lifesteal: 'Roubo de Vida',
  rush: 'Investida',
  flying: 'Voar',
  stealth: 'Furtivo',
};

const FRAME_MAP = {
  VAMPIRE: '/assets/vamort/cards/vampire-frame.svg',
  HUMAN: '/assets/vamort/cards/human-frame.svg',
  NEUTRAL: '/assets/vamort/cards/neutral-frame.svg',
};

/* Map faction to color class for card border */
const FACTION_BORDER_CLASS = {
  VAMPIRE: 'f-vampire',
  HUMAN: 'f-human',
  NEUTRAL: 'f-neutral',
  DEFAULT: 'f-neutral',
};

/* Vibrant rarity colors */
const RARITY_COLOR = {
  COMUM: '#9ca3af',
  RARA: '#3b82f6',
  EPICA: '#a855f7',
  LENDARIA: '#f59e0b',
};

/* SVG placeholder by faction when art is unavailable */
const FACTION_PLACEHOLDER = {
  VAMPIRE: (
    <svg width="100%" height="100%" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 4, display: 'block' }}>
      <defs>
        <radialGradient id="vg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4a0010" />
          <stop offset="100%" stopColor="#1a0005" />
        </radialGradient>
      </defs>
      <rect width="120" height="80" fill="url(#vg)" />
      <text x="60" y="48" textAnchor="middle" fontSize="30" fill="rgba(230,25,75,0.7)">🦇</text>
    </svg>
  ),
  HUMAN: (
    <svg width="100%" height="100%" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 4, display: 'block' }}>
      <defs>
        <radialGradient id="hg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4a2800" />
          <stop offset="100%" stopColor="#1a0e00" />
        </radialGradient>
      </defs>
      <rect width="120" height="80" fill="url(#hg)" />
      <text x="60" y="48" textAnchor="middle" fontSize="30" fill="rgba(229,169,60,0.7)">⚔️</text>
    </svg>
  ),
  NEUTRAL: (
    <svg width="100%" height="100%" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 4, display: 'block' }}>
      <defs>
        <radialGradient id="ng" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2d1050" />
          <stop offset="100%" stopColor="#0d0520" />
        </radialGradient>
      </defs>
      <rect width="120" height="80" fill="url(#ng)" />
      <text x="60" y="48" textAnchor="middle" fontSize="30" fill="rgba(168,85,247,0.7)">🌅</text>
    </svg>
  ),
};

const rarityClass = (r) => {
  const r2 = (r || 'COMUM').toUpperCase();
  return `card-rarity-${r2}`;
};

/* Floating number animation component */
function FloatingNumber({ value, type, x, y, onEnd }) {
  const ref = useRef(null);
  
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    const colors = {
      damage: '#ff6b6b',
      heal: '#69db7c',
      shield: '#4ecdc4',
      blood: '#e5a93a',
    };
    
    const color = colors[type] || '#fff';
    const prefix = type === 'heal' ? '+' : type === 'damage' ? '-' : '+';
    
    el.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      pointer-events: none;
      z-index: 9999;
      font-weight: 900;
      font-size: 1.5rem;
      color: ${color};
      text-shadow: 0 0 8px ${color}, 0 0 16px ${color};
      font-family: 'Newsreader', serif;
      transform: translate(-50%, -50%);
      animation: floatUp 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    `;
    
    el.textContent = `${prefix}${value}`;
    
    const handleEnd = () => {
      el.remove();
      onEnd?.();
    };
    
    el.addEventListener('animationend', handleEnd);
    return () => el.removeEventListener('animationend', handleEnd);
  }, [value, type, x, y, onEnd]);
  
  return <span ref={ref} />;
}

export default function CardView({ card, onClick, disabled, small, count, isTargeted, isPlayable }) {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const playable = !!onClick && !disabled;
  const keywords = card.keywords || [];
  const frameSrc = FRAME_MAP[card.faction] || FRAME_MAP.NEUTRAL;
  const artSrc = card.art ? `/assets/vamort/${card.art}` : null;
  const rarityColor = RARITY_COLOR[(card.rarity || 'COMUM').toUpperCase()] || RARITY_COLOR.COMUM;

  /* Determine faction class for border color */
  const factionClass = FACTION_BORDER_CLASS[card.faction] || FACTION_BORDER_CLASS.DEFAULT;

  const handle3DMove = (e) => {
    if (!small && playable) {
      e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
    }
  };

  const handle3DLeave = (e) => {
    if (!small) {
      e.currentTarget.style.transform = '';
    }
  };

  const handleMouseDown = (e) => {
    if (playable && !small) {
      e.currentTarget.style.transform = 'translateY(-2px) scale(0.98)';
    }
  };

  const handleMouseUp = (e) => {
    if (playable && !small) {
      e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
    }
  };

  return (
    <div
      className={`card ${factionClass} ${playable ? 'playable' : ''} ${disabled ? 'disabled' : ''} ${isTargeted ? 'targeted' : ''} ${SCALE_PRESS}`}
      onClick={playable ? onClick : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); }}
      onMouseMove={handle3DMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      title={card.lore || ''}
      style={{
        ...(small ? { minHeight: 0, padding: 8 } : {}),
        backgroundImage: `url(${frameSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'transform 0.1s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        outline: `1px solid ${rarityColor}44`,
        borderColor: isTargeted ? 'var(--gold)' : hovered && playable ? rarityColor : 'transparent',
        boxShadow: isTargeted 
          ? '0 0 30px rgba(229,169,60,0.6), inset 0 0 20px rgba(229,169,60,0.2)'
          : hovered && playable 
            ? `0 12px 40px ${rarityColor}40, 0 0 30px ${rarityColor}20` 
            : disabled 
              ? 'inset 0 0 40px rgba(0,0,0,0.5)' 
              : 'var(--shadow-md)',
        transform: isTargeted ? 'scale(1.02)' : '',
      }}
    >
      {card.cost != null && (
        <div 
          className="cost-badge" 
          title="Custo (Sangue)"
          style={{
            background: playable ? 'linear-gradient(135deg, var(--gold), var(--gold-dim))' : 'rgba(20,15,10,0.9)',
            color: playable ? '#16121c' : 'var(--text-muted)',
            boxShadow: playable ? '0 0 16px rgba(229,169,60,0.5)' : 'none',
            transform: hovered && playable ? 'scale(1.15)' : 'scale(1)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          {card.cost}
        </div>
      )}
      {count != null && (
        <div
          className="cost-badge"
          style={{
            left: 8,
            right: 'auto',
            background: 'linear-gradient(135deg, #1a2a3a, #0d1a28)',
            borderColor: '#5b8db8',
            color: '#a8d4f5',
            fontWeight: 700,
            minWidth: '1.5rem',
            textAlign: 'center',
          }}
        >
          ×{count}
        </div>
      )}

      <div className="card-name" style={{ 
        color: isTargeted ? 'var(--gold)' : 'var(--text)',
        textShadow: isTargeted ? '0 0 8px var(--gold)' : 'none',
        transition: 'color 0.2s ease, text-shadow 0.2s ease',
      }}>{card.name}</div>
      
      <div className="card-type">
        <span 
          className={rarityClass(card.rarity)} 
          style={{ 
            color: rarityColor, 
            fontWeight: 700,
            textShadow: `0 0 8px ${rarityColor}80`,
            transition: 'text-shadow 0.2s ease',
          }}
        >
          {card.rarity || 'COMUM'}
        </span>
        {' · '}{FACTION_LABEL[card.faction] || card.faction} · {TYPE_LABEL[card.type] || card.type}
      </div>

      {!small && (
        <div className="card-art" style={{ marginTop: 8, marginBottom: 8, minHeight: 60 }}>
          {artSrc && !imgError ? (
            <img
              src={artSrc}
              alt={card.name}
              onError={() => setImgError(true)}
              style={{ 
                width: '100%', 
                height: 'auto', 
                maxHeight: '160px', 
                objectFit: 'contain', 
                borderRadius: '4px',
                transition: 'transform 0.3s ease, filter 0.3s ease',
                filter: disabled ? 'grayscale(0.7) brightness(0.7)' : hovered ? 'brightness(1.05)' : 'none',
                transform: hovered ? 'scale(1.02)' : 'scale(1)',
              }}
            />
          ) : (
            <div style={{ width: '100%', height: 80 }}>
              {FACTION_PLACEHOLDER[card.faction] || FACTION_PLACEHOLDER.NEUTRAL}
            </div>
          )}
        </div>
      )}

      {card.effectSymbol && (
        <div style={{ 
          fontSize: '1.1rem',
          filter: disabled ? 'grayscale(0.5)' : 'none',
          transition: 'filter 0.2s ease',
        }}>{card.effectSymbol}</div>
      )}

      {keywords.length > 0 && (
        <div className="card-keywords" style={{ marginTop: 4, marginBottom: 4 }}>
          {keywords.map(k => (
            <span 
              key={k} 
              className="keyword-pill" 
              title={KEYWORD_LABELS[k] || k}
              style={{
                borderColor: k === 'divineShield' ? '#f59e0b' : k === 'lifesteal' ? '#dc2626' : k === 'taunt' ? '#22c55e' : k === 'flying' ? '#3b82f6' : k === 'stealth' ? '#6366f1' : 'var(--gold)',
                background: k === 'divineShield' ? 'rgba(245,158,11,0.15)' : k === 'lifesteal' ? 'rgba(220,38,38,0.15)' : k === 'taunt' ? 'rgba(34,197,94,0.15)' : k === 'flying' ? 'rgba(59,130,246,0.15)' : k === 'stealth' ? 'rgba(99,102,241,0.15)' : 'rgba(229,169,60,0.15)',
                                  boxShadow: hovered ? '0 0 10px ' + (k === 'divineShield' ? '#f59e0b' : k === 'lifesteal' ? '#dc2626' : k === 'taunt' ? '#22c55e' : k === 'flying' ? '#3b82f6' : 'var(--gold)') + '40' : 'none',
                transition: 'box-shadow 0.2s ease, transform 0.1s ease',
                transform: hovered ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {KEYWORD_LABELS[k] || k}
            </span>
          ))}
        </div>
      )}

      <div className="card-desc" style={{ fontSize: '0.85rem', color: '#d6d3d1', lineHeight: 1.5 }}>{card.description}</div>

      {card.effects?.onPlay && (
        <div className="card-battlecry" style={{ marginTop: 4, fontSize: '0.8rem', color: '#fbbf24', fontStyle: 'italic' }}>
          Efeito: {formatEffects(card.effects.onPlay)}
        </div>
      )}

      {card.effects?.battlecry && (
        <div className="card-battlecry" style={{ marginTop: 4, fontSize: '0.8rem', color: '#fbbf24', fontStyle: 'italic' }}>
          Grito de Guerra: {formatEffects(card.effects.battlecry)}
        </div>
      )}

      {card.effects?.deathrattle && (
        <div className="card-deathrattle" style={{ marginTop: 4, fontSize: '0.8rem', color: '#a8a078', fontStyle: 'italic' }}>
          Último Suspiro: {formatEffects(card.effects.deathrattle)}
        </div>
      )}

      {card.battlecry && !card.effects?.battlecry && (
        <div className="card-battlecry" style={{ marginTop: 4, fontSize: '0.8rem', color: '#fbbf24', fontStyle: 'italic' }}>
          Grito de Guerra: {formatBattlecry(card.battlecry)}
        </div>
      )}

      {card.deathrattle && !card.effects?.deathrattle && (
        <div className="card-deathrattle" style={{ marginTop: 4, fontSize: '0.8rem', color: '#a8a078', fontStyle: 'italic' }}>
          Último Suspiro: {formatDeathrattle(card.deathrattle)}
        </div>
      )}

      <div className="stats" style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
        {card.type === 'MINION' ? (
          <>
            <span className="pill" style={{ background: 'rgba(220,38,38,0.2)', borderColor: '#dc2626', color: '#fca5a5' }}>⚔ {card.attack ?? 0}</span>
            <span className="pill" style={{ background: 'rgba(34,197,94,0.2)', borderColor: '#22c55e', color: '#86efac' }}>❤ {card.health ?? 0}</span>
          </>
        ) : card.power != null ? (
          <span className="pill" style={{ background: 'rgba(168,85,247,0.2)', borderColor: '#a855f7', color: '#d8b4fe' }}>Poder {card.power}</span>
        ) : null}
      </div>

      {card.lore && !small && <div className="card-lore">"{card.lore}"</div>}
    </div>
  );
}

function formatEffects(effects) {
  if (!Array.isArray(effects)) return '';
  return effects.map(eff => {
    switch (eff.type) {
      case 'gainBlood': return `Ganhe ${eff.value} de Sangue`;
      case 'healHero': return `Cure ${eff.value} de vida`;
      case 'healAll': return `Cure ${eff.value} de vida em todos`;
      case 'damageHero': return `Cause ${eff.value} de dano ao herói`;
      case 'damageEnemyMinion': return `Cause ${eff.value} de dano a um lacaio inimigo`;
      case 'damageAll': return `Cause ${eff.value} de dano a todos`;
      case 'silence': return 'Silencie um lacaio';
      case 'summon': return `Invoque ${eff.count || 1} ${eff.cardId}`;
      case 'buffLastMinion': return `Ganha +${eff.stats?.attack || 0}/+${eff.stats?.health || 0} por carta na mão`;
      case 'setHandCost': return `Cartas na mão custam ${eff.cost}`;
      case 'giveDivineShield': return `Dá Escudo Divino${eff.target === 'all' ? ' a todos' : ''}`;
      case 'draw': return `Compre ${eff.count} carta(s)`;
      case 'gainArmor': return `Ganhe ${eff.value} de escudo`;
      default: return eff.type;
    }
  }).join('. ');
}

function formatBattlecry(bc) {
  const parts = [];
  if (bc.gainBlood) parts.push(`Ganhe ${bc.gainBlood} de Sangue`);
  if (bc.heal) parts.push(`Cure ${bc.heal} de vida`);
  if (bc.healAll) parts.push(`Cure ${bc.healAll} de vida em todos`);
  if (bc.damage) parts.push(`Cause ${bc.damage} de dano${bc.condition === 'enemyMinion' ? ' a um lacaio inimigo' : ' ao inimigo'}`);
  if (bc.silence) parts.push('Silencie um lacaio inimigo');
  if (bc.summon) parts.push(`Invoque ${bc.summon.count || 1} ${bc.summon.id}`);
  if (bc.gainStats) parts.push(`Ganha +1/+1 por carta na mão`);
  if (bc.transformHand) parts.push(`Cartas na mão custam ${bc.transformHand.cost}`);
  if (bc.giveDivineShield) parts.push('Dá Escudo Divino');
  if (bc.draw) parts.push(`Compre ${bc.draw} carta(s)`);
  return parts.join('. ');
}

function formatDeathrattle(dr) {
  const parts = [];
  if (dr.summon) parts.push(`Invoque ${dr.summon.count || 1} ${dr.summon.id}`);
  if (dr.draw) parts.push(`Compre ${dr.draw} carta(s)`);
  if (dr.gainBlood) parts.push(`Ganhe ${dr.gainBlood} de Sangue`);
  if (dr.healAll) parts.push(`Cure ${dr.healAll} de vida em todos`);
  return parts.join('. ');
}

