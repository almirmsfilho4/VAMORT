import React, { useState } from 'react';
import { StitchCard, StitchButton, StitchBadge, StitchModal, StitchSectionHeader } from './StitchUI.jsx';
import { VIP_TIERS } from '../services/vipBenefits.js';

const TIER_INFO = {
  silver: { name: 'Silver', price: '4.99', color: '#c0c0c0', icon: 'star' },
  gold: { name: 'Gold', price: '9.99', color: '#ffd700', icon: 'star' },
  platinum: { name: 'Platinum', price: '19.99', color: '#e5e4e2', icon: 'diamond' },
  diamond: { name: 'Diamond', price: '39.99', color: '#b9f2ff', icon: 'diamond' },
};

export default function VIPSubscription({ currentTier = 'free', onSubscribe, onClose }) {
  const [selectedTier, setSelectedTier] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async (tierId) => {
    setIsProcessing(true);
    try {
      // In production, this would redirect to Stripe checkout
      // For now, simulate subscription
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (onSubscribe) onSubscribe(tierId);
    } catch (e) {
      console.error('Subscription failed:', e);
    } finally {
      setIsProcessing(false);
      setSelectedTier(null);
    }
  };

  return (
    <div className="space-y-6">
      <StitchSectionHeader title="VIP Subscription" icon="diamond" subtitle="Choose your tier and unlock exclusive benefits" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(TIER_INFO).map(([tierId, info]) => {
          const isCurrent = currentTier === tierId;
          const isHigher = VIP_TIERS[tierId]?.level > (VIP_TIERS[currentTier]?.level || 0);
          
          return (
            <StitchCard 
              key={tierId}
              variant={isCurrent ? 'elevated' : 'filled'}
              className={`p-4 text-center transition-all ${isCurrent ? 'ring-2 ring-[var(--md-sys-color-primary)]' : ''}`}
            >
              <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${info.color}, ${info.color}88)` }}>
                <span className="material-symbols-outlined text-3xl text-white">{info.icon}</span>
              </div>
              
              <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)] mb-1">{info.name}</h3>
              <div className="text-2xl font-bold text-[var(--md-sys-color-primary)] mb-3">
                ${info.price}<span className="text-sm text-[var(--md-sys-color-on-surface-variant)]">/month</span>
              </div>
              
              {isCurrent ? (
                <StitchBadge variant="primary" size="md">Current Plan</StitchBadge>
              ) : isHigher ? (
                <StitchButton 
                  variant="primary" 
                  size="sm" 
                  onClick={() => handleSubscribe(tierId)}
                  disabled={isProcessing}
                  fullWidth
                >
                  {isProcessing && selectedTier === tierId ? 'Processing...' : 'Subscribe'}
                </StitchButton>
              ) : (
                <StitchButton variant="tonal" size="sm" disabled fullWidth>
                  Downgrade
                </StitchButton>
              )}
            </StitchCard>
          );
        })}
      </div>
      
      <StitchCard variant="outlined" className="p-4">
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
          <strong>Note:</strong> In production, this would redirect to Stripe Checkout. 
          For now, subscriptions are simulated for testing purposes.
        </p>
      </StitchCard>
    </div>
  );
}