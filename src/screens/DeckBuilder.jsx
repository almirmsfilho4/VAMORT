import React, { useMemo, useState, useEffect } from 'react';
import StitchLayout from '../components/StitchLayout.jsx';
import StitchCardRelic from '../components/StitchCardRelic.jsx';
import cards from '../data/hv_cards.json';
import { SCREENS, GAME, FACTION_LABEL } from '../data/constants.js';
import { getStitchAsset } from '../data/stitchAssets.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import {
  StitchButton,
  StitchCard,
  StitchGrid,
  StitchSectionHeader,
  StitchProgress,
  StitchHeroPanel,
  StitchInput,
  StitchBadge,
  StitchStat,
  StitchDivider,
  StitchIconButton,
  StitchModal,
} from '../components/StitchUI.jsx';
import { encodeDeck, decodeDeck, getDeckShareUrl, getDeckCodeFromUrl } from '../utils/deckCode.js';

function filterCardsByClass(classId) {
  if (classId === 'VAMPIRE') {
    return cards.filter(c => c.faction === 'VAMPIRE' || c.faction === 'NEUTRAL');
  }
  if (classId === 'HUMAN') {
    return cards.filter(c => c.faction === 'HUMAN' || c.faction === 'NEUTRAL');
  }
  return cards;
}

export default function DeckBuilder({ go, deckIds, setDeckIds, playerClass, stats }) {
  const { t } = useLanguage();
  const [classFilter, setClassFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState('');
  const [exportCode, setExportCode] = useState('');

  // Load deck from URL on mount
  useEffect(() => {
    const code = getDeckCodeFromUrl();
    if (code) {
      const decoded = decodeDeck(code);
      if (decoded.length > 0) {
        setDeckIds(decoded);
        // Clean URL hash
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const counts = useMemo(() => {
    const m = {};
    for (const id of deckIds) m[id] = (m[id] || 0) + 1;
    return m;
  }, [deckIds]);

  const availableCards = useMemo(() => {
    let result = cards;
    if (classFilter !== 'ALL') {
      result = filterCardsByClass(classFilter);
    }
    if (searchTerm) {
      result = result.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.id && c.id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return result;
  }, [classFilter, searchTerm]);

  const add = (card) => {
    if (deckIds.length >= GAME.maxDeckSize) return;
    const have = counts[card.id] || 0;
    const max = card.maxInDeck || 2;
    if (have >= max) return;
    setDeckIds([...deckIds, card.id]);
  };

  const remove = (cardId) => {
    const idx = deckIds.indexOf(cardId);
    if (idx === -1) return;
    const copy = [...deckIds];
    copy.splice(idx, 1);
    setDeckIds(copy);
  };

  const clear = () => setDeckIds([]);

  const autoFill = () => {
    const ids = [];
    for (const c of cards) {
      const n = Math.min(2, c.maxInDeck || 2);
      for (let i = 0; i < n && ids.length < GAME.maxDeckSize; i++) ids.push(c.id);
    }
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setDeckIds(ids.slice(0, GAME.maxDeckSize));
  };

  const handleExport = () => {
    const code = encodeDeck(deckIds);
    setExportCode(code);
    navigator.clipboard.writeText(code).then(() => {
      // Could show toast notification here
      console.log('Deck code copied to clipboard');
    });
  };

  const handleShare = () => {
    const url = getDeckShareUrl(deckIds);
    if (url) {
      navigator.clipboard.writeText(url).then(() => {
        console.log('Share URL copied to clipboard');
      });
    }
  };

  const handleImport = () => {
    setImportError('');
    const decoded = decodeDeck(importCode.trim());
    if (decoded.length === 0) {
      setImportError(t('deckBuilder.importError'));
      return;
    }
    if (decoded.length > GAME.maxDeckSize) {
      setImportError(t('deckBuilder.importErrorSize').replace('{count}', decoded.length).replace('{max}', GAME.maxDeckSize));
      return;
    }
    // Validate all cards exist and respect maxInDeck
    const counts = {};
    for (const id of decoded) {
      counts[id] = (counts[id] || 0) + 1;
    }
    for (const [id, count] of Object.entries(counts)) {
      const card = cards.find(c => c.id === id);
      if (!card) {
        setImportError(t('deckBuilder.importErrorUnknown').replace('{id}', id));
        return;
      }
      if (count > (card.maxInDeck || 2)) {
        setImportError(t('deckBuilder.importErrorLimit').replace('{max}', card.maxInDeck || 2).replace('{name}', card.name));
        return;
      }
    }
    setDeckIds(decoded);
    setShowImportModal(false);
    setImportCode('');
  };

  const deckCards = useMemo(() => {
    const m = {};
    for (const id of deckIds) m[id] = (m[id] || 0) + 1;
    return Object.entries(m).map(([id, count]) => ({ card: cards.find(c => c.id === id), count })).filter(x => x.card);
  }, [deckIds]);

  const manaDistribution = useMemo(() => {
    const distribution = {};
    for (const card of availableCards) {
      const cost = card.cost || 0;
      distribution[cost] = (distribution[cost] || 0) + (counts[card.id] || 1);
    }
    return distribution;
  }, [availableCards, counts]);

  const manaCurveData = useMemo(() => {
    const data = Object.entries(manaDistribution)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([cost, count]) => ({ cost: parseInt(cost), count }));
    return data;
  }, [manaDistribution]);

  const ready = deckIds.length === GAME.maxDeckSize;

  return (
    <StitchLayout go={go} stats={stats} playerClass={playerClass} currentScreen={SCREENS.DeckBuilder}>
      <main className="stitch-main-with-nav">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-6">
          {/* Hero Panel */}
          <StitchHeroPanel
            image={getStitchAsset('DeckBuilder', 'workspace')}
            imageAlt="Gothic workshop with grimoire forging tools"
            className="relative overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline)] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="relative flex flex-col gap-4 min-[720px]:flex-row min-[720px]:items-end min-[720px]:justify-between">
              <div>
                <StitchBadge variant="tertiary" className="mb-2">Forjador de Grimórios</StitchBadge>
                <h1 className="font-serif text-[clamp(1.9rem,4.3vw,3.1rem)] leading-[1.02] tracking-[-0.02em] text-[var(--md-sys-color-on-surface)]">
                  Monte seu <span className="text-[var(--md-sys-color-secondary)]">Grimório</span>
                </h1>
                <p className="mt-3 max-w-lg text-pretty text-base leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
                  Monte seu deck com até {GAME.maxDeckSize} cartas. Curva de mana equilibrada é a chave para a vitória.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StitchStat value={deckIds.length} label={`/${GAME.maxDeckSize}`} variant="secondary" className="ml-auto" />
              </div>
            </div>
          </StitchHeroPanel>

          {/* Search and Filters */}
          <StitchCard variant="filled">
            <StitchSectionHeader title="Filtrar" icon="filter_list" className="mb-4" />
            <div className="flex flex-wrap gap-2 mb-4">
              <StitchInput
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar cartas..."
                leftIcon="search"
                className="flex-1 min-w-[200px]"
              />
            </div>
            <StitchDivider className="my-4" />
            <StitchSectionHeader title="Facção" icon="groups" className="mb-4" />
            <div className="flex flex-wrap gap-2">
              {['ALL', 'HUMAN', 'VAMPIRE', 'NEUTRAL'].map(f => (
                <StitchButton
                  key={f}
                  variant={classFilter === f ? 'tonal' : 'ghost'}
                  size="sm"
                  onClick={() => setClassFilter(f)}
                >
                  {f === 'ALL' ? 'Todas' : FACTION_LABEL[f]}
                </StitchButton>
              ))}
            </div>
          </StitchCard>

          {/* Mana Curve */}
          <StitchCard variant="filled">
            <StitchSectionHeader title="Distribuição de Custo (Mana Curve)" icon="show_chart" className="mb-4" />
            <div className="flex flex-wrap gap-2 overflow-x-auto">
              {manaCurveData.length > 0 ? (
                manaCurveData.map(item => (
                  <div key={item.cost} className="flex items-center gap-2 px-3 py-2 bg-[var(--md-sys-color-surface-container-low)] rounded-full">
                    <StitchProgress value={item.count} max={10} variant="primary" className="w-32 h-1.5" />
                    <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">{item.cost}</span>
                    <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">×{item.count}</span>
                  </div>
                ))
              ) : (
                <span className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Nenhuma carta para exibir</span>
              )}
            </div>
          </StitchCard>

          {/* Available Cards */}
          <StitchSectionHeader
            title={`Cartas disponíveis (${availableCards.length})`}
            icon="collections_bookmark"
            className="mb-4"
            action={
              <div className="flex items-center gap-2 flex-wrap">
                <StitchButton variant="secondary" size="sm" leftIcon="auto_fix_high" onClick={autoFill}>{t('deckBuilder.autoFill') || 'Auto-preencher'}</StitchButton>
                <StitchButton variant="ghost" size="sm" leftIcon="delete" onClick={clear} className="text-[var(--md-sys-color-error)]">{t('deckBuilder.clear') || 'Limpar'}</StitchButton>
                <StitchButton variant="tonal" size="sm" leftIcon="file_download" onClick={handleExport} disabled={deckIds.length === 0}>{t('deckBuilder.export')}</StitchButton>
                <StitchButton variant="tonal" size="sm" leftIcon="share" onClick={handleShare} disabled={deckIds.length === 0}>{t('deckBuilder.share')}</StitchButton>
                <StitchButton variant="outlined" size="sm" leftIcon="file_upload" onClick={() => { setImportCode(''); setImportError(''); setShowImportModal(true); }}>{t('deckBuilder.import')}</StitchButton>
              </div>
            }
          />
          <StitchGrid columns={5} gap="md">
            {availableCards.map(card => {
              const have = counts[card.id] || 0;
              const max = card.maxInDeck || 2;
              return (
                <div key={card.id} className="relative">
                  <StitchCardRelic card={card} />
                  <div className="absolute top-2 right-2">
                    <StitchIconButton
                      icon="add"
                      size="sm"
                      onClick={() => add(card)}
                      disabled={have >= max || deckIds.length >= GAME.maxDeckSize}
                      aria-label={`Adicionar ${card.name}`}
                    />
                  </div>
                  {have > 0 && (
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center text-xs font-bold">
                      {have}
                    </div>
                  )}
                </div>
              );
            })}
          </StitchGrid>

          {/* Deck Summary */}
          {deckCards.length > 0 && (
            <StitchCard variant="elevated" style={{ borderColor: 'var(--md-sys-color-secondary)' }}>
              <StitchSectionHeader
                title={`Seu Deck (${deckIds.length} cartas)`}
                icon="style"
                action={
                  ready ? (
                    <StitchButton variant="filled" size="sm" leftIcon="swords" onClick={() => go(SCREENS.Arena)}>Ir para Arena</StitchButton>
                  ) : (
                    <StitchBadge variant="surface">{GAME.maxDeckSize - deckIds.length} faltando</StitchBadge>
                  )
                }
              />
              <StitchDivider className="my-3" />
              <div className="flex flex-wrap gap-2">
                {deckCards.map(({ card, count }) => (
                  <StitchBadge key={card.id} variant="surface" className="gap-1">
                    {card.name}
                    <span className="text-[var(--md-sys-color-secondary)]">×{count}</span>
                    <StitchIconButton
                      icon="close"
                      size="sm"
                      onClick={() => remove(card.id)}
                      aria-label={`Remover ${card.name}`}
                    />
                  </StitchBadge>
                ))}
              </div>
            </StitchCard>
          )}

          {/* Export Code Modal */}
          {exportCode && (
            <StitchModal
              open
              onClose={() => setExportCode('')}
              title={t('deckBuilder.exportTitle')}
              size="sm"
            >
              <div className="space-y-3">
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{t('deckBuilder.exportDesc')}</p>
                <textarea
                  readOnly
                  rows={3}
                  className="w-full font-mono text-xs p-3 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)] rounded-md text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                  value={exportCode}
                />
                <div className="flex gap-2 justify-end">
                  <StitchButton variant="tonal" size="sm" onClick={() => navigator.clipboard.writeText(exportCode)}>{t('deckBuilder.copyAgain')}</StitchButton>
                  <StitchButton variant="filled" size="sm" onClick={() => setExportCode('')}>{t('common.close')}</StitchButton>
                </div>
              </div>
            </StitchModal>
          )}

          {/* Import Modal */}
          <StitchModal
            open={showImportModal}
            onClose={() => { setShowImportModal(false); setImportCode(''); setImportError(''); }}
            title={t('deckBuilder.importTitle')}
            size="md"
          >
            <div className="space-y-4">
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{t('deckBuilder.importDesc')}</p>
              <textarea
                value={importCode}
                onChange={e => setImportCode(e.target.value)}
                placeholder={t('deckBuilder.importPlaceholder')}
                rows={4}
                className="w-full font-mono text-sm p-3 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)] rounded-md text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              />
              {importError && <p className="text-sm text-[var(--md-sys-color-error)]">{importError}</p>}
              <div className="flex gap-2 justify-end">
                <StitchButton variant="tonal" size="sm" onClick={() => { setShowImportModal(false); setImportCode(''); setImportError(''); }}>{t('common.cancel')}</StitchButton>
                <StitchButton variant="filled" size="sm" onClick={handleImport} disabled={!importCode.trim()}>{t('deckBuilder.import')}</StitchButton>
              </div>
            </div>
          </StitchModal>
        </div>
      </main>
    </StitchLayout>
  );
}