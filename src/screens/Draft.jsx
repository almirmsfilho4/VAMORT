import React, { useState, useEffect, useMemo } from 'react';
import StitchLayout from '../components/StitchLayout.jsx';
import { SCREENS } from '../data/constants.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getSupabase } from '../supabase.js';
import cards from '../data/hv_cards.json';
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
  StitchProgress,
  StitchCardRelic,
} from '../components/StitchUI.jsx';

const PICKS_PER_PACK = 3;
const TOTAL_PICKS = 30;
const PACK_SIZE = 15;

const RARITY_WEIGHTS = {
  COMUM: 60,
  RARA: 25,
  EPICA: 12,
  LENDARIA: 3,
};

function weightedRarity(rng) {
  const roll = rng() * 100;
  let acc = 0;
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    acc += weight;
    if (roll < acc) return rarity;
  }
  return 'COMUM';
}

function seededRNG(seed) {
  let state = seed >>> 0;
  return function() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function generatePack(rng, availableCards, picksSoFar = 0) {
  const pack = [];
  const guaranteedRareAt = [9, 19, 29];
  const isGuaranteedRare = guaranteedRareAt.includes(picksSoFar);

  for (let i = 0; i < PACK_SIZE; i++) {
    let rarity;
    if (isGuaranteedRare && i === 0) {
      const rareRoll = rng();
      rarity = rareRoll < 0.75 ? 'RARA' : (rareRoll < 0.95 ? 'EPICA' : 'LENDARIA');
    } else {
      rarity = weightedRarity(rng);
    }
    const pool = availableCards.filter(c => c.rarity === rarity);
    if (pool.length === 0) continue;
    const card = pool[Math.floor(rng() * pool.length)];
    pack.push(card);
  }
  return pack;
}

export default function Draft({ go, user, stats, deckIds, setDeckIds }) {
  const { t, lang } = useLanguage();
  const [phase, setPhase] = useState('lobby'); // lobby, drafting, review, complete
  const [draftId, setDraftId] = useState(null);
  const [seed, setSeed] = useState(null);
  const [rng, setRng] = useState(null);
  const [availableCards, setAvailableCards] = useState([]);
  const [currentPack, setCurrentPack] = useState([]);
  const [pickedCards, setPickedCards] = useState([]);
  const [pickNumber, setPickNumber] = useState(0);
  const [packNumber, setPackNumber] = useState(1);
  const [picksInPack, setPicksInPack] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [draftRecord, setDraftRecord] = useState(null);

  const maxPicks = TOTAL_PICKS;
  const progress = maxPicks > 0 ? (pickNumber / maxPicks) * 100 : 0;

  const filteredCards = useMemo(() => {
    if (!deckIds?.length) return cards;
    return cards.filter(c => !deckIds.includes(c.id));
  }, [deckIds]);

  const classCards = useMemo(() => {
    // Em draft, todas as classes disponíveis
    return filteredCards;
  }, [filteredCards]);

  async function startDraft() {
    if (!user) { go(SCREENS.Auth); return; }
    setIsLoading(true);
    const sb = getSupabase();
    const newSeed = Date.now() + Math.floor(Math.random() * 1000000);
    const newRng = seededRNG(newSeed);
    const packs = [];
    let allAvailable = classCards;

    // Pré-gerar todos os packs para consistência
    for (let p = 0; p < Math.ceil(TOTAL_PICKS / PICKS_PER_PACK); p++) {
      const pack = generatePack(newRng, allAvailable, p * PICKS_PER_PACK);
      packs.push(pack);
    }

    try {
      if (sb) {
        const { data, error } = await sb
          .from('drafts')
          .insert({
            user_id: user.id,
            seed: newSeed,
            picks: [],
            current_pack: 0,
            pack_number: 1,
            status: 'drafting',
            packs: packs,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (!error && data) {
          setDraftId(data.id);
        }
      }
    } catch (e) {
      console.error('Erro ao criar draft:', e);
    }

    setSeed(newSeed);
    setRng(newRng);
    setAvailableCards(classCards);
    setCurrentPack(packs[0] || []);
    setPickedCards([]);
    setPickNumber(0);
    setPackNumber(1);
    setPicksInPack(0);
    setPhase('drafting');
    setIsLoading(false);
  }

  async function pickCard(card) {
    if (phase !== 'drafting' || !currentPack.includes(card)) return;

    const newPicked = [...pickedCards, card];
    const newPickNumber = pickNumber + 1;
    const newPicksInPack = picksInPack + 1;

    setPickedCards(newPicked);
    setPickNumber(newPickNumber);
    setPicksInPack(newPicksInPack);

    // Remover card do pack atual
    const remainingPack = currentPack.filter(c => c.id !== card.id);
    setCurrentPack(remainingPack);

    // Salvar no servidor
    const sb = getSupabase();
    if (sb && draftId) {
      try {
        await sb.from('drafts').update({ picks: newPicked.map(c => c.id) }).eq('id', draftId);
      } catch (e) { console.error('Erro ao salvar pick:', e); }
    }

    // Verificar se pack acabou
    if (newPicksInPack >= PICKS_PER_PACK) {
      // Próximo pack
      const nextPackIndex = packNumber;
      const allPacks = [];
      // Regenerar packs com mesmo RNG
      let tempRng = seededRNG(seed);
      for (let p = 0; p < Math.ceil(TOTAL_PICKS / PICKS_PER_PACK); p++) {
        allPacks.push(generatePack(tempRng, classCards, p * PICKS_PER_PACK));
      }

      if (nextPackIndex < allPacks.length && newPickNumber < maxPicks) {
        setPackNumber(packNumber + 1);
        setPicksInPack(0);
        setCurrentPack(allPacks[nextPackIndex]);
        if (sb && draftId) {
          await sb.from('drafts').update({ current_pack: nextPackIndex, pack_number: packNumber + 1 }).eq('id', draftId);
        }
      } else {
        // Draft completo
        await completeDraft();
      }
    }
  }

  async function completeDraft() {
    setPhase('review');
    const sb = getSupabase();
    if (sb && draftId) {
      try {
        await sb.from('drafts').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', draftId);
        const { data } = await sb.from('drafts').select('*').eq('id', draftId).single();
        setDraftRecord(data);
      } catch (e) { console.error('Erro ao finalizar draft:', e); }
    }
  }

  async function saveDraftDeck() {
    if (!user) { go(SCREENS.Auth); return; }
    const sb = getSupabase();
    const newDeckIds = pickedCards.map(c => c.id);

    // Salvar no localStorage para a classe atual
    const cls = 'NEUTRAL'; // Draft é neutro
    localStorage.setItem('heroisEVampirosDeck_' + cls, JSON.stringify(newDeckIds));
    setDeckIds(newDeckIds);

    if (sb) {
      try {
        await sb.from('player_profiles').upsert({
          user_id: user.id,
          deck_ids: newDeckIds,
          updated_at: new Date().toISOString(),
        });
        await sb.from('drafts').update({ deck_ids: newDeckIds, status: 'deck_saved' }).eq('id', draftId);
      } catch (e) { console.error('Erro ao salvar deck do draft:', e); }
    }

    setShowConfirm(false);
    go(SCREENS.DeckBuilder);
  }

  async function loadRecentDrafts() {
    if (!user) return;
    const sb = getSupabase();
    if (!sb) return;
    try {
      const { data } = await sb
        .from('drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      // Poderia exibir histórico aqui
    } catch (e) { console.error('Erro ao carregar drafts:', e); }
  }

  useEffect(() => {
    loadRecentDrafts();
  }, [user]);

  const factionColors = {
    VAMPIRE: '#e6194b',
    HUMAN: '#2196f3',
    NEUTRAL: '#fabc4d',
  };

  const rarityColors = {
    COMUM: '#9e9e9e',
    RARA: '#2196f3',
    EPICA: '#9c27b0',
    LENDARIA: '#ff9800',
  };

  if (phase === 'lobby') {
    return (
      <StitchLayout currentScreen={SCREENS.Draft} go={go} user={user} stats={stats} leftSidebarOpen={false}>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12 md:py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-primary-dark))' }}>
                <span className="material-symbols-outlined text-white text-5xl" aria-hidden="true">style</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-[var(--md-sys-color-on-surface)] mb-4 font-serif">{t('draft.title')}</h1>
              <p className="text-lg text-[var(--md-sys-color-on-surface-variant)] max-w-2xl mx-auto mb-10">{t('draft.subtitle')}</p>

              <StitchCard variant="elevated" className="p-6 max-w-xl mx-auto mb-8" style={{ border: '1px solid var(--md-sys-color-secondary)/30' }}>
                <StitchStat label={t('draft.totalPicks')} value={TOTAL_PICKS} icon="style" className="mb-4" />
                <StitchStat label={t('draft.picksPerPack')} value={PICKS_PER_PACK} icon="layers" className="mb-4" />
                <StitchStat label={t('draft.packSize')} value={PACK_SIZE} icon="card_giftcard" />
              </StitchCard>

              <StitchButton
                variant="filled"
                size="lg"
                icon="play_arrow"
                onClick={startDraft}
                className="w-full max-w-md mx-auto"
                style={{
                  background: 'linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-primary-dark))',
                  fontSize: '1.1rem',
                  padding: '1rem 2rem',
                }}
              >
                {t('draft.startDraft')}
              </StitchButton>

              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-6 max-w-xl mx-auto">
                {t('draft.lobbyDesc')}
              </p>
            </div>

            {/* Regras do Draft */}
            <StitchSectionHeader title={t('draft.howItWorks')} className="mt-12 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: 'layers', title: t('draft.step1Title'), desc: t('draft.step1Desc') },
                { icon: 'star_rate', title: t('draft.step2Title'), desc: t('draft.step2Desc') },
                { icon: 'deck', title: t('draft.step3Title'), desc: t('draft.step3Desc') },
              ].map((step, i) => (
                <StitchCard key={i} variant="filled" className="p-6 text-center">
                  <span className="material-symbols-outlined text-4xl mb-3 block" style={{ color: 'var(--md-sys-color-secondary)' }}>{step.icon}</span>
                  <h3 className="font-bold text-lg text-[var(--md-sys-color-on-surface)] mb-2">{step.title}</h3>
                  <p className="text-[var(--md-sys-color-on-surface-variant)]">{step.desc}</p>
                </StitchCard>
              ))}
            </div>
          </div>
        </div>
      </StitchLayout>
    );
  }

  if (phase === 'drafting') {
    const currentPackCards = currentPack;
    const factionsInPack = [...new Set(currentPackCards.map(c => c.faction))];

    return (
      <StitchLayout currentScreen={SCREENS.Draft} go={go} user={user} stats={stats} leftSidebarOpen={false}>
        {/* Header com progresso */}
        <header className="sticky top-16 z-30 bg-[var(--md-sys-color-surface-container-lowest)]/95 backdrop-blur-2xl border-b border-[var(--md-sys-color-outline)]/10 px-4 py-3 lg:pl-[260px]">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <StitchBadge variant="primary" icon="style">{t('draft.pack')} {packNumber}</StitchBadge>
                <StitchBadge variant="secondary" icon="star_rate">{t('draft.pick')} {pickNumber + 1} / {maxPicks}</StitchBadge>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                <span className="material-symbols-outlined">style</span>
                <span>{pickedCards.length} {t('draft.cardsSelected')}</span>
              </div>
            </div>
            <StitchProgress value={progress} className="h-2" showLabel={false} />
          </div>
        </header>

        <main className="main-content flex-1 min-h-screen bg-[var(--md-sys-color-surface)] lg:pl-[260px] pt-0">
          <div className="max-w-5xl mx-auto p-4 md:p-6">
            {/* Pack Atual */}
            <StitchCard variant="elevated" className="mb-6 overflow-hidden" style={{ border: '1px solid var(--md-sys-color-secondary)/30' }}>
              <div className="p-4 border-b border-[var(--md-sys-color-outline)]/10 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-secondary)' }}>card_giftcard</span>
                  {t('draft.currentPack')} ({currentPackCards.length} {t('draft.cardsAvailable')})
                </h2>
                <StitchProgress value={(picksInPack / PICKS_PER_PACK) * 100} className="w-32 h-1.5" showLabel={false} />
              </div>
              <div className="p-4">
                <StitchGrid columns={5} gap={3} className="min-h-[280px]">
                  {currentPackCards.map((card, idx) => (
                    <StitchCardRelic
                      key={`${card.id}-${idx}`}
                      card={card}
                      compact={true}
                      onClick={() => pickCard(card)}
                      className="cursor-pointer hover:shadow-xl transition-shadow animate-card-enter"
                      style={{ animationDelay: `${idx * 50}ms`, border: '2px solid transparent' }}
                    />
                  ))}
                  {currentPackCards.length < PACK_SIZE && Array.from({ length: PACK_SIZE - currentPackCards.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-[2/3] rounded-lg bg-[var(--md-sys-color-surface-container-low)] border-2 border-dashed border-[var(--md-sys-color-outline)]/20 animate-pulse" />
                  ))}
                </StitchGrid>
              </div>
            </StitchCard>

            {/* Deck Atual (Cartas Escolhidas) */}
            <StitchSectionHeader title={`${t('draft.yourDeck')} (${pickedCards.length}/${maxPicks})`} className="mb-4" />
            <StitchCard variant="filled" className="min-h-[200px]">
              {pickedCards.length === 0 ? (
                <div className="p-8 text-center text-[var(--md-sys-color-on-surface-variant)]">
                  <span className="material-symbols-outlined text-4xl mb-3 block" style={{ color: 'var(--md-sys-color-secondary)' }}>deck</span>
                  <p>{t('draft.noCardsYet')}</p>
                </div>
              ) : (
                <div className="p-4">
                  <StitchGrid columns={{ base: 3, sm: 5, md: 7, lg: 10 }} gap={2}>
                    {pickedCards.map((card, idx) => (
                      <StitchCardRelic
                        key={`${card.id}-picked-${idx}`}
                        card={card}
                        compact={true}
                        className="animate-card-enter"
                        style={{ animationDelay: `${idx * 30}ms`, opacity: 0.9 }}
                      />
                    ))}
                  </StitchGrid>
                </div>
              )}
            </StitchCard>

            {/* Mana Curve Preview */}
            {pickedCards.length > 0 && (
              <StitchCard variant="outlined" className="mt-6 p-4" style={{ borderColor: 'var(--md-sys-color-secondary)/30' }}>
                <h3 className="font-bold text-[var(--md-sys-color-on-surface)] mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-secondary)' }}>show_chart</span>
                  {t('draft.manaCurve')}
                </h3>
                <div className="flex items-end gap-1 h-24">
                  {[0,1,2,3,4,5,6,7,8,9,10].map(cost => {
                    const count = pickedCards.filter(c => Math.min(c.cost || 0, 10) === cost).length;
                    const maxCount = Math.max(1, ...[0,1,2,3,4,5,6,7,8,9,10].map(c => pickedCards.filter(cc => Math.min(cc.cost || 0, 10) === c).length));
                    return (
                      <div key={cost} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-[var(--md-sys-color-primary)] rounded-t" style={{ height: `${(count / maxCount) * 100}%`, minHeight: count > 0 ? '4px' : '0' }} />
                        <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-mono">{cost}</span>
                        {count > 0 && <span className="text-xs font-bold text-[var(--md-sys-color-primary)]">{count}</span>}
                      </div>
                    );
                  })}
                </div>
              </StitchCard>
            )}

            {/* Faction Breakdown */}
            {pickedCards.length > 0 && (
              <StitchCard variant="outlined" className="mt-4 p-4" style={{ borderColor: 'var(--md-sys-color-secondary)/30' }}>
                <h3 className="font-bold text-[var(--md-sys-color-on-surface)] mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-secondary)' }}>pie_chart</span>
                  {t('draft.factionBreakdown')}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {['VAMPIRE', 'HUMAN', 'NEUTRAL'].map(faction => {
                    const count = pickedCards.filter(c => c.faction === faction).length;
                    if (count === 0) return null;
                    return (
                      <StitchBadge key={faction} variant="surface" icon={faction === 'VAMPIRE' ? 'bats' : faction === 'HUMAN' ? 'shield' : 'balance'} className="gap-1" style={{ borderLeft: `4px solid ${factionColors[faction]}` }}>
                        <span style={{ color: factionColors[faction] }}>{faction}</span>
                        <span className="font-mono">{count}</span>
                      </StitchBadge>
                    );
                  })}
                </div>
              </StitchCard>
            )}
          </div>
        </main>
      </StitchLayout>
    );
  }

  if (phase === 'review') {
    const deckIds = pickedCards.map(c => c.id);
    const manaCurve = [0,1,2,3,4,5,6,7,8,9,10].map(cost => ({
      cost,
      count: pickedCards.filter(c => Math.min(c.cost || 0, 10) === cost).length,
    }));
    const factions = {
      VAMPIRE: pickedCards.filter(c => c.faction === 'VAMPIRE').length,
      HUMAN: pickedCards.filter(c => c.faction === 'HUMAN').length,
      NEUTRAL: pickedCards.filter(c => c.faction === 'NEUTRAL').length,
    };
    const rarities = {
      COMUM: pickedCards.filter(c => c.rarity === 'COMUM').length,
      RARA: pickedCards.filter(c => c.rarity === 'RARA').length,
      EPICA: pickedCards.filter(c => c.rarity === 'EPICA').length,
      LENDARIA: pickedCards.filter(c => c.rarity === 'LENDARIA').length,
    };

    return (
      <StitchLayout currentScreen={SCREENS.Draft} go={go} user={user} stats={stats} leftSidebarOpen={false}>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--md-sys-color-secondary), #ffb300)' }}>
                <span className="material-symbols-outlined text-white text-4xl" aria-hidden="true">emoji_events</span>
              </div>
              <h1 className="text-3xl font-bold text-[var(--md-sys-color-on-surface)] mb-2">{t('draft.draftComplete')}</h1>
              <p className="text-[var(--md-sys-color-on-surface-variant)]">{t('draft.reviewYourDeck')}</p>
            </div>

            {/* Stats Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StitchCard variant="filled" className="p-4 text-center">
                <StitchStat value={pickedCards.length} label={t('draft.totalCards')} icon="style" />
              </StitchCard>
              <StitchCard variant="filled" className="p-4 text-center">
                <StitchStat value={rarities.LENDARIA + rarities.EPICA} label={t('draft.premiumCards')} icon="star_rate" variant="secondary" />
              </StitchCard>
              <StitchCard variant="filled" className="p-4 text-center">
                <StitchStat value={Math.round(pickedCards.reduce((a, c) => a + (c.cost || 0), 0) / pickedCards.length * 10) / 10} label={t('draft.avgCost')} icon="attach_money" variant="tertiary" />
              </StitchCard>
              <StitchCard variant="filled" className="p-4 text-center">
                <StitchStat value={factions.VAMPIRE > factions.HUMAN ? '🧛' : factions.HUMAN > factions.VAMPIRE ? '⚔️' : '⚖️'} label={t('draft.dominantFaction')} icon="groups" />
              </StitchCard>
            </div>

            {/* Mana Curve */}
            <StitchCard variant="elevated" className="mb-6 p-6" style={{ border: '1px solid var(--md-sys-color-secondary)/30' }}>
              <h3 className="font-bold text-lg text-[var(--md-sys-color-on-surface)] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-secondary)' }}>show_chart</span>
                {t('draft.manaCurve')}
              </h3>
              <div className="flex items-end gap-1 h-32">
                {manaCurve.map(({ cost, count }) => {
                  const maxCount = Math.max(1, ...manaCurve.map(m => m.count));
                  return (
                    <div key={cost} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-gradient-to-t from-[var(--md-sys-color-primary)] to-[var(--md-sys-color-secondary)] rounded-t" style={{ height: `${(count / maxCount) * 100}%`, minHeight: count > 0 ? '4px' : '0' }} />
                      <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-mono">{cost}</span>
                      {count > 0 && <span className="text-xs font-bold text-[var(--md-sys-color-primary)]">{count}</span>}
                    </div>
                  );
                })}
              </div>
            </StitchCard>

            {/* Faction & Rarity Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <StitchCard variant="filled" className="p-4">
                <h3 className="font-bold text-[var(--md-sys-color-on-surface)] mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-secondary)' }}>pie_chart</span>
                  {t('draft.factionBreakdown')}
                </h3>
                <div className="space-y-2">
                  {Object.entries(factions).filter(([,v]) => v > 0).map(([faction, count]) => (
                    <div key={faction} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ background: factionColors[faction] }} />
                        <span className="capitalize text-[var(--md-sys-color-on-surface)]">{faction.toLowerCase()}</span>
                      </div>
                      <span className="font-mono font-bold text-[var(--md-sys-color-primary)]" style={{ color: factionColors[faction] }}>{count}</span>
                    </div>
                  ))}
                </div>
              </StitchCard>

              <StitchCard variant="filled" className="p-4">
                <h3 className="font-bold text-[var(--md-sys-color-on-surface)] mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-secondary)' }}>diamond</span>
                  {t('draft.rarityBreakdown')}
                </h3>
                <div className="space-y-2">
                  {Object.entries(rarities).filter(([,v]) => v > 0).map(([rarity, count]) => (
                    <div key={rarity} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StitchBadge variant="surface" size="xs" icon="star" style={{ background: rarityColors[rarity], color: rarity === 'COMUM' ? '#000' : '#fff' }}>{rarity}</StitchBadge>
                      </div>
                      <span className="font-mono font-bold text-[var(--md-sys-color-primary)]" style={{ color: rarityColors[rarity] }}>{count}</span>
                    </div>
                  ))}
                </div>
              </StitchCard>
            </div>

            {/* Deck List */}
            <StitchSectionHeader title={`${t('draft.deckList')} (${pickedCards.length})`} className="mb-4" />
            <StitchCard variant="filled" className="max-h-96 overflow-y-auto">
              <StitchGrid columns={{ base: 2, sm: 3, md: 4, lg: 5 }} gap={2} className="p-4">
                {pickedCards.map((card, idx) => (
                  <StitchCardRelic
                    key={`${card.id}-review-${idx}`}
                    card={card}
                    compact={true}
                    className="animate-card-enter"
                    style={{ animationDelay: `${idx * 20}ms` }}
                  />
                ))}
              </StitchGrid>
            </StitchCard>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6 justify-center">
              <StitchButton variant="outline" icon="refresh" onClick={startDraft} className="w-full sm:w-auto">
                {t('draft.redraft')}
              </StitchButton>
              <StitchButton
                variant="filled"
                icon="save"
                onClick={() => setShowConfirm(true)}
                className="w-full sm:w-auto"
                style={{
                  background: 'linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-primary-dark))',
                }}
              >
                {t('draft.saveDeck')}
              </StitchButton>
              <StitchButton variant="tonal" icon="sports_esports" onClick={() => go(SCREENS.Arena)} className="w-full sm:w-auto">
                {t('draft.goToArena')}
              </StitchButton>
            </div>

            {/* Save Confirm Modal */}
            <StitchModal
              open={showConfirm}
              onClose={() => setShowConfirm(false)}
              title={t('draft.saveDeckTitle')}
              description={t('draft.saveDeckDesc')}
              maxWidth="md"
            >
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                <StitchButton variant="outline" onClick={() => setShowConfirm(false)}>{t('common.cancel')}</StitchButton>
                <StitchButton variant="primary" onClick={saveDraftDeck}>{t('draft.confirmSave')}</StitchButton>
              </div>
            </StitchModal>
          </div>
        </div>
      </StitchLayout>
    );
  }

  return null;
}