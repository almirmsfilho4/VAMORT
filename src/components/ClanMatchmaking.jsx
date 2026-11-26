import React, { useState, useEffect } from 'react';
import { StitchCard, StitchButton, StitchBadge, StitchStat, StitchSectionHeader } from './StitchUI.jsx';
import { getSupabase } from '../supabase.js';
import { createClanWar, startClanWar } from '../services/clanWars.js';

export default function ClanMatchmaking({ clan, onWarStarted }) {
  const [availableClans, setAvailableClans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [isChallenging, setIsChallenging] = useState(false);

  useEffect(() => {
    loadAvailableClans();
  }, [clan]);

  async function loadAvailableClans() {
    const sb = getSupabase();
    if (!sb || !clan) { setIsLoading(false); return; }
    
    try {
      const { data } = await sb
        .from('clans')
        .select('id, name, tag, member_count, total_wins, total_losses')
        .neq('id', clan.id)
        .eq('is_public', true)
        .order('total_wins', { ascending: false })
        .limit(20);
      
      setAvailableClans(data || []);
    } catch (e) {
      console.error('Erro ao carregar clãs:', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleChallenge(opponent) {
    if (!clan) return;
    setIsChallenging(true);
    try {
      const war = await createClanWar(clan.id, opponent.id);
      if (war) {
        await startClanWar(war.id);
        onWarStarted?.(war, opponent);
      }
    } catch (e) {
      console.error('Erro ao desafiar:', e);
    } finally {
      setIsChallenging(false);
    }
  }

  if (!clan) {
    return (
      <StitchCard variant="filled" className="p-8 text-center">
        <span className="material-symbols-outlined text-5xl text-[var(--md-sys-color-on-surface-variant)] mb-4 block">groups</span>
        <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] mb-2">Join a Clan First</h3>
        <p className="text-[var(--md-sys-color-on-surface-variant)]">You need to be in a clan to challenge others.</p>
      </StitchCard>
    );
  }

  if (isLoading) {
    return (
      <StitchCard variant="filled" className="p-8 text-center">
        <span className="material-symbols-outlined text-4xl animate-spin text-[var(--md-sys-color-primary)]">progress_activity</span>
        <p className="text-[var(--md-sys-color-on-surface-variant)] mt-2">Loading clans...</p>
      </StitchCard>
    );
  }

  return (
    <div className="space-y-4">
      <StitchSectionHeader title="Find Opponent" icon="search" subtitle="Challenge another clan to a war" />
      
      {availableClans.length === 0 ? (
        <StitchCard variant="filled" className="p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-[var(--md-sys-color-on-surface-variant)] mb-2 block">search_off</span>
          <p className="text-[var(--md-sys-color-on-surface-variant)]">No clans available to challenge</p>
        </StitchCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableClans.map(opponent => (
            <StitchCard 
              key={opponent.id} 
              variant={selectedOpponent?.id === opponent.id ? 'elevated' : 'filled'} 
              className="p-4 cursor-pointer transition-all"
              onClick={() => setSelectedOpponent(opponent)}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-[var(--md-sys-color-on-surface)]">{opponent.name}</h4>
                  <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">[{opponent.tag}]</p>
                </div>
                <StitchBadge variant="secondary" size="sm">{opponent.member_count || 0} members</StitchBadge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <StitchStat label="Wins" value={opponent.total_wins || 0} icon="emoji_events" />
                <StitchStat label="Losses" value={opponent.total_losses || 0} icon="close" />
              </div>
              
              {selectedOpponent?.id === opponent.id && (
                <StitchButton 
                  variant="primary" 
                  icon="sports_esports" 
                  onClick={() => handleChallenge(opponent)} 
                  disabled={isChallenging}
                  fullWidth
                >
                  {isChallenging ? 'Challenging...' : 'Challenge to War'}
                </StitchButton>
              )}
            </StitchCard>
          ))}
        </div>
      )}
    </div>
  );
}