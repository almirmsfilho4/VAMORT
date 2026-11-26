import React, { useState, useEffect } from 'react';
import StitchLayout from '../components/StitchLayout.jsx';
import Tutorial from '../components/Tutorial.jsx';
import { SCREENS, GAME } from '../data/constants.js';
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
} from '../components/StitchUI.jsx';

export default function Arena({ go, stats, playerClass, deckIds }) {
  const [tutorialOpen, setTutorialOpen] = useState(() => {
    try { return localStorage.getItem('vamort_tutorial_done') !== 'true'; } catch { return false; }
  });
  const { t } = useLanguage();

  const handleTutorialComplete = () => {
    setTutorialOpen(false);
  };

  return (
    <StitchLayout go={go} stats={stats} playerClass={playerClass} currentScreen={SCREENS.Arena}>
      <main className="stitch-main-with-nav">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-6">
          {/* Hero Panel */}
          <StitchHeroPanel
            image={getStitchAsset('Arena', 'battlefield')}
            imageAlt="Ancient gothic battlefield with blood moon"
            className="relative overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline)] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--md-sys-color-surface)] via-[var(--md-sys-color-surface)]/90 to-[var(--md-sys-color-surface)]/15" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--md-sys-color-surface)] via-transparent to-transparent" />
            <div className="relative z-10 px-5 py-7 sm:px-8 sm:py-8">
              <div className="flex flex-col min-[720px]:flex-row min-[720px]:items-end min-[720px]:justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--md-sys-color-primary)]">Salão de batalha</p>
                  <h1 className="mt-2 font-serif text-[clamp(2rem,4.5vw,3.4rem)] leading-[1.02] tracking-[-0.02em] text-[var(--md-sys-color-on-surface)]">
                    Arena de <span className="text-[var(--md-sys-color-secondary)]">Duelo</span>
                  </h1>
                  <p className="mt-3 max-w-lg text-base leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
                    Escolha sua facção e enfrente uma inteligência tática. Sem sorte — só decisões.
                  </p>
                </div>
              </div>
            </div>
          </StitchHeroPanel>

          {/* Game Modes */}
          <section aria-labelledby="modes-title">
            <StitchSectionHeader
              title="Modos de jogo"
              icon="swords"
              className="mb-4"
            />
            <StitchGrid columns={{ base: 1, md: 2, lg: 5 }} gap="md">
              <StitchCard variant="filled" hover className="group min-h-[160px] flex flex-col p-6">
                <div className="flex-1">
                  <StitchBadge variant="primary" className="mb-2">{t('arena.mode.normal')}</StitchBadge>
                  <h3 className="font-serif text-2xl text-[var(--md-sys-color-on-surface)]">{t('arena.mode.arena.title')}</h3>
                  <p className="mt-1 text-[var(--md-sys-color-on-surface-variant)]">{t('arena.mode.arena.desc')}</p>
                </div>
                <div className="flex items-end justify-between w-full pt-4">
                  <StitchButton
                    variant="filled"
                    size="lg"
                    leftIcon="swords"
                    onClick={() => go(SCREENS.Battle)}
                    className="w-full"
                  >
                    {t('arena.mode.arena.btn')}
                  </StitchButton>
                  <span className="text-4xl opacity-50" aria-hidden="true">🧛</span>
                </div>
              </StitchCard>

              <StitchCard variant="filled" hover className="group min-h-[160px] flex flex-col p-6" style={{ borderColor: 'var(--md-sys-color-primary)', boxShadow: '0 8px 32px rgba(230,25,75,0.15)' }}>
                <div className="flex-1">
                  <StitchBadge variant="primary" className="mb-2">⚔️ {t('arena.mode.pvp.label')}</StitchBadge>
                  <h3 className="font-serif text-2xl text-[var(--md-sys-color-on-surface)]">{t('arena.mode.pvp.title')}</h3>
                  <p className="mt-1 text-[var(--md-sys-color-on-surface-variant)]">{t('arena.mode.pvp.desc')}</p>
                </div>
                <div className="flex items-end justify-between w-full pt-4">
                  <StitchButton
                    variant="filled"
                    size="lg"
                    leftIcon="match"
                    onClick={() => go(SCREENS.Lobby)}
                    className="w-full"
                    style={{ background: 'linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-primary-dark))', boxShadow: '0 4px 16px rgba(230,25,75,0.35)' }}
                  >
                    {t('arena.mode.pvp.btn')}
                  </StitchButton>
                  <span className="text-4xl opacity-50" aria-hidden="true">⚔️</span>
                </div>
              </StitchCard>

              <StitchCard variant="filled" hover className="group min-h-[160px] flex flex-col p-6" style={{ borderColor: 'var(--md-sys-color-tertiary)', boxShadow: '0 8px 32px rgba(116,86,174,0.15)' }}>
                <div className="flex-1">
                  <StitchBadge variant="tertiary" className="mb-2">{t('arena.mode.practice.label')}</StitchBadge>
                  <h3 className="font-serif text-2xl text-[var(--md-sys-color-on-surface)]">{t('arena.mode.practice.title')}</h3>
                  <p className="mt-1 text-[var(--md-sys-color-on-surface-variant)]">{t('arena.mode.practice.desc')}</p>
                </div>
                <div className="flex items-end justify-between w-full pt-4">
                  <StitchButton
                    variant="filled"
                    size="lg"
                    leftIcon="school"
                    onClick={() => go(SCREENS.Practice)}
                    className="w-full"
                    style={{ background: 'linear-gradient(135deg, var(--md-sys-color-tertiary), var(--md-sys-color-tertiary-dark))', boxShadow: '0 4px 16px rgba(116,86,174,0.35)' }}
                  >
                    {t('arena.mode.practice.btn')}
                  </StitchButton>
                  <span className="text-4xl opacity-50" aria-hidden="true">🎯</span>
                </div>
              </StitchCard>

              <StitchCard variant="filled" hover className="group min-h-[160px] flex flex-col p-6">
                <div className="flex-1">
                  <StitchBadge variant="secondary" className="mb-2">{t('arena.mode.campaign.label')}</StitchBadge>
                  <h3 className="font-serif text-2xl text-[var(--md-sys-color-on-surface)]">{t('arena.mode.campaign.title')}</h3>
                  <p className="mt-1 text-[var(--md-sys-color-on-surface-variant)]">{t('arena.mode.campaign.desc')}</p>
                </div>
                <div className="flex items-end justify-between w-full pt-4">
                  <StitchButton
                    variant="filled"
                    size="lg"
                    leftIcon="auto_stories"
                    onClick={() => go(SCREENS.Campaign)}
                    className="w-full stitch-btn-gold"
                  >
                    {t('arena.mode.campaign.btn')}
                  </StitchButton>
                  <span className="text-4xl opacity-50" aria-hidden="true">📜</span>
                </div>
              </StitchCard>

              {/* Draft Mode */}
              <StitchCard variant="filled" hover className="group min-h-[160px] flex flex-col p-6" style={{ borderColor: 'var(--md-sys-color-secondary)', boxShadow: '0 8px 32px rgba(250,188,77,0.15)' }}>
                <div className="flex-1">
                  <StitchBadge variant="secondary" className="mb-2">🎲 {t('draft.title')}</StitchBadge>
                  <h3 className="font-serif text-2xl text-[var(--md-sys-color-on-surface)]">{t('draft.title')}</h3>
                  <p className="mt-1 text-[var(--md-sys-color-on-surface-variant)]">{t('draft.subtitle')}</p>
                </div>
                <div className="flex items-end justify-between w-full pt-4">
                  <StitchButton
                    variant="filled"
                    size="lg"
                    leftIcon="style"
                    onClick={() => go(SCREENS.Draft)}
                    className="w-full"
                    style={{ background: 'linear-gradient(135deg, var(--md-sys-color-secondary), #e6a700)', boxShadow: '0 4px 16px rgba(250,188,77,0.35)' }}
                  >
                    {t('draft.startDraft')}
                  </StitchButton>
                  <span className="text-4xl opacity-50" aria-hidden="true">🎲</span>
                </div>
              </StitchCard>
            </StitchGrid>
          </section>

          {/* Quick Stats */}
          <section aria-labelledby="quick-stats-title" className="lg:hidden">
            <StitchSectionHeader
              title="Sua progressão"
              icon="workspace_premium"
              className="mb-4"
            />
            <StitchGrid columns={2} gap="md">
              <StitchStat value={stats?.wins || 0} label="Vitórias" icon="emoji_events" variant="secondary" />
              <StitchStat value={stats?.losses || 0} label="Derrotas" icon="swords" variant="primary" />
              <StitchStat value={stats?.xp || 0} label="XP Total" icon="star" variant="secondary" />
              <StitchStat value={stats?.rankPoints || 0} label="Pontos de Rank" icon="military_tech" variant="primary" />
            </StitchGrid>
          </section>
        </div>
      </main>

      {tutorialOpen && <Tutorial onComplete={handleTutorialComplete} />}
    </StitchLayout>
  );
}