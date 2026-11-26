import React, { useMemo, useState } from 'react';
import cards from '../data/hv_cards.json';
import { SCREENS, FACTION_LABEL } from '../data/constants.js';
import StitchCardRelic from '../components/StitchCardRelic.jsx';
import StitchLayout from '../components/StitchLayout.jsx';
import Marketplace from '../components/Marketplace.jsx';
import { getStitchAsset } from '../data/stitchAssets.js';
import {
  StitchButton,
  StitchCard,
  StitchGrid,
  StitchSectionHeader,
  StitchBadge,
  StitchTabs,
  StitchHeroPanel,
  StitchDivider,
} from '../components/StitchUI.jsx';

export default function Collection({ go, stats, playerClass, setStats }) {
  const [filter, setFilter] = useState('ALL');
  const [rarity, setRarity] = useState('ALL');
  const [showMarketplace, setShowMarketplace] = useState(false);

  const filtered = useMemo(() => {
    let list = filter === 'ALL' ? cards : cards.filter(c => c.faction === filter);
    if (rarity !== 'ALL') list = list.filter(c => (c.rarity || '').toUpperCase() === rarity);
    return list;
  }, [filter, rarity]);

  return (
    <StitchLayout go={go} stats={stats} playerClass={playerClass} currentScreen={SCREENS.Collection}>
      <main className="stitch-main-with-nav">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-6">
          {/* Hero Panel */}
          <StitchHeroPanel
            image={getStitchAsset('Collection', 'grid')}
            imageAlt="Ancient gothic museum hall with relic displays"
            className="relative overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline)] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="relative flex flex-col gap-4 min-[720px]:flex-row min-[720px]:items-end min-[720px]:justify-between">
              <div>
                <StitchBadge variant="secondary" className="mb-2">Relicário de Cartas</StitchBadge>
                <h1 className="font-serif text-[clamp(1.9rem,4.3vw,3.1rem)] leading-[1.02] tracking-[-0.02em] text-[var(--md-sys-color-on-surface)]">
                  Catálogo de <span className="text-[var(--md-sys-color-secondary)]">Relíquias</span>
                </h1>
                <p className="mt-3 max-w-lg text-pretty text-base leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
                  Todas as {cards.length} relíquias conhecidas catalogadas no cosmos de VAMORT.
                </p>
              </div>
              <StitchButton variant="outlined" leftIcon="storefront" onClick={() => setShowMarketplace(true)}>
                Mercado Arcano
              </StitchButton>
            </div>
          </StitchHeroPanel>

          {/* Filter Panel */}
          <StitchCard variant="filled">
            <StitchSectionHeader title="Filtrar por Facção" icon="filter_list" className="mb-4" />
            <div className="flex flex-wrap gap-2 mb-4">
              {['ALL', 'HUMAN', 'VAMPIRE', 'NEUTRAL'].map(f => (
                <StitchButton
                  key={f}
                  variant={filter === f ? 'tonal' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {f === 'ALL' ? 'Todas as Facções' : FACTION_LABEL[f]}
                </StitchButton>
              ))}
            </div>
            <StitchDivider className="my-4" />
            <StitchSectionHeader title="Filtrar por Raridade" icon="auto_awesome" className="mb-4" />
            <div className="flex flex-wrap gap-2">
              {['ALL', 'COMUM', 'RARA', 'EPICA', 'LENDARIA'].map(r => (
                <StitchButton
                  key={r}
                  variant={rarity === r ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setRarity(r)}
                >
                  {r === 'ALL' ? 'Todas' : r.charAt(0) + r.slice(1).toLowerCase()}
                </StitchButton>
              ))}
            </div>
          </StitchCard>

          {/* Card Grid */}
          <StitchSectionHeader title={`Relíquias (${filtered.length})`} icon="collections_bookmark" className="mb-4" />
          <StitchGrid columns={5} gap="md">
            {filtered.map(card => (
              <StitchCardRelic key={card.id} card={card} />
            ))}
          </StitchGrid>

          {/* Marketplace Section */}
          <StitchCard variant="elevated" className="border-[var(--md-sys-color-primary)]/30">
            <StitchSectionHeader
              title="Mercado Arcano"
              icon="storefront"
              action={
                <StitchButton variant="text" size="sm" onClick={() => setShowMarketplace(true)}>
                  Ver Listagens
                </StitchButton>
              }
            />
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-4">
              Compre e venda cartas entre jogadores · Taxa de 5% · 10% vai para o fundo da guilda
            </p>
            <Marketplace
              gold={stats?.gold || 0}
              onSpend={() => setStats(s => ({ ...s, gold: (s.gold || 0) - 100 }))}
              onEarn={() => setStats(s => ({ ...s, gold: (s.gold || 0) + 50 }))}
              ownedCards={stats?.ownedCards || []}
            />
          </StitchCard>
        </div>
      </main>
    </StitchLayout>
  );
}