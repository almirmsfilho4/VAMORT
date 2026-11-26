import React, { useMemo, useState } from 'react';
import { SCREENS, GAME, RANKS } from '../data/constants.js';
import StitchLayout from '../components/StitchLayout.jsx';
import Missions from '../components/Missions.jsx';
import Achievements from '../components/Achievements.jsx';
import DailyRewards from '../components/DailyRewards.jsx';
import BattlePass from '../components/BattlePass.jsx';
import CosmeticShop from '../components/CosmeticShop.jsx';
import EnergySystem from '../components/EnergySystem.jsx';
import LimitedEvent from '../components/LimitedEvent.jsx';
import BloodPact from '../components/BloodPact.jsx';
import CreatorSystem from '../components/CreatorSystem.jsx';
import { getStitchAsset } from '../data/stitchAssets.js';
import {
  StitchButton,
  StitchCard,
  StitchProgress,
  StitchStat,
  StitchTabs,
  StitchGrid,
  StitchSectionHeader,
  StitchHeroPanel,
  StitchBadge,
  StitchDivider,
} from '../components/StitchUI.jsx';

const TABS = [
  { id: 'missions', label: 'Missões', icon: 'target' },
  { id: 'achievements', label: 'Conquistas', icon: 'trophy' },
  { id: 'rewards', label: 'Recompensas', icon: 'gift' },
  { id: 'battle-pass', label: 'Passe de Batalha', icon: 'tickets' },
  { id: 'cosmetic-shop', label: 'Loja de Cosméticos', icon: 'palette' },
  { id: 'energy', label: 'Energia', icon: 'zap' },
  { id: 'blood-pact', label: 'Pacto de Sangue', icon: 'droplet' },
  { id: 'limited-event', label: 'Evento Limitado', icon: 'local_fire_department' },
  { id: 'creators', label: 'Criadores', icon: 'videocam' },
];

const SEASON_TIERS = [
  { level: 1, label: 'Selo da Longa Noite', reward: 'Cosmético' },
  { level: 3, label: 'Ouro ritual', reward: '150 Ouro' },
  { level: 5, label: 'Pó arcano', reward: '60 Pó' },
  { level: 8, label: 'Verso Carmesim', reward: 'Cosmético' },
  { level: 12, label: 'Ouro ritual', reward: '300 Ouro' },
  { level: 16, label: 'Título de Arena', reward: 'Cosmético' },
  { level: 20, label: 'Relicário do Eclipse', reward: 'Cosmético' },
  { level: 25, label: 'Ouro ritual', reward: '500 Ouro' },
  { level: 30, label: 'Coroa da Primeira Dinastia', reward: 'Cosmético' },
];

function normalizeReward(reward, fallbackId) {
  if (!reward) return null;
  if (typeof reward === 'object') return { ...reward, id: reward.id || fallbackId };
  return { id: fallbackId, label: String(reward) };
}

export default function Journey({ go, stats, setStats, playerClass }) {
  const [tab, setTab] = useState('missions');
  const xp = Math.max(0, stats?.xp || 0);
  const level = Math.min(30, Math.floor(xp / 500) + 1);
  const levelProgress = xp % 500;
  const wins = stats?.wins || 0;
  const games = stats?.games || 0;
  const rate = games > 0 ? Math.round((wins / games) * 100) : 0;

  const nextTier = useMemo(() => SEASON_TIERS.find(tier => tier.level > level) || null, [level]);

  const applyReward = (reward, fallbackId) => {
    const normalized = normalizeReward(reward, fallbackId);
    if (!normalized) return;
    setStats(previous => {
      const next = { ...previous };
      if (normalized.gold) next.gold = (next.gold || 0) + normalized.gold;
      if (normalized.xp) next.xp = (next.xp || 0) + normalized.xp;
      if (normalized.dust) next.dust = (next.dust || 0) + normalized.dust;
      if (normalized.cosmetic) {
        next.ownedCosmetics = Array.isArray(next.ownedCosmetics) ? [...next.ownedCosmetics] : [];
        if (!next.ownedCosmetics.includes(normalized.cosmetic)) next.ownedCosmetics.push(normalized.cosmetic);
      }
      return next;
    });
  };

  return (
    <StitchLayout go={go} stats={stats} playerClass={playerClass} currentScreen={SCREENS.Journey}>
      <main className="stitch-main-with-nav">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-6">
          {/* Hero Panel */}
          <StitchHeroPanel
            image={getStitchAsset('Journey', 'hero')}
            imageAlt="Gothic covenant sanctuary with ritualistic architecture"
            className="relative overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline)] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[var(--md-sys-color-primary)]/10 blur-3xl" />
            <div className="relative flex flex-col gap-5 min-[720px]:flex-row min-[720px]:items-end min-[720px]:justify-between">
              <div>
                <StitchBadge variant="primary" className="mb-2">Temporada I · Ato da Longa Noite</StitchBadge>
                <h1 className="font-serif text-[clamp(1.9rem,4.3vw,3.1rem)] leading-[1.02] tracking-[-0.02em] text-[var(--md-sys-color-on-surface)]">
                  Sua <span className="text-[var(--md-sys-color-secondary)]">jornada</span> na corte.
                </h1>
                <p className="mt-3 max-w-lg text-pretty text-base leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
                  Recompensas fixas, metas claras e nenhuma roleta. Jogue, cumpra os ritos e fortaleça seu acervo.
                </p>
              </div>
              <StitchCard variant="filled" className="w-full max-w-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-serif text-lg text-[var(--md-sys-color-on-surface)]">Grau {level}</span>
                  <span className="text-xs tabular-nums text-[var(--md-sys-color-on-surface-variant)]">{levelProgress}/500 XP</span>
                </div>
                <StitchProgress value={levelProgress} max={500} variant="secondary" className="mt-2 h-1.5" />
                <p className="mt-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  {nextTier ? `Próximo marco no grau ${nextTier.level}: ${nextTier.label}` : 'Todos os marcos da temporada alcançados.'}
                </p>
              </StitchCard>
            </div>
          </StitchHeroPanel>

          {/* Quick Stats */}
          <StitchGrid columns={3} gap="md">
            <StitchStat value={wins} label="Vitórias" icon="military_tech" variant="secondary" />
            <StitchStat value={games} label="Partidas" icon="swords" variant="primary" />
            <StitchStat value={`${rate}%`} label="Taxa de vitória" icon="monitoring" variant="tertiary" />
          </StitchGrid>

          {/* Tabs */}
          <StitchTabs
            tabs={TABS}
            activeTab={tab}
            onChange={setTab}
            className="w-full"
          />

          {/* Tab Panels */}
          <section role="tabpanel" className="min-h-[320px]">
            {tab === 'missions' && (
              <div className="space-y-4">
                <StitchSectionHeader
                  title="Ritos da semana"
                  icon="target"
                  action={
                    <StitchButton variant="filled" size="sm" leftIcon="swords" onClick={() => go(SCREENS.Arena)}>
                      Jogar agora
                    </StitchButton>
                  }
                />
                <StitchCard variant="filled">
                  <Missions stats={stats} onClaim={reward => applyReward(reward, `mission-${Date.now()}`)} />
                </StitchCard>
              </div>
            )}

            {tab === 'achievements' && (
              <div className="space-y-4">
                <StitchSectionHeader
                  title="Sala de troféus"
                  icon="trophy"
                />
                <StitchCard variant="filled">
                  <Achievements stats={stats} />
                </StitchCard>
              </div>
            )}

            {tab === 'rewards' && (
              <div className="space-y-4">
                <StitchSectionHeader
                  title="Recompensas diárias"
                  icon="gift"
                />
                <StitchCard variant="filled">
                  <DailyRewards onClaim={reward => applyReward(reward, `daily-${Date.now()}`)} />
                </StitchCard>
              </div>
            )}

            {tab === 'battle-pass' && (
              <div className="space-y-4">
                <StitchSectionHeader
                  title="Passe de Batalha"
                  icon="tickets"
                />
                <StitchCard variant="filled">
                  <BattlePass
                    xp={xp}
                    isPremium={!!stats?.battlePassPremium}
                    onBuyPremium={() => applyReward({ gold: 0, cosmetic: 'battle-pass-premium' }, 'battle-pass-premium')}
                  />
                </StitchCard>
              </div>
            )}

            {tab === 'cosmetic-shop' && (
              <div className="space-y-4">
                <StitchSectionHeader
                  title="Loja de Cosméticos"
                  icon="palette"
                />
                <StitchCard variant="filled">
                  <CosmeticShop
                    gold={stats?.gold || 0}
                    owned={stats?.ownedCosmetics || []}
                    onSpend={amt => setStats(s => ({ ...s, gold: (s.gold || 0) - amt }))}
                    onBuy={id => setStats(s => {
                      const cosmetics = Array.isArray(s.ownedCosmetics) ? [...s.ownedCosmetics] : [];
                      if (!cosmetics.includes(id)) cosmetics.push(id);
                      return { ...s, ownedCosmetics: cosmetics };
                    })}
                  />
                </StitchCard>
              </div>
            )}

            {tab === 'energy' && (
              <div className="space-y-4">
                <StitchSectionHeader
                  title="Sistema de Energia"
                  icon="zap"
                />
                <StitchCard variant="filled">
                  <EnergySystem onSpend={amt => {}} onBuy={() => setStats(s => ({ ...s, gold: (s.gold || 0) - 100 }))} />
                </StitchCard>
              </div>
            )}

            {tab === 'blood-pact' && (
              <div className="space-y-4">
                <StitchSectionHeader
                  title="Pacto de Sangue"
                  icon="droplet"
                />
                <StitchCard variant="filled">
                  <BloodPact onClaim={() => {
                    setStats(s => ({
                      ...s,
                      gold: (s.gold || 0) + 500,
                      xp: (s.xp || 0) + 100,
                      dust: (s.dust || 0) + 50,
                    }));
                  }} />
                </StitchCard>
              </div>
            )}

            {tab === 'limited-event' && (
              <div className="space-y-4">
                <StitchSectionHeader
                  title="Evento por Tempo Limitado"
                  icon="local_fire_department"
                />
                <StitchCard variant="filled">
                  <LimitedEvent onClaim={() => {
                    setStats(s => ({
                      ...s,
                      gold: (s.gold || 0) + 1000,
                      xp: (s.xp || 0) + 200,
                      dust: (s.dust || 0) + 100,
                    }));
                  }} />
                </StitchCard>
              </div>
            )}

            {tab === 'creators' && (
              <div className="space-y-4">
                <StitchSectionHeader
                  title="Programa de Criadores"
                  icon="videocam"
                />
                <StitchCard variant="filled">
                  <CreatorSystem />
                </StitchCard>
              </div>
            )}
          </section>

          {/* Season Track */}
          <StitchCard variant="filled">
            <StitchSectionHeader
              title="Marcos gratuitos"
              icon="workspace_premium"
              action={<span className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{level}/30 graus</span>}
            />
            <StitchDivider className="my-4" />
            <StitchGrid columns={9} gap="sm">
              {SEASON_TIERS.map(tier => {
                const unlocked = level >= tier.level;
                return (
                  <StitchCard
                    key={tier.level}
                    variant={unlocked ? 'outlined' : 'filled'}
                    className="text-center p-3"
                    style={{ opacity: unlocked ? 1 : 0.55 }}
                  >
                    <span className="material-symbols-outlined text-[18px]" style={{ color: unlocked ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-on-surface-variant)' }} aria-hidden="true">
                      {unlocked ? 'lock_open' : 'lock'}
                    </span>
                    <div className="mt-1 text-xs font-bold uppercase tracking-wide text-[var(--md-sys-color-on-surface)]">Grau {tier.level}</div>
                    <div className="mt-0.5 text-xs leading-snug text-[var(--md-sys-color-on-surface-variant)]">{tier.label}</div>
                  </StitchCard>
                );
              })}
            </StitchGrid>
          </StitchCard>

          {/* VAMORT Commitment */}
          <StitchCard variant="elevated" className="flex flex-wrap items-center justify-between gap-3" style={{ borderColor: 'var(--md-sys-color-secondary)', background: 'rgba(250, 188, 77, 0.05)' }}>
            <p className="max-w-xl text-pretty text-sm leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
              <span className="font-semibold text-[var(--md-sys-color-secondary)]">Compromisso VAMORT:</span> nenhuma vantagem competitiva é vendida. Cosméticos e recompensas são conquistados jogando.
            </p>
            <StitchButton variant="outlined" onClick={() => go(SCREENS.DeckBuilder)}>Revisar grimório</StitchButton>
          </StitchCard>
        </div>
      </main>
    </StitchLayout>
  );
}