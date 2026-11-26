import React, { useState } from 'react';
import {
  StitchCard,
  StitchButton,
  StitchProgress,
  StitchBadge,
  StitchSectionHeader,
  StitchGrid,
} from './StitchUI.jsx';

const TIERS = Array.from({ length: 30 }, (_, i) => ({
  level: i + 1,
  free: i % 3 === 0 ? { type: 'gold', amount: 50 + i * 10, label: `${50 + i * 10} Ouro` } : i % 5 === 0 ? { type: 'pack', amount: 1, label: '1 Pacote' } : null,
  premium: i % 2 === 0 ? { type: 'cosmetic', label: 'Cosmético Exclusivo' } : { type: 'gold', amount: 100 + i * 20, label: `${100 + i * 20} Ouro` },
}));

export default function BattlePass({ xp = 0, isPremium = false, onBuyPremium }) {
  const level = Math.min(30, Math.floor(xp / 100) + 1);
  const progress = (xp % 100);
  const overallProgress = Math.min(100, Math.round((xp / 3000) * 100));

  return (
    <StitchCard variant="filled" className="p-4">
      <StitchSectionHeader
        title="Passe de Batalha — Temporada I"
        icon="tickets"
        className="mb-4"
        action={
          <div className="flex items-center gap-2">
            <StitchBadge variant={isPremium ? 'secondary' : 'surface'} className="gap-1">
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">{isPremium ? 'workspace_premium' : 'lock'}</span>
              {isPremium ? 'Premium Ativo' : 'Grau Gratuito'}
            </StitchBadge>
            {!isPremium && (
              <StitchButton variant="filled" size="sm" leftIcon="workspace_premium" onClick={onBuyPremium} style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                Desbloquear Premium
              </StitchButton>
            )}
          </div>
        }
      />

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="font-bold text-lg text-[var(--md-sys-color-on-surface)]">Nível {level} / 30</span>
            <span className="text-sm text-[var(--md-sys-color-on-surface-variant)] ml-2">{progress}/100 XP para o próximo</span>
          </div>
          <span className="font-bold text-[var(--md-sys-color-secondary)]">{overallProgress}%</span>
        </div>
        <StitchProgress value={xp} max={3000} variant="secondary" className="h-2" />
      </div>

      <StitchSectionHeader title="Trilha de Recompensas" icon="card_giftcard" className="mb-4" />

      <div className="overflow-x-auto pb-2">
        <StitchGrid columns={15} gap="sm" className="min-w-max">
          {TIERS.map(t => {
            const unlocked = t.level <= level;
            const freeReward = t.free;
            const premReward = t.premium;

            return (
              <StitchCard
                key={t.level}
                variant={unlocked ? 'outlined' : 'filled'}
                className="text-center p-3 min-w-[72px] flex-shrink-0"
                style={{
                  opacity: unlocked ? 1 : 0.5,
                  borderColor: unlocked ? 'var(--md-sys-color-secondary)' : undefined,
                  background: unlocked ? 'rgba(250, 188, 77, 0.08)' : undefined,
                }}
              >
                <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: unlocked ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-on-surface-variant)' }}>
                  Grau {t.level}
                </div>
                <div className="mb-1 text-xs">
                  {freeReward ? (
                    <StitchBadge variant="surface" className="gap-1">
                      <span className="material-symbols-outlined text-[12px]" aria-hidden="true">card_giftcard</span>
                      <span>{freeReward.label}</span>
                    </StitchBadge>
                  ) : (
                    <span className="text-[var(--md-sys-color-on-surface-variant)]">—</span>
                  )}
                </div>
                <div className="text-xs">
                  {isPremium ? (
                    premReward ? (
                      <StitchBadge variant="tertiary" className="gap-1">
                        <span className="material-symbols-outlined text-[12px]" aria-hidden="true">workspace_premium</span>
                        <span>{premReward.label}</span>
                      </StitchBadge>
                    ) : (
                      <span className="text-[var(--md-sys-color-on-surface-variant)]">—</span>
                    )
                  ) : (
                    <StitchBadge variant="surface" className="gap-1" style={{ opacity: 0.5 }}>
                      <span className="material-symbols-outlined text-[12px]" aria-hidden="true">lock</span>
                      <span>Premium</span>
                    </StitchBadge>
                  )}
                </div>
                {unlocked && (
                  <span className="material-symbols-outlined text-[16px] mt-1" style={{ color: 'var(--md-sys-color-tertiary)' }} aria-hidden="true">check_circle</span>
                )}
              </StitchCard>
            );
          })}
        </StitchGrid>
      </div>

      {!isPremium && (
        <StitchCard variant="elevated" className="mt-4 p-4" style={{ borderColor: 'var(--md-sys-color-tertiary)', background: 'rgba(139, 92, 246, 0.05)' }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="font-bold text-lg text-[var(--md-sys-color-tertiary)]">Desbloqueie o Passe Premium</div>
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Acesso a 30 recompensas exclusivas: cosméticos, versos de carta, títulos e muito mais ouro.</p>
            </div>
            <StitchButton variant="filled" leftIcon="workspace_premium" onClick={onBuyPremium} style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
              Comprar Premium
            </StitchButton>
          </div>
        </StitchCard>
      )}
    </StitchCard>
  );
}