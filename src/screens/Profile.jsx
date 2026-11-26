import React, { useState } from 'react';
import { SCREENS } from '../data/constants.js';
import Leaderboard from '../components/Leaderboard.jsx';
import StitchLayout from '../components/StitchLayout.jsx';
import CompetitiveRanking from '../components/CompetitiveRanking.jsx';
import RankLadder from '../components/RankLadder.jsx';
import { getStitchAsset } from '../data/stitchAssets.js';
import {
  StitchButton,
  StitchCard,
  StitchGrid,
  StitchSectionHeader,
  StitchTabs,
  StitchStat,
  StitchInput,
  StitchHeroPanel,
  StitchBadge,
  StitchDivider,
} from '../components/StitchUI.jsx';

export default function Profile({ go, stats, setStats, playerClass }) {
  const [name, setName] = useState(stats?.name || 'Herói');
  const [tab, setTab] = useState('overview');
  const save = () => setStats(s => ({ ...s, name: name.trim() || 'Herói' }));
  const reset = () => {
    if (window.confirm('Resetar estatísticas?')) setStats({ name: stats?.name || 'Herói', wins: 0, losses: 0, games: 0 });
  };
  const rate = stats?.games ? Math.round((stats.wins / stats.games) * 100) : 0;
  const isVampire = playerClass === 'VAMPIRE';
  const isHuman = playerClass === 'HUMAN';
  const accentColor = isVampire ? '#e6194b' : isHuman ? '#fabc4d' : '#6E9ECC';
  const classTitle = isVampire ? 'Lorde Vampiro' : isHuman ? 'Paladino Humano' : 'Herói Neutro';
  const classIcon = isVampire ? '🦇' : isHuman ? '⚔️' : '🛡️';

  const PROFILE_TABS = [
    { id: 'overview', label: 'Visão Geral', icon: 'person' },
    { id: 'ranking', label: 'Ranking Competitivo', icon: 'leaderboard' },
    { id: 'ladder', label: 'Escada de Ranques', icon: 'trending_up' },
    { id: 'global', label: 'Ranking Global', icon: 'public' },
  ];

  return (
    <StitchLayout go={go} stats={stats} playerClass={playerClass} currentScreen={SCREENS.Profile}>
      <main className="stitch-main-with-nav">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-6">
          {/* Hero Panel */}
          <StitchHeroPanel
            image={getStitchAsset('Profile', 'avatar')}
            imageAlt="Gothic vampire lord portrait with crimson lighting"
            className="relative overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline)] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.1 }} />
            <div className="relative flex flex-col gap-5 min-[720px]:flex-row min-[720px]:items-end min-[720px]:justify-between">
              <div>
                <StitchBadge variant="primary" className="mb-2">Perfil do Herói</StitchBadge>
                <h1 className="font-serif text-[clamp(1.9rem,4.3vw,3.1rem)] leading-[1.02] tracking-[-0.02em] text-[var(--md-sys-color-on-surface)]">
                  <span style={{ color: accentColor }}>{classTitle}</span> · {stats?.name || 'Herói'}
                </h1>
                <p className="mt-3 max-w-lg text-pretty text-base leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
                  Suas conquistas, identidade arcana ativa e colocação mundial no panteão de VAMORT.
                </p>
              </div>
              <StitchCard variant="filled" className="w-full max-w-sm">
                <div className="flex items-center gap-4">
                  <div className="text-5xl" style={{ filter: `drop-shadow(0 0 12px ${accentColor})` }}>{classIcon}</div>
                  <div>
                    <div className="font-bold text-lg text-[var(--md-sys-color-on-surface)]" style={{ color: accentColor }}>{classTitle}</div>
                    <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest">Identidade Arcana Ativa</div>
                  </div>
                </div>
              </StitchCard>
            </div>
          </StitchHeroPanel>

          {/* Name Editor */}
          <StitchCard variant="filled">
            <StitchSectionHeader title="Alcunha do Herói" icon="badge" className="mb-4" />
            <div className="flex flex-wrap gap-2 items-center">
              <StitchInput
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Digite seu nome..."
                className="flex-1 min-w-[200px]"
              />
              <StitchButton variant="filled" onClick={save} leftIcon="save">
                Salvar Nome
              </StitchButton>
            </div>
          </StitchCard>

          {/* Stats Grid */}
          <StitchSectionHeader title="Estatísticas de Combate" icon="analytics" className="mb-4" />
          <StitchGrid columns={4} gap="md">
            <StitchStat value={stats?.wins || 0} label="Vitórias" icon="military_tech" variant="secondary" />
            <StitchStat value={stats?.losses || 0} label="Derrotas" icon="close" variant="primary" />
            <StitchStat value={stats?.games || 0} label="Batalhas" icon="swords" variant="primary" />
            <StitchStat value={`${rate}%`} label="Taxa de Vitória" icon="trending_up" variant="tertiary" />
          </StitchGrid>

          {/* Tabs */}
          <StitchTabs tabs={PROFILE_TABS} activeTab={tab} onChange={setTab} className="w-full" />

          {/* Tab Panels */}
          <section role="tabpanel" className="min-h-[320px]">
            {tab === 'overview' && (
              <div className="space-y-4">
                <StitchCard variant="filled">
                  <StitchSectionHeader
                    title="Rank Atual"
                    icon="workspace_premium"
                    action={
                      <StitchBadge variant="surface" style={{ backgroundColor: accentColor }}>
                        {stats?.rank || 'FERRO'} · {stats?.rankPoints || 0} pts
                      </StitchBadge>
                    }
                  />
                  <CompetitiveRanking wins={stats?.wins || 0} losses={stats?.losses || 0} games={stats?.games || 0} />
                </StitchCard>

                <StitchCard variant="filled">
                  <StitchSectionHeader title="Escada de Ranques" icon="trending_up" />
                  <RankLadder currentPoints={stats?.rankPoints || 0} compact={false} />
                </StitchCard>

                <StitchButton variant="ghost" onClick={reset} className="text-[var(--md-sys-color-error)]" leftIcon="restart_alt">
                  Resetar Estatísticas Locais
                </StitchButton>
              </div>
            )}

            {tab === 'ranking' && (
              <StitchCard variant="filled">
                <CompetitiveRanking wins={stats?.wins || 0} losses={stats?.losses || 0} games={stats?.games || 0} />
              </StitchCard>
            )}

            {tab === 'ladder' && (
              <StitchCard variant="filled">
                <RankLadder currentPoints={stats?.rankPoints || 0} compact={false} />
              </StitchCard>
            )}

            {tab === 'global' && (
              <StitchCard variant="filled">
                <Leaderboard />
              </StitchCard>
            )}
          </section>
        </div>
      </main>
    </StitchLayout>
  );
}