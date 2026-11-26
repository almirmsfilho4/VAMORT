import React, { useState, useEffect, useCallback } from 'react';
import { SCREENS } from '../data/constants.js';
import StitchLayout from '../components/StitchLayout.jsx';
import { getSupabase, isConfigured } from '../supabase.js';
import { getStitchAsset } from '../data/stitchAssets.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import {
  StitchButton,
  StitchCard,
  StitchBadge,
  StitchDivider,
  StitchStat,
  StitchIconButton,
  StitchModal,
  StitchScrollArea,
  StitchProgress,
  StitchGrid,
} from '../components/StitchUI.jsx';

// Card data for deck preview
import cards from '../data/hv_cards.json';
const CARDS = cards;

function MatchHistoryScreen() {
  const { currentLang, t } = useLanguage();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showReplay, setShowReplay] = useState(false);
  const [replayData, setReplayData] = useState(null);
  const [replayTurn, setReplayTurn] = useState(0);
  const [filter, setFilter] = useState('all'); // all, wins, losses
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  const fetchMatches = useCallback(async (pageNum = 0, append = false) => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }
    try {
      const sb = getSupabase();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { setLoading(false); return; }

      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = sb
        .from('matches')
        .select(`
          *,
          match_players!inner(user_id, player_class, health, deck_ids),
          winner:winner_id(id)
        `)
        .eq('match_players.user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, error } = await query;
      if (error) throw error;

      const processed = (data || []).map(m => {
        const myPlayer = m.match_players.find(p => p.user_id === user.id);
        const oppPlayer = m.match_players.find(p => p.user_id !== user.id);
        const isWin = m.winner_id === user.id;
        return {
          ...m,
          myClass: myPlayer?.player_class,
          oppClass: oppPlayer?.player_class,
          myHealth: myPlayer?.health,
          oppHealth: oppPlayer?.health,
          myDeck: myPlayer?.deck_ids || [],
          isWin,
          duration: m.finished_at && m.started_at 
            ? Math.round((new Date(m.finished_at) - new Date(m.started_at)) / 1000)
            : 0,
        };
      });

      if (append) {
        setMatches(prev => [...prev, ...processed]);
      } else {
        setMatches(processed);
      }
      setHasMore(processed.length === PAGE_SIZE);
    } catch (e) {
      console.error('Match history error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMatches(0, false); }, [fetchMatches]);

  const loadMore = () => { fetchMatches(page + 1, true); setPage(p => p + 1); };

  const filteredMatches = matches.filter(m => {
    if (filter === 'wins') return m.isWin;
    if (filter === 'losses') return !m.isWin;
    return true;
  });

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(currentLang, { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const openReplay = async (match) => {
    setSelectedMatch(match);
    setReplayTurn(0);
    if (match.result_data) {
      setReplayData(match.result_data);
      setShowReplay(true);
    } else if (isConfigured()) {
      // Fetch actions for replay reconstruction
      const sb = getSupabase();
      const { data } = await sb
        .from('match_actions')
        .select('*')
        .eq('match_id', match.id)
        .order('turn_number', { ascending: true });
      setReplayData({ actions: data || [], finalState: null });
      setShowReplay(true);
    }
  };

  const getCardArt = (cardId) => {
    const card = CARDS.find(c => c.id === cardId);
    return card?.art || getStitchAsset('card_back');
  };

  const getClassIcon = (cls) => cls === 'VAMPIRE' ? '🧛' : '⚔️';

  return (
    <StitchLayout currentScreen={SCREENS.MATCH_HISTORY}>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-[var(--md-sys-color-on-surface)]">
              {t('matchHistory.title')}
            </h1>
            <p className="text-[var(--md-sys-color-on-surface-variant)] mt-1">
              {t('matchHistory.subtitle')}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'wins', 'losses'].map(f => (
              <StitchButton
                key={f}
                variant={filter === f ? 'primary' : 'surface'}
                size="sm"
                onClick={() => { setFilter(f); setPage(0); fetchMatches(0, false); }}
              >
                {t(`matchHistory.filter.${f}`)}
              </StitchButton>
            ))}
          </div>
        </header>

        {/* Stats Summary */}
        <StitchGrid columns={3} className="gap-4">
          <StitchCard className="p-4">
            <StitchStat 
              label={t('matchHistory.stats.total')} 
              value={matches.length} 
              icon="history" 
            />
          </StitchCard>
          <StitchCard className="p-4">
            <StitchStat 
              label={t('matchHistory.stats.wins')} 
              value={matches.filter(m => m.isWin).length} 
              icon="check_circle" 
              valueColor="var(--md-sys-color-success)"
            />
          </StitchCard>
          <StitchCard className="p-4">
            <StitchStat 
              label={t('matchHistory.stats.winrate')} 
              value={`${(matches.length > 0 ? Math.round((matches.filter(m => m.isWin).length / matches.length) * 100) : 0)}%`} 
              icon="trending_up" 
              valueColor="var(--md-sys-color-primary)"
            />
          </StitchCard>
        </StitchGrid>

        {/* Match List */}
        <StitchCard className="overflow-hidden">
          {loading && matches.length === 0 ? (
            <div className="p-12 text-center">
              <div className="stitch-spinner mx-auto mb-4" style={{ width: 40, height: 40 }} />
              <p className="text-[var(--md-sys-color-on-surface-variant)]">{t('matchHistory.loading')}</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-6xl text-[var(--md-sys-color-on-surface-variant)]">history</span>
              <h3 className="font-serif text-xl mt-4 text-[var(--md-sys-color-on-surface)]">{t('matchHistory.empty')}</h3>
              <p className="text-[var(--md-sys-color-on-surface-variant)] mt-2">{t('matchHistory.emptyDesc')}</p>
              <StitchButton variant="primary" onClick={() => window.location.hash = '#/arena'} className="mt-4">
                {t('matchHistory.goToArena')}
              </StitchButton>
            </div>
          ) : (
            <>
              <StitchScrollArea className="max-h-[60vh]">
                <div className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                  {filteredMatches.map((match, idx) => (
                    <button
                      key={match.id}
                      onClick={() => openReplay(match)}
                      className="w-full p-4 md:p-5 hover:bg-[var(--md-sys-color-surface-container)] transition-colors text-left flex flex-col md:flex-row md:items-center gap-4"
                    >
                      {/* Result Badge */}
                      <div className="flex items-center gap-3 min-w-[100px]">
                        <StitchBadge 
                          variant={match.isWin ? 'success' : 'error'} 
                          size="lg"
                          icon={match.isWin ? 'check_circle' : 'cancel'}
                        >
                          {match.isWin ? t('matchHistory.victory') : t('matchHistory.defeat')}
                        </StitchBadge>
                      </div>

                      {/* Match Info */}
                      <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-2xl">{getClassIcon(match.myClass)}</span>
                          <span className="font-medium text-[var(--md-sys-color-on-surface)]">
                            {t(`factions.${match.myClass?.toLowerCase()}`)}
                          </span>
                          <StitchDivider orientation="vertical" className="h-5 mx-1" />
                          <span className="text-2xl">{getClassIcon(match.oppClass)}</span>
                          <span className="font-medium text-[var(--md-sys-color-on-surface-variant)]">
                            {t(`factions.${match.oppClass?.toLowerCase()}`)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[var(--md-sys-color-on-surface-variant)] flex-wrap">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-base">schedule</span>
                            {formatDuration(match.duration)}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-base">sync</span>
                            {match.turn_number} {t('matchHistory.turns')}
                          </span>
                          <span>{formatDate(match.created_at)}</span>
                        </div>
                      </div>

                      {/* Deck Preview */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0" aria-label={t('matchHistory.deckPreview')}>
                        {match.myDeck.slice(0, 5).map((cardId, i) => (
                          <img
                            key={`${cardId}-${i}`}
                            src={getCardArt(cardId)}
                            alt=""
                            className="w-10 h-10 md:w-12 md:h-12 rounded border border-[var(--md-sys-color-outline-variant)] object-cover"
                            style={{ marginLeft: i > 0 ? '-8px' : 0, zIndex: 5 - i }}
                          />
                        ))}
                        {match.myDeck.length > 5 && (
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] flex items-center justify-center text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] ml-[-8px]">
                            +{match.myDeck.length - 5}
                          </div>
                        )}
                      </div>

                      <StitchIconButton icon="replay" size="sm" className="ml-auto flex-shrink-0" aria-label={t('matchHistory.watchReplay')} onClick={() => { window.location.hash = `replay/${match.id}`; }} />
                    </button>
                  ))}
                </div>
              </StitchScrollArea>

              {/* Load More */}
              {hasMore && (
                <div className="p-4 border-t border-[var(--md-sys-color-outline-variant)]">
                  <StitchButton 
                    variant="surface" 
                    fullWidth 
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? t('matchHistory.loadingMore') : t('matchHistory.loadMore')}
                  </StitchButton>
                </div>
              )}
            </>
          )}
        </StitchCard>
      </div>

      {/* Replay Modal */}
      {showReplay && selectedMatch && (
        <ReplayModal
          match={selectedMatch}
          replayData={replayData}
          currentTurn={replayTurn}
          onTurnChange={setReplayTurn}
          onClose={() => { setShowReplay(false); setSelectedMatch(null); setReplayData(null); }}
        />
      )}
    </StitchLayout>
  );
}

// Replay Modal Component
function ReplayModal({ match, replayData, currentTurn, onTurnChange, onClose }) {
  const { currentLang, t } = useLanguage();
  const [playing, setPlaying] = useState(false);
  const maxTurn = replayData?.actions 
    ? Math.max(...replayData.actions.map(a => a.turn_number), 0) 
    : match.turn_number;

  const actionsByTurn = replayData?.actions?.reduce((acc, a) => {
    if (!acc[a.turn_number]) acc[a.turn_number] = [];
    acc[a.turn_number].push(a);
    return acc;
  }, {}) || {};

  const formatAction = (action) => {
    const typeLabels = {
      play_card: 'matchHistory.action.playCard',
      attack: 'matchHistory.action.attack',
      end_turn: 'matchHistory.action.endTurn',
      use_ability: 'matchHistory.action.useAbility',
      concede: 'matchHistory.action.concede',
      emote: 'matchHistory.action.emote',
    };
    return t(typeLabels[action.action_type] || action.action_type);
  };

  return (
    <StitchModal 
      open={true} 
      onClose={onClose} 
      maxWidth="xl"
      className="max-h-[90vh]"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{match.isWin ? '🏆' : '💀'}</span>
            <div>
              <h2 className="font-serif text-xl font-bold">{t('matchHistory.replayTitle')}</h2>
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                {t('matchHistory.replaySubtitle', { turns: maxTurn, duration: formatDuration(match.duration) })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StitchButton variant="surface" size="sm" onClick={() => { setPlaying(false); onTurnChange(0); }} disabled={currentTurn === 0}>
              <span className="material-symbols-outlined">first_page</span>
            </StitchButton>
            <StitchButton variant="surface" size="sm" onClick={() => { setPlaying(false); onTurnChange(Math.max(0, currentTurn - 1)); }} disabled={currentTurn === 0}>
              <span className="material-symbols-outlined">chevron_left</span>
            </StitchButton>
            <StitchButton 
              variant={playing ? 'error' : 'primary'} 
              size="sm" 
              onClick={() => setPlaying(!playing)}
            >
              <span className="material-symbols-outlined">{playing ? 'pause' : 'play_arrow'}</span>
            </StitchButton>
            <StitchButton variant="surface" size="sm" onClick={() => { setPlaying(false); onTurnChange(Math.min(maxTurn, currentTurn + 1)); }} disabled={currentTurn >= maxTurn}>
              <span className="material-symbols-outlined">chevron_right</span>
            </StitchButton>
            <StitchButton variant="surface" size="sm" onClick={() => { setPlaying(false); onTurnChange(maxTurn); }} disabled={currentTurn >= maxTurn}>
              <span className="material-symbols-outlined">last_page</span>
            </StitchButton>
          </div>
        </div>

        {/* Turn Slider */}
        <div className="p-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <div className="flex items-center gap-3">
            <span className="font-medium min-w-[80px]">{t('matchHistory.turn')}: {currentTurn}/{maxTurn}</span>
            <input
              type="range"
              min={0}
              max={maxTurn}
              value={currentTurn}
              onChange={(e) => { setPlaying(false); onTurnChange(parseInt(e.target.value)); }}
              className="flex-1"
              style={{ accentColor: 'var(--md-sys-color-primary)' }}
            />
          </div>
        </div>

        {/* Replay Content */}
        <StitchScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {/* Player Info */}
            <StitchGrid columns={2} className="gap-4">
              <StitchCard className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{match.isWin ? '🏆' : '💀'}</span>
                  <h3 className="font-serif text-lg font-semibold">{t('matchHistory.you')}</h3>
                </div>
                <p className="text-[var(--md-sys-color-on-surface-variant)]">
                  {t(`factions.${match.myClass?.toLowerCase()}`)} • {match.myDeck?.length || 0} cartas
                </p>
              </StitchCard>
              <StitchCard className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{match.oppClass === 'VAMPIRE' ? '🧛' : '⚔️'}</span>
                  <h3 className="font-serif text-lg font-semibold">{t('matchHistory.opponent')}</h3>
                </div>
                <p className="text-[var(--md-sys-color-on-surface-variant)]">
                  {t(`factions.${match.oppClass?.toLowerCase()}`)}
                </p>
              </StitchCard>
            </StitchGrid>

            {/* Turn Log */}
            <h3 className="font-serif text-lg font-semibold text-[var(--md-sys-color-primary)] mb-2">
              {t('matchHistory.turnLog')}
            </h3>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {Array.from({ length: maxTurn + 1 }, (_, i) => i).map(turn => {
                const turnActions = actionsByTurn[turn] || [];
                return (
                  <StitchCard key={turn} variant="surface" className={`p-3 ${currentTurn === turn ? 'ring-2 ring-[var(--md-sys-color-primary)]' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-[var(--md-sys-color-on-surface)]">
                        {t('matchHistory.turn')} {turn}
                      </h4>
                      {turnActions.length > 0 && (
                        <StitchBadge variant="surface" size="sm">
                          {turnActions.length} {t('matchHistory.actions')}
                        </StitchBadge>
                      )}
                    </div>
                    {turnActions.length === 0 ? (
                      <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] italic">
                        {t('matchHistory.noActions')}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {turnActions.map((action, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-[var(--md-sys-color-surface-container-low)] rounded">
                            <span className="material-symbols-outlined text-[var(--md-sys-color-primary)] text-base">bolt</span>
                            <span className="font-medium">{action.user_id === match.match_players?.find(p => p.user_id === action.user_id)?.user_id ? t('matchHistory.you') : t('matchHistory.opponent')}</span>
                            <span className="text-[var(--md-sys-color-on-surface-variant)]">{formatAction(action)}</span>
                            {action.action_data?.card_id && (
                              <span className="text-[var(--md-sys-color-on-surface-variant)] italic">
                                {CARDS.find(c => c.id === action.action_data.card_id)?.name || action.action_data.card_id}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </StitchCard>
                );
              })}
            </div>
          </div>
        </StitchScrollArea>
      </div>
    </StitchModal>
  );
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default MatchHistoryScreen;