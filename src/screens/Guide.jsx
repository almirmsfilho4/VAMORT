import React from 'react';
import StitchLayout from '../components/StitchLayout.jsx';
import { SCREENS } from '../data/constants.js';
import { getStitchAsset } from '../data/stitchAssets.js';
import {
  StitchCard,
  StitchGrid,
  StitchSectionHeader,
  StitchHeroPanel,
  StitchBadge,
} from '../components/StitchUI.jsx';

const KEYWORDS = [
  { name: 'Provocação', icon: 'shield', desc: 'Inimigos devem atacar este lacaio primeiro.', color: 'text-[var(--md-sys-color-secondary)]' },
  { name: 'Escudo Divino', icon: 'shield_with_heart', desc: 'Bloqueia o próximo dano recebido.', color: 'text-[var(--md-sys-color-tertiary)]' },
  { name: 'Roubo de Vida', icon: 'bloodtype', desc: 'Cura o herói pelo dano causado.', color: 'text-[var(--md-sys-color-primary)]' },
  { name: 'Investida', icon: 'bolt', desc: 'Pode atacar no turno em que é invocado.', color: 'text-[var(--md-sys-color-tertiary)]' },
  { name: 'Voar', icon: 'air', desc: 'Só pode ser bloqueado por lacaios com Voar.', color: 'text-[var(--md-sys-color-primary)]' },
  { name: 'Furtivo', icon: 'visibility_off', desc: 'Não pode ser alvo de ataques ou feitiços até atacar.', color: 'text-[var(--md-sys-color-on-surface-variant)]' },
];

const RULES = [
  { step: 1, text: 'Cada jogador começa com 30 de vida e 1 de Sangue/Fé.' },
  { step: 2, text: 'No seu turno, compre uma carta e ganhe +1 de Sangue/Fé (máx. 10).' },
  { step: 3, text: 'Jogue cartas da mão pagando seu custo em Sangue/Fé.' },
  { step: 4, text: 'Lacaios podem atacar no turno seguinte (ou imediatamente com Investida).' },
  { step: 5, text: 'Reduza a vida do herói inimigo a 0 para vencer.' },
];

const AFFINITIES = [
  { name: 'Sangue', icon: 'bloodtype', desc: 'Foco em sacrifício, roubo de vida e lacaios agressivos.', color: '#e6194b' },
  { name: 'Fé', icon: 'auto_awesome', desc: 'Foco em cura, escudos, buffs e controle.', color: '#fabc4d' },
  { name: 'Sombra', icon: 'dark_mode', desc: 'Foco em furtividade, veneno e manipulação de custo.', color: '#9c27b0' },
  { name: 'Arcano', icon: 'psychology', desc: 'Foco em draw, manipulação de mana e feitiços.', color: '#6750a4' },
];

export default function Guide({ go, stats, playerClass }) {
  return (
    <StitchLayout go={go} stats={stats} playerClass={playerClass} currentScreen={SCREENS.Guide}>
      <main className="stitch-main-with-nav">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-6">
          {/* Hero Panel */}
          <StitchHeroPanel
            image={getStitchAsset('Guide', 'lore')}
            imageAlt="Ancient gothic grimoire with arcane symbols and candlelight"
            className="relative overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline)] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[var(--md-sys-color-primary)]/10 blur-3xl" />
            <div className="relative flex flex-col gap-4">
              <div>
                <StitchBadge variant="tertiary" className="mb-2">Códice de Regras</StitchBadge>
                <h1 className="font-serif text-[clamp(1.9rem,4.3vw,3.1rem)] leading-[1.02] tracking-[-0.02em] text-[var(--md-sys-color-on-surface)]">
                  <span className="text-[var(--md-sys-color-secondary)]">Guia Arcano</span> de VAMORT
                </h1>
                <p className="mt-3 max-w-lg text-pretty text-base leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
                  Palavras-chave, afinidades elementais e estratégias ancestrais para dominar a noite.
                </p>
              </div>
            </div>
          </StitchHeroPanel>

          {/* Keywords */}
          <StitchSectionHeader title="Palavras-chave" icon="menu_book" className="mb-4" />
          <StitchGrid columns={3} gap="md">
            {KEYWORDS.map((k, i) => (
              <StitchCard key={i} variant="filled" className="group hover:border-[var(--md-sys-color-primary)]/40 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-[var(--md-sys-color-surface-container-low)] flex items-center justify-center">
                    <span className={`material-symbols-outlined text-[22px] ${k.color}`}>{k.icon}</span>
                  </div>
                  <h3 className="font-bold text-lg text-[var(--md-sys-color-on-surface)]" style={{ color: k.color }}>{k.name}</h3>
                </div>
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{k.desc}</p>
              </StitchCard>
            ))}
          </StitchGrid>

          {/* Affinities */}
          <StitchSectionHeader title="Afinidades Elementais" icon="auto_awesome" className="mb-4 mt-8" />
          <StitchGrid columns={4} gap="md">
            {AFFINITIES.map((a, i) => (
              <StitchCard key={i} variant="filled" className="group hover:border-current/40 transition-colors" style={{ borderColor: a.color }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${a.color}20` }}>
                    <span className="material-symbols-outlined text-[22px]" style={{ color: a.color }}>{a.icon}</span>
                  </div>
                  <h3 className="font-bold text-lg text-[var(--md-sys-color-on-surface)]" style={{ color: a.color }}>{a.name}</h3>
                </div>
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{a.desc}</p>
              </StitchCard>
            ))}
          </StitchGrid>

          {/* How to Play */}
          <StitchCard variant="elevated" className="border-[var(--md-sys-color-secondary)]/30" style={{ background: 'rgba(250, 188, 77, 0.05)' }}>
            <StitchSectionHeader title="Como Jogar" icon="swords" className="mb-4" />
            <div className="space-y-3">
              {RULES.map(r => (
                <div key={r.step} className="flex gap-3 items-start">
                  <StitchBadge variant="secondary" className="flex-shrink-0 mt-0.5">{r.step}</StitchBadge>
                  <p className="text-base leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">{r.text}</p>
                </div>
              ))}
            </div>
          </StitchCard>

          {/* Tips */}
          <StitchCard variant="outlined">
            <StitchSectionHeader title="Dicas Estratégicas" icon="lightbulb" className="mb-4" />
            <div className="space-y-3 text-sm text-[var(--md-sys-color-on-surface-variant)]">
              <p><span className="font-semibold text-[var(--md-sys-color-on-surface)]">Curva de Mana:</span> Mantenha cartas de custo 1-3 para consistência no early game.</p>
              <p><span className="font-semibold text-[var(--md-sys-color-on-surface)]">Controle de Tabuleiro:</span> Lacaios com Provocação protegem seu herói e forçam trocas favoráveis.</p>
              <p><span className="font-semibold text-[var(--md-sys-color-on-surface)]">Economia de Cartas:</span> Não gaste toda a mão; guarde respostas para ameaças do oponente.</p>
              <p><span className="font-semibold text-[var(--md-sys-color-on-surface)]">Sinergia de Facção:</span> Cartas HUMAN e VAMPIRE têm bônus com heróis da mesma facção.</p>
              <p><span className="font-semibold text-[var(--md-sys-color-on-surface)]">Blood Pact Semanal:</span> Complete os ritos semanais para ouro, XP e cosméticos exclusivos.</p>
            </div>
          </StitchCard>
        </div>
      </main>
    </StitchLayout>
  );
}