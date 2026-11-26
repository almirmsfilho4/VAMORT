import React, { useState, useMemo, useEffect } from 'react';
import StitchLayout from '../components/StitchLayout.jsx';
import { SCREENS, RARITIES } from '../data/constants.js';
import cards from '../data/hv_cards.json';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getSupabase } from '../supabase.js';
import {
  StitchButton,
  StitchCard,
  StitchSectionHeader,
  StitchGrid,
  StitchBadge,
  StitchStat,
  StitchDivider,
  StitchIconButton,
  StitchTabs,
  StitchTextField,
  StitchModal,
  StitchTooltip,
  StitchCardRelic,
  StitchSelect,
} from '../components/StitchUI.jsx';

// Custos de crafting/desencantar por raridade
const CRAFT_COSTS = {
  COMUM: { craft: 40, disenchant: 5 },
  RARA: { craft: 100, disenchant: 20 },
  EPICA: { craft: 400, disenchant: 100 },
  LENDARIA: { craft: 1600, disenchant: 400 },
};

const RARITY_ORDER = ['COMUM', 'RARA', 'EPICA', 'LENDARIA'];

export default function CraftingScreen({ go, stats, setStats, user }) {
  const { t, lang } = useLanguage();
  const [dust, setDust] = useState(stats?.dust || 0);
  const [ownedCards, setOwnedCards] = useState(stats?.ownedCards || []);
  const [activeTab, setActiveTab] = useState('collection'); // collection, craft
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRarity, setFilterRarity] = useState('all');
  const [filterFaction, setFilterFaction] = useState('all');
  const [showCraftModal, setShowCraftModal] = useState(null);
  const [craftQuantity, setCraftQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Sincroniza dust com stats
  useEffect(() => {
    setDust(stats?.dust || 0);
    setOwnedCards(stats?.ownedCards || []);
  }, [stats]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const getOwnedCount = (cardId) => {
    return ownedCards.filter(id => id === cardId).length;
  };

  const getMaxInDeck = (card) => {
    return card.rarity === 'LENDARIA' ? 1 : 2;
  };

  const getAvailableForDisenchant = (card) => {
    const owned = getOwnedCount(card.id);
    const maxAllowed = getMaxInDeck(card);
    return Math.max(0, owned - maxAllowed);
  };

  const canCraft = (card) => {
    const cost = CRAFT_COSTS[card.rarity]?.craft || 0;
    const owned = getOwnedCount(card.id);
    const maxAllowed = getMaxInDeck(card);
    return dust >= cost && owned < maxAllowed;
  };

  const handleCraft = async (card) => {
    if (!canCraft(card)) return;
    
    const cost = CRAFT_COSTS[card.rarity].craft * craftQuantity;
    if (dust < cost) {
      showToast(t('crafting.insufficientDust'), 'error');
      return;
    }

    setIsLoading(true);
    try {
      // Atualiza localmente primeiro
      const newOwned = [...ownedCards];
      for (let i = 0; i < craftQuantity; i++) {
        newOwned.push(card.id);
      }
      setOwnedCards(newOwned);
      setDust(d => d - cost);
      
      // Persiste no Supabase se logado
      if (user?.id) {
        const sb = getSupabase();
        if (sb) {
          await sb.from('player_stats').upsert({
            user_id: user.id,
            dust: dust - cost,
            owned_cards: newOwned,
          }, { onConflict: 'user_id' });
        }
      }
      
      // Atualiza stats global
      setStats(s => ({ ...s, dust: dust - cost, ownedCards: newOwned }));
      
      showToast(t('crafting.craftedSuccess').replace('{name}', card.name), 'success');
      setShowCraftModal(null);
    } catch (e) {
      console.error('Erro ao craftar:', e);
      showToast(t('crafting.error'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisenchant = async (card, quantity = 1) => {
    const available = getAvailableForDisenchant(card);
    if (quantity > available) {
      showToast(t('crafting.noExcessCopies'), 'error');
      return;
    }

    const gain = CRAFT_COSTS[card.rarity].disenchant * quantity;
    const newOwned = ownedCards.filter((id, i) => {
      if (id === card.id && quantity > 0) {
        quantity--;
        return false;
      }
      return true;
    });

    try {
      setOwnedCards(newOwned);
      setDust(d => d + gain);
      
      if (user?.id) {
        const sb = getSupabase();
        if (sb) {
          await sb.from('player_stats').upsert({
            user_id: user.id,
            dust: dust + gain,
            owned_cards: newOwned,
          }, { onConflict: 'user_id' });
        }
      }
      
      setStats(s => ({ ...s, dust: dust + gain, ownedCards: newOwned }));
      showToast(t('crafting.disenchantedSuccess').replace('{name}', card.name).replace('{amount}', gain), 'success');
    } catch (e) {
      console.error('Erro ao desencantar:', e);
      showToast(t('crafting.error'), 'error');
    }
  };

  const handleMassDisenchant = async (rarity) => {
    const excessCards = ownedCards.filter(id => {
      const card = cards.find(c => c.id === id);
      return card && card.rarity === rarity && getAvailableForDisenchant(card) > 0;
    });
    
    if (excessCards.length === 0) {
      showToast(t('crafting.noExcessOfRarity').replace('{rarity}', t(`rarity.${rarity.toLowerCase()}`)), 'info');
      return;
    }

    const totalGain = excessCards.reduce((sum, id) => {
      const card = cards.find(c => c.id === id);
      return sum + (CRAFT_COSTS[card.rarity]?.disenchant || 0);
    }, 0);

    const newOwned = ownedCards.filter(id => {
      const card = cards.find(c => c.id === id);
      return !card || card.rarity !== rarity || getAvailableForDisenchant(card) === 0;
    });

    try {
      setOwnedCards(newOwned);
      setDust(d => d + totalGain);
      
      if (user?.id) {
        const sb = getSupabase();
        if (sb) {
          await sb.from('player_stats').upsert({
            user_id: user.id,
            dust: dust + totalGain,
            owned_cards: newOwned,
          }, { onConflict: 'user_id' });
        }
      }
      
      setStats(s => ({ ...s, dust: dust + totalGain, ownedCards: newOwned }));
      showToast(t('crafting.massDisenchantSuccess').replace('{count}', excessCards.length).replace('{amount}', totalGain), 'success');
    } catch (e) {
      console.error('Erro ao desencantar em massa:', e);
      showToast(t('crafting.error'), 'error');
    }
  };

  // Cartas filtradas para aba "Coleção"
  const collectionCards = useMemo(() => {
    return cards.filter(card => {
      const owned = getOwnedCount(card.id);
      const matchesSearch = searchQuery === '' || 
        card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (card.description && card.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesRarity = filterRarity === 'all' || card.rarity === filterRarity;
      const matchesFaction = filterFaction === 'all' || card.faction === filterFaction;
      
      // Na aba coleção, mostra apenas cartas possuídas
      return owned > 0 && matchesSearch && matchesRarity && matchesFaction;
    }).sort((a, b => {
      // Ordena por raridade (lendária primeiro) depois nome
      const ra = RARITY_ORDER.indexOf(a.rarity);
      const rb = RARITY_ORDER.indexOf(b.rarity);
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    }));
  }, [ownedCards, searchQuery, filterRarity, filterFaction]);

  // Cartas filtradas para aba "Crafting" (todas as cartas, mesmo não possuídas)
  const craftingCards = useMemo(() => {
    return cards.filter(card => {
      const matchesSearch = searchQuery === '' || 
        card.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRarity = filterRarity === 'all' || card.rarity === filterRarity;
      const matchesFaction = filterFaction === 'all' || card.faction === filterFaction;
      return matchesSearch && matchesRarity && matchesFaction;
    }).sort((a, b) => {
      const ra = RARITY_ORDER.indexOf(a.rarity);
      const rb = RARITY_ORDER.indexOf(b.rarity);
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });
  }, [searchQuery, filterRarity, filterFaction]);

  const tabs = [
    { id: 'collection', label: t('crafting.tabCollection'), icon: 'collections_bookmark' },
    { id: 'craft', label: t('crafting.tabCrafting'), icon: 'auto_fix_high' },
  ];

  return (
    <StitchLayout currentScreen={SCREENS.Crafting} onNavigate={go}>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header com Dust */}
        <StitchCard variant="elevated" className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #fabc4d, #e5a91a)' }}>
              <span className="material-symbols-outlined text-2xl text-white" aria-hidden="true">diamond</span>
            </div>
            <div>
              <div className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{t('crafting.arcaneDust')}</div>
              <div className="text-3xl font-bold font-serif text-[var(--md-sys-color-secondary)]">{dust.toLocaleString()}</div>
            </div>
          </div>
          
          <StitchTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </StitchCard>

        {/* Filtros */}
        <StitchCard variant="outlined" className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <StitchTextField
              label={t('crafting.searchPlaceholder')}
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('crafting.searchPlaceholder')}
              leftIcon="search"
              className="flex-1"
            />
            <StitchSelect
              label={t('crafting.filterRarity')}
              value={filterRarity}
              onChange={setFilterRarity}
              options={[
                { value: 'all', label: t('crafting.allRarities') },
                { value: 'COMUM', label: t('rarity.comum') },
                { value: 'RARA', label: t('rarity.rara') },
                { value: 'EPICA', label: t('rarity.epica') },
                { value: 'LENDARIA', label: t('rarity.lendaria') },
              ]}
              className="w-full sm:w-48"
            />
            <StitchSelect
              label={t('crafting.filterFaction')}
              value={filterFaction}
              onChange={setFilterFaction}
              options={[
                { value: 'all', label: t('crafting.allFactions') },
                { value: 'HUMAN', label: t('factions.human') },
                { value: 'VAMPIRE', label: t('factions.vampire') },
                { value: 'NEUTRAL', label: t('factions.neutral') },
              ]}
              className="w-full sm:w-48"
            />
          </div>
        </StitchCard>

        {/* Grid de Cartas */}
        <StitchCard variant="outlined" className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <StitchSectionHeader
              title={activeTab === 'collection' 
                ? t('crafting.ownedCardsTitle').replace('{count}', collectionCards.length)
                : t('crafting.allCardsTitle').replace('{count}', craftingCards.length)
              }
              icon={activeTab === 'collection' ? 'inventory_2' : 'shopping_bag'}
            />
            {activeTab === 'collection' && (
              <StitchButton
                variant="tonal"
                size="sm"
                leftIcon="auto_fix_high"
                onClick={() => {
                  const raritiesWithExcess = RARITY_ORDER.filter(r => 
                    ownedCards.some(id => {
                      const card = cards.find(c => c.id === id);
                      return card && card.rarity === r && getAvailableForDisenchant(card) > 0;
                    })
                  );
                  if (raritiesWithExcess.length === 1) {
                    handleMassDisenchant(raritiesWithExcess[0]);
                  } else if (raritiesWithExcess.length > 1) {
                    // Poderia abrir modal para escolher, por simplicidade faz a primeira
                    handleMassDisenchant(raritiesWithExcess[0]);
                  } else {
                    showToast(t('crafting.noExcessCopies'), 'info');
                  }
                }}
              >
                {t('crafting.disenchantExcess')}
              </StitchButton>
            )}
          </div>

          {activeTab === 'collection' && collectionCards.length === 0 && (
            <div className="text-center py-12 text-[var(--md-sys-color-on-surface-variant)]">
              <span className="material-symbols-outlined text-6xl mb-4 block" aria-hidden="true">inventory</span>
              <p className="text-lg">{t('crafting.noOwnedCards')}</p>
              <p className="text-sm mt-2">{t('crafting.noOwnedCardsDesc')}</p>
            </div>
          )}

          {activeTab === 'craft' && craftingCards.length === 0 && (
            <div className="text-center py-12 text-[var(--md-sys-color-on-surface-variant)]">
              <span className="material-symbols-outlined text-6xl mb-4 block" aria-hidden="true">search_off</span>
              <p className="text-lg">{t('crafting.noCardsFound')}</p>
            </div>
          )}

          <StitchGrid columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }} gap="md" className="min-h-[200px]">
            {(activeTab === 'collection' ? collectionCards : craftingCards).map(card => {
              const owned = getOwnedCount(card.id);
              const maxAllowed = getMaxInDeck(card);
              const availableForDisenchant = activeTab === 'collection' ? getAvailableForDisenchant(card) : 0;
              const canCraftCard = activeTab === 'craft' && canCraft(card);
              const craftCost = CRAFT_COSTS[card.rarity]?.craft || 0;
              const disenchantValue = CRAFT_COSTS[card.rarity]?.disenchant || 0;

              return (
                <StitchTooltip
                  key={card.id}
                  label={`${card.name} (${owned}/${maxAllowed})`}
                  position="top"
                >
                  <StitchCardRelic
                    card={card}
                    size="sm"
                    showCost={true}
                    disabled={activeTab === 'craft' && !canCraftCard}
                    className={`relative ${availableForDisenchant > 0 ? 'ring-2 ring-[var(--md-sys-color-tertiary)]' : ''}`}
                    onClick={() => activeTab === 'craft' && canCraftCard && setShowCraftModal({ card, owned, maxAllowed })}
                  >
                    {availableForDisenchant > 0 && (
                      <StitchTooltip label={t('crafting.disenchantableTooltip').replace('{count}', availableForDisenchant)} position="top">
                        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--md-sys-color-tertiary)' }}>
                          {availableForDisenchant}
                        </div>
                      </StitchTooltip>
                    )}
                    {activeTab === 'craft' && owned >= maxAllowed && (
                      <div className="absolute inset-0 bg-[var(--md-sys-color-surface)]/80 flex items-center justify-center rounded-lg">
                        <span className="material-symbols-outlined text-2xl text-[var(--md-sys-color-on-surface-variant)]" aria-hidden="true">check_circle</span>
                      </div>
                    )}
                  </StitchCardRelic>
                </StitchTooltip>
              );
            })}
          </StitchGrid>
        </StitchCard>

        {/* Modal de Crafting */}
        <StitchModal
          isOpen={!!showCraftModal}
          onClose={() => { setShowCraftModal(null); setCraftQuantity(1); }}
          title={t('crafting.craftCard').replace('{name}', showCraftModal?.card?.name || '')}
          size="md"
        >
          {showCraftModal && (() => {
            const craftCost = CRAFT_COSTS[showCraftModal.card?.rarity]?.craft || 0;
            return (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-[var(--md-sys-color-surface-container)] rounded-lg">
                <StitchCardRelic card={showCraftModal.card} size="md" showCost={true} />
                <div className="flex-1">
                  <h4 className="font-bold text-lg">{showCraftModal.card.name}</h4>
                  <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                    {t('crafting.owned').replace('{owned}', showCraftModal.owned).replace('{max}', showCraftModal.maxAllowed)}
                  </p>
                  <p className="text-sm text-[var(--md-sys-color-secondary)] font-medium mt-1">
                    {t('crafting.craftCost').replace('{cost}', craftCost.toLocaleString())}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('crafting.quantity')}</label>
                <div className="flex items-center gap-4">
                  <StitchIconButton
                    icon="remove"
                    onClick={() => setCraftQuantity(q => Math.max(1, q - 1))}
                    disabled={craftQuantity <= 1}
                    aria-label={t('crafting.decrease')}
                  />
                  <div className="w-20 text-center text-xl font-bold">{craftQuantity}</div>
                  <StitchIconButton
                    icon="add"
                    onClick={() => setCraftQuantity(q => Math.min(showCraftModal.maxAllowed - showCraftModal.owned, q + 1))}
                    disabled={craftQuantity >= showCraftModal.maxAllowed - showCraftModal.owned}
                    aria-label={t('crafting.increase')}
                  />
                  <span className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                    {t('crafting.maxAllowed').replace('{max}', showCraftModal.maxAllowed - showCraftModal.owned)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-[var(--md-sys-color-surface-container)] rounded-lg">
                <span className="font-medium">{t('crafting.totalCost')}</span>
                <span className="text-lg font-bold text-[var(--md-sys-color-secondary)]">
                  {craftCost * craftQuantity} {t('crafting.dustShort')}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <StitchButton
                  variant="tonal"
                  fullWidth
                  onClick={() => { setShowCraftModal(null); setCraftQuantity(1); }}
                >
                  {t('common.cancel')}
                </StitchButton>
                <StitchButton
                  variant="filled"
                  fullWidth
                  leftIcon="auto_fix_high"
                  onClick={() => handleCraft(showCraftModal.card)}
                  disabled={isLoading || dust < craftCost * craftQuantity}
                >
                  {isLoading ? t('common.crafting') : t('crafting.craftButton').replace('{cost}', (craftCost * craftQuantity).toLocaleString())}
                </StitchButton>
              </div>
            </div>
            );
          })()}

        {/* Toasts */}
        <div className="fixed bottom-4 left-4 right-4 z-50 space-y-2 pointer-events-none sm:bottom-4 sm:right-4 sm:left-auto sm:max-w-md">
          {toasts.map(toast => (
            <StitchCard
              key={toast.id}
              variant="elevated"
              className="pointer-events-auto animate-slide-in-right w-full max-w-xs sm:max-w-md"
              style={{
                borderLeft: `4px solid ${toast.type === 'success' ? '#22c55e' : toast.type === 'error' ? '#ef4444' : '#fabc4d'}`,
              }}
            >
              <div className="flex items-center gap-3 p-3">
                <span className="material-symbols-outlined text-lg" style={{ 
                  color: toast.type === 'success' ? '#22c55e' : toast.type === 'error' ? '#ef4444' : '#fabc4d' 
                }}>
                  {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
                </span>
                <span className="flex-1 text-sm">{toast.message}</span>
              </div>
            </StitchCard>
          ))}
        </div>
      </div>
    </StitchLayout>
  );
}