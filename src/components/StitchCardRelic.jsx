import React from 'react';
import { TYPE_LABEL } from '../data/constants.js';

const RARITY_CLASS_MAP = {
  'COMUM': 'rarity-common',
  'RARA': 'rarity-rare',
  'EPICA': 'rarity-epic',
  'LENDARIA': 'rarity-legendary',
  'common': 'rarity-common',
  'rare': 'rarity-rare',
  'epic': 'rarity-epic',
  'legendary': 'rarity-legendary',
};

const RARITY_LABEL_MAP = {
  'COMUM': 'Comum',
  'RARA': 'Rara',
  'EPICA': 'Épica',
  'LENDARIA': 'Lendária',
  'common': 'Comum',
  'rare': 'Rara',
  'epic': 'Épica',
  'legendary': 'Lendária',
};

const TYPE_LABEL_MAP = {
  'MINION': 'Lacaio',
  'ATTACK': 'Ataque',
  'DEFENSE': 'Defesa',
  'MAGIC': 'Magia',
  'SPECIAL': 'Especial',
  'minion': 'Lacaio',
  'spell': 'Feitiço',
};

export default function StitchCardRelic({
  card,
  onClick,
  disabled,
  count,
  faceDown,
  selected,
  className = '',
}) {
  if (!card) return null;

  const rarityKey = String(card.rarity || '').toUpperCase();
  const rarityClass = RARITY_CLASS_MAP[rarityKey] || 'rarity-common';
  const rarityLabel = RARITY_LABEL_MAP[rarityKey] || rarityKey;
  const typeKey = String(card.type || '').toUpperCase();
  const typeLabel = TYPE_LABEL_MAP[typeKey] || card.type || 'Carta';

  const handleClick = () => {
    if (!disabled && onClick) onClick();
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    e.currentTarget.style.transform = `translateY(-8px) perspective(600px) rotateY(${x * 14}deg) rotateX(${-y * 10}deg) scale(1.03)`;
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = '';
  };

  const illustrationUrl = card.art ? `/assets/vamort/${card.art}` : null;

  return (
    <div
      className={`stitch-card-relic ${rarityClass} ${disabled ? 'disabled' : ''} ${selected ? 'selected' : ''} ${className}`}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      tabIndex={disabled ? -1 : 0}
      role={onClick ? 'button' : undefined}
      aria-label={card.name}
      style={{
        cursor: onClick && !disabled ? 'pointer' : 'default',
        ...(faceDown ? { opacity: 0.6 } : {}),
      }}
      title={card.name}
    >
      <div className="relic-frame" aria-hidden="true" />
      
      {/* Card Artwork Illustration Window */}
      <div
        className="relic-art"
        aria-hidden="true"
        style={{
          position: 'relative',
          height: '56%',
          background: '#0a080d',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
        }}
      >
        {illustrationUrl && (
          <img
            src={illustrationUrl}
            alt={card.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
              transition: 'transform 0.4s ease',
            }}
          />
        )}
      </div>

      <div className="relic-rarity" aria-hidden="true">
        <span className={`rarity-badge ${rarityClass}`}>{rarityLabel}</span>
      </div>

      <div className="relic-info" style={{ height: '44%', padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div className="relic-name" style={{ fontSize: '0.92rem', marginBottom: 2 }}>{card.name}</div>
          <div className="relic-type" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{typeLabel}</div>
          {card.description && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35, marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {card.description}
            </div>
          )}
        </div>

        <div className="relic-stats" style={{ paddingTop: 6 }}>
          {card.attack != null ? (
            <span className="relic-stat atk" style={{ fontSize: '0.85rem' }}>
              ⚔️ {card.attack}
            </span>
          ) : <span />}
          {card.health != null ? (
            <span className="relic-stat hp" style={{ fontSize: '0.85rem' }}>
              ❤ {card.health}
            </span>
          ) : <span />}
        </div>
      </div>

      <div className="relic-cost" aria-label={`Custo: ${card.cost ?? 0}`}>
        {card.cost ?? 0}
      </div>

      {count != null && count > 1 && (
        <div className="card-count" aria-label={`${count} cópias`}>x{count}</div>
      )}
    </div>
  );
}
