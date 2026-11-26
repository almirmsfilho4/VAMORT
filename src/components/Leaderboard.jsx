import React, { useEffect, useState } from 'react';
import { getLeaderboard, isConfigured } from '../supabase.js';
import {
  StitchCard,
  StitchSectionHeader,
  StitchStat,
  StitchBadge,
  StitchDivider,
} from './StitchUI.jsx';

const CLASS_ICON = { VAMPIRE: '🦇', HUMAN: '⚔️', NEUTRAL: '🛡️' };
const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured()) { setLoading(false); return; }
    getLeaderboard(20).then(data => { setEntries(data); setLoading(false); });
  }, []);

  if (!isConfigured()) return (
    <StitchCard variant="outlined" className="text-center py-8">
      <span className="material-symbols-outlined text-[var(--md-sys-color-on-surface-variant)] text-4xl mb-2 block">lock</span>
      <p className="text-[var(--md-sys-color-on-surface-variant)]">Leaderboard disponível com conta conectada</p>
    </StitchCard>
  );

  return (
    <StitchCard variant="filled">
      <StitchSectionHeader title="Ranking Global" icon="leaderboard" className="mb-4" />
      {loading ? (
        <div className="space-y-2" role="status" aria-label="Carregando ranking">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-[var(--md-sys-color-surface-container-low)] animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-[var(--md-sys-color-on-surface-variant)] text-4xl mb-2 block">emoji_events</span>
          <p className="text-[var(--md-sys-color-on-surface-variant)]">Nenhum jogador no ranking ainda. Seja o primeiro!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {entries.map((e, i) => (
            <StitchCard key={e.user_id || i} variant={i < 3 ? 'elevated' : 'filled'} className="flex items-center gap-4 p-3" style={{ borderColor: i < 3 ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-outline)' }}>
              <StitchBadge variant={i < 3 ? 'secondary' : 'surface'} className="w-10 h-10 flex items-center justify-center text-lg font-serif">
                {i < 3 ? MEDALS[i] : i + 1}
              </StitchBadge>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xl" aria-hidden="true">{CLASS_ICON[e.player_class] || '🛡️'}</span>
                <span className="font-serif text-[var(--md-sys-color-on-surface)] truncate">{e.name || 'Herói'}</span>
              </div>
              <StitchStat value={e.wins || 0} label="Vitórias" variant="secondary" className="text-right" />
              <StitchStat value={e.games || 0} label="Partidas" variant="surface" className="text-right" />
            </StitchCard>
          ))}
        </div>
      )}
    </StitchCard>
  );
}