import React from 'react';
import { StitchCard, StitchBadge } from './StitchUI.jsx';

/**
 * TournamentBracket - Visual tournament bracket component
 * Supports single elimination, double elimination, and Swiss formats
 */
export default function TournamentBracket({ tournament, matches = [], onMatchClick, onReportResult }) {
  const rounds = React.useMemo(() => {
    if (!matches || matches.length === 0) return [];
    
    // Group matches by round
    const roundMap = new Map();
    matches.forEach(match => {
      const round = match.round || 1;
      if (!roundMap.has(round)) roundMap.set(round, []);
      roundMap.get(round).push(match);
    });
    
    // Sort rounds
    const sortedRounds = Array.from(roundMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([round, roundMatches]) => ({
        round,
        matches: roundMatches.sort((a, b) => (a.position || 0) - (b.position || 0))
      }));
    
    return sortedRounds;
  }, [matches]);

  if (rounds.length === 0) {
    return (
      <StitchCard variant="filled" className="p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-[var(--md-sys-color-on-surface-variant)] mb-2 block">account_tree</span>
        <p className="text-[var(--md-sys-color-on-surface-variant)]">Bracket will be generated when tournament starts</p>
      </StitchCard>
    );
  }

  const getRoundLabel = (round, totalRounds) => {
    if (round === totalRounds) return 'Final';
    if (round === totalRounds - 1) return 'Semifinal';
    if (round === totalRounds - 2) return 'Quarterfinal';
    return `Round ${round}`;
  };

  const totalRounds = rounds.length;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-8 min-w-max">
        {rounds.map(({ round, matches: roundMatches }) => (
          <div key={round} className="flex flex-col gap-4 min-w-[220px]">
            <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider text-center">
              {getRoundLabel(round, totalRounds)}
            </h4>
            <div className="flex flex-col gap-3 justify-center" style={{ minHeight: `${Math.pow(2, totalRounds - round) * 60}px` }}>
              {roundMatches.map((match, idx) => (
                <div
                  key={match.id || idx}
                  className={`relative flex flex-col rounded-lg border-2 transition-all ${
                    match.status === 'completed'
                      ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]'
                      : match.status === 'active'
                      ? 'border-[var(--md-sys-color-tertiary)] bg-[var(--md-sys-color-tertiary-container)] animate-pulse'
                      : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]'
                  }`}
                  onClick={() => onMatchClick?.(match)}
                >
                  {/* Player 1 */}
                  <div className={`flex items-center justify-between px-3 py-2 ${match.winner === match.player1 ? 'bg-[var(--md-sys-color-primary)]/10' : ''}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center text-xs font-bold">
                        {match.player1?.name?.[0] || '?'}
                      </div>
                      <span className={`text-sm truncate ${match.winner === match.player1 ? 'font-bold text-[var(--md-sys-color-primary)]' : ''}`}>
                        {match.player1?.name || 'TBD'}
                      </span>
                    </div>
                    {match.score1 !== undefined && (
                      <span className={`text-sm font-bold ${match.winner === match.player1 ? 'text-[var(--md-sys-color-primary)]' : 'text-[var(--md-sys-color-on-surface-variant)]'}`}>
                        {match.score1}
                      </span>
                    )}
                  </div>
                  
                  <div className="h-px bg-[var(--md-sys-color-outline-variant)]" />
                  
                  {/* Player 2 */}
                  <div className={`flex items-center justify-between px-3 py-2 ${match.winner === match.player2 ? 'bg-[var(--md-sys-color-primary)]/10' : ''}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center text-xs font-bold">
                        {match.player2?.name?.[0] || '?'}
                      </div>
                      <span className={`text-sm truncate ${match.winner === match.player2 ? 'font-bold text-[var(--md-sys-color-primary)]' : ''}`}>
                        {match.player2?.name || 'TBD'}
                      </span>
                    </div>
                    {match.score2 !== undefined && (
                      <span className={`text-sm font-bold ${match.winner === match.player2 ? 'text-[var(--md-sys-color-primary)]' : 'text-[var(--md-sys-color-on-surface-variant)]'}`}>
                        {match.score2}
                      </span>
                    )}
                  </div>
                  
                  {/* Status badge */}
                  {match.status === 'active' && (
                    <div className="absolute -top-2 -right-2">
                      <StitchBadge variant="tertiary" size="sm">LIVE</StitchBadge>
                    </div>
                  )}
                  
                  {/* Report Result button for active matches */}
                  {match.status === 'active' && onReportResult && (
                    <div className="px-3 py-2 border-t border-[var(--md-sys-color-outline-variant)]">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); onReportResult(match, match.player1); }}
                          className="flex-1 text-xs py-1 px-2 rounded bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] hover:opacity-80"
                        >
                          {match.player1?.name || 'P1'} Wins
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onReportResult(match, match.player2); }}
                          className="flex-1 text-xs py-1 px-2 rounded bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:opacity-80"
                        >
                          {match.player2?.name || 'P2'} Wins
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}