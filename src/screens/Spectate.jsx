import React, { useState, useEffect, useMemo } from 'react';
import StitchLayout from '../components/StitchLayout.jsx';
import { SCREENS } from '../data/constants.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStitchAsset } from '../data/stitchAssets.js';
import {
  StitchButton,
  StitchCard,
  StitchSectionHeader,
  StitchGrid,
  StitchBadge,
  StitchStat,
  StitchDivider,
  StitchIconButton,
  StitchAvatar,
} from '../components/StitchUI.jsx';
import { getSupabase } from '../supabase.js';

const REFRESH_INTERVAL = 15000;

export default function Spectate({ go, user, stats }) {
  const { t, lang } = useLanguage();
  const [liveMatches, setLiveMatches] = useState([]);
  const [recentReplays, setRecentReplays] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadMatches();
    const interval = setInterval(() => {
      if (autoRefresh) loadMatches();
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  async function loadMatches() {
    const sb = getSupabase();
    if (!sb) {
      setIsLoading(false);
      return;
    }
    try {
      const { data: live } = await sb
        .from('matches')
        .select(`
          id, status, turn, created_at, updated_at,
          match_players!inner(user_id, hero_class, deck_ids, is_turn),
          profiles:match_players!inner(user_id, display_name, avatar_url)
        `)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(20);

      const { data: replays } = await sb
        .from('matches')
        .select(`
          id, status, turn, duration_seconds, winner_id, created_at,
          match_players!inner(user_id, hero_class, deck_ids),
          profiles:match_players!inner(user_id, display_name, avatar_url)
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(30);

      setLiveMatches(live || []);
      setRecentReplays(replays || []);
    } catch (e) {
      console.error('Erro ao carregar partidas:', e);
    } finally {
      setIsLoading(false);
    }
  }

  function formatDuration(seconds) {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function getHeroName(classKey) {
    const names = {
      VAMPIRE: t('faction.vampire'),
      HUNTER: t('faction.hunter'),
      HUMAN: t('faction.human'),
    };
    return names[classKey] || classKey;
  }

  function getPlayerInfo(match, index) {
    const players = match.match_players || [];
    const player = players[index];
    if (!player) return { name: '—', class: '—', avatar: null };
    const profile = player.profiles?.[0] || {};
    return {
      name: profile.display_name || `Player ${index + 1}`,
      class: getHeroName(player.hero_class),
      avatar: profile.avatar_url,
      deckCount: player.deck_ids?.length || 0,
    };
  }

  const filteredReplays = useMemo(() => {
    if (filter === 'all') return recentReplays;
    if (filter === 'wins') return recentReplays.filter(m => m.winner_id === user?.id);
    if (filter === 'losses') return recentReplays.filter(m => m.winner_id && m.winner_id !== user?.id);
    return recentReplays;
  }, [recentReplays, filter, user?.id]);

  if (selectedMatch) {
    return (
      <StitchLayout
        currentScreen={SCREENS.Spectate}
        go={go}
        user={user}
        stats={stats}
        leftSidebarOpen={false}
      >
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <StitchButton variant="ghost" size="sm" onClick={() => setSelectedMatch(null)} className="mb-4">
              <span className="material-symbols-outlined mr-2">arrow_back</span>
              {t('spectate.backToList')}
            </StitchButton>

            <StitchCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">
                    {t('spectate.watching')} #{selectedMatch.id.slice(0, 8)}
                  </h2>
                  <p className="text-[var(--md-sys-color-on-surface-variant)] text-sm">
                    {t('spectate.turn')} {selectedMatch.turn} • {t('spectate.status')}: {selectedMatch.status === 'active' ? t('spectate.live') : t('spectate.replay')}
                  </p>
                </div>
                <StitchBadge variant={selectedMatch.status === 'active' ? 'primary' : 'outline'}>
                  {selectedMatch.status === 'active' ? t('spectate.live') : t('spectate.replay')}
                </StitchBadge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedMatch.match_players?.map((p, i) => {
                  const info = getPlayerInfo(selectedMatch, i);
                  const isTurn = p.is_turn;
                  return (
                    <StitchCard key={p.user_id} variant={isTurn ? 'elevated' : 'filled'} className={isTurn ? 'ring-2 ring-[var(--md-sys-color-primary)] animate-pulse' : ''}>
                      <div className="flex items-center gap-3">
                        <StitchAvatar src={info.avatar} size="lg" fallback={info.name[0]} />
                        <div>
                          <p className="font-semibold text-[var(--md-sys-color-on-surface)]">{info.name}</p>
                          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{info.class}</p>
                          {isTurn && <StitchBadge variant="primary" size="sm">{t('spectate.yourTurn')}</StitchBadge>}
                        </div>
                      </div>
                    </StitchCard>
                  );
                })}
              </div>

              <div className="space-y-3">
                <StitchButton
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    if (selectedMatch.status === 'active') {
                      go(SCREENS.PvPBattle, { matchId: selectedMatch.id, spectate: true });
                    } else {
                      window.location.hash = `replay/${selectedMatch.id}`;
                    }
                  }}
                  icon="visibility"
                >
                  {selectedMatch.status === 'active' ? t('spectate.joinLive') : t('spectate.watchReplay')}
                </StitchButton>
                <StitchButton
                  variant="outline"
                  fullWidth
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}#spectate=${selectedMatch.id}`)}
                  icon="content_copy"
                >
                  {t('spectate.copyLink')}
                </StitchButton>
              </div>
            </StitchCard>
          </div>
        </div>
      </StitchLayout>
    );
  }

  return (
    <StitchLayout
      currentScreen={SCREENS.Spectate}
      go={go}
      user={user}
      stats={stats}
      leftSidebarOpen={false}
    >
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[var(--md-sys-color-on-surface)]">{t('spectate.title')}</h1>
              <p className="text-[var(--md-sys-color-on-surface-variant)] mt-1">{t('spectate.subtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StitchButton variant={autoRefresh ? 'primary' : 'outline'} onClick={() => setAutoRefresh(!autoRefresh)} icon={autoRefresh ? 'autorenew' : 'autorenew_off'}>
                {autoRefresh ? t('spectate.autoRefreshOn') : t('spectate.autoRefreshOff')}
              </StitchButton>
              <StitchButton variant="outline" onClick={loadMatches} icon="refresh" disabled={isLoading}>
                {t('common.refresh')}
              </StitchButton>
            </div>
          </div>

          {/* Live Matches */}
          <StitchSectionHeader
            title={t('spectate.liveMatches')}
            subtitle={t('spectate.liveMatchesDesc', { count: liveMatches.length })}
            action={
              <StitchBadge variant="primary" className="animate-pulse">
                <span className="relative flex items-center">
                  <span className="w-2 h-2 bg-[var(--md-sys-color-on-primary)] rounded-full mr-2 animate-pulse"></span>
                  {t('spectate.live')}
                </span>
              </StitchBadge>
            }
          />

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {[1, 2, 3].map(i => (
                <StitchCard key={i} variant="filled" className="animate-pulse h-40" />
              ))}
            </div>
          ) : liveMatches.length === 0 ? (
            <StitchCard variant="filled" className="p-8 text-center mb-8">
              <span className="material-symbols-outlined text-5xl text-[var(--md-sys-color-on-surface-variant)] mb-4 block">tv_off</span>
              <p className="text-[var(--md-sys-color-on-surface-variant)]">{t('spectate.noLiveMatches')}</p>
              <StitchButton variant="primary" onClick={() => go(SCREENS.Lobby)} className="mt-4" icon="sports_esports">
                {t('spectate.goPlay')}
              </StitchButton>
            </StitchCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {liveMatches.map(match => {
                const p1 = getPlayerInfo(match, 0);
                const p2 = getPlayerInfo(match, 1);
                return (
                  <StitchCard
                    key={match.id}
                    variant="elevated"
                    className="hover:shadow-lg transition-shadow cursor-pointer animate-card-enter"
                    onClick={() => setSelectedMatch(match)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <StitchBadge variant="primary" size="sm">{t('spectate.live')}</StitchBadge>
                      <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                        Turno {match.turn}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-[var(--md-sys-color-surface-container)] rounded-lg">
                        <StitchAvatar src={p1.avatar} size="sm" fallback={p1.name[0]} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--md-sys-color-on-surface)] truncate">{p1.name}</p>
                          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{p1.class}</p>
                        </div>
                        {match.match_players?.[0]?.is_turn && <StitchBadge variant="primary" size="sm">{t('spectate.acting')}</StitchBadge>}
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-[var(--md-sys-color-surface-container)] rounded-lg">
                        <StitchAvatar src={p2.avatar} size="sm" fallback={p2.name[0]} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--md-sys-color-on-surface)] truncate">{p2.name}</p>
                          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{p2.class}</p>
                        </div>
                        {match.match_players?.[1]?.is_turn && <StitchBadge variant="primary" size="sm">{t('spectate.acting')}</StitchBadge>}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
                      <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                        {new Date(match.updated_at).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <StitchIconButton
                        onClick={(e) => { e.stopPropagation(); setSelectedMatch(match); }}
                        icon="visibility"
                        aria-label={t('spectate.watch')}
                      />
                    </div>
                  </StitchCard>
                );
              })}
            </div>
          )}

          {/* Replays */}
          <StitchSectionHeader
            title={t('spectate.recentReplays')}
            subtitle={t('spectate.recentReplaysDesc', { count: filteredReplays.length })}
            action={
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="stitch-select"
                aria-label={t('spectate.filter')}
              >
                <option value="all">{t('spectate.filterAll')}</option>
                <option value="wins">{t('spectate.filterWins')}</option>
                <option value="losses">{t('spectate.filterLosses')}</option>
              </select>
            }
          />

          {filteredReplays.length === 0 ? (
            <StitchCard variant="filled" className="p-8 text-center">
              <span className="material-symbols-outlined text-5xl text-[var(--md-sys-color-on-surface-variant)] mb-4 block">history</span>
              <p className="text-[var(--md-sys-color-on-surface-variant)]">{t('spectate.noReplays')}</p>
            </StitchCard>
          ) : (
            <div className="space-y-3">
              {filteredReplays.map(match => {
                const p1 = getPlayerInfo(match, 0);
                const p2 = getPlayerInfo(match, 1);
                const isWinner = match.winner_id === user?.id;
                const isPlayer1 = match.match_players?.[0]?.user_id === user?.id;
                const myResult = user ? (match.winner_id === user.id ? 'win' : match.winner_id ? 'loss' : 'draw') : null;
                return (
                  <StitchCard
                    key={match.id}
                    variant="filled"
                    className="hover:shadow-md transition-shadow cursor-pointer animate-card-enter"
                    onClick={() => setSelectedMatch(match)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <StitchAvatar src={p1.avatar} size="md" fallback={p1.name[0]} />
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--md-sys-color-on-surface)] truncate">{p1.name}</p>
                          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{p1.class} • {p1.deckCount} cartas</p>
                        </div>
                        <StitchDivider orientation="vertical" className="mx-2 h-8" />
                        <StitchAvatar src={p2.avatar} size="md" fallback={p2.name[0]} />
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--md-sys-color-on-surface)] truncate">{p2.name}</p>
                          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{p2.class} • {p2.deckCount} cartas</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <StitchBadge variant={myResult === 'win' ? 'success' : myResult === 'loss' ? 'error' : 'outline'}>
                          {myResult === 'win' ? t('matchHistory.victory') : myResult === 'loss' ? t('matchHistory.defeat') : t('spectate.completed')}
                        </StitchBadge>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                            {formatDuration(match.duration_seconds)} • {match.turn} {t('matchHistory.turns')}
                          </p>
                          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                            {new Date(match.created_at).toLocaleDateString(lang, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <StitchIconButton
                          icon="visibility"
                          aria-label={t('spectate.watchReplay')}
                          onClick={() => { window.location.hash = `replay/${match.id}`; }}
                        />
                      </div>
                    </div>
                  </StitchCard>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StitchLayout>
  );
}