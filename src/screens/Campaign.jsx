import React, { useEffect, useMemo, useState } from 'react';
import StitchLayout from '../components/StitchLayout.jsx';
import { SCREENS, GAME } from '../data/constants.js';
import { getStitchAsset } from '../data/stitchAssets.js';
import {
  StitchButton,
  StitchCard,
  StitchGrid,
  StitchSectionHeader,
  StitchProgress,
  StitchBadge,
  StitchStat,
  StitchHeroPanel,
} from '../components/StitchUI.jsx';

export const CAMPAIGN_STAGES = [
  {
    id: 1,
    title: 'O Portão da Cripta',
    chapter: 'Prólogo',
    description: 'Os sinos anunciam sua chegada. Um esquadrão humano bloqueia a entrada da cripta.',
    enemyClass: 'HUMAN',
    difficulty: 'easy',
    reward: '120 XP · 60 Ouro',
    icon: 'gate',
    accent: '#fabc4d',
  },
  {
    id: 2,
    title: 'Os Cães da Inquisição',
    chapter: 'Capítulo I',
    description: 'Caçadores treinados farejam sangue nas paredes antigas. Resista à investida.',
    enemyClass: 'HUMAN',
    difficulty: 'normal',
    reward: '160 XP · 80 Ouro',
    icon: 'pets',
    accent: '#f59e0b',
  },
  {
    id: 3,
    title: 'A Capela Profanada',
    chapter: 'Capítulo II',
    description: 'Sob vitrais quebrados, um paladino invoca escudos divinos contra sua corte.',
    enemyClass: 'HUMAN',
    difficulty: 'normal',
    reward: '200 XP · 100 Ouro',
    icon: 'church',
    accent: '#fbbf24',
  },
  {
    id: 4,
    title: 'A Cripta dos Ancestrais',
    chapter: 'Capítulo III',
    description: 'Lordes vampíricos despertam. Prove seu valor contra a nobreza antiga.',
    enemyClass: 'VAMPIRE',
    difficulty: 'hard',
    reward: '280 XP · 140 Ouro',
    icon: 'dark_mode',
    accent: '#e6194b',
  },
  {
    id: 5,
    title: 'O Trono Carmesim',
    chapter: 'Final',
    description: 'O Lorde Supremo aguarda. A batalha final pelo domínio da noite.',
    enemyClass: 'VAMPIRE',
    difficulty: 'extreme',
    reward: '500 XP · 300 Ouro · Cosmético Exclusivo',
    icon: 'diamond',
    accent: '#a80038',
  },
];

const DIFFICULTY_LABELS = {
  easy: { label: 'Fácil', color: '#22c55e' },
  normal: { label: 'Normal', color: '#f59e0b' },
  hard: { label: 'Difícil', color: '#ef4444' },
  extreme: { label: 'Extremo', color: '#a80038' },
};

export default function Campaign({ go, stats, setStats, playerClass }) {
  const [completedStages, setCompletedStages] = useState(() => {
    const saved = localStorage.getItem('vamort_campaign_completed');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedStage, setSelectedStage] = useState(null);

  useEffect(() => {
    localStorage.setItem('vamort_campaign_completed', JSON.stringify(completedStages));
  }, [completedStages]);

  const totalStages = CAMPAIGN_STAGES.length;
  const completedCount = completedStages.length;
  const progress = totalStages > 0 ? Math.round((completedCount / totalStages) * 100) : 0;

  const handleStageClick = (stage) => {
    if (stage.id === 1 || completedStages.includes(stage.id - 1)) {
      setSelectedStage(stage);
    }
  };

  const handleStartBattle = () => {
    if (!selectedStage) return;
    go(SCREENS.BattleScreen, { campaignStage: selectedStage });
  };

  const handleCompleteStage = () => {
    if (!selectedStage) return;
    const nextStageId = selectedStage.id;
    if (!completedStages.includes(nextStageId)) {
      setCompletedStages([...completedStages, nextStageId]);
      if (selectedStage.id === totalStages) {
        setStats(s => ({
          ...s,
          gold: (s.gold || 0) + 300,
          xp: (s.xp || 0) + 500,
          ownedCosmetics: [...(s.ownedCosmetics || []), 'campaign-complete'],
        }));
      }
    }
    setSelectedStage(null);
  };

  return (
    <StitchLayout go={go} stats={stats} playerClass={playerClass} currentScreen={SCREENS.Campaign}>
      <main className="stitch-main-with-nav">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-6">
          {/* Hero Panel */}
          <StitchHeroPanel
            image={getStitchAsset('Campaign', 'map')}
            imageAlt="Gothic campaign map with ancient crypts and crimson thrones"
            className="relative overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline)] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[var(--md-sys-color-primary)]/10 blur-3xl" />
            <div className="relative flex flex-col gap-5 min-[720px]:flex-row min-[720px]:items-end min-[720px]:justify-between">
              <div>
                <StitchBadge variant="primary" className="mb-2">Crônicas Solo</StitchBadge>
                <h1 className="font-serif text-[clamp(1.9rem,4.3vw,3.1rem)] leading-[1.02] tracking-[-0.02em] text-[var(--md-sys-color-on-surface)]">
                  <span className="text-[var(--md-sys-color-secondary)]">Campanha</span> da Longa Noite
                </h1>
                <p className="mt-3 max-w-lg text-pretty text-base leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
                  Enfrente a Inquisição e a nobreza vampírica em {totalStages} estágios com dificuldade progressiva.
                  Recompensas fixas, sem RNG.
                </p>
              </div>
              <StitchCard variant="filled" className="w-full max-w-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-serif text-lg text-[var(--md-sys-color-on-surface)]">Progresso da Campanha</div>
                    <div className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{completedCount} / {totalStages} estágios</div>
                  </div>
                  <StitchStat value={`${progress}%`} label="" variant="secondary" />
                </div>
                <StitchProgress value={completedCount} max={totalStages} variant="secondary" className="mt-3 h-2" />
              </StitchCard>
            </div>
          </StitchHeroPanel>

          {/* Quick Stats */}
          <StitchGrid columns={3} gap="md">
            <StitchStat value={completedCount} label="Estágios Concluídos" icon="check_circle" variant="secondary" />
            <StitchStat value={totalStages - completedCount} label="Pendentes" icon="schedule" variant="primary" />
            <StitchStat value={`${progress}%`} label="Conclusão" icon="trending_up" variant="tertiary" />
          </StitchGrid>

          {/* Stages Grid */}
          <StitchSectionHeader title="Capítulos da Longa Noite" icon="menu_book" className="mb-4" />
          <StitchGrid columns={5} gap="md">
            {CAMPAIGN_STAGES.map((stage) => {
              const isCompleted = completedStages.includes(stage.id);
              const isUnlocked = stage.id === 1 || completedStages.includes(stage.id - 1);
              const difficulty = DIFFICULTY_LABELS[stage.difficulty];

              return (
                <StitchCard
                  key={stage.id}
                  variant={isCompleted ? 'elevated' : isUnlocked ? 'outlined' : 'filled'}
                  className="relative p-4 text-center group cursor-pointer transition-all duration-200"
                  style={{
                    opacity: isUnlocked ? 1 : 0.45,
                    borderColor: isCompleted ? 'var(--md-sys-color-secondary)' : isUnlocked ? 'var(--md-sys-color-primary)' : undefined,
                    background: isCompleted ? 'rgba(250, 188, 77, 0.08)' : undefined,
                  }}
                  onClick={() => handleStageClick(stage)}
                >
                  <div className="absolute top-2 right-2">
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-[18px] text-[var(--md-sys-color-secondary)]" aria-hidden="true">check_circle</span>
                    ) : !isUnlocked ? (
                      <span className="material-symbols-outlined text-[18px] text-[var(--md-sys-color-on-surface-variant)]" aria-hidden="true">lock</span>
                    ) : (
                      <span className="material-symbols-outlined text-[18px] text-[var(--md-sys-color-primary)]" aria-hidden="true">play_circle</span>
                    )}
                  </div>

                  <span className="material-symbols-outlined text-[32px] mb-2" style={{ color: stage.accent }} aria-hidden="true">
                    {stage.icon}
                  </span>
                  <div className="font-bold text-[var(--md-sys-color-on-surface)]">{stage.title}</div>
                  <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">{stage.chapter}</div>

                  <StitchBadge variant="surface" className="mt-2 mx-auto" style={{ backgroundColor: difficulty.color, color: 'white' }}>
                    {difficulty.label}
                  </StitchBadge>

                  <div className="mt-2 text-xs text-[var(--md-sys-color-secondary)] font-medium">{stage.reward}</div>

                  {!isCompleted && isUnlocked && (
                    <div className="mt-3 pt-3 border-t border-[var(--md-sys-color-outline)]/20">
                      <StitchButton variant="filled" size="sm" className="w-full" leftIcon="swords">
                        Iniciar
                      </StitchButton>
                    </div>
                  )}
                </StitchCard>
              );
            })}
          </StitchGrid>

          {/* Stage Detail Modal */}
          {selectedStage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
              <StitchCard variant="elevated" className="w-full max-w-lg max-h-[80vh] overflow-y-auto">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <StitchBadge variant="primary" className="mb-2">{selectedStage.chapter}</StitchBadge>
                    <h2 className="font-serif text-2xl text-[var(--md-sys-color-on-surface)]">{selectedStage.title}</h2>
                  </div>
                  <StitchButton variant="ghost" size="sm" icon="close" onClick={() => setSelectedStage(null)} />
                </div>

                <StitchDivider className="mb-4" />

                <p className="text-[var(--md-sys-color-on-surface-variant)] mb-4">{selectedStage.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <StitchBadge variant="surface" style={{ backgroundColor: selectedStage.accent }}>
                    <span className="material-symbols-outlined text-[14px]" aria-hidden="true">{selectedStage.icon}</span>
                    Inimigo: {selectedStage.enemyClass === 'HUMAN' ? 'Inquisição Humana' : 'Nobreza Vampírica'}
                  </StitchBadge>
                  <StitchBadge variant="surface" style={{ backgroundColor: DIFFICULTY_LABELS[selectedStage.difficulty].color }}>
                    {DIFFICULTY_LABELS[selectedStage.difficulty].label}
                  </StitchBadge>
                </div>

                <div className="flex items-center gap-2 text-sm text-[var(--md-sys-color-secondary)] mb-4">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">card_giftcard</span>
                  <span>Recompensa: {selectedStage.reward}</span>
                </div>

                <div className="flex gap-3">
                  <StitchButton variant="outlined" className="flex-1" onClick={() => setSelectedStage(null)}>
                    Fechar
                  </StitchButton>
                  <StitchButton variant="filled" className="flex-1" leftIcon="swords" onClick={handleStartBattle}>
                    Iniciar Batalha
                  </StitchButton>
                </div>
              </StitchCard>
            </div>
          )}
        </div>
      </main>
    </StitchLayout>
  );
}