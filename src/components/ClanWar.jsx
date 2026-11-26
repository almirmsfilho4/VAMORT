import React, { useState } from 'react';
import { StitchCard, StitchButton, StitchBadge, StitchStat } from './StitchUI.jsx';

/**
 * ClanWar - Component for clan war management and display
 */
export default function ClanWar({ clan, opponentClan, warStatus, onStartWar, onJoinBattle }) {
  const [selectedMembers, setSelectedMembers] = useState([]);

  const getWarStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--md-sys-color-tertiary)';
      case 'pending': return 'var(--md-sys-color-secondary)';
      case 'completed': return 'var(--md-sys-color-primary)';
      default: return 'var(--md-sys-color-on-surface-variant)';
    }
  };

  const getWarStatusIcon = (status) => {
    switch (status) {
      case 'active': return 'sports_esports';
      case 'pending': return 'schedule';
      case 'completed': return 'emoji_events';
      default: return 'gps_fixed';
    }
  };

  if (!clan) {
    return (
      <StitchCard variant="filled" className="p-8 text-center">
        <span className="material-symbols-outlined text-5xl text-[var(--md-sys-color-on-surface-variant)] mb-4 block">groups</span>
        <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] mb-2">Join a Clan First</h3>
        <p className="text-[var(--md-sys-color-on-surface-variant)]">You need to be in a clan to participate in clan wars.</p>
      </StitchCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* War Status */}
      {warStatus && warStatus !== 'none' && (
        <StitchCard variant="filled" className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${getWarStatusColor(warStatus.status)}, ${getWarStatusColor(warStatus.status)}88)` }}>
              <span className="material-symbols-outlined text-3xl text-white">{getWarStatusIcon(warStatus.status)}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">
                {warStatus.status === 'active' ? 'War in Progress' : warStatus.status === 'pending' ? 'War Pending' : 'War Completed'}
              </h3>
              {opponentClan && (
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                  vs {opponentClan.name} [{opponentClan.tag}]
                </p>
              )}
            </div>
            <StitchBadge variant={warStatus.status === 'active' ? 'tertiary' : warStatus.status === 'completed' ? 'primary' : 'secondary'} size="md">
              {warStatus.status.toUpperCase()}
            </StitchBadge>
          </div>

          {/* Score */}
          {warStatus.status !== 'pending' && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <StitchStat label={clan.name} value={warStatus.clanScore || 0} icon="shield" />
              <StitchStat label="VS" value="" icon="swords" />
              <StitchStat label={opponentClan?.name || 'Opponent'} value={warStatus.opponentScore || 0} icon="shield" />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {warStatus.status === 'active' && (
              <StitchButton variant="primary" icon="sports_esports" onClick={() => onJoinBattle?.(warStatus)}>
                Join Battle
              </StitchButton>
            )}
            {warStatus.status === 'completed' && (
              <StitchButton variant="tonal" icon="history" onClick={() => {}}>
                View Results
              </StitchButton>
            )}
          </div>
        </StitchCard>
      )}

      {/* Start War Section */}
      {(!warStatus || warStatus === 'none') && (
        <StitchCard variant="filled" className="p-6">
          <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] mb-4">Start a Clan War</h3>
          <div className="space-y-4">
            <p className="text-[var(--md-sys-color-on-surface-variant)]">
              Challenge another clan to a war. Both clans will select their best players for battle.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StitchCard variant="outlined" className="p-4">
                <h4 className="font-bold text-[var(--md-sys-color-on-surface)] mb-2">Your Clan</h4>
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{clan.name} [{clan.tag}]</p>
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Members: {clan.member_count || 0}</p>
              </StitchCard>
              <StitchCard variant="outlined" className="p-4">
                <h4 className="font-bold text-[var(--md-sys-color-on-surface)] mb-2">Opponent</h4>
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Select from clan list</p>
              </StitchCard>
            </div>
            <StitchButton variant="primary" icon="sports_esports" onClick={() => onStartWar?.()} fullWidth>
              Find Opponent
            </StitchButton>
          </div>
        </StitchCard>
      )}

      {/* War History */}
      <StitchCard variant="filled" className="p-6">
        <h3 className="font-bold text-[var(--md-sys-color-on-surface)] mb-4">War History</h3>
        <div className="text-center py-8 text-[var(--md-sys-color-on-surface-variant)]">
          <span className="material-symbols-outlined text-4xl mb-2 block">history</span>
          <p>No war history yet</p>
        </div>
      </StitchCard>
    </div>
  );
}