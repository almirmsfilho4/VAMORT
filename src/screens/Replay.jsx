import React, { useState, useEffect, useMemo, useRef } from 'react';
import StitchLayout from '../components/StitchLayout.jsx';
import { SCREENS } from '../data/constants.js';
import cards from '../data/hv_cards.json';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getSupabase } from '../supabase.js';
import {
  StitchButton,
  StitchCard,
  StitchSectionHeader,
  StitchGrid,
  StitchBadge,
  StitchIconButton,
  StitchScrollArea,
  StitchModal,
  StitchProgress,
  StitchDivider,
  StitchTooltip,
} from '../components/StitchUI.jsx';

const FACTION_ICONS = { VAMPIRE: '🧛', HUMAN: '⚔️', NEUTRAL: '✨' };
const FACTION_COLORS = { VAMPIRE: '#e6194b', HUMAN: '#fabc4d', NEUTRAL: '#6E9ECC' };
const ACTION_ICONS = {
  play_card: 'style',
  attack: 'sports_mma',
  end_turn: 'skip_next',
  use_ability: 'auto_awesome',
  concede: 'flag',
  emote: 'emoji_emotions',
};

function getCard(id) {
  return cards.find(c => c.id === id);
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getShareUrl(matchId, turn) {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/#replay/${matchId}${turn !== undefined ? `?turn=${turn}` : ''}`;
}

export default function ReplayScreen({ go, user, stats }) {
  const { t, lang } = useLanguage();
  const [match, setMatch] = useState(null);
  const [matchPlayers, setMatchPlayers] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const playIntervalRef = useRef(null);

  // Parse matchId and turn from URL hash
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    let matchId = null;
    let turn = 0;
    
    if (hash.startsWith('replay/')) {
      const parts = hash.replace('replay/', '').split('?');
      matchId = parts[0];
      if (parts[1]) {
        const params = new URLSearchParams(parts[1]);
        turn = parseInt(params.get('turn') || '0', 10);
      }
    } else if (hash.startsWith('replay?')) {
      const params = new URLSearchParams(hash.replace('replay?', ''));
      matchId = params.get('matchId');
      turn = parseInt(params.get('turn') || '0', 10);
    }
    
    if (matchId) {
      setCurrentTurn(turn);
      fetchReplay(matchId);
    } else {
      setError('No match ID in URL');
      setLoading(false);
    }
  }, []);

  async function fetchReplay(matchId) {
    setLoading(true);
    setError(null);
    const sb = getSupabase();
    if (!sb) {
      setError('Supabase not configured');
      setLoading(false);
      return;
    }

    try {
      const [matchRes, playersRes, actionsRes] = await Promise.all([
        sb.from('matches').select('*').eq('id', matchId).single(),
        sb.from('match_players').select('*').eq('match_id', matchId),
        sb.from('match_actions').select('*').eq('match_id', matchId).order('turn_number', { ascending: true }).order('created_at', { ascending: true }),
      ]);

      if (matchRes.error) throw matchRes.error;
      if (playersRes.error) throw playersRes.error;
      if (actionsRes.error) throw actionsRes.error;

      setMatch(matchRes.data);
      setMatchPlayers(playersRes.data || []);
      setActions(actionsRes.data || []);
    } catch (e) {
      console.error('Failed to load replay:', e);
      setError(e.message || 'Failed to load replay');
    } finally {
      setLoading(false);
    }
  }

  const maxTurn = useMemo(() => {
    if (actions.length === 0) return match?.turn_number || 0;
    return Math.max(...actions.map(a => a.turn_number), 0);
  }, [actions, match]);

  const actionsByTurn = useMemo(() => {
    return actions.reduce((acc, a) => {
      if (!acc[a.turn_number]) acc[a.turn_number] = [];
      acc[a.turn_number].push(a);
      return acc;
    }, {});
  }, [actions]);

  const myPlayer = useMemo(() => matchPlayers.find(p => p.user_id === user?.id), [matchPlayers, user]);
  const oppPlayer = useMemo(() => matchPlayers.find(p => p.user_id !== user?.id), [matchPlayers, user]);
  const isWin = myPlayer?.health > 0 && oppPlayer?.health <= 0;

  useEffect(() => {
    if (playing) {
      playIntervalRef.current = setInterval(() => {
        setCurrentTurn(prev => {
          if (prev >= maxTurn) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000 / playSpeed);
    } else {
      clearInterval(playIntervalRef.current);
    }
    return () => clearInterval(playIntervalRef.current);
  }, [playing, maxTurn, playSpeed]);

  function handleTurnChange(turn) {
    setPlaying(false);
    setCurrentTurn(Math.max(0, Math.min(maxTurn, turn)));
  }

  function copyShareLink() {
    const hash = window.location.hash.slice(1);
    let matchId = null;
    if (hash.startsWith('replay/')) {
      matchId = hash.replace('replay/', '').split('?')[0];
    } else if (hash.startsWith('replay?')) {
      const params = new URLSearchParams(hash.replace('replay?', ''));
      matchId = params.get('matchId');
    }
    if (matchId) {
      const url = getShareUrl(matchId, currentTurn);
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function formatAction(action) {
    const typeLabels = {
      play_card: t('replay.action.playCard'),
      attack: t('replay.action.attack'),
      end_turn: t('replay.action.endTurn'),
      use_ability: t('replay.action.useAbility'),
      concede: t('replay.action.concede'),
      emote: t('replay.action.emote'),
    };
    return typeLabels[action.action_type] || action.action_type;
  }

  function getActionPlayer(action) {
    return action.user_id === myPlayer?.user_id ? t('replay.you') : t('replay.opponent');
  }

  function getPlayerClass(player) {
    return player?.player_class || 'NEUTRAL';
  }

  function reconstructBoardState(upToTurn) {
    if (!myPlayer || !oppPlayer) return { myBoard: [], oppBoard: [], myHand: [], oppHand: [], myHealth: 30, oppHealth: 30, myMana: 0, oppMana: 0, myMaxMana: 0, oppMaxMana: 0, myGraveyard: [], oppGraveyard: [] };
    
    let myHealth = myPlayer.health || 30;
    let oppHealth = oppPlayer.health || 30;
    let myMana = 0, oppMana = 0;
    let myMaxMana = 0, oppMaxMana = 0;
    let myBoard = [], oppBoard = [];
    let myHand = [...(myPlayer.hand || [])];
    let oppHand = [...(oppPlayer.hand || [])];
    let myGraveyard = [...(myPlayer.graveyard || [])];
    let oppGraveyard = [...(oppPlayer.graveyard || [])];

    for (let t = 0; t <= upToTurn; t++) {
      const turnActions = actionsByTurn[t] || [];
      for (const action of turnActions) {
        const isMe = action.user_id === myPlayer.user_id;
        
        switch (action.action_type) {
          case 'play_card':
            if (action.action_data?.card_id) {
              const card = getCard(action.action_data.card_id);
              if (card) {
                if (isMe) {
                  myHand = myHand.filter(id => id !== action.action_data.card_id);
                  if (card.type === 'MINION') myBoard.push({ ...card, instanceId: action.action_data.instanceId });
                } else {
                  oppHand = oppHand.filter(id => id !== action.action_data.card_id);
                  if (card.type === 'MINION') oppBoard.push({ ...card, instanceId: action.action_data.instanceId });
                }
              }
            }
            break;
          case 'attack':
            if (action.action_data?.target_id) {
              if (isMe) {
                const target = oppBoard.find(m => m.instanceId === action.action_data.target_id);
                if (target) {
                  const attacker = myBoard.find(m => m.instanceId === action.action_data.attacker_id);
                  if (attacker) target.health = (target.health || target.hp || 1) - (attacker.atk || attacker.attack || 0);
                  if ((target.health || target.hp || 1) <= 0) oppBoard = oppBoard.filter(m => m.instanceId !== action.action_data.target_id);
                } else {
                  oppHealth -= (action.action_data.damage || 0);
                }
              } else {
                const target = myBoard.find(m => m.instanceId === action.action_data.target_id);
                if (target) {
                  const attacker = oppBoard.find(m => m.instanceId === action.action_data.attacker_id);
                  if (attacker) target.health = (target.health || target.hp || 1) - (attacker.atk || attacker.attack || 0);
                  if ((target.health || target.hp || 1) <= 0) myBoard = myBoard.filter(m => m.instanceId !== action.action_data.target_id);
                } else {
                  myHealth -= (action.action_data.damage || 0);
                }
              }
            }
            break;
          case 'end_turn':
            if (isMe) {
              myMaxMana = Math.min(10, myMaxMana + 1);
              myMana = myMaxMana;
            } else {
              oppMaxMana = Math.min(10, oppMaxMana + 1);
              oppMana = oppMaxMana;
            }
            break;
        }
      }
    }

    return { myBoard, oppBoard, myHand, oppHand, myHealth: Math.max(0, myHealth), oppHealth: Math.max(0, oppHealth), myMana, oppMana, myMaxMana, oppMaxMana, myGraveyard, oppGraveyard };
  }

  const boardState = useMemo(() => reconstructBoardState(currentTurn), [currentTurn, actionsByTurn, myPlayer, oppPlayer]);
  const currentTurnActions = actionsByTurn[currentTurn] || [];

  if (loading) {
    return (
      <StitchLayout currentScreen={SCREENS.Replay} go={go} user={user} stats={stats} leftSidebarOpen={false}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-6xl mb-4" style={{ color: 'var(--md-sys-color-primary)' }}>🔄</div>
            <p className="text-[var(--md-sys-color-on-surface-variant)]">{t('replay.loading')}</p>
          </div>
        </div>
      </StitchLayout>
    );
  }

  if (error) {
    return (
      <StitchLayout currentScreen={SCREENS.Replay} go={go} user={user} stats={stats} leftSidebarOpen={false}>
        <div className="flex-1 flex items-center justify-center">
          <StitchCard variant="elevated" className="max-w-md p-8 text-center">
            <span className="text-6xl mb-4 block">⚠️</span>
            <h2 className="font-serif text-xl font-bold text-[var(--md-sys-color-error)] mb-2">{t('replay.errorTitle')}</h2>
            <p className="text-[var(--md-sys-color-on-surface-variant)] mb-6">{error}</p>
            <StitchButton variant="filled" icon="arrow_back" onClick={() => go(SCREENS.MatchHistory)}>
              {t('replay.backToHistory')}
            </StitchButton>
          </StitchCard>
        </div>
      </StitchLayout>
    );
  }

  if (!match) {
    return null;
  }

  return (
    <StitchLayout currentScreen={SCREENS.Replay} go={go} user={user} stats={stats} leftSidebarOpen={false}>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <StitchIconButton icon="arrow_back" onClick={() => go(SCREENS.MatchHistory)} aria-label={t('common.back')} />
              <div>
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-[var(--md-sys-color-on-surface)]">{t('replay.title')}</h1>
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{t('replay.matchId', { id: match.id.slice(0, 8) })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StitchTooltip label={t('replay.shareTooltip')}>
                <StitchButton variant="outline" icon="share" onClick={() => setShowShare(true)}>
                  {t('replay.share')}
                </StitchButton>
              </StitchTooltip>
              <StitchTooltip label={t('replay.copyLinkTooltip')}>
                <StitchButton variant="tonal" icon="content_copy" onClick={copyShareLink}>
                  {copied ? t('replay.copied') : t('replay.copyLink')}
                </StitchButton>
              </StitchTooltip>
            </div>
          </div>

          {/* Match Summary */}
          <StitchGrid columns={{ base: 1, md: 3 }} gap={4} className="mb-6">
            <StitchCard variant="elevated" className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{isWin ? '🏆' : '💀'}</span>
                <div>
                  <h3 className="font-semibold text-[var(--md-sys-color-on-surface)]">{isWin ? t('replay.victory') : t('replay.defeat')}</h3>
                  <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{t('replay.mode', { mode: t(`replay.mode.${match.mode}`) })}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">{t('replay.duration')}</span>
                <span className="font-mono font-bold">{formatDuration(match.duration || 0)}</span>
              </div>
            </StitchCard>

            <StitchCard variant="elevated" className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl" style={{ color: FACTION_COLORS[getPlayerClass(myPlayer)] }}>{FACTION_ICONS[getPlayerClass(myPlayer)]}</span>
                <div>
                  <h3 className="font-semibold text-[var(--md-sys-color-on-surface)]">{t('replay.you')}</h3>
                  <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{t(`factions.${getPlayerClass(myPlayer).toLowerCase()}`)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg" style={{ background: 'var(--md-sys-color-primary)/10' }}>
                  <div className="font-bold text-lg text-[var(--md-sys-color-primary)]">{boardState.myHealth}</div>
                  <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{t('replay.health')}</div>
                </div>
                <div className="p-2 rounded-lg" style={{ background: 'var(--md-sys-color-secondary)/10' }}>
                  <div className="font-bold text-lg text-[var(--md-sys-color-secondary)]">{boardState.myMana}/{boardState.myMaxMana}</div>
                  <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{t('replay.mana')}</div>
                </div>
                <div className="p-2 rounded-lg" style={{ background: 'var(--md-sys-color-tertiary)/10' }}>
                  <div className="font-bold text-lg text-[var(--md-sys-color-tertiary)]">{boardState.myBoard.length}</div>
                  <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{t('replay.minions')}</div>
                </div>
              </div>
            </StitchCard>

            <StitchCard variant="elevated" className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl" style={{ color: FACTION_COLORS[getPlayerClass(oppPlayer)] }}>{FACTION_ICONS[getPlayerClass(oppPlayer)]}</span>
                <div>
                  <h3 className="font-semibold text-[var(--md-sys-color-on-surface)]">{t('replay.opponent')}</h3>
                  <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{t(`factions.${getPlayerClass(oppPlayer).toLowerCase()}`)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg" style={{ background: 'var(--md-sys-color-error)/10' }}>
                  <div className="font-bold text-lg text-[var(--md-sys-color-error)]">{boardState.oppHealth}</div>
                  <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{t('replay.health')}</div>
                </div>
                <div className="p-2 rounded-lg" style={{ background: 'var(--md-sys-color-secondary)/10' }}>
                  <div className="font-bold text-lg text-[var(--md-sys-color-secondary)]">{boardState.oppMana}/{boardState.oppMaxMana}</div>
                  <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{t('replay.mana')}</div>
                </div>
                <div className="p-2 rounded-lg" style={{ background: 'var(--md-sys-color-tertiary)/10' }}>
                  <div className="font-bold text-lg text-[var(--md-sys-color-tertiary)]">{boardState.oppBoard.length}</div>
                  <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{t('replay.minions')}</div>
                </div>
              </div>
            </StitchCard>
          </StitchGrid>

          {/* Playback Controls */}
          <StitchCard variant="elevated" className="p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <StitchButton variant="surface" size="sm" icon="first_page" onClick={() => handleTurnChange(0)} disabled={currentTurn === 0} />
                <StitchButton variant="surface" size="sm" icon="chevron_left" onClick={() => handleTurnChange(currentTurn - 1)} disabled={currentTurn === 0} />
                <StitchButton variant={playing ? 'error' : 'primary'} size="md" icon={playing ? 'pause' : 'play_arrow'} onClick={() => setPlaying(!playing)} className="min-w-[100px]" />
                <StitchButton variant="surface" size="sm" icon="chevron_right" onClick={() => handleTurnChange(currentTurn + 1)} disabled={currentTurn >= maxTurn} />
                <StitchButton variant="surface" size="sm" icon="last_page" onClick={() => handleTurnChange(maxTurn)} disabled={currentTurn >= maxTurn} />
              </div>
              <div className="flex-1 flex items-center gap-3">
                <span className="font-medium text-[var(--md-sys-color-on-surface)] min-w-[100px] text-center">
                  {t('replay.turn')}: {currentTurn}/{maxTurn}
                </span>
                <input
                  type="range"
                  min={0}
                  max={maxTurn}
                  value={currentTurn}
                  onChange={(e) => handleTurnChange(parseInt(e.target.value))}
                  className="flex-1"
                  style={{ accentColor: 'var(--md-sys-color-primary)' }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{t('replay.speed')}</span>
                <select value={playSpeed} onChange={(e) => setPlaySpeed(parseFloat(e.target.value))} className="text-sm px-2 py-1 rounded" style={{ background: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface)', border: '1px solid var(--md-sys-color-outline)' }}>
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                  <option value={3}>3x</option>
                </select>
              </div>
            </div>
            
            {/* Turn Progress Bar */}
            <StitchProgress value={maxTurn > 0 ? (currentTurn / maxTurn) * 100 : 0} className="mt-3" />
          </StitchCard>

          {/* Board Reconstruction */}
          <StitchSectionHeader title={t('replay.boardState')} className="mb-4" />
          <StitchGrid columns={{ base: 1, lg: 2 }} gap={4} className="mb-6">
            {/* Opponent Board */}
            <StitchCard variant="elevated" className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                  <span style={{ color: FACTION_COLORS[getPlayerClass(oppPlayer)] }}>{FACTION_ICONS[getPlayerClass(oppPlayer)]}</span>
                  {t('replay.opponentBoard')}
                </h3>
                <StitchBadge variant="surface" size="sm">{boardState.oppBoard.length}/{oppPlayer?.max_board || 7}</StitchBadge>
              </div>
              <div className="min-h-[120px] flex items-center justify-center gap-2 flex-wrap p-4" style={{ background: 'var(--md-sys-color-surface-container-low)', borderRadius: '12px' }}>
                {boardState.oppBoard.length === 0 ? (
                  <p className="text-[var(--md-sys-color-on-surface-variant)] italic">{t('replay.emptyBoard')}</p>
                ) : (
                  boardState.oppBoard.map((minion, idx) => (
                    <StitchCard key={idx} variant="outlined" className="w-28 h-40 flex flex-col items-center justify-center p-2" style={{ borderColor: FACTION_COLORS[getPlayerClass(oppPlayer)] }}>
                      <span className="text-3xl">{minion.name?.charAt(0) || '?'}</span>
                      <div className="text-xs font-bold text-center">{minion.name}</div>
                      <div className="flex gap-2 text-xs">
                        <StitchBadge variant="primary" size="xs">{minion.atk || minion.attack || 0}</StitchBadge>
                        <StitchBadge variant="error" size="xs">{minion.health || minion.hp || 0}</StitchBadge>
                      </div>
                    </StitchCard>
                  ))
                )}
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                <span className="material-symbols-outlined">style</span>
                <span>{t('replay.hand')}: {boardState.oppHand.length}</span>
                <span className="material-symbols-outlined">delete</span>
                <span>{t('replay.graveyard')}: {boardState.oppGraveyard.length}</span>
              </div>
            </StitchCard>

            {/* My Board */}
            <StitchCard variant="elevated" className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                  <span style={{ color: FACTION_COLORS[getPlayerClass(myPlayer)] }}>{FACTION_ICONS[getPlayerClass(myPlayer)]}</span>
                  {t('replay.yourBoard')}
                </h3>
                <StitchBadge variant="surface" size="sm">{boardState.myBoard.length}/{myPlayer?.max_board || 7}</StitchBadge>
              </div>
              <div className="min-h-[120px] flex items-center justify-center gap-2 flex-wrap p-4" style={{ background: 'var(--md-sys-color-primary)/5', borderRadius: '12px', border: '1px solid var(--md-sys-color-primary)/20' }}>
                {boardState.myBoard.length === 0 ? (
                  <p className="text-[var(--md-sys-color-on-surface-variant)] italic">{t('replay.emptyBoard')}</p>
                ) : (
                  boardState.myBoard.map((minion, idx) => (
                    <StitchCard key={idx} variant="filled" className="w-28 h-40 flex flex-col items-center justify-center p-2" style={{ background: `linear-gradient(145deg, ${FACTION_COLORS[getPlayerClass(myPlayer)]}11, var(--md-sys-color-surface-container))` }}>
                      <span className="text-3xl">{minion.name?.charAt(0) || '?'}</span>
                      <div className="text-xs font-bold text-center">{minion.name}</div>
                      <div className="flex gap-2 text-xs">
                        <StitchBadge variant="primary" size="xs">{minion.atk || minion.attack || 0}</StitchBadge>
                        <StitchBadge variant="error" size="xs">{minion.health || minion.hp || 0}</StitchBadge>
                      </div>
                    </StitchCard>
                  ))
                )}
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                <span className="material-symbols-outlined">style</span>
                <span>{t('replay.hand')}: {boardState.myHand.length}</span>
                <span className="material-symbols-outlined">delete</span>
                <span>{t('replay.graveyard')}: {boardState.myGraveyard.length}</span>
              </div>
            </StitchCard>
          </StitchGrid>

          {/* Turn Log */}
          <StitchSectionHeader title={t('replay.turnLog')} className="mb-4" />
          <StitchCard variant="elevated" className="p-4">
            <StitchScrollArea className="max-h-[400px]">
              <div className="space-y-3">
                {Array.from({ length: maxTurn + 1 }, (_, i) => i).map(turn => {
                  const turnActions = actionsByTurn[turn] || [];
                  return (
                    <StitchCard key={turn} variant={currentTurn === turn ? 'outlined' : 'surface'} className="p-3 transition-all" style={{ borderColor: currentTurn === turn ? 'var(--md-sys-color-primary)' : 'transparent', background: currentTurn === turn ? 'var(--md-sys-color-primary)/5' : 'var(--md-sys-color-surface-container-low)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                          <StitchBadge variant={currentTurn === turn ? 'primary' : 'surface'} size="xs">
                            {t('replay.turn')} {turn}
                          </StitchBadge>
                        </h4>
                        {turnActions.length > 0 && (
                          <StitchBadge variant="surface" size="sm">
                            {turnActions.length} {t('replay.actions')}
                          </StitchBadge>
                        )}
                      </div>
                      {turnActions.length === 0 ? (
                        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] italic">{t('replay.noActions')}</p>
                      ) : (
                        <div className="space-y-1 ml-6">
                          {turnActions.map((action, idx) => (
                            <StitchTooltip key={idx} label={`${getActionPlayer(action)} • ${formatAction(action)}`}>
                              <div className="flex items-center gap-2 text-sm p-2 rounded bg-[var(--md-sys-color-surface-container)]">
                                <span className="material-symbols-outlined text-[var(--md-sys-color-primary)]" style={{ fontSize: '18px' }}>{ACTION_ICONS[action.action_type] || 'help'}</span>
                                <span className="font-medium text-[var(--md-sys-color-on-surface-variant)] min-w-[80px]">{getActionPlayer(action)}</span>
                                <span className="text-[var(--md-sys-color-on-surface)]">{formatAction(action)}</span>
                                {action.action_data?.card_id && (
                                  <>
                                <StitchDivider vertical className="mx-1" />
                                <span className="text-[var(--md-sys-color-tertiary)] italic">
                                  {getCard(action.action_data.card_id)?.name || action.action_data.card_id}
                                </span>
                                  </>
                                )}
                                {action.action_data?.damage && (
                                  <>
                                <StitchDivider vertical className="mx-1" />
                                <span className="text-[var(--md-sys-color-error)] font-bold">-{action.action_data.damage}</span>
                                  </>
                                )}
                              </div>
                            </StitchTooltip>
                          ))}
                        </div>
                      )}
                    </StitchCard>
                  );
                })}
              </div>
            </StitchScrollArea>
          </StitchCard>

          {/* Share Modal */}
          <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity ${showShare ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setShowShare(false)}>
            <StitchCard variant="elevated" className="w-full max-w-md p-6 animate-card-enter" onClick={e => e.stopPropagation()}>
              <h2 className="font-serif text-xl font-bold text-[var(--md-sys-color-on-surface)] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-primary)' }}>share</span>
                {t('replay.shareReplay')}
              </h2>
              <StitchDivider className="mb-4" />
              <p className="text-[var(--md-sys-color-on-surface-variant)] mb-4">{t('replay.shareDesc')}</p>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={getShareUrl(match.id, currentTurn)}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm rounded"
                  style={{ background: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface)', border: '1px solid var(--md-sys-color-outline)' }}
                />
                <StitchButton variant="filled" icon="content_copy" onClick={copyShareLink}>
                  {copied ? t('replay.copied') : t('replay.copy')}
                </StitchButton>
              </div>
              <div className="flex gap-2">
                <StitchButton variant="outline" flex={1} onClick={() => setShowShare(false)}>
                  {t('common.close')}
                </StitchButton>
              </div>
            </StitchCard>
          </div>
        </div>
      </div>
    </StitchLayout>
  );
}