/**
 * VIP Benefits Service
 * Manages VIP tier benefits: daily rewards, XP/gold boosts, shop discounts, etc.
 */

const VIP_TIERS = {
  free: { level: 0, dailyGold: 0, dailyDust: 0, dailyPack: false, xpBoost: 0, goldBoost: 0, shopDiscount: 0 },
  silver: { level: 1, dailyGold: 50, dailyDust: 10, dailyPack: false, xpBoost: 0.05, goldBoost: 0.05, shopDiscount: 0.05 },
  gold: { level: 2, dailyGold: 100, dailyDust: 25, dailyPack: true, xpBoost: 0.10, goldBoost: 0.10, shopDiscount: 0.10 },
  platinum: { level: 3, dailyGold: 200, dailyDust: 50, dailyPack: true, xpBoost: 0.15, goldBoost: 0.15, shopDiscount: 0.15 },
  diamond: { level: 4, dailyGold: 400, dailyDust: 100, dailyPack: true, xpBoost: 0.25, goldBoost: 0.25, shopDiscount: 0.25 },
};

export function getVIPBenefits(tierId) {
  return VIP_TIERS[tierId] || VIP_TIERS.free;
}

export function canClaimDailyReward(tierId, lastClaimDate) {
  const tier = VIP_TIERS[tierId];
  if (!tier || tier.level === 0) return false;
  
  const today = new Date().toDateString();
  if (lastClaimDate === today) return false;
  return true;
}

export function calculateDailyReward(tierId) {
  const tier = VIP_TIERS[tierId];
  if (!tier) return null;
  
  const reward = {
    gold: tier.dailyGold,
    dust: tier.dailyDust,
    pack: tier.dailyPack,
  };
  
  return reward;
}

export function applyXPBoost(tierId, baseXP) {
  const tier = VIP_TIERS[tierId];
  if (!tier) return baseXP;
  return Math.floor(baseXP * (1 + tier.xpBoost));
}

export function applyGoldBoost(tierId, baseGold) {
  const tier = VIP_TIERS[tierId];
  if (!tier) return baseGold;
  return Math.floor(baseGold * (1 + tier.goldBoost));
}

export function applyShopDiscount(tierId, price) {
  const tier = VIP_TIERS[tierId];
  if (!tier) return price;
  return Math.floor(price * (1 - tier.shopDiscount));
}

export function isVIP(tierId) {
  return tierId !== 'free' && VIP_TIERS[tierId]?.level > 0;
}

export function getVIPBadgeColor(tierId) {
  const colors = {
    free: '#9e9e9e',
    silver: '#c0c0c0',
    gold: '#ffd700',
    platinum: '#e5e4e2',
    diamond: '#b9f2ff',
  };
  return colors[tierId] || colors.free;
}

export default {
  getVIPBenefits,
  canClaimDailyReward,
  calculateDailyReward,
  applyXPBoost,
  applyGoldBoost,
  applyShopDiscount,
  isVIP,
  getVIPBadgeColor,
  VIP_TIERS,
};