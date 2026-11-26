import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import {
  StitchButton,
  StitchCard,
  StitchSectionHeader,
  StitchTabs,
  StitchBadge,
  StitchStat,
  StitchDivider,
  StitchGrid,
  StitchIconButton,
  StitchTooltip,
} from '../components/StitchUI.jsx';
import { getStitchAsset } from '../data/stitchAssets.js';

const VIP_TIERS = [
  { id: 'free', labelKey: 'vip.tier.free', price: 0, period: null, color: 'var(--md-sys-color-on-surface-variant)', bg: 'var(--md-sys-color-surface-container-low)', icon: 'diamond_outline' },
  { id: 'silver', labelKey: 'vip.tier.silver', price: 4.99, period: 'vip.price.monthly', color: '#c0c0c0', bg: 'linear-gradient(135deg, rgba(192,192,192,0.15), rgba(192,192,192,0.05))', icon: 'workspace_premium' },
  { id: 'gold', labelKey: 'vip.tier.gold', price: 9.99, period: 'vip.price.monthly', color: '#ffd700', bg: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))', icon: 'emoji_events' },
  { id: 'platinum', labelKey: 'vip.tier.platinum', price: 19.99, period: 'vip.price.monthly', color: '#00e5ff', bg: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(0,229,255,0.05))', icon: 'star' },
  { id: 'diamond', labelKey: 'vip.tier.diamond', price: 49.99, period: 'vip.price.monthly', color: '#b388ff', bg: 'linear-gradient(135deg, rgba(179,136,255,0.15), rgba(179,136,255,0.05))', icon: 'diamond' },
];

const VIP_BENEFITS = [
  { key: 'vip.benefit.dailyDust', tierMin: 'silver', values: { silver: '+50/dia', gold: '+150/dia', platinum: '+400/dia', diamond: '+1000/dia' } },
  { key: 'vip.benefit.dailyGold', tierMin: 'silver', values: { silver: '+500/dia', gold: '+1500/dia', platinum: '+4000/dia', diamond: '+10000/dia' } },
  { key: 'vip.benefit.dailyPack', tierMin: 'gold', values: { gold: '1 Comum', platinum: '1 Rara', diamond: '1 Épica' } },
  { key: 'vip.benefit.xpBoost', tierMin: 'silver', values: { silver: '+10%', gold: '+25%', platinum: '+50%', diamond: '+100%' } },
  { key: 'vip.benefit.goldBoost', tierMin: 'silver', values: { silver: '+10%', gold: '+25%', platinum: '+50%', diamond: '+100%' } },
  { key: 'vip.benefit.cosmeticDiscount', tierMin: 'silver', values: { silver: '5%', gold: '15%', platinum: '30%', diamond: '50%' } },
  { key: 'vip.benefit.priorityQueue', tierMin: 'gold', values: { gold: true, platinum: true, diamond: true } },
  { key: 'vip.benefit.exclusiveCosmetics', tierMin: 'platinum', values: { platinum: true, diamond: true } },
  { key: 'vip.benefit.monthlyCardBack', tierMin: 'platinum', values: { platinum: true, diamond: true } },
  { key: 'vip.benefit.customEmotes', tierMin: 'diamond', values: { diamond: true } },
];

function TierCard({ tier, t, isCurrent, isSelected, onSelect }) {
  return (
    <StitchCard
      variant={isCurrent ? 'filled' : isSelected ? 'tonal' : 'outlined'}
      className="flex flex-col h-full transition-all duration-200 relative overflow-hidden"
      style={{
        background: isCurrent ? 'var(--md-sys-color-primary-container)' : tier.bg,
        borderColor: isCurrent ? 'var(--md-sys-color-primary)' : isSelected ? tier.color : 'transparent',
        borderWidth: isSelected ? 2 : 1,
        boxShadow: isSelected ? `0 0 16px ${tier.color}40` : 'none',
      }}
      onClick={() => !isCurrent && onSelect?.(tier.id)}
    >
      {/* Current badge */}
      {isCurrent && (
        <StitchBadge variant="primary" className="self-start mb-2" icon="check_circle">
          {t('vip.currentTier').replace('{tier}', t(tier.labelKey))}
        </StitchBadge>
      )}
      
      {/* Selected indicator */}
      {isSelected && !isCurrent && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: tier.color }}>
          <span className="material-symbols-outlined text-white text-sm" aria-hidden="true">check</span>
        </div>
      )}

      <div className="flex flex-col flex-1 items-center text-center p-4">
        <span className="material-symbols-outlined text-5xl mb-2" aria-hidden="true" style={{ color: tier.color }}>
          {tier.icon}
        </span>
        
        <h3 className="text-xl font-bold mb-1" style={{ color: tier.color }}>
          {t(tier.labelKey)}
        </h3>

        {tier.price > 0 && (
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-3xl font-bold" style={{ color: tier.color }}>${tier.price}</span>
            <span className="text-sm text-[var(--md-sys-color-on-surface-variant)]">/{t(tier.period)}</span>
          </div>
        )}

        {!tier.price && (
          <StitchBadge variant="tonal" className="mb-3" icon="free_breakfast">
            {t('vip.tier.free')}
          </StitchBadge>
        )}

        {/* Benefits preview */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-4 min-h-[60px]">
          {VIP_BENEFITS.filter(b => b.tierMin === tier.id || 
            (tier.id === 'gold' && ['silver'].includes(b.tierMin)) ||
            (tier.id === 'platinum' && ['silver', 'gold'].includes(b.tierMin)) ||
            (tier.id === 'diamond' && ['silver', 'gold', 'platinum'].includes(b.tierMin))
          ).slice(0, 4).map((benefit, i) => (
            <StitchTooltip key={i} label={t(benefit.key)}>
              <StitchBadge variant="ghost" size="sm" className="text-xs">
                {benefit.values[tier.id] === true ? '✓' : benefit.values[tier.id] || '—'}
              </StitchBadge>
            </StitchTooltip>
          ))}
        </div>

        <StitchButton
          variant={isCurrent ? 'ghost' : tier.id === 'free' ? 'tonal' : 'filled'}
          fullWidth
          leftIcon={isCurrent ? 'check' : tier.id === 'free' ? 'upgrade' : 'credit_card'}
          disabled={isCurrent}
          onClick={() => !isCurrent && onSelect?.(tier.id)}
          className="mt-auto"
          style={tier.id !== 'free' && !isCurrent ? {
            background: `linear-gradient(135deg, ${tier.color}, ${tier.color}dd)`,
            color: '#000',
          } : {}}
        >
          {isCurrent ? t('vip.active') : tier.id === 'free' ? t('vip.currentTier') : t('vip.subscribe')}
        </StitchButton>
      </div>
    </StitchCard>
  );
}

function BenefitsTable({ t, currentTier }) {
  const tierOrder = ['free', 'silver', 'gold', 'platinum', 'diamond'];
  const currentIndex = tierOrder.indexOf(currentTier);

  return (
    <StitchCard variant="outlined" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
              <th className="text-left p-3 font-semibold text-[var(--md-sys-color-on-surface-variant)] sticky left-0 z-10" style={{ background: 'var(--md-sys-color-surface-container-low)', minWidth: '180px' }}>
                {t('vip.benefits')}
              </th>
              {VIP_TIERS.map(tier => (
                <th key={tier.id} className="text-center p-3 font-semibold" style={{ color: tier.color, minWidth: '100px' }}>
                  {t(tier.labelKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VIP_BENEFITS.map((benefit, rowIndex) => (
              <tr key={benefit.key} style={{ background: rowIndex % 2 === 0 ? 'transparent' : 'var(--md-sys-color-surface-container-low)/50' }}>
                <td className="p-3 text-[var(--md-sys-color-on-surface)] font-medium sticky left-0 z-10" style={{ background: rowIndex % 2 === 0 ? 'transparent' : 'var(--md-sys-color-surface-container-low)/50', minWidth: '180px' }}>
                  {t(benefit.key)}
                </td>
                {VIP_TIERS.map(tier => {
                  const tierIndex = tierOrder.indexOf(tier.id);
                  const hasBenefit = benefit.values[tier.id];
                  const isCurrentTier = tier.id === currentTier;
                  const isUnlocked = tierIndex <= currentIndex && hasBenefit;
                  
                  return (
                    <td key={tier.id} className="text-center p-3" style={{ 
                      color: hasBenefit ? tier.color : 'var(--md-sys-color-on-surface-variant)',
                      fontWeight: hasBenefit ? 600 : 400,
                      background: isCurrentTier ? 'rgba(0,0,0,0.03)' : 'transparent',
                    }}>
                      {hasBenefit === true ? (
                        <span className="material-symbols-outlined text-lg" aria-hidden="true">check_circle</span>
                      ) : hasBenefit ? (
                        <span>{hasBenefit}</span>
                      ) : (
                        <span className="material-symbols-outlined text-lg" aria-hidden="true">cancel</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </StitchCard>
  );
}

export default function VIPScreen({ go, stats, onClose }) {
  const { t } = useLanguage();
  const [selectedTier, setSelectedTier] = useState(null);
  const [showManage, setShowManage] = useState(false);
  
  // Get current tier from stats (mock for now - in real app this would come from subscription status)
  const currentTier = stats?.vipTier || 'free';
  const isSubscribed = currentTier !== 'free';
  const activeUntil = stats?.vipActiveUntil;

  // Tier selection handler
  const handleTierSelect = (tierId) => {
    setSelectedTier(tierId);
    // In a real app, this would trigger the payment flow
    console.log('Subscribe to tier:', tierId);
    // Simulate subscription for demo
    if (confirm(`${t('vip.subscribe')} ${t(`vip.tier.${tierId}`)}?`)) {
      // This would call your payment provider
      alert(t('vip.comingSoon'));
    }
    setSelectedTier(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <StitchSectionHeader 
          title={t('vip.title')} 
          icon="diamond" 
          subtitle={t('vip.subtitle')} 
        />
        {onClose && (
          <StitchIconButton icon="close" onClick={onClose} aria-label={t('common.close')} />
        )}
      </div>

      {/* Current Status Card */}
      {isSubscribed && (
        <StitchCard variant="filled" className="p-4" style={{ background: 'linear-gradient(135deg, var(--md-sys-color-primary-container), var(--md-sys-color-secondary-container))' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ 
                background: `linear-gradient(135deg, ${VIP_TIERS.find(t => t.id === currentTier)?.color || 'var(--md-sys-color-primary)'}, ${VIP_TIERS.find(t => t.id === currentTier)?.color}dd)` 
              }}>
                <span className="material-symbols-outlined text-3xl text-white" aria-hidden="true">
                  {VIP_TIERS.find(t => t.id === currentTier)?.icon || 'diamond'}
                </span>
              </div>
              <div>
                <div className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">
                  {t('vip.currentTier')}: {t(`vip.tier.${currentTier}`)}
                </div>
                {activeUntil && (
                  <div className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                    {t('vip.activeUntil').replace('{date}', new Date(activeUntil).toLocaleDateString())}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <StitchButton variant="tonal" leftIcon="settings" onClick={() => setShowManage(true)}>
                {t('vip.manage')}
              </StitchButton>
              <StitchButton variant="outlined" leftIcon="cancel" onClick={() => confirm(t('vip.cancel')) && alert(t('vip.comingSoon'))}>
                {t('vip.cancel')}
              </StitchButton>
            </div>
          </div>
        </StitchCard>
      )}

      {/* Tier Selection */}
      <StitchSectionHeader title={isSubscribed ? t('vip.upgrade').replace('{tier}', '') : t('vip.choosePlan')} icon="card_membership" />

      <StitchGrid columns={5} gap="md" className="gap-4">
        {VIP_TIERS.map(tier => (
          <TierCard
            key={tier.id}
            tier={tier}
            t={t}
            isCurrent={tier.id === currentTier}
            isSelected={selectedTier === tier.id}
            onSelect={handleTierSelect}
          />
        ))}
      </StitchGrid>

      {/* Benefits Comparison */}
      <StitchSectionHeader title={t('vip.benefits')} icon="star_rate" />
      <BenefitsTable t={t} currentTier={currentTier} />

      {/* Subscription Management Modal */}
      {showManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowManage(false)}>
          <StitchCard variant="elevated" className="w-full max-w-md p-6 space-y-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">{t('vip.manage')}</h3>
              <StitchIconButton icon="close" onClick={() => setShowManage(false)} aria-label={t('common.close')} />
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-2xl" style={{ color: VIP_TIERS.find(t => t.id === currentTier)?.color }}>
                    {VIP_TIERS.find(t => t.id === currentTier)?.icon}
                  </span>
                  <div>
                    <div className="font-semibold">{t(`vip.tier.${currentTier}`)} {t('vip.active')}</div>
                    <div className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                      {activeUntil 
                        ? t('vip.activeUntil').replace('{date}', new Date(activeUntil).toLocaleDateString())
                        : t('vip.comingSoon')
                      }
                    </div>
                  </div>
                </div>
              </div>

              <StitchDivider label={t('vip.upgrade')} />
              <StitchGrid columns={2} gap="sm">
                {VIP_TIERS.filter(t => t.id !== 'free' && t.id !== currentTier).map(tier => (
                  <StitchButton
                    key={tier.id}
                    variant="outlined"
                    fullWidth
                    className="py-3"
                    style={{ borderColor: tier.color, color: tier.color }}
                    onClick={() => { handleTierSelect(tier.id); setShowManage(false); }}
                  >
                    <div className="flex flex-col items-center">
                      <span className="material-symbols-outlined" style={{ color: tier.color }}>{tier.icon}</span>
                      <span className="font-medium">{t(tier.labelKey)}</span>
                      <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">${tier.price}/{t(tier.period)}</span>
                    </div>
                  </StitchButton>
                ))}
              </StitchGrid>

              <StitchDivider label={t('vip.cancel')} />
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] text-center">
                {t('vip.cancelDesc') || 'O cancelamento entra em vigor no final do período de faturamento atual. Você manterá os benefícios até lá.'}
              </p>
              <StitchButton variant="outlined" fullWidth leftIcon="cancel" onClick={() => alert(t('vip.comingSoon'))}>
                {t('vip.cancel')} {t('vip.subscription')}
              </StitchButton>
            </div>
          </StitchCard>
        </div>
      )}
    </div>
  );
}