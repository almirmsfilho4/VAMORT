import React from 'react';
import { RANKS } from '../data/constants.js';
import { Trophy, Flame, Crown } from 'lucide-react';
import {
  StitchCard,
  StitchSectionHeader,
  StitchProgress,
  StitchBadge,
  StitchGrid,
} from './StitchUI.jsx';

function RankIcon({ rank, size = 20 }) {
  if (rank.name === 'Lorde Supremo') return <Crown size={size} color="#fff" />;
  if (rank.name === 'Mestre') return <Flame size={size} color="#fff" />;
  return <Trophy size={size} color="#fff" />;
}

export default function RankLadder({ currentPoints = 0, compact = false }) {
  const nextRank = RANKS.find(r => r.min > currentPoints);
  const currentTier = [...RANKS].reverse().find(r => currentPoints >= r.min) || RANKS[0];
  const progress = nextRank
    ? Math.min(100, Math.max(0, ((currentPoints - currentTier.min) / (nextRank.min - currentTier.min)) * 100))
    : 100;

  return (
    <StitchCard variant="filled">
      {!compact && <StitchSectionHeader title="Progressão de Ranque" icon="trending_up" className="mb-4" />}
      <div className="space-y-3" style={{ maxHeight: compact ? 'none' : '400px', overflowY: 'auto' }}>
        {RANKS.map((rank) => {
          const isCurrentTier = rank.name === currentTier.name;
          const isReached = currentPoints >= rank.min;
          const color = rank.color || '#e5a93c';

          return (
            <StitchCard key={rank.name} variant={isCurrentTier ? 'elevated' : 'filled'} className="p-4" style={{ 
              borderColor: isCurrentTier ? color : 'var(--md-sys-color-outline)',
              opacity: isReached ? 1 : 0.5,
              transition: 'all 0.3s ease',
            }}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${color}, rgba(0,0,0,0.6))`,
                      boxShadow: isCurrentTier ? `0 0 16px ${color}66` : 'none',
                    }}
                  >
                    <RankIcon rank={rank} size={22} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-serif font-semibold" style={{ color: isCurrentTier ? color : 'var(--md-sys-color-on-surface)', fontSize: compact ? '0.9rem' : '1rem' }}>
                      {rank.name}
                    </div>
                    <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Mínimo: {rank.min} pts</div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {isCurrentTier && (
                    <StitchBadge variant="primary" style={{ backgroundColor: color, fontSize: '0.65rem' }}>
                      Seu Ranque Atual
                    </StitchBadge>
                  )}
                  {isCurrentTier && nextRank && (
                    <div className="w-full min-w-[120px]">
                      <div className="flex justify-between text-xs text-[var(--md-sys-color-on-surface-variant)] mb-1">
                        <span>Progresso para {nextRank.name}</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <StitchProgress value={progress} max={100} variant="secondary" className="h-1.5" style={{ '--md-sys-color-primary': color, '--md-sys-color-secondary': nextRank.color || color }} />
                    </div>
                  )}
                </div>
              </div>
            </StitchCard>
          );
        })}
      </div>
    </StitchCard>
  );
}