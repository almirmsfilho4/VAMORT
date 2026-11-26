import React, { useState, useEffect } from 'react';
import { Crown, Flame, Trophy, TrendingUp, TrendingDown, Shield, Zap } from 'lucide-react';
import {
  StitchCard,
  StitchSectionHeader,
  StitchStat,
  StitchProgress,
  StitchBadge,
  StitchGrid,
  StitchDivider,
} from './StitchUI.jsx';

const RANKS = [
  { name: 'Bronze', icon: '🥉', minStars: 0, color: '#cd7f32', slots: null },
  { name: 'Prata', icon: '🥈', minStars: 5, color: '#c0c0c0', slots: null },
  { name: 'Ouro', icon: '🥇', minStars: 12, color: '#ffd700', slots: null },
  { name: 'Platina', icon: '💎', minStars: 22, color: '#06b6d4', slots: null },
  { name: 'Diamante', icon: '💠', minStars: 35, color: '#3b82f6', slots: null },
  { name: 'Mestre', icon: '👑', minStars: 50, color: '#8b5cf6', slots: 100 },
  { name: 'Lenda', icon: '🔥', minStars: 70, color: '#ef4444', slots: 50 },
];

function getRank(stars) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (stars >= r.minStars) rank = r;
  }
  return rank;
}

function RankIcon({ rank, size = 24 }) {
  if (rank.name === 'Lenda') return <Flame size={size} color="#fff" />;
  if (rank.name === 'Mestre') return <Crown size={size} color="#fff" />;
  return <Trophy size={size} color="#fff" />;
}

export default function CompetitiveRanking({ wins = 0, losses = 0, games = 0 }) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem('vamort_rank');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { stars: 0, peakStars: 0, season: 1, lastPlay: Date.now(), legendPosition: null };
  });

  // Decay: lose 1 star per day of inactivity after 3 days
  useEffect(() => {
    const now = Date.now();
    const daysInactive = Math.floor((now - state.lastPlay) / (24 * 60 * 60 * 1000));
    if (daysInactive >= 3 && state.stars > 0) {
      const decay = Math.min(state.stars, daysInactive - 2);
      const newState = { ...state, stars: state.stars - decay, lastPlay: now };
      setState(newState);
      try { localStorage.setItem('vamort_rank', JSON.stringify(newState)); } catch {}
    }
  }, []);

  const rank = getRank(state.stars);
  const nextRank = RANKS[RANKS.indexOf(rank) + 1];
  const starsToNext = nextRank ? nextRank.minStars - state.stars : 0;
  const winRate = games > 0 ? Math.round((wins / games) * 100) : 0;
  const progressToNext = nextRank
    ? Math.min(100, Math.max(0, ((state.stars - rank.minStars) / (nextRank.minStars - rank.minStars)) * 100))
    : 100;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Current Rank Display */}
      <StitchCard variant="elevated" className="mb-4" style={{ borderColor: rank.color }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${rank.color}, rgba(0,0,0,0.6))`, boxShadow: `0 0 20px ${rank.color}66` }}>
              <RankIcon rank={rank} size={32} />
            </div>
            <div>
              <div className="font-serif text-2xl" style={{ color: rank.color }}>{rank.name}</div>
              <div className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                {state.stars} estrelas · Pico: {state.peakStars} · Temporada {state.season}
              </div>
              {rank.slots && (
                <StitchBadge variant="primary" className="mt-2" style={{ backgroundColor: rank.color }}>
                  Top {rank.slots} vagas — permaneça ganhando para não cair
                </StitchBadge>
              )}
            </div>
          </div>
          <div className="flex gap-6 flex-wrap">
            <StitchStat value={wins} label="Vitórias" icon="military_tech" variant="tertiary" />
            <StitchStat value={losses} label="Derrotas" icon="close" variant="primary" />
            <StitchStat value={`${winRate}%`} label="Taxa de Vitória" icon="trending_up" variant="secondary" />
          </div>
        </div>

        {nextRank && (
          <div className="mt-4 pt-4 border-t border-[var(--md-sys-color-outline)]">
            <div className="flex justify-between text-sm text-[var(--md-sys-color-on-surface-variant)] mb-2">
              <span>Progresso para {nextRank.name} {nextRank.icon}</span>
              <span>{starsToNext} estrelas restantes</span>
            </div>
            <StitchProgress value={progressToNext} max={100} variant="secondary" className="h-2" style={{ '--md-sys-color-primary': rank.color, '--md-sys-color-secondary': nextRank.color }} />
          </div>
        )}
      </StitchCard>

      {/* All Ranks Ladder */}
      <StitchCard variant="filled">
        <StitchSectionHeader title="Escada de Ranques" icon="trending_up" className="mb-4" />
        <StitchGrid columns={7} gap="sm">
          {RANKS.map(r => {
            const reached = state.stars >= r.minStars;
            const isCurrent = r.name === rank.name;
            return (
              <StitchCard key={r.name} variant={isCurrent ? 'elevated' : 'filled'} className="text-center p-4" style={{ 
                borderColor: isCurrent ? r.color : 'var(--md-sys-color-outline)',
                opacity: reached ? 1 : 0.5,
              }}>
                <div className="text-3xl mb-2">{r.icon}</div>
                <div className="font-serif font-bold text-sm" style={{ color: reached ? r.color : 'var(--md-sys-color-on-surface-variant)' }}>
                  {r.name}
                </div>
                <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{r.minStars}★</div>
                {r.slots && <div className="text-xs mt-1" style={{ color: '#ef4444' }}>Top {r.slots}</div>}
                {isCurrent && <StitchBadge variant="primary" className="mt-2" style={{ backgroundColor: r.color }}>Seu Ranque</StitchBadge>}
              </StitchCard>
            );
          })}
        </StitchGrid>

        <StitchDivider className="my-4" />
        <StitchCard variant="outlined" className="p-3" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: '#fca5a5' }}>
            <Flame size={16} />
            <span>Inatividade por 3+ dias causa perda de estrelas. Os ranks Mestre e Lenda têm vagas limitadas — apenas os melhores se mantêm.</span>
          </div>
        </StitchCard>
      </StitchCard>
    </div>
  );
}