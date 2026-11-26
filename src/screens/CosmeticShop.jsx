import React, { useState, useMemo } from 'react';
import StitchLayout from '../components/StitchLayout.jsx';
import { SCREENS } from '../data/constants.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getSupabase } from '../supabase.js';
import {
  StitchButton,
  StitchCard,
  StitchSectionHeader,
  StitchGrid,
  StitchBadge,
  StitchStat,
  StitchIconButton,
  StitchTabs,
  StitchProgress,
  StitchTextField,
} from '../components/StitchUI.jsx';

const COSMETICS = [
  // Card Backs
  { id: 'back_vampire', nameKey: 'cosmetic.back_vampire', type: 'cardback', price: 300, color: '#e6194b', preview: '🦇', rarity: 'RARA' },
  { id: 'back_human', nameKey: 'cosmetic.back_human', type: 'cardback', price: 300, color: '#fabc4d', preview: '⚔️', rarity: 'RARA' },
  { id: 'back_neutral', nameKey: 'cosmetic.back_neutral', type: 'cardback', price: 300, color: '#6E9ECC', preview: '✨', rarity: 'RARA' },
  { id: 'back_blood_moon', nameKey: 'cosmetic.back_blood_moon', type: 'cardback', price: 600, color: '#dc2626', preview: '🩸', rarity: 'EPICA' },
  { id: 'back_starlight', nameKey: 'cosmetic.back_starlight', type: 'cardback', price: 600, color: '#fbbf24', preview: '⭐', rarity: 'EPICA' },
  { id: 'back_void', nameKey: 'cosmetic.back_void', type: 'cardback', price: 1200, color: '#581c87', preview: '🕳️', rarity: 'LENDARIA' },

  // Board Skins
  { id: 'board_dark', nameKey: 'cosmetic.board_dark', type: 'board', price: 600, color: '#8b5cf6', preview: '🌑', rarity: 'EPICA' },
  { id: 'board_light', nameKey: 'cosmetic.board_light', type: 'board', price: 600, color: '#fbbf24', preview: '☀️', rarity: 'EPICA' },
  { id: 'board_blood', nameKey: 'cosmetic.board_blood', type: 'board', price: 1000, color: '#dc2626', preview: '🩸', rarity: 'EPICA' },
  { id: 'board_crystal', nameKey: 'cosmetic.board_crystal', type: 'board', price: 1500, color: '#0ea5e9', preview: '💎', rarity: 'LENDARIA' },
  { id: 'board_abyss', nameKey: 'cosmetic.board_abyss', type: 'board', price: 2000, color: '#1e1b4b', preview: '🌌', rarity: 'LENDARIA' },

  // Hero Skins
  { id: 'hero_vampire_alt', nameKey: 'cosmetic.hero_vampire_alt', type: 'hero', price: 1200, color: '#dc2626', preview: '🧛', rarity: 'EPICA', class: 'VAMPIRE' },
  { id: 'hero_human_alt', nameKey: 'cosmetic.hero_human_alt', type: 'hero', price: 1200, color: '#f59e0b', preview: '🛡️', rarity: 'EPICA', class: 'HUMAN' },
  { id: 'hero_vampire_lord', nameKey: 'cosmetic.hero_vampire_lord', type: 'hero', price: 2500, color: '#991b1b', preview: '👑', rarity: 'LENDARIA', class: 'VAMPIRE' },
  { id: 'hero_human_saint', nameKey: 'cosmetic.hero_human_saint', type: 'hero', price: 2500, color: '#fef08a', preview: '✝️', rarity: 'LENDARIA', class: 'HUMAN' },

  // Emotes
  { id: 'emote_laugh', nameKey: 'cosmetic.emote_laugh', type: 'emote', price: 150, color: '#22c55e', preview: '😂', rarity: 'COMUM' },
  { id: 'emote_roar', nameKey: 'cosmetic.emote_roar', type: 'emote', price: 150, color: '#ef4444', preview: '😡', rarity: 'COMUM' },
  { id: 'emote_bow', nameKey: 'cosmetic.emote_bow', type: 'emote', price: 150, color: '#3b82f6', preview: '🙇', rarity: 'COMUM' },
  { id: 'emote_wink', nameKey: 'cosmetic.emote_wink', type: 'emote', price: 200, color: '#ec4899', preview: '😉', rarity: 'RARA' },
  { id: 'emote_thumbs_up', nameKey: 'cosmetic.emote_thumbs_up', type: 'emote', price: 200, color: '#f97316', preview: '👍', rarity: 'RARA' },
  { id: 'emote_spectral', nameKey: 'cosmetic.emote_spectral', type: 'emote', price: 500, color: '#a855f7', preview: '👻', rarity: 'EPICA' },

  // Titles
  { id: 'title_novice', nameKey: 'cosmetic.title_novice', type: 'title', price: 0, color: '#9ca3af', preview: '📜', rarity: 'COMUM', unlockDesc: 'cosmetic.unlock_play_first' },
  { id: 'title_veteran', nameKey: 'cosmetic.title_veteran', type: 'title', price: 500, color: '#6b7280', preview: '⚔️', rarity: 'RARA', unlockDesc: 'cosmetic.unlock_100_wins' },
  { id: 'title_master', nameKey: 'cosmetic.title_master', type: 'title', price: 1500, color: '#f59e0b', preview: '🏆', rarity: 'EPICA', unlockDesc: 'cosmetic.unlock_500_wins' },
  { id: 'title_grandmaster', nameKey: 'cosmetic.title_grandmaster', type: 'title', price: 0, color: '#e6194b', preview: '👑', rarity: 'LENDARIA', unlockDesc: 'cosmetic.unlock_rank_gm' },
  { id: 'title_bloodlord', nameKey: 'cosmetic.title_bloodlord', type: 'title', price: 0, color: '#dc2626', preview: '🩸', rarity: 'LENDARIA', unlockDesc: 'cosmetic.unlock_blood_pact_10' },
];

const TYPE_LABELS = {
  cardback: 'cosmetic.type.cardback',
  board: 'cosmetic.type.board',
  hero: 'cosmetic.type.hero',
  emote: 'cosmetic.type.emote',
  title: 'cosmetic.type.title',
};

const TYPE_ICONS = {
  cardback: 'style',
  board: 'grid_view',
  hero: 'person',
  emote: 'emoji_emotions',
  title: 'badge',
};

const RARITY_COLORS = {
  COMUM: '#9e9e9e',
  RARA: '#2196f3',
  EPICA: '#9c27b0',
  LENDARIA: '#ff9800',
};

const RARITY_ICONS = {
  COMUM: 'circle',
  RARA: 'star_half',
  EPICA: 'star',
  LENDARIA: 'diamond',
};

function getUnlockStatus(item, stats, playerClass) {
  if (item.price > 0) return { unlocked: false, reason: null };
  
  // Free items with unlock conditions
  if (item.id === 'title_novice') return { unlocked: true, reason: null };
  if (item.id === 'title_veteran') return { unlocked: (stats?.wins || 0) >= 100, reason: 'cosmetic.unlock_100_wins' };
  if (item.id === 'title_master') return { unlocked: (stats?.wins || 0) >= 500, reason: 'cosmetic.unlock_500_wins' };
  if (item.id === 'title_grandmaster') return { unlocked: (stats?.rankPoints || 0) >= 2400, reason: 'cosmetic.unlock_rank_gm' };
  if (item.id === 'title_bloodlord') {
    const pact = localStorage.getItem('vamort_blood_pact_streak');
    const streak = pact ? parseInt(pact, 10) : 0;
    return { unlocked: streak >= 10, reason: 'cosmetic.unlock_blood_pact_10' };
  }
  return { unlocked: false, reason: null };
}

export default function CosmeticShopScreen({ go, user, stats, deckIds, setDeckIds }) {
  const { t, lang } = useLanguage();
  const [filter, setFilter] = useState('all');
  const [owned, setOwned] = useState(stats?.ownedCosmetics || []);
  const [gold, setGold] = useState(stats?.gold || 0);
  const [dust, setDust] = useState(stats?.dust || 0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const filteredCosmetics = useMemo(() => {
    if (filter === 'all') return COSMETICS;
    return COSMETICS.filter(c => c.type === filter);
  }, [filter]);

  const canAfford = (item) => gold >= item.price;

  async function handleBuy(item) {
    if (gold < item.price || owned.includes(item.id)) return;
    if (item.class && item.class !== stats?.playerClass) return;

    // Optimistic update
    const newGold = gold - item.price;
    const newOwned = [...owned, item.id];
    setGold(newGold);
    setOwned(newOwned);

    // Sync to Supabase
    const sb = getSupabase();
    if (sb && user) {
      try {
        await sb.from('player_profiles').upsert({
          user_id: user.id,
          gold: newGold,
          owned_cosmetics: newOwned,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Erro ao comprar cosmético:', e);
        // Rollback on error
        setGold(gold);
        setOwned(owned);
      }
    }

    // Also update local stats for immediate feedback
    setStats(s => ({ ...s, gold: newGold, ownedCosmetics: newOwned }));
  }

  function handleOpenConfirm(item) {
    setSelectedItem(item);
    setShowConfirm(true);
  }

  function handleConfirmBuy() {
    if (selectedItem) handleBuy(selectedItem);
    setShowConfirm(false);
    setSelectedItem(null);
  }

  return (
    <StitchLayout currentScreen={SCREENS.CosmeticShop} go={go} user={user} stats={stats} leftSidebarOpen={false}>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--md-sys-color-secondary)' }}>palette</span>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-[var(--md-sys-color-on-surface)]">{t('cosmetic.title')}</h1>
            </div>
            <p className="text-[var(--md-sys-color-on-surface-variant)] max-w-2xl mx-auto">{t('cosmetic.subtitle')}</p>
          </div>

          {/* Currency Bar */}
          <StitchCard variant="elevated" className="mb-6 p-4" style={{ border: '1px solid var(--md-sys-color-secondary)/30' }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-secondary)' }}>diamond</span>
                  <StitchStat value={gold} label={t('cosmetic.gold')} variant="secondary" icon="diamond" className="mb-0" />
                </div>
                <div className="flex items-center gap-2 border-l border-[var(--md-sys-color-outline)]/20 pl-6">
                  <span className="material-symbols-outlined" style={{ color: '#a855f7' }}>sparkles</span>
                  <StitchStat value={dust} label={t('cosmetic.dust')} variant="tertiary" icon="sparkles" className="mb-0" />
                </div>
                <div className="flex items-center gap-2 border-l border-[var(--md-sys-color-outline)]/20 pl-6">
                  <span className="material-symbols-outlined" style={{ color: '#e6194b' }}>workspace_premium</span>
                  <StitchStat value={owned.length} label={t('cosmetic.owned')} variant="primary" icon="workspace_premium" className="mb-0" />
                </div>
              </div>
              <StitchButton variant="tonal" icon="storefront" onClick={() => go(SCREENS.Journey)} className="whitespace-nowrap">
                {t('cosmetic.battlePassTab')}
              </StitchButton>
            </div>
          </StitchCard>

          {/* Filters */}
          <StitchCard variant="filled" className="mb-6 p-4">
            <div className="flex flex-wrap gap-2">
              {['all', 'cardback', 'board', 'hero', 'emote', 'title'].map(f => (
                <StitchButton
                  key={f}
                  variant={filter === f ? 'filled' : 'outlined'}
                  size="sm"
                  leftIcon={TYPE_ICONS[f]}
                  onClick={() => setFilter(f)}
                  className="whitespace-nowrap"
                >
                  {t(TYPE_LABELS[f])}
                </StitchButton>
              ))}
            </div>
          </StitchCard>

          {/* Cosmetics Grid */}
          <StitchSectionHeader title={t('cosmetic.available')} className="mb-4" />
          <StitchGrid columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }} gap={3} className="min-h-[300px]">
            {filteredCosmetics.map(item => {
              const isOwned = owned.includes(item.id);
              const isClassLocked = item.class && item.class !== stats?.playerClass;
              const { unlocked, reason } = getUnlockStatus(item, stats, stats?.playerClass);
              const isFreeUnlocked = item.price === 0 && unlocked;
              const canBuy = (canAfford(item) || isFreeUnlocked) && !isOwned && !isClassLocked;

              const itemName = t(item.nameKey);
              const itemType = t(TYPE_LABELS[item.type]);
              const rarityLabel = t(`rarity.${item.rarity.toLowerCase()}`);

              return (
                <StitchCard
                  key={item.id}
                  variant={isOwned || isFreeUnlocked ? 'outlined' : 'filled'}
                  hover={!isOwned && !isFreeUnlocked && !isClassLocked}
                  className="flex flex-col group"
                  style={{
                    borderColor: isOwned || isFreeUnlocked ? 'var(--md-sys-color-primary)' : `var(--md-sys-color-outline)`,
                    background: isOwned || isFreeUnlocked 
                      ? 'linear-gradient(145deg, var(--md-sys-color-primary)/10, var(--md-sys-color-surface-container))' 
                      : `linear-gradient(145deg, ${item.color}22, var(--md-sys-color-surface-container))`,
                    opacity: isClassLocked ? 0.5 : 1,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <StitchBadge
                      variant="surface"
                      size="xs"
                      icon={RARITY_ICONS[item.rarity]}
                      className="shrink-0"
                      style={{ background: RARITY_COLORS[item.rarity], color: item.rarity === 'COMUM' ? '#000' : '#fff' }}
                    >
                      {rarityLabel}
                    </StitchBadge>
                    {isOwned && (
                      <StitchBadge variant="primary" size="xs" icon="check_circle">
                        {t('cosmetic.owned')}
                      </StitchBadge>
                    )}
                    {isFreeUnlocked && !isOwned && (
                      <StitchBadge variant="secondary" size="xs" icon="lock_open">
                        {t('cosmetic.free')}
                      </StitchBadge>
                    )}
                    {isClassLocked && (
                      <StitchBadge variant="surface" size="xs" icon="lock">
                        {t('cosmetic.classLocked')}
                      </StitchBadge>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="text-5xl mb-3 transition-transform group-hover:scale-110" style={{ filter: isClassLocked ? 'grayscale(1)' : 'none' }}>
                      {item.preview}
                    </div>
                    <h3 className="font-bold text-center text-[var(--md-sys-color-on-surface)] mb-1 line-clamp-1">{itemName}</h3>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] text-center mb-3">{itemType}</p>
                    
                    {reason && !unlocked && (
                      <p className="text-xs text-[var(--md-sys-color-tertiary)] text-center mb-3 flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-xs">lock</span>
                        {t(reason)}
                      </p>
                    )}

                    <div className="w-full flex items-center justify-between pt-2 border-t border-[var(--md-sys-color-outline)]/10">
                      <span className="font-mono font-bold text-lg" style={{ color: item.color }}>
                        {item.price > 0 ? `${item.price}` : t('cosmetic.free')}
                      </span>
                      {item.price > 0 && (
                        <span className="material-symbols-outlined text-sm" style={{ color: 'var(--md-sys-color-secondary)' }}>diamond</span>
                      )}
                    </div>

                    {!isOwned && !isFreeUnlocked && !isClassLocked && (
                      <StitchButton
                        variant={canBuy ? 'filled' : 'tonal'}
                        fullWidth
                        className="mt-3"
                        disabled={!canBuy}
                        onClick={() => handleOpenConfirm(item)}
                        style={{ background: canBuy ? `linear-gradient(135deg, ${item.color}, ${item.color}dd)` : undefined }}
                      >
                        <span className="material-symbols-outlined text-sm mr-1">shopping_cart</span>
                        {canBuy ? t('cosmetic.buy') : t('cosmetic.cantAfford')}
                      </StitchButton>
                    )}

                    {isOwned && (
                      <StitchButton variant="surface" fullWidth className="mt-3" disabled>
                        <span className="material-symbols-outlined text-sm mr-1">check_circle</span>
                        {t('cosmetic.owned')}
                      </StitchButton>
                    )}

                    {(isFreeUnlocked && !isOwned) && (
                      <StitchButton variant="filled" fullWidth className="mt-3" onClick={() => handleBuy(item)}>
                        <span class="material-symbols-outlined text-sm mr-1">lock_open</span>
                        {t('cosmetic.claim')}
                      </StitchButton>
                    )}
                  </div>
                </StitchCard>
              );
            })}
          </StitchGrid>

          {/* Empty state */}
          {filteredCosmetics.length === 0 && (
            <StitchCard variant="filled" className="py-12 text-center">
              <span className="material-symbols-outlined text-6xl mb-4 block" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>inventory_2</span>
              <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)] mb-2">{t('cosmetic.noItems')}</h3>
              <p className="text-[var(--md-sys-color-on-surface-variant)]">{t('cosmetic.noItemsDesc')}</p>
            </StitchCard>
          )}

          {/* Buy Confirm Modal */}
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity ${showConfirm ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setShowConfirm(false)}
          >
            <StitchCard variant="elevated" className="w-full max-w-md p-6 animate-card-enter" onClick={e => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${selectedItem?.color}22, ${selectedItem?.color}44)` }}>
                  <span className="text-5xl">{selectedItem?.preview}</span>
                </div>
                <h2 className="font-serif text-xl font-bold text-[var(--md-sys-color-on-surface)]">{t(selectedItem?.nameKey)}</h2>
                <p className="text-[var(--md-sys-color-on-surface-variant)] mt-1">{t(TYPE_LABELS[selectedItem?.type])}</p>
              </div>

              <StitchDivider className="mb-4" />

              <div className="flex items-center justify-between mb-4">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">{t('cosmetic.price')}</span>
                <div className="flex items-center gap-2 font-bold text-lg" style={{ color: selectedItem?.color }}>
                  <span>{selectedItem?.price > 0 ? selectedItem?.price : t('cosmetic.free')}</span>
                  {selectedItem?.price > 0 && <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-secondary)' }}>diamond</span>}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">{t('cosmetic.yourGold')}</span>
                <div className="flex items-center gap-2 font-bold text-lg" style={{ color: 'var(--md-sys-color-secondary)' }}>
                  <span>{gold}</span>
                  <span className="material-symbols-outlined">diamond</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4 p-3 rounded-lg" style={{ background: gold >= (selectedItem?.price || 0) ? 'var(--md-sys-color-primary)/10' : 'var(--md-sys-color-error)/10' }}>
                <span className="text-[var(--md-sys-color-on-surface-variant)]">{t('cosmetic.remaining')}</span>
                <div className="flex items-center gap-2 font-bold text-lg" style={{ color: gold >= (selectedItem?.price || 0) ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-error)' }}>
                  <span>{gold - (selectedItem?.price || 0)}</span>
                  <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-secondary)' }}>diamond</span>
                </div>
              </div>

              <div className="flex gap-3">
                <StitchButton variant="outline" flex={1} onClick={() => setShowConfirm(false)}>
                  {t('common.cancel')}
                </StitchButton>
                <StitchButton
                  variant="filled"
                  flex={1}
                  onClick={handleConfirmBuy}
                  disabled={gold < (selectedItem?.price || 0)}
                  style={{ background: `linear-gradient(135deg, ${selectedItem?.color}, ${selectedItem?.color}dd)` }}
                >
                  {t('cosmetic.confirmBuy')}
                </StitchButton>
              </div>
            </StitchCard>
          </div>
        </div>
      </div>
    </StitchLayout>
  );
}