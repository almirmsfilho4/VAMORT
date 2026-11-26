import React from 'react';
import StitchLayout from '../components/StitchLayout.jsx';
import { SCREENS, GAME, RANKS } from '../data/constants.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStitchAsset } from '../data/stitchAssets.js';
import {
  StitchButton,
  StitchCard,
  StitchProgress,
  StitchStat,
  StitchGrid,
  StitchSectionHeader,
  StitchBadge,
  StitchDivider,
  StitchHeroPanel,
} from '../components/StitchUI.jsx';

const ACTIONS = [
  {
    screen: SCREENS.Arena,
    icon: 'swords',
    label: 'Arena de Duelo',
    description: 'Escolha sua facção e enfrente uma inteligência tática.',
    accent: 'primary',
  },
  {
    screen: SCREENS.Campaign,
    icon: 'auto_stories',
    label: 'Crônicas Solo',
    description: 'Seis encontros, uma dinastia a ser conquistada.',
    accent: 'secondary',
  },
  {
    screen: SCREENS.Journey,
    icon: 'workspace_premium',
    label: 'Jornada',
    description: 'Missões, conquistas e recompensas da temporada.',
    accent: 'tertiary',
  },
  {
    screen: SCREENS.DeckBuilder,
    icon: 'edit_note',
    label: 'Forjar Grimório',
    description: 'Ajuste a curva, os filtros e as trinta relíquias.',
    accent: 'info',
  },
  {
    screen: SCREENS.Collection,
    icon: 'collections_bookmark',
    label: 'Relicário',
    description: 'Consulte o catálogo completo e seus detalhes.',
    accent: 'secondary',
  },
  {
    screen: SCREENS.Guide,
    icon: 'menu_book',
    label: 'Códice de Regras',
    description: 'Aprenda palavras-chave, turnos e alvos.',
    accent: 'surface',
  },
];

function QuestRow({ complete, progress, target, title, detail }) {
  const percentage = target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0;
  return (
    <StitchCard variant="filled" className="min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">{title}</p>
          <p className="mt-0.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">{detail}</p>
        </div>
        <StitchBadge variant={complete ? 'secondary' : 'surface'} size="sm">
          {Math.min(progress, target)}/{target}
        </StitchBadge>
      </div>
      <StitchProgress value={Math.min(progress, target)} max={target} variant="primary" className="mt-2.5 h-1.5" />
    </StitchCard>
  );
}

export default function MainMenu({ go, stats, playerClass, deckIds }) {
  const { t } = useLanguage();
  const xp = Math.max(0, stats?.xp || 0);
  const level = Math.floor(xp / 500) + 1;
  const levelProgress = xp % 500;
  const points = Math.max(0, stats?.rankPoints ?? ((stats?.wins || 0) * 25 - (stats?.losses || 0) * 10));
  const rank = [...RANKS].reverse().find(item => points >= item.min) || RANKS[0];
  const deckCount = Array.isArray(deckIds) ? deckIds.length : 0;
  const deckReady = deckCount === GAME.maxDeckSize;
  const isVampire = playerClass === 'VAMPIRE';
  const isHuman = playerClass === 'HUMAN';
  const factionName = isVampire ? 'Corte Vampírica' : isHuman ? 'Ordem Humana' : 'Sem facção';
  const factionIcon = isVampire ? '🦇' : isHuman ? '⚔️' : '🛡️';
  const accent = isVampire ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-secondary)';

  const play = () => go(SCREENS.Arena);

  return (
    <StitchLayout go={go} stats={stats} playerClass={playerClass} currentScreen={SCREENS.MainMenu}>
      <main className="stitch-main-with-nav">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-6">
          {/* Hero Banner */}
          <StitchHeroPanel
            image={getStitchAsset('MainMenu', 'hero')}
            imageAlt="Gothic grand cathedral interior with shattered stained glass, crimson moonlight"
            className="relative overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline)] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--md-sys-color-surface)] via-[var(--md-sys-color-surface)]/90 to-[var(--md-sys-color-surface)]/15" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--md-sys-color-surface)] via-transparent to-transparent" />
            <div className="relative z-10 grid gap-8 px-5 py-7 sm:px-8 sm:py-9 min-[900px]:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] min-[900px]:items-end lg:px-10 lg:py-12">
              <div className="max-w-2xl">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <StitchBadge variant="primary">
                    Temporada I · Ato da Longa Noite
                  </StitchBadge>
                  <span className="text-xs uppercase tracking-[0.14em] text-[var(--md-sys-color-on-surface-variant)]">
                    TCG tático gótico
                  </span>
                </div>
                <h1 className="max-w-xl text-balance font-serif text-[clamp(2.15rem,5.6vw,4.4rem)] font-medium leading-[0.98] tracking-[-0.025em] text-[var(--md-sys-color-on-surface)]">
                  A noite exige um <span className="text-[var(--md-sys-color-secondary)]">estrategista.</span>
                </h1>
                <p className="mt-4 max-w-lg text-pretty text-base leading-relaxed text-[var(--md-sys-color-on-surface-variant)] sm:text-lg">
                  Comande a Corte Vampírica ou a Ordem Humana em duelos de mana, provocação e sacrifício. Cada relíquia conta — cada turno cobra seu preço.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <StitchButton
                    variant="filled"
                    size="lg"
                    leftIcon="swords"
                    onClick={play}
                    className="min-h-[48px]"
                  >
                    Entrar na Arena
                  </StitchButton>
                  <StitchButton
                    variant="outlined"
                    size="lg"
                    leftIcon="auto_stories"
                    onClick={() => go(SCREENS.Campaign)}
                    className="min-h-[48px]"
                  >
                    Continuar Crônicas
                  </StitchButton>
                </div>
              </div>

              {/* Player Status Panel */}
              <StitchCard variant="elevated" className="w-full">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--md-sys-color-on-surface-variant)]">Seu domínio</p>
                    <p className="mt-1 font-serif text-xl leading-tight text-[var(--md-sys-color-on-surface)]">{rank.name}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border" style={{ borderColor: `${accent}55`, background: `${accent}14` }}>
                    <span className="text-2xl" aria-hidden="true">{factionIcon}</span>
                  </div>
                </div>
                <StitchDivider className="my-4" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">{factionName}</span>
                  <span className="font-semibold tabular-nums" style={{ color: accent }}>{points} pts</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Grimório</span>
                  <span className={`font-semibold tabular-nums ${deckReady ? 'text-[var(--md-sys-color-success)]' : 'text-[var(--md-sys-color-secondary)]'}`}>
                    {deckCount}/{GAME.maxDeckSize}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    <span>Grau {level}</span>
                    <span className="tabular-nums">{levelProgress}/500 XP</span>
                  </div>
                  <StitchProgress value={levelProgress} max={500} variant="secondary" className="h-1.5" />
                </div>
                <StitchButton
                  variant="ghost"
                  fullWidth
                  onClick={() => go(SCREENS.Journey)}
                  className="mt-4"
                >
                  {t('nav.journey')}
                  <span className="material-symbols-outlined text-base" aria-hidden="true">arrow_forward</span>
                </StitchButton>
              </StitchCard>
            </div>
          </StitchHeroPanel>

          {/* Action Grid */}
          <section aria-labelledby="hub-actions-title">
            <StitchSectionHeader
              title="Para onde a noite leva você?"
              icon="explore"
              className="mb-4"
            >
              <span className="hidden text-sm text-[var(--md-sys-color-on-surface-variant)] sm:block">Tudo liberado. Nada de sorte.</span>
            </StitchSectionHeader>
            <StitchGrid columns={3} gap="md">
              {ACTIONS.map((action, index) => (
                <StitchCard
                  key={action.screen}
                  variant="filled"
                  hover
                  onClick={() => go(action.screen)}
                  className="group min-h-[106px] flex flex-col"
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border" style={{ borderColor: `var(--md-sys-color-${action.accent})44`, background: `var(--md-sys-color-${action.accent})12`, color: `var(--md-sys-color-${action.accent})` }}>
                      <span className="material-symbols-outlined text-[21px]" aria-hidden="true">{action.icon}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-base font-semibold text-[var(--md-sys-color-on-surface)]">
                        {action.label}
                        <span className="material-symbols-outlined text-[14px] text-[var(--md-sys-color-on-surface-variant)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--md-sys-color-secondary)]" aria-hidden="true">arrow_outward</span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">{action.description}</p>
                    </div>
                  </div>
                </StitchCard>
              ))}
            </StitchGrid>
          </section>

          {/* Session Status */}
          <section aria-labelledby="session-status-title" className="lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)] gap-4">
            <StitchCard variant="filled">
              <StitchSectionHeader
                title="Sessão atual"
                icon="star"
                className="mb-4"
              />
              <div className="space-y-3">
                <StitchCard variant="outlined">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px] text-[var(--md-sys-color-secondary)]">star</span>
                    <span className="font-semibold text-[var(--md-sys-color-on-surface)]">Nível {level}</span>
                  </div>
                  <StitchProgress value={levelProgress} max={500} variant="secondary" className="mt-1 h-1.5" />
                  <p className="mt-1 text-xs text-[var(--md-sys-color-on-surface-variant)]">{levelProgress}/500 XP para próximo nível</p>
                </StitchCard>
                {deckReady ? (
                  <StitchCard variant="outlined">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-[var(--md-sys-color-success)]">check_circle</span>
                      <span className="font-semibold text-[var(--md-sys-color-on-surface)]">Deck completo ({deckCount}/{GAME.maxDeckSize})</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--md-sys-color-on-surface-variant)]">Pronto para o duelo</p>
                  </StitchCard>
                ) : (
                  <StitchCard variant="outlined">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-[var(--md-sys-color-error)]">error</span>
                      <span className="font-semibold text-[var(--md-sys-color-on-surface)]">Deck incompleto ({deckCount}/{GAME.maxDeckSize})</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--md-sys-color-on-surface-variant)]">Complete {GAME.maxDeckSize - deckCount} carta(s) para ter 30</p>
                  </StitchCard>
                )}
              </div>
            </StitchCard>
          </section>
        </div>
      </main>
    </StitchLayout>
  );
}