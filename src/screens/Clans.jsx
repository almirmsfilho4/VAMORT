import React, { useState, useEffect, useMemo } from 'react';
import StitchLayout from '../components/StitchLayout.jsx';
import { SCREENS } from '../data/constants.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getSupabase } from '../supabase.js';
import ClanWar from '../components/ClanWar.jsx';
import ClanMatchmaking from '../components/ClanMatchmaking.jsx';
import { getRealtimeService } from '../services/realtime.js';
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
  StitchModal,
  StitchSelect,
  StitchTextField,
} from '../components/StitchUI.jsx';

const CLAN_ROLES = {
  leader: { labelKey: 'clans.role.leader', color: '#e6194b', icon: 'emoji_events' },
  officer: { labelKey: 'clans.role.officer', color: '#fabc4d', icon: 'shield' },
  member: { labelKey: 'clans.role.member', color: '#2196f3', icon: 'person' },
};

export default function Clans({ go, user, stats }) {
  const { t, lang } = useLanguage();
  const [clans, setClans] = useState([]);
  const [myClan, setMyClan] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [clanMembers, setClanMembers] = useState([]);
  const [clanLog, setClanLog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedClan, setSelectedClan] = useState(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    tag: '',
    description: '',
    minRank: 'bronze',
    isPublic: true,
    minTrophies: 0,
  });

  useEffect(() => {
    loadClans();
    if (user) loadMyClan();
  }, [user]);

  // Realtime subscription for clan wars
  useEffect(() => {
    if (!myClan?.id) return;
    const realtime = getRealtimeService();
    return () => {
      realtime.unsubscribeAll();
    };
  }, [myClan?.id]);

  async function loadClans() {
    const sb = getSupabase();
    if (!sb) { setIsLoading(false); return; }
    try {
      const { data } = await sb
        .from('clans')
        .select(`
          *,
          clan_members(count)
        `)
        .order('trophies', { ascending: false })
        .limit(50);
      setClans(data || []);
    } catch (e) {
      console.error('Erro ao carregar clãs:', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMyClan() {
    const sb = getSupabase();
    if (!sb) return;
    try {
      const { data: membership } = await sb
        .from('clan_members')
        .select('*, clans(*)')
        .eq('user_id', user.id)
        .single();
      if (membership) {
        setMyClan(membership.clans);
        setMyRole(membership.role);
        await loadClanDetails(membership.clans.id);
      }
    } catch (e) {
      console.error('Erro ao carregar meu clã:', e);
    }
  }

  async function loadClanDetails(clanId) {
    const sb = getSupabase();
    if (!sb) return;
    try {
      const { data: members } = await sb
        .from('clan_members')
        .select('*, profiles(user_id, display_name, avatar_url, rank_points)')
        .eq('clan_id', clanId)
        .order('role', { ascending: true })
        .order('joined_at', { ascending: true });
      setClanMembers(members || []);

      const { data: log } = await sb
        .from('clan_log')
        .select('*, profiles(user_id, display_name)')
        .eq('clan_id', clanId)
        .order('created_at', { ascending: false })
        .limit(50);
      setClanLog(log || []);
    } catch (e) {
      console.error('Erro ao carregar detalhes do clã:', e);
    }
  }

  const filteredClans = useMemo(() => {
    if (!searchQuery.trim()) return clans;
    const q = searchQuery.toLowerCase();
    return clans.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.tag.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  }, [clans, searchQuery]);

  function formatNumber(n) {
    if (!n) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  }

  async function handleCreate() {
    if (!user) { go(SCREENS.Auth); return; }
    const sb = getSupabase();
    if (!sb) return;
    try {
      const { data: clan, error } = await sb
        .from('clans')
        .insert({
          name: createForm.name,
          tag: createForm.tag.toUpperCase(),
          description: createForm.description,
          min_rank: createForm.minRank,
          is_public: createForm.isPublic,
          min_trophies: createForm.minTrophies,
          leader_id: user.id,
          trophies: 0,
        })
        .select()
        .single();
      if (error) throw error;

      await sb.from('clan_members').insert({
        clan_id: clan.id,
        user_id: user.id,
        role: 'leader',
      });
      await sb.from('clan_log').insert({
        clan_id: clan.id,
        user_id: user.id,
        action: 'created',
        details: { name: clan.name },
      });

      setShowCreateModal(false);
      setCreateForm({ name: '', tag: '', description: '', minRank: 'bronze', isPublic: true, minTrophies: 0 });
      await loadClans();
      await loadMyClan();
    } catch (e) {
      console.error('Erro ao criar clã:', e);
    }
  }

  async function handleJoin(clan) {
    if (!user) { go(SCREENS.Auth); return; }
    const sb = getSupabase();
    if (!sb) return;
    try {
      await sb.from('clan_members').insert({
        clan_id: clan.id,
        user_id: user.id,
        role: 'member',
      });
      await sb.from('clan_log').insert({
        clan_id: clan.id,
        user_id: user.id,
        action: 'joined',
        details: {},
      });
      await loadClans();
      await loadMyClan();
    } catch (e) {
      console.error('Erro ao entrar no clã:', e);
    }
  }

  async function handleLeave() {
    if (!myClan || !user) return;
    const sb = getSupabase();
    if (!sb) return;
    try {
      await sb.from('clan_members').delete()
        .eq('clan_id', myClan.id)
        .eq('user_id', user.id);
      await sb.from('clan_log').insert({
        clan_id: myClan.id,
        user_id: user.id,
        action: 'left',
        details: {},
      });
      setMyClan(null);
      setMyRole(null);
      setClanMembers([]);
      setClanLog([]);
      await loadClans();
    } catch (e) {
      console.error('Erro ao sair do clã:', e);
    }
  }

  async function handleKick(member) {
    const sb = getSupabase();
    if (!sb) return;
    try {
      await sb.from('clan_members').delete()
        .eq('clan_id', myClan.id)
        .eq('user_id', member.user_id);
      await sb.from('clan_log').insert({
        clan_id: myClan.id,
        user_id: member.user_id,
        action: 'kicked',
        details: { by: user.id },
      });
      await loadClanDetails(myClan.id);
    } catch (e) {
      console.error('Erro ao expulsar:', e);
    }
  }

  async function handlePromote(member, newRole) {
    const sb = getSupabase();
    if (!sb) return;
    try {
      await sb.from('clan_members').update({ role: newRole })
        .eq('clan_id', myClan.id)
        .eq('user_id', member.user_id);
      await sb.from('clan_log').insert({
        clan_id: myClan.id,
        user_id: member.user_id,
        action: 'promoted',
        details: { role: newRole, by: user.id },
      });
      await loadClanDetails(myClan.id);
    } catch (e) {
      console.error('Erro ao promover:', e);
    }
  }

  const canManage = myRole === 'leader' || myRole === 'officer';
  const isLeader = myRole === 'leader';

  if (myClan && activeTab === 'myClan') {
    const roleInfo = CLAN_ROLES[myRole] || CLAN_ROLES.member;
    return (
      <StitchLayout currentScreen={SCREENS.Clans} go={go} user={user} stats={stats} leftSidebarOpen={false}>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">{myClan.name}</h2>
                  <span className="px-2 py-1 bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] rounded-full text-sm font-mono">[{myClan.tag}]</span>
                  <StitchBadge variant="primary" icon={roleInfo.icon}>{t(roleInfo.labelKey)}</StitchBadge>
                </div>
                <p className="text-[var(--md-sys-color-on-surface-variant)]">#{myClan.trophies ? formatNumber(myClan.trophies) : '—'} {t('clans.rank')}</p>
              </div>
              <StitchButton variant="outline" onClick={handleLeave} icon="logout">
                {t('clans.leaveClan')}
              </StitchButton>
            </div>

            <StitchTabs
              tabs={[
                { id: 'members', label: t('clans.tab.members') },
                { id: 'log', label: t('clans.tab.activity') },
                { id: 'war', label: t('clans.tab.war') },
                { id: 'settings', label: t('clans.tab.settings') },
              ]}
              value={activeTab}
              onChange={setActiveTab}
              className="mb-6"
            />

            {activeTab === 'members' && (
              <div className="space-y-3">
                {clanMembers.map((member, idx) => {
                  const mRole = member.role || 'member';
                  const roleInfo = CLAN_ROLES[mRole] || CLAN_ROLES.member;
                  const profile = member.profiles?.[0] || {};
                  const isSelf = member.user_id === user?.id;
                  const canAct = canManage && !isSelf && (isLeader || mRole !== 'leader');
                  return (
                    <StitchCard key={member.user_id} variant="filled" className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <StitchAvatar src={profile.avatar_url} name={profile.display_name || `Player ${idx + 1}`} size={44} />
                        <div>
                          <p className="font-medium text-[var(--md-sys-color-on-surface)]">{profile.display_name || `Player ${idx + 1}`}</p>
                          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                            {t('clans.trophies')}: {formatNumber(profile.rank_points || 0)} • {t('clans.joined')}: {new Date(member.joined_at).toLocaleDateString(lang)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StitchBadge variant="outline" icon={roleInfo.icon} size="sm">{t(roleInfo.labelKey)}</StitchBadge>
                        {canAct && (
                          <>
                            {mRole === 'member' && (
                              <StitchButton variant="tonal" size="sm" onClick={() => handlePromote(member, 'officer')} icon="shield">
                                {t('clans.promoteOfficer')}
                              </StitchButton>
                            )}
                            {mRole === 'officer' && isLeader && (
                              <StitchButton variant="primary" size="sm" onClick={() => handlePromote(member, 'leader')} icon="emoji_events">
                                {t('clans.transferLeadership')}
                              </StitchButton>
                            )}
                            <StitchButton variant="outline" size="sm" onClick={() => handleKick(member)} icon="person_remove" color="error">
                              {t('clans.kick')}
                            </StitchButton>
                          </>
                        )}
                      </div>
                    </StitchCard>
                  );
                })}
              </div>
            )}

            {activeTab === 'log' && (
              <div className="space-y-2">
                {clanLog.length === 0 ? (
                  <StitchCard variant="filled" className="p-8 text-center">
                    <p className="text-[var(--md-sys-color-on-surface-variant)]">{t('clans.noActivity')}</p>
                  </StitchCard>
                ) : (
                  clanLog.map((entry, idx) => {
                    const profile = entry.profiles?.[0] || {};
                    const actionLabels = {
                      created: t('clans.log.created'),
                      joined: t('clans.log.joined'),
                      left: t('clans.log.left'),
                      kicked: t('clans.log.kicked'),
                      promoted: t('clans.log.promoted'),
                      war_started: t('clans.log.warStarted'),
                      war_ended: t('clans.log.warEnded'),
                    };
                    return (
                      <StitchCard key={idx} variant="filled" className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <StitchAvatar src={profile.avatar_url} name={profile.display_name || 'Player'} size={32} />
                            <span className="font-medium text-[var(--md-sys-color-on-surface)]">{profile.display_name || 'Player'}</span>
                            <span className="text-[var(--md-sys-color-primary)]">{actionLabels[entry.action] || entry.action}</span>
                          </div>
                          <span className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                            {new Date(entry.created_at).toLocaleString(lang)}
                          </span>
                        </div>
                      </StitchCard>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'war' && (
              <div className="space-y-4">
                <ClanMatchmaking 
                  clan={myClan} 
                  onWarStarted={(war, opponent) => {
                    console.log('War started:', war, opponent);
                    // Reload clan data
                  }}
                />
              </div>
            )}

            {activeTab === 'settings' && canManage && (
              <StitchCard variant="filled" className="p-6 space-y-4">
                <h3 className="font-bold text-[var(--md-sys-color-on-surface)]">{t('clans.settings.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StitchTextField
                    label={t('clans.name')}
                    value={myClan.name}
                    disabled
                  />
                  <StitchTextField
                    label={t('clans.tag')}
                    value={myClan.tag}
                    disabled
                  />
                  <StitchTextField
                    label={t('clans.description')}
                    value={myClan.description || ''}
                    multiline
                    rows={3}
                    disabled
                  />
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-[var(--md-sys-color-on-surface)]">
                      <input type="checkbox" checked={myClan.is_public} disabled />
                      <span>{t('clans.public')}</span>
                    </label>
                  </div>
                </div>
              </StitchCard>
            )}

            {activeTab === 'settings' && !canManage && (
              <StitchCard variant="filled" className="p-8 text-center">
                <p className="text-[var(--md-sys-color-on-surface-variant)]">{t('clans.settings.noPermission')}</p>
              </StitchCard>
            )}
          </div>
        </div>
      </StitchLayout>
    );
  }

  return (
    <StitchLayout currentScreen={SCREENS.Clans} go={go} user={user} stats={stats} leftSidebarOpen={false}>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[var(--md-sys-color-on-surface)]">{t('clans.title')}</h1>
              <p className="text-[var(--md-sys-color-on-surface-variant)] mt-1">{t('clans.subtitle')}</p>
            </div>
            {!myClan && user && (
              <StitchButton variant="primary" onClick={() => setShowCreateModal(true)} icon="add">
                {t('clans.createClan')}
              </StitchButton>
            )}
          </div>

          <StitchTabs
            tabs={[
              { id: 'discover', label: t('clans.tab.discover') },
              { id: 'myClan', label: t('clans.tab.myClan') },
            ]}
            value={activeTab}
            onChange={setActiveTab}
            className="mb-6"
          />

          {activeTab === 'discover' && (
            <div className="mb-4">
              <StitchTextField
                label={t('clans.search')}
                placeholder={t('clans.searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                leftIcon="search"
                className="max-w-md"
              />
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <StitchCard key={i} variant="filled" className="animate-pulse h-48" />
              ))}
            </div>
          ) : filteredClans.length === 0 ? (
            <StitchCard variant="filled" className="p-8 text-center">
              <span className="material-symbols-outlined text-5xl text-[var(--md-sys-color-on-surface-variant)] mb-4 block">groups</span>
              <p className="text-[var(--md-sys-color-on-surface-variant)] mb-4">
                {activeTab === 'discover'
                  ? (searchQuery ? t('clans.noResults') : t('clans.noClans'))
                  : t('clans.noClanYet')}
              </p>
              {activeTab === 'discover' && !searchQuery && user && (
                <StitchButton variant="primary" onClick={() => setShowCreateModal(true)} icon="add" className="mt-4">
                  {t('clans.createFirst')}
                </StitchButton>
              )}
              {activeTab === 'myClan' && !myClan && user && (
                <StitchButton variant="primary" onClick={() => setShowCreateModal(true)} icon="add" className="mt-4">
                  {t('clans.createFirst')}
                </StitchButton>
              )}
            </StitchCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClans.map(clan => {
                const memberCount = clan.clan_members?.[0]?.count || 0;
                const isFull = memberCount >= 50;
                return (
                  <StitchCard
                    key={clan.id}
                    variant="elevated"
                    className="hover:shadow-lg transition-shadow cursor-pointer animate-card-enter"
                    onClick={() => setSelectedClan(clan)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-[var(--md-sys-color-on-surface)]">{clan.name}</h3>
                        <span className="text-sm font-mono text-[var(--md-sys-color-primary)]">[{clan.tag}]</span>
                      </div>
                      {myClan?.id === clan.id && (
                        <StitchBadge variant="success" size="sm" icon="check_circle">{t('clans.myClan')}</StitchBadge>
                      )}
                    </div>

                    <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] line-clamp-2 mb-3">{clan.description || t('clans.noDescription')}</p>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2 text-[var(--md-sys-color-on-surface-variant)]">
                        <span className="material-symbols-outlined text-base">people</span>
                        <span>{memberCount}/50</span>
                        {isFull && <StitchBadge variant="outline" size="xs">{t('clans.full')}</StitchBadge>}
                      </div>
                      <div className="flex items-center gap-2 text-[var(--md-sys-color-on-surface-variant)]">
                        <span className="material-symbols-outlined text-base">emoji_events</span>
                        <span>{t('clans.trophies')}: {formatNumber(clan.trophies)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[var(--md-sys-color-on-surface-variant)]">
                        <span className="material-symbols-outlined text-base">badge</span>
                        <span>{t('clans.minRank')}: {t(`ranks.${clan.min_rank}`) || clan.min_rank}</span>
                      </div>
                      {clan.min_trophies > 0 && (
                        <div className="flex items-center gap-2 text-[var(--md-sys-color-on-surface-variant)]">
                          <span className="material-symbols-outlined text-base">trending_up</span>
                          <span>{t('clans.minTrophies')}: {formatNumber(clan.min_trophies)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[var(--md-sys-color-on-surface-variant)]">
                        <span className="material-symbols-outlined text-base">{clan.is_public ? 'public' : 'lock'}</span>
                        <span>{clan.is_public ? t('clans.public') : t('clans.private')}</span>
                      </div>
                    </div>

                    <StitchDivider className="mb-3" />

                    <div className="flex items-center justify-between">
                      <StitchButton variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedClan(clan); }} icon="visibility">
                        {t('clans.viewDetails')}
                      </StitchButton>
                      {myClan?.id === clan.id ? (
                        <StitchButton variant="tonal" size="sm" disabled>
                          {t('clans.alreadyMember')}
                        </StitchButton>
                      ) : myClan ? (
                        <StitchButton variant="outline" size="sm" disabled>
                          {t('clans.alreadyInClan')}
                        </StitchButton>
                      ) : !user ? (
                        <StitchButton variant="outline" size="sm" onClick={() => go(SCREENS.Auth)} icon="login">
                          {t('clans.loginToJoin')}
                        </StitchButton>
                      ) : clan.is_public && !isFull ? (
                        <StitchButton variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); handleJoin(clan); }} icon="group_add">
                          {t('clans.join')}
                        </StitchButton>
                      ) : (
                        <StitchButton variant="tonal" size="sm" disabled>
                          {isFull ? t('clans.full') : t('clans.requestInvite')}
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

      {/* Create Clan Modal */}
      <StitchModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('clans.createTitle')}
        description={t('clans.createDesc')}
        maxWidth="md"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-[var(--md-sys-color-on-surface)] mb-1">{t('clans.name')}</label>
            <input
              type="text"
              value={createForm.name}
              onChange={e => setCreateForm({...createForm, name: e.target.value})}
              className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)] rounded-lg text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              placeholder={t('clans.namePlaceholder')}
              maxLength={30}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--md-sys-color-on-surface)] mb-1">{t('clans.tag')}</label>
            <input
              type="text"
              value={createForm.tag}
              onChange={e => setCreateForm({...createForm, tag: e.target.value.toUpperCase()})}
              className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)] rounded-lg text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              placeholder={t('clans.tagPlaceholder')}
              maxLength={5}
              required
            />
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">{t('clans.tagHint')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--md-sys-color-on-surface)] mb-1">{t('clans.description')}</label>
            <textarea
              value={createForm.description}
              onChange={e => setCreateForm({...createForm, description: e.target.value})}
              rows={3}
              className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)] rounded-lg text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              placeholder={t('clans.descriptionPlaceholder')}
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--md-sys-color-on-surface)] mb-1">{t('clans.minRank')}</label>
              <StitchSelect
                value={createForm.minRank}
                onChange={e => setCreateForm({...createForm, minRank: e.target.value})}
                options={[
                  { value: 'bronze', label: t('ranks.bronze') },
                  { value: 'silver', label: t('ranks.silver') },
                  { value: 'gold', label: t('ranks.gold') },
                  { value: 'platinum', label: t('ranks.platinum') },
                  { value: 'diamond', label: t('ranks.diamond') },
                  { value: 'master', label: t('ranks.master') },
                  { value: 'grandmaster', label: t('ranks.grandmaster') },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--md-sys-color-on-surface)] mb-1">{t('clans.minTrophies')}</label>
              <input
                type="number"
                value={createForm.minTrophies}
                onChange={e => setCreateForm({...createForm, minTrophies: parseInt(e.target.value) || 0})}
                min="0"
                className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)] rounded-lg text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-[var(--md-sys-color-on-surface)]">
              <input
                type="checkbox"
                checked={createForm.isPublic}
                onChange={e => setCreateForm({...createForm, isPublic: e.target.checked})}
              />
              <span>{t('clans.public')}</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
          <StitchButton variant="outline" onClick={() => setShowCreateModal(false)}>{t('common.cancel')}</StitchButton>
          <StitchButton variant="primary" onClick={handleCreate} disabled={!createForm.name.trim() || !createForm.tag.trim()}>
            {t('clans.create')}
          </StitchButton>
        </div>
      </StitchModal>

      {/* Clan Detail Modal */}
      {selectedClan && (
        <StitchModal
          open={true}
          onClose={() => setSelectedClan(null)}
          title={selectedClan.name}
          description={`[${selectedClan.tag}] ${selectedClan.description || t('clans.noDescription')}`}
          maxWidth="lg"
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StitchStat label={t('clans.members')} value={`${selectedClan.clan_members?.[0]?.count || 0}/50`} icon="people" />
              <StitchStat label={t('clans.trophies')} value={formatNumber(selectedClan.trophies)} icon="emoji_events" />
              <StitchStat label={t('clans.minRank')} value={t(`ranks.${selectedClan.min_rank}`) || selectedClan.min_rank} icon="badge" />
              <StitchStat label={t('clans.type')} value={selectedClan.is_public ? t('clans.public') : t('clans.private')} icon={selectedClan.is_public ? 'public' : 'lock'} />
            </div>

            <StitchDivider />

            <h3 className="font-semibold text-[var(--md-sys-color-on-surface)]">{t('clans.recentActivity')}</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {/* Would load clan log here */}
              <StitchCard variant="filled" className="p-4 text-center">
                <p className="text-[var(--md-sys-color-on-surface-variant)]">{t('clans.activityLoading')}</p>
              </StitchCard>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
            <StitchButton variant="outline" onClick={() => setSelectedClan(null)}>{t('common.close')}</StitchButton>
            {!myClan && !selectedClan.is_public && user && (
              <StitchButton variant="outline" onClick={() => setShowInviteModal(true)} icon="mail">
                {t('clans.requestInvite')}
              </StitchButton>
            )}
            {!myClan && selectedClan.is_public && user && (
              <StitchButton variant="primary" onClick={() => handleJoin(selectedClan)} icon="group_add">
                {t('clans.join')}
              </StitchButton>
            )}
          </div>
        </StitchModal>
      )}
    </StitchLayout>
  );
}