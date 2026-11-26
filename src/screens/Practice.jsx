import React, { useState, useEffect, useMemo } from 'react';
import StitchLayout from '../components/StitchLayout.jsx';
import { SCREENS, GAME, FACTIONS } from '../data/constants.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStitchAsset } from '../data/stitchAssets.js';
import {
  StitchButton,
  StitchCard,
  StitchHeroPanel,
  StitchSectionHeader,
  StitchGrid,
  StitchBadge,
  StitchStat,
  StitchSelect,
  StitchDivider,
} from '../components/StitchUI.jsx';
import cards from '../data/hv_cards.json';

const DIFFICULTIES = [
  { id: 'easy', labelKey: 'arena.easy', descKey: 'arena.easyDesc', icon: 'sentiment_satisfied', color: '#4caf50' },
  { id: 'normal', labelKey: 'arena.normal', descKey: 'arena.normalDesc', icon: 'sentiment_neutral', color: '#ff9800' },
  { id: 'hard', labelKey: 'arena.hard', descKey: 'arena.hardDesc', icon: 'psychology', color: '#e6194b' },
];

const AI_PERSONALITIES = [
  { id: 'balanced', nameKey: 'practice.ai.balanced', descKey: 'practice.ai.balancedDesc', icon: 'balance' },
  { id: 'aggressive', nameKey: 'practice.ai.aggressive', descKey: 'practice.ai.aggressiveDesc', icon: 'flash_on' },
  { id: 'control', nameKey: 'practice.ai.control', descKey: 'practice.ai.controlDesc', icon: 'shield' },
  { id: 'random', nameKey: 'practice.ai.random', descKey: 'practice.ai.randomDesc', icon: 'shuffle' },
];

export default function Practice({ go, stats, playerClass, deckIds }) {
  const { t } = useLanguage();
  const [difficulty, setDifficulty] = useState(() => {
    try { return localStorage.getItem('vamort_practice_difficulty') || 'normal'; } catch { return 'normal'; }
  });
  const [aiPersonality, setAiPersonality] = useState(() => {
    try { return localStorage.getItem('vamort_practice_ai') || 'balanced'; } catch { return 'balanced'; }
  });
  const [showDeckSelect, setShowDeckSelect] = useState(false);
  const [enemyClass, setEnemyClass] = useState(() => {
    try { return localStorage.getItem('vamort_practice_enemy_class') || 'VAMPIRE'; } catch { return 'VAMPIRE'; }
  });
  const [enemyDeckIds, setEnemyDeckIds] = useState(() => {
    try {
      const saved = localStorage.getItem('vamort_practice_enemy_deck');
      if (saved) return JSON.parse(saved);
    } catch {}
    return generateAIDeck(enemyClass);
  });
  const [isBattleStarting, setIsBattleStarting] = useState(false);

  useEffect(() => {
    localStorage.setItem('vamort_practice_difficulty', difficulty);
  }, [difficulty]);

  useEffect(() => {
    localStorage.setItem('vamort_practice_ai', aiPersonality);
  }, [aiPersonality]);

  useEffect(() => {
    localStorage.setItem('vamort_practice_enemy_class', enemyClass);
  }, [enemyClass]);

  const handleStartBattle = () => {
    if (deckIds.length === 0) {
      setShowDeckSelect(true);
      return;
    }
    setIsBattleStarting(true);
    // Save enemy deck
    localStorage.setItem('vamort_practice_enemy_deck', JSON.stringify(enemyDeckIds));
    // Navigate to battle screen with practice mode
    setTimeout(() => {
      go(SCREENS.Battle, {
        mode: 'practice',
        difficulty,
        aiPersonality,
        enemyClass,
        enemyDeckIds,
        playerDeckIds: deckIds,
      });
      setIsBattleStarting(false);
    }, 300);
  };

  const handleRegenerateEnemyDeck = () => {
    setEnemyDeckIds(generateAIDeck(enemyClass));
  };

  const enemyDeckCards = useMemo(() => {
    const counts = {};
    for (const id of enemyDeckIds) counts[id] = (counts[id] || 0) + 1;
    return Object.entries(counts)
      .map(([id, count]) => ({ card: cards.find(c => c.id === id), count }))
      .filter(x => x.card);
  }, [enemyDeckIds, enemyClass]);

  const playerDeckStats = useMemo(() => {
    if (deckIds.length === 0) return { count: 0, avgCost: 0, minions: 0, spells: 0 };
    const counts = {};
    for (const id of deckIds) counts[id] = (counts[id] || 0) + 1;
    const deckCards = Object.entries(counts).map(([id, count]) => ({
      card: cards.find(c => c.id === id),
      count
    })).filter(x => x.card);
    const totalCost = deckCards.reduce((sum, { card, count }) => sum + (card.cost || 0) * count, 0);
    const minions = deckCards.filter(({ card }) => card.type === 'MINION').reduce((sum, { count }) => sum + count, 0);
    const spells = deckCards.filter(({ card }) => card.type !== 'MINION').reduce((sum, { count }) => sum + count, 0);
    return {
      count: deckIds.length,
      avgCost: deckCards.length > 0 ? (totalCost / deckIds.length).toFixed(1) : 0,
      minions,
      spells,
    };
  }, [deckIds]);

  const enemyDeckStats = useMemo(() => {
    const totalCost = enemyDeckCards.reduce((sum, { card, count }) => sum + (card.cost || 0) * count, 0);
    const minions = enemyDeckCards.filter(({ card }) => card.type === 'MINION').reduce((sum, { count }) => sum + count, 0);
    const spells = enemyDeckCards.filter(({ card }) => card.type !== 'MINION').reduce((sum, { count }) => sum + count, 0);
    return {
      count: enemyDeckIds.length,
      avgCost: enemyDeckCards.length > 0 ? (totalCost / enemyDeckIds.length).toFixed(1) : 0,
      minions,
      spells,
    };
  }, [enemyDeckCards, enemyDeckIds]);

  const selectedDifficulty = DIFFICULTIES.find(d => d.id === difficulty) || DIFFICULTIES[1];
  const selectedAI = AI_PERSONALITIES.find(a => a.id === aiPersonality) || AI_PERSONALITIES[0];

  return (
    <StitchLayout go={go} stats={stats} playerClass={playerClass} currentScreen={SCREENS.Practice}>
      <main className="stitch-main-with-nav">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-6">
          {/* Hero Panel */}
          <StitchHeroPanel
            image={getStitchAsset('Practice', 'training_grounds')}
            imageAlt="Ancient training grounds with practice dummies and mystical runes"
            className="relative overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline)] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--md-sys-color-surface)] via-[var(--md-sys-color-surface)]/90 to-[var(--md-sys-color-surface)]/15" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--md-sys-color-surface)] via-transparent to-transparent" />
            <div className="relative z-10 px-5 py-7 sm:px-8 sm:py-8">
              <div className="flex flex-col min-[720px]:flex-row min-[720px]:items-end min-[720px]:justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--md-sys-color-tertiary)]">{t('nav.practice') || 'Modo Prática'}</p>
                  <h1 className="mt-2 font-serif text-[clamp(2rem,4.5vw,3.4rem)] leading-[1.02] tracking-[-0.02em] text-[var(--md-sys-color-on-surface)]">
                    {t('practice.title') || 'Campo de Treino'}
                  </h1>
                  <p className="mt-3 max-w-lg text-base leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
                    {t('practice.subtitle') || 'Aprimore suas táticas contra IA adaptável. Sem ranque, sem pressão.'}
                  </p>
                </div>
              </div>
            </div>
          </StitchHeroPanel>

          {/* Settings Panel */}
          <section aria-labelledby="settings-title">
            <StitchSectionHeader
              title={t('practice.settings') || 'Configurações do Treino'}
              icon="tune"
              className="mb-4"
            />
            <StitchGrid columns={{ base: 1, md: 2, lg: 4 }} gap="md">
              {/* Difficulty */}
              <StitchCard variant="filled" className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl" aria-hidden="true">{selectedDifficulty.icon}</span>
                  <h3 className="font-serif text-lg text-[var(--md-sys-color-on-surface)]">{t('practice.difficulty') || 'Dificuldade'}</h3>
                </div>
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-3">{t(selectedDifficulty.descKey)}</p>
                <div className="space-y-2">
                  {DIFFICULTIES.map(d => (
                    <label
                      key={d.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${difficulty === d.id ? 'bg-[var(--md-sys-color-primary-container)] border border-[var(--md-sys-color-primary)]' : 'bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'}`}
                    >
                      <input
                        type="radio"
                        name="difficulty"
                        value={d.id}
                        checked={difficulty === d.id}
                        onChange={() => setDifficulty(d.id)}
                        className="sr-only"
                      />
                      <span className="text-2xl" aria-hidden="true">{d.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-[var(--md-sys-color-on-surface)]">{t(d.labelKey)}</p>
                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{t(d.descKey)}</p>
                      </div>
                      {difficulty === d.id && <span className="text-[var(--md-sys-color-primary)]">✓</span>}
                    </label>
                  ))}
                </div>
              </StitchCard>

              {/* AI Personality */}
              <StitchCard variant="filled" className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl" aria-hidden="true">{selectedAI.icon}</span>
                  <h3 className="font-serif text-lg text-[var(--md-sys-color-on-surface)]">{t('practice.aiPersonality') || 'Personalidade da IA'}</h3>
                </div>
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-3">{t(selectedAI.descKey)}</p>
                <StitchSelect
                  value={aiPersonality}
                  onChange={setAiPersonality}
                  options={AI_PERSONALITIES.map(a => ({ value: a.id, label: t(a.nameKey) }))}
                  className="w-full"
                />
              </StitchCard>

              {/* Enemy Class */}
              <StitchCard variant="filled" className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl" aria-hidden="true">{enemyClass === 'VAMPIRE' ? '🧛' : '🛡️'}</span>
                  <h3 className="font-serif text-lg text-[var(--md-sys-color-on-surface)]">{t('practice.enemyClass') || 'Classe do Oponente'}</h3>
                </div>
                <StitchSelect
                  value={enemyClass}
                  onChange={e => {
                    const newClass = e.target.value;
                    setEnemyClass(newClass);
                    setEnemyDeckIds(generateAIDeck(newClass));
                  }}
                  options={[
                    { value: 'VAMPIRE', label: t('faction.vampire') || 'Vampiro' },
                    { value: 'HUMAN', label: t('faction.human') || 'Humano' },
                  ]}
                  className="w-full"
                />
              </StitchCard>

              {/* Deck Stats */}
              <StitchCard variant="filled" className="p-4">
                <h3 className="font-serif text-lg text-[var(--md-sys-color-on-surface)] mb-3">{t('practice.deckStats') || 'Estatísticas do Deck'}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <StitchStat value={playerDeckStats.count} label={t('practice.cards') || 'Cartas'} icon="style" variant="primary" />
                  <StitchStat value={playerDeckStats.avgCost} label={t('practice.avgCost') || 'Custo Médio'} icon="attach_money" variant="secondary" />
                  <StitchStat value={playerDeckStats.minions} label={t('practice.minions') || 'Lacaios'} icon="groups" variant="primary" />
                  <StitchStat value={playerDeckStats.spells} label={t('practice.spells') || 'Feitiços'} icon="auto_awesome" variant="secondary" />
                </div>
              </StitchCard>
            </StitchGrid>
          </section>

          {/* Deck Preview */}
          <section aria-labelledby="decks-title" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Player Deck */}
            <StitchCard variant="filled" className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${playerClass === 'VAMPIRE' ? 'bg-[var(--md-sys-color-primary-container)]' : 'bg-[var(--md-sys-color-secondary-container)]'}`}>
                    {playerClass === 'VAMPIRE' ? '🧛' : '🛡️'}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-[var(--md-sys-color-on-surface)]">{t('practice.yourDeck') || 'Seu Deck'}</h3>
                    <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{t('faction.' + playerClass.toLowerCase()) || playerClass}</p>
                  </div>
                </div>
                <StitchButton
                  variant={deckIds.length === 0 ? 'filled' : 'outlined'}
                  size="sm"
                  leftIcon={deckIds.length === 0 ? 'add' : 'edit'}
                  onClick={() => setShowDeckSelect(true)}
                  disabled={isBattleStarting}
                >
                  {deckIds.length === 0 ? t('practice.selectDeck') || 'Selecionar Deck' : t('practice.changeDeck') || 'Trocar Deck'}
                </StitchButton>
              </div>

              {deckIds.length === 0 ? (
                <div className="text-center py-8 text-[var(--md-sys-color-on-surface-variant)]">
                  <span className="text-4xl mb-3 block" aria-hidden="true">📋</span>
                  <p>{t('practice.noDeck') || 'Nenhum deck selecionado'}</p>
                  <p className="text-sm mt-1">{t('practice.noDeckDesc') || 'Crie ou importe um deck no Grimório primeiro'}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Object.entries(useMemo(() => {
                    const m = {};
                    for (const id of deckIds) m[id] = (m[id] || 0) + 1;
                    return m;
                  }, [deckIds])).map(([id, count]) => {
                    const card = cards.find(c => c.id === id);
                    if (!card) return null;
                    return (
                      <div key={id} className="flex items-center gap-3 p-2 bg-[var(--md-sys-color-surface-container)] rounded-lg">
                        <div className="w-10 h-14 bg-[var(--md-sys-color-surface-container-low)] rounded border border-[var(--md-sys-color-outline)] flex items-center justify-center text-xs font-bold text-[var(--md-sys-color-on-surface-variant)]">
                          {card.cost}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--md-sys-color-on-surface)] truncate">{card.name}</p>
                          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{t('cardType.' + card.type) || card.type} • {card.faction}</p>
                        </div>
                        <span className="text-sm font-bold text-[var(--md-sys-color-on-surface)] text-[var(--md-sys-color-primary)]">×{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </StitchCard>

            {/* Enemy Deck */}
            <StitchCard variant="filled" className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${enemyClass === 'VAMPIRE' ? 'bg-[var(--md-sys-color-primary-container)]' : 'bg-[var(--md-sys-color-secondary-container)]'}`}>
                    {enemyClass === 'VAMPIRE' ? '🧛' : '🛡️'}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-[var(--md-sys-color-on-surface)]">{t('practice.enemyDeck') || 'Deck do Oponente'}</h3>
                    <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{t('faction.' + enemyClass.toLowerCase()) || enemyClass}</p>
                  </div>
                </div>
                <StitchButton
                  variant="tonal"
                  size="sm"
                  leftIcon="refresh"
                  onClick={handleRegenerateEnemyDeck}
                  disabled={isBattleStarting}
                >
                  {t('practice.regenerate') || 'Regenerar'}
                </StitchButton>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {enemyDeckCards.map(({ card, count }) => (
                  <div key={card.id} className="flex items-center gap-3 p-2 bg-[var(--md-sys-color-surface-container)] rounded-lg">
                    <div className="w-10 h-14 bg-[var(--md-sys-color-surface-container-low)] rounded border border-[var(--md-sys-color-outline)] flex items-center justify-center text-xs font-bold text-[var(--md-sys-color-on-surface-variant)]">
                      {card.cost}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--md-sys-color-on-surface)] truncate">{card.name}</p>
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{t('cardType.' + card.type) || card.type} • {card.faction}</p>
                    </div>
                    <span className="text-sm font-bold text-[var(--md-sys-color-on-surface)] text-[var(--md-sys-color-error)]">×{count}</span>
                  </div>
                ))}
              </div>
            </StitchCard>
          </section>

          {/* Start Battle */}
          <section>
            <StitchDivider className="my-4" />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <StitchBadge variant="tertiary" className="text-sm">
                  {t(selectedDifficulty.labelKey)}
                </StitchBadge>
                <StitchBadge variant="secondary" className="text-sm">
                  {t(selectedAI.nameKey)}
                </StitchBadge>
                <StitchBadge variant="primary" className="text-sm">
                  {t('faction.' + enemyClass.toLowerCase()) || enemyClass}
                </StitchBadge>
              </div>
              <StitchButton
                variant="filled"
                size="xl"
                leftIcon="sports_martial_arts"
                onClick={handleStartBattle}
                disabled={isBattleStarting || deckIds.length === 0}
                className="w-full sm:w-auto"
                style={{
                  background: 'linear-gradient(135deg, var(--md-sys-color-tertiary), var(--md-sys-color-tertiary-dark))',
                  boxShadow: '0 8px 32px rgba(116,86,174,0.4)'
                }}
              >
                {isBattleStarting ? t('common.loading') : (t('practice.startBtn') || 'Iniciar Treino')}
              </StitchButton>
            </div>
          </section>

          {/* Tips */}
          <StitchCard variant="outlined" className="mt-6 p-4 border-[var(--md-sys-color-tertiary)]">
            <h4 className="font-semibold text-[var(--md-sys-color-tertiary)] mb-2 flex items-center gap-2">
              <span aria-hidden="true">💡</span>
              {t('practice.tipsTitle') || 'Dicas de Treino'}
            </h4>
            <ul className="space-y-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">
              <li>• {t('practice.tip1') || 'Teste decks novos sem perder ranque'}</li>
              <li>• {t('practice.tip2') || 'Ajuste a dificuldade conforme seu nível'}</li>
              <li>• {t('practice.tip3') || 'IA Agressiva pressiona cedo; IA Controle joga pelo valor'}</li>
              <li>• {t('practice.tip4') || 'Use "Regenerar" para variar o deck inimigo'}</li>
            </ul>
          </StitchCard>
        </div>
      </main>

      {/* Deck Select Modal */}
      {showDeckSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="deck-select-title">
          <StitchCard variant="filled" className="w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--md-sys-color-outline)]">
              <h2 id="deck-select-title" className="font-serif text-xl text-[var(--md-sys-color-on-surface)]">
                {t('practice.selectDeck') || 'Selecionar Deck'}
              </h2>
              <StitchIconButton
                variant="ghost"
                size="sm"
                icon="close"
                onClick={() => setShowDeckSelect(false)}
                aria-label={t('common.close')}
              />
            </div>
            <div className="p-4 overflow-y-auto">
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-4">
                {t('practice.selectDeckDesc') || 'Escolha um deck salvo ou crie um novo no Grimório'}
              </p>
              {/* This would integrate with the deck system - for now show message */}
              <div className="text-center py-8 text-[var(--md-sys-color-on-surface-variant)]">
                <span className="text-4xl mb-3 block" aria-hidden="true">📋</span>
                <p>{t('practice.goToDeckBuilder') || 'Vá ao Grimório para criar/editar decks'}</p>
                <StitchButton
                  variant="filled"
                  size="lg"
                  leftIcon="edit"
                  onClick={() => { setShowDeckSelect(false); go(SCREENS.DeckBuilder); }}
                  className="mt-4"
                >
                  {t('practice.openDeckBuilder') || 'Abrir Grimório'}
                </StitchButton>
              </div>
            </div>
          </StitchCard>
        </div>
      )}
    </StitchLayout>
  );
}

function generateAIDeck(faction) {
  const factionCards = cards.filter(c =>
    (c.faction === faction || c.faction === 'NEUTRAL') && c.rarity !== 'LENDARIA'
  );
  const deck = [];
  const counts = {};
  const maxCopies = 2;

  while (deck.length < 30) {
    const card = factionCards[Math.floor(Math.random() * factionCards.length)];
    const currentCount = counts[card.id] || 0;
    if (currentCount < maxCopies) {
      deck.push(card.id);
      counts[card.id] = currentCount + 1;
    }
  }

  return deck;
}