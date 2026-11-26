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
  StitchTabs,
  StitchSelect,
  StitchModal,
} from '../components/StitchUI.jsx';
import { getSupabase } from '../supabase.js';
import TournamentBracket from '../components/TournamentBracket.jsx';
import { getRealtimeService } from '../services/realtime.js';

const TOURNAMENT_TYPES = [
  { id: 'single_elim', labelKey: 'tournaments.type.singleElim', descKey: 'tournaments.type.singleElimDesc', icon: 'account_tree', color: '#e6194b' },
  { id: 'swiss', labelKey: 'tournaments.type.swiss', descKey: 'tournaments.type.swissDesc', icon: 'swap_horiz', color: '#fabc4d' },
  { id: 'round_robin', labelKey: 'tournaments.type.roundRobin', descKey: 'tournaments.type.roundRobinDesc', icon: 'sync', color: '#4caf50' },
];

const TOURNAMENT_STATUS = {
  upcoming: { labelKey: 'tournaments.status.upcoming', color: '#2196f3', icon: 'schedule' },
  registration: { labelKey: 'tournaments.status.registration', color: '#4caf50', icon: 'how_to_reg' },
  active: { labelKey: 'tournaments.status.active', color: '#e6194b', icon: 'sports_esports' },
  completed: { labelKey: 'tournaments.status.completed', color: '#9e9e9e', icon: 'emoji_events' },
  cancelled: { labelKey: 'tournaments.status.cancelled', color: '#f44336', icon: 'cancel' },
};

export default function Tournaments({ go, user, stats }) {
  const { t, lang } = useLanguage();
  const [tournaments, setTournaments] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournamentMatches, setTournamentMatches] = useState([]);

  // Realtime subscription for tournament matches
  useEffect(() => {
    if (!selectedTournament?.id) return;
    const realtime = getRealtimeService();
    const channel = realtime.subscribeToTournamentMatches(selectedTournament.id, (payload) => {
      // Reload matches on any change
      loadTournamentMatches(selectedTournament.id).then(setTournamentMatches);
    });
    return () => {
      realtime.unsubscribe(`tournament:${selectedTournament.id}`);
    };
  }, [selectedTournament?.id]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    type: 'single_elim',
    maxPlayers: 16,
    startDelayMinutes: 10,
    prizePool: '',
    description: '',
  });

  useEffect(() => {
    loadTournaments();
    if (user) loadMyRegistrations();
  }, [user]);

  async function loadTournaments() {
    const sb = getSupabase();
    if (!sb) { setIsLoading(false); return; }
    try {
      const { data } = await sb
        .from('tournaments')
        .select(`
          *,
          tournament_registrations(user_id)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      setTournaments(data || []);
    } catch (e) {
      console.error('Erro ao carregar torneios:', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadTournamentMatches(tournamentId) {
    const sb = getSupabase();
    if (!sb) return [];
    try {
      const { data } = await sb
        .from('tournament_matches')
        .select(`
          *,
          player1:player1_id(id, name),
          player2:player2_id(id, name)
        `)
        .eq('tournament_id', tournamentId)
        .order('round', { ascending: true })
        .order('position', { ascending: true });
      return data || [];
    } catch (e) {
      console.error('Erro ao carregar partidas:', e);
      return [];
    }
  }

  async function reportMatchResult(match, winner) {
    const sb = getSupabase();
    if (!sb) return;
    try {
      await sb.from('tournament_matches').update({
        status: 'completed',
        winner_id: winner.id,
        score1: winner.id === match.player1_id ? 1 : 0,
        score2: winner.id === match.player2_id ? 1 : 0,
      }).eq('id', match.id);
      
      // Advance winner to next round
      const currentRound = match.round;
      const nextRound = currentRound + 1;
      const nextPosition = Math.floor(match.position / 2);
      
      // Check if next round match exists
      const { data: nextMatch } = await sb
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', match.tournament_id)
        .eq('round', nextRound)
        .eq('position', nextPosition)
        .single();
      
      if (nextMatch) {
        const updateField = match.position % 2 === 0 ? 'player1_id' : 'player2_id';
        await sb.from('tournament_matches').update({
          [updateField]: winner.id,
        }).eq('id', nextMatch.id);
      }
      
      // Reload matches
      const matches = await loadTournamentMatches(match.tournament_id);
      setTournamentMatches(matches);
    } catch (e) {
      console.error('Erro ao reportar resultado:', e);
    }
  }

  async function generateBracket(tournament) {
    const sb = getSupabase();
    if (!sb) return;
    try {
      // Get registrations
      const { data: registrations } = await sb
        .from('tournament_registrations')
        .select('user_id, users(name)')
        .eq('tournament_id', tournament.id);
      
      if (!registrations || registrations.length < 2) return;
      
      // Shuffle players for bracket
      const players = registrations.map(r => ({ id: r.user_id, name: r.users?.name || 'Player' }));
      for (let i = players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [players[i], players[j]] = [players[j], players[i]];
      }
      
      // Calculate number of rounds
      const numPlayers = players.length;
      const numRounds = Math.ceil(Math.log2(numPlayers));
      
      // Generate first round matches
      const matches = [];
      let position = 0;
      for (let i = 0; i < players.length; i += 2) {
        if (i + 1 < players.length) {
          matches.push({
            tournament_id: tournament.id,
            round: 1,
            position: position++,
            player1_id: players[i].id,
            player2_id: players[i + 1].id,
            status: 'pending',
          });
        } else {
          // Bye - player advances automatically
          matches.push({
            tournament_id: tournament.id,
            round: 1,
            position: position++,
            player1_id: players[i].id,
            player2_id: null,
            status: 'completed',
            winner_id: players[i].id,
          });
        }
      }
      
      // Generate subsequent rounds (empty slots)
      for (let round = 2; round <= numRounds; round++) {
        const matchesInRound = Math.ceil(matches.filter(m => m.round === round - 1).length / 2);
        for (let i = 0; i < matchesInRound; i++) {
          matches.push({
            tournament_id: tournament.id,
            round: round,
            position: i,
            player1_id: null,
            player2_id: null,
            status: 'pending',
          });
        }
      }
      
      // Insert matches
      await sb.from('tournament_matches').insert(matches);
      
      // Update tournament status
      await sb.from('tournaments').update({ status: 'active' }).eq('id', tournament.id);
      
      await loadTournaments();
    } catch (e) {
      console.error('Erro ao gerar bracket:', e);
    }
  }

  async function loadMyRegistrations() {
    const sb = getSupabase();
    if (!sb) return;
    try {
      const { data } = await sb
        .from('tournament_registrations')
        .select('*, tournaments(*)')
        .eq('user_id', user.id);
      setMyRegistrations(data || []);
    } catch (e) {
      console.error('Erro ao carregar inscrições:', e);
    }
  }

  function getStatusInfo(status) {
    return TOURNAMENT_STATUS[status] || TOURNAMENT_STATUS.upcoming;
  }

  function getTypeInfo(typeId) {
    return TOURNAMENT_TYPES.find(t => t.id === typeId) || TOURNAMENT_TYPES[0];
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(lang, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(lang, { month: 'short', day: 'numeric' });
  }

  const filteredTournaments = useMemo(() => {
    const now = new Date();
    return tournaments.filter(t => {
      const start = new Date(t.start_at);
      if (activeTab === 'upcoming') return t.status === 'upcoming' || t.status === 'registration';
      if (activeTab === 'active') return t.status === 'active';
      if (activeTab === 'completed') return t.status === 'completed';
      if (activeTab === 'my') return myRegistrations.some(r => r.tournament_id === t.id);
      return true;
    });
  }, [tournaments, activeTab, myRegistrations]);

  const isRegistered = (tournamentId) => myRegistrations.some(r => r.tournament_id === tournamentId);
  const canRegister = (t) => (t.status === 'registration' || t.status === 'upcoming') && !isRegistered(t.id);
  const isFull = (t) => t.current_players >= t.max_players;

  async function handleRegister(tournament) {
    if (!user) { go(SCREENS.Auth); return; }
    const sb = getSupabase();
    if (!sb) return;
    try {
      await sb.from('tournament_registrations').insert({
        tournament_id: tournament.id,
        user_id: user.id,
        deck_ids: stats?.deckIds?.[0] || [],
      });
      await loadTournaments();
      await loadMyRegistrations();
    } catch (e) {
      console.error('Erro ao inscrever:', e);
    }
  }

  async function handleUnregister(tournament) {
    const sb = getSupabase();
    if (!sb) return;
    try {
      await sb.from('tournament_registrations').delete()
        .eq('tournament_id', tournament.id)
        .eq('user_id', user.id);
      await loadTournaments();
      await loadMyRegistrations();
    } catch (e) {
      console.error('Erro ao cancelar:', e);
    }
  }

  async function handleCreate() {
    const sb = getSupabase();
    if (!sb) return;
    try {
      await sb.from('tournaments').insert({
        name: createForm.name,
        type: createForm.type,
        max_players: createForm.maxPlayers,
        start_at: new Date(Date.now() + createForm.startDelayMinutes * 60000).toISOString(),
        prize_pool: createForm.prizePool,
        description: createForm.description,
        status: 'registration',
        created_by: user?.id,
      });
      setShowCreateModal(false);
      setCreateForm({ name: '', type: 'single_elim', maxPlayers: 16, startDelayMinutes: 10, prizePool: '', description: '' });
      await loadTournaments();
    } catch (e) {
      console.error('Erro ao criar torneio:', e);
    }
  }

  if (selectedTournament) {
    const statusInfo = getStatusInfo(selectedTournament.status);
    const typeInfo = getTypeInfo(selectedTournament.type);
    const registered = isRegistered(selectedTournament.id);
    const myReg = myRegistrations.find(r => r.tournament_id === selectedTournament.id);

    return (
      <StitchLayout currentScreen={SCREENS.Tournaments} go={go} user={user} stats={stats} leftSidebarOpen={false}>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <StitchButton variant="ghost" size="sm" onClick={() => setSelectedTournament(null)} className="mb-4">
              <span className="material-symbols-outlined mr-2">arrow_back</span>
              {t('tournaments.backToList')}
            </StitchButton>

            <StitchCard className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">{selectedTournament.name}</h2>
                    <StitchBadge variant={selectedTournament.status === 'active' ? 'primary' : 'outline'} icon={statusInfo.icon}>
                      {t(statusInfo.labelKey)}
                    </StitchBadge>
                  </div>
                  <p className="text-[var(--md-sys-color-on-surface-variant)] text-sm">
                    {t(typeInfo.labelKey)} • {selectedTournament.current_players || 0}/{selectedTournament.max_players} {t('tournaments.players')}
                  </p>
                </div>
              </div>

              <StitchDivider className="mb-4" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StitchStat label={t('tournaments.format')} value={t(typeInfo.labelKey)} icon={typeInfo.icon} />
                <StitchStat label={t('tournaments.maxPlayers')} value={selectedTournament.max_players} icon="people" />
                <StitchStat label={t('tournaments.startTime')} value={formatDateShort(selectedTournament.start_at)} icon="event" />
                <StitchStat label={t('tournaments.prizePool')} value={selectedTournament.prize_pool || t('tournaments.cosmeticOnly')} icon="card_giftcard" />
              </div>

              {selectedTournament.description && (
                <div className="mb-6 p-4 bg-[var(--md-sys-color-surface-container)] rounded-lg">
                  <p className="text-[var(--md-sys-color-on-surface-variant)]">{selectedTournament.description}</p>
                </div>
              )}

              {/* Tournament Bracket */}
              {selectedTournament.status === 'active' && (
                <div className="mb-6">
                  <h3 className="font-semibold text-[var(--md-sys-color-on-surface)] mb-3">{t('tournaments.bracket')}</h3>
                  <TournamentBracket 
                    tournament={selectedTournament} 
                    matches={tournamentMatches}
                    onMatchClick={(match) => console.log('Match clicked:', match)}
                    onReportResult={reportMatchResult}
                  />
                </div>
              )}

              {/* Generate Bracket Button (for registration status) */}
              {selectedTournament.status === 'registration' && user && selectedTournament.created_by === user.id && (
                <div className="mb-6">
                  <StitchButton variant="primary" icon="account_tree" onClick={() => generateBracket(selectedTournament)} fullWidth>
                    Generate Bracket & Start Tournament
                  </StitchButton>
                </div>
              )}

              {/* Participants */}
              <div className="mb-6">
                <h3 className="font-semibold text-[var(--md-sys-color-on-surface)] mb-3">{t('tournaments.participants')} ({selectedTournament.current_players || 0})</h3>
                <StitchCard variant="filled" className="p-4 min-h-[120px]">
                  <p className="text-[var(--md-sys-color-on-surface-variant)] text-center py-8">{t('tournaments.participantsLoading')}</p>
                </StitchCard>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {selectedTournament.status === 'registration' && !registered && !isFull(selectedTournament) && user && (
                  <StitchButton variant="primary" onClick={() => handleRegister(selectedTournament)} icon="how_to_reg" fullWidth smDown>
                    {t('tournaments.register')}
                  </StitchButton>
                )}
                {registered && selectedTournament.status !== 'completed' && selectedTournament.status !== 'cancelled' && (
                  <StitchButton variant="outline" onClick={() => handleUnregister(selectedTournament)} icon="cancel" fullWidth smDown>
                    {t('tournaments.unregister')}
                  </StitchButton>
                )}
                {selectedTournament.status === 'active' && myReg && (
                  <StitchButton variant="primary" onClick={() => go(SCREENS.Lobby, { tournamentId: selectedTournament.id })} icon="sports_esports" fullWidth smDown>
                    {t('tournaments.enterMatch')}
                  </StitchButton>
                )}
                {selectedTournament.status === 'completed' && (
                  <StitchButton variant="tonal" disabled icon="emoji_events" fullWidth smDown>
                    {t('tournaments.finished')}
                  </StitchButton>
                )}
                {!user && (
                  <StitchButton variant="outline" onClick={() => go(SCREENS.Auth)} icon="login" fullWidth smDown>
                    {t('tournaments.loginToRegister')}
                  </StitchButton>
                )}
              </div>
            </StitchCard>
          </div>
        </div>
      </StitchLayout>
    );
  }

  return (
    <StitchLayout currentScreen={SCREENS.Tournaments} go={go} user={user} stats={stats} leftSidebarOpen={false}>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[var(--md-sys-color-on-surface)]">{t('tournaments.title')}</h1>
              <p className="text-[var(--md-sys-color-on-surface-variant)] mt-1">{t('tournaments.subtitle')}</p>
            </div>
            {user && (
              <StitchButton variant="primary" onClick={() => setShowCreateModal(true)} icon="add">
                {t('tournaments.createTournament')}
              </StitchButton>
            )}
          </div>

          <StitchTabs
            tabs={[
              { id: 'upcoming', label: t('tournaments.tab.upcoming') },
              { id: 'active', label: t('tournaments.tab.active') },
              { id: 'completed', label: t('tournaments.tab.completed') },
              { id: 'my', label: t('tournaments.tab.my') },
            ]}
            value={activeTab}
            onChange={setActiveTab}
            className="mb-6"
          />

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <StitchCard key={i} variant="filled" className="animate-pulse h-64" />
              ))}
            </div>
          ) : filteredTournaments.length === 0 ? (
            <StitchCard variant="filled" className="p-8 text-center">
              <span className="material-symbols-outlined text-5xl text-[var(--md-sys-color-on-surface-variant)] mb-4 block">emoji_events</span>
              <p className="text-[var(--md-sys-color-on-surface-variant)] mb-4">{t('tournaments.empty.' + activeTab)}</p>
              {activeTab === 'upcoming' && user && (
                <StitchButton variant="primary" onClick={() => setShowCreateModal(true)} icon="add">
                  {t('tournaments.createFirst')}
                </StitchButton>
              )}
            </StitchCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTournaments.map(tournament => {
                const statusInfo = getStatusInfo(tournament.status);
                const typeInfo = getTypeInfo(tournament.type);
                const registered = isRegistered(tournament.id);
                const full = isFull(tournament);

                return (
                  <StitchCard
                    key={tournament.id}
                    variant="elevated"
                    className="hover:shadow-lg transition-shadow cursor-pointer animate-card-enter"
                    onClick={async () => { setSelectedTournament(tournament); const matches = await loadTournamentMatches(tournament.id); setTournamentMatches(matches); }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <StitchBadge variant={tournament.status === 'active' ? 'primary' : 'outline'} icon={statusInfo.icon}>
                        {t(statusInfo.labelKey)}
                      </StitchBadge>
                      {registered && <StitchBadge variant="success" size="sm" icon="check_circle">{t('tournaments.registered')}</StitchBadge>}
                    </div>

                    <h3 className="font-bold text-lg text-[var(--md-sys-color-on-surface)] mb-1 truncate">{tournament.name}</h3>
                    <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-3">{t(typeInfo.labelKey)}</p>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2 text-[var(--md-sys-color-on-surface-variant)]">
                        <span className="material-symbols-outlined text-base">people</span>
                        <span>{tournament.current_players || 0}/{tournament.max_players}</span>
                        {full && <StitchBadge variant="outline" size="xs">{t('tournaments.full')}</StitchBadge>}
                      </div>
                      <div className="flex items-center gap-2 text-[var(--md-sys-color-on-surface-variant)]">
                        <span className="material-symbols-outlined text-base">event</span>
                        <span>{formatDate(tournament.start_at)}</span>
                      </div>
                      {tournament.prize_pool && (
                        <div className="flex items-center gap-2 text-[var(--md-sys-color-primary)]">
                          <span className="material-symbols-outlined text-base">card_giftcard</span>
                          <span>{tournament.prize_pool}</span>
                        </div>
                      )}
                    </div>

                    <StitchDivider className="mb-3" />

                    <div className="flex items-center justify-between">
                      <StitchButton variant="ghost" size="sm" onClick={async (e) => { e.stopPropagation(); setSelectedTournament(tournament); const matches = await loadTournamentMatches(tournament.id); setTournamentMatches(matches); }} icon="visibility">
                        {t('tournaments.viewDetails')}
                      </StitchButton>
                      {tournament.status === 'registration' && !registered && !full && user ? (
                        <StitchButton variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); handleRegister(tournament); }} icon="how_to_reg">
                          {t('tournaments.register')}
                        </StitchButton>
                      ) : registered && tournament.status !== 'completed' ? (
                        <StitchButton variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleUnregister(tournament); }} icon="cancel">
                          {t('tournaments.unregister')}
                        </StitchButton>
                      ) : (
                        <StitchButton variant="tonal" size="sm" disabled>
                          {tournament.status === 'completed' ? t('tournaments.finished') : t('tournaments.notAvailable')}
                        </StitchButton>
                      )}
                    </div>
                  </StitchCard>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Tournament Modal */}
      <StitchModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('tournaments.createTitle')}
        description={t('tournaments.createDesc')}
        maxWidth="md"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-[var(--md-sys-color-on-surface)] mb-1">{t('tournaments.name')}</label>
            <input
              type="text"
              value={createForm.name}
              onChange={e => setCreateForm({...createForm, name: e.target.value})}
              className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)] rounded-lg text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              placeholder={t('tournaments.namePlaceholder')}
              maxLength={50}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--md-sys-color-on-surface)] mb-1">{t('tournaments.format')}</label>
            <StitchSelect
              value={createForm.type}
              onChange={e => setCreateForm({...createForm, type: e.target.value})}
              options={TOURNAMENT_TYPES.map(t => ({ value: t.id, label: t(t.labelKey) }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--md-sys-color-on-surface)] mb-1">{t('tournaments.maxPlayers')}</label>
              <select
                value={createForm.maxPlayers}
                onChange={e => setCreateForm({...createForm, maxPlayers: parseInt(e.target.value)})}
                className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)] rounded-lg text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              >
                {[8, 16, 32, 64].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--md-sys-color-on-surface)] mb-1">{t('tournaments.startInMinutes')}</label>
              <select
                value={createForm.startDelayMinutes}
                onChange={e => setCreateForm({...createForm, startDelayMinutes: parseInt(e.target.value)})}
                className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)] rounded-lg text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              >
                {[5, 10, 15, 30, 60].map(m => <option key={m} value={m}>{m} {t('common.minutes')}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--md-sys-color-on-surface)] mb-1">{t('tournaments.prizePool')}</label>
            <input
              type="text"
              value={createForm.prizePool}
              onChange={e => setCreateForm({...createForm, prizePool: e.target.value})}
              className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)] rounded-lg text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              placeholder={t('tournaments.prizePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--md-sys-color-on-surface)] mb-1">{t('tournaments.description')}</label>
            <textarea
              value={createForm.description}
              onChange={e => setCreateForm({...createForm, description: e.target.value})}
              rows={3}
              className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)] rounded-lg text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              placeholder={t('tournaments.descriptionPlaceholder')}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
          <StitchButton variant="outline" onClick={() => setShowCreateModal(false)}>{t('common.cancel')}</StitchButton>
          <StitchButton variant="primary" onClick={handleCreate} disabled={!createForm.name.trim()}>{t('tournaments.create')}</StitchButton>
        </div>
      </StitchModal>
    </StitchLayout>
  );
}