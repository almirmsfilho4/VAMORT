import React, { useState, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import {
  StitchButton,
  StitchCard,
  StitchBadge,
  StitchGrid,
  StitchSectionHeader,
  StitchStat,
  StitchDivider,
} from './StitchUI.jsx';

const ACHIEVEMENTS = [
  { 
    id: 'first_win', 
    nameKey: 'achievements.first_win.name', 
    descKey: 'achievements.first_win.desc', 
    icon: 'emoji_events', 
    rewardKey: 'achievements.first_win.reward', 
    check: (s) => s.wins >= 1 
  },
  { 
    id: 'ten_wins', 
    nameKey: 'achievements.ten_wins.name', 
    descKey: 'achievements.ten_wins.desc', 
    icon: 'star', 
    rewardKey: 'achievements.ten_wins.reward', 
    check: (s) => s.wins >= 10 
  },
  { 
    id: 'fifty_wins', 
    nameKey: 'achievements.fifty_wins.name', 
    descKey: 'achievements.fifty_wins.desc', 
    icon: 'workspace_premium', 
    rewardKey: 'achievements.fifty_wins.reward', 
    check: (s) => s.wins >= 50 
  },
  { 
    id: 'hundred_games', 
    nameKey: 'achievements.hundred_games.name', 
    descKey: 'achievements.hundred_games.desc', 
    icon: 'local_fire_department', 
    rewardKey: 'achievements.hundred_games.reward', 
    check: (s) => s.games >= 100 
  },
  { 
    id: 'win_streak_3', 
    nameKey: 'achievements.win_streak_3.name', 
    descKey: 'achievements.win_streak_3.desc', 
    icon: 'bolt', 
    rewardKey: 'achievements.win_streak_3.reward', 
    check: (s) => (s.maxStreak || 0) >= 3 
  },
  { 
    id: 'win_streak_5', 
    nameKey: 'achievements.win_streak_5.name', 
    descKey: 'achievements.win_streak_5.desc', 
    icon: 'workspace_premium', 
    rewardKey: 'achievements.win_streak_5.reward', 
    check: (s) => (s.maxStreak || 0) >= 5 
  },
  { 
    id: 'play_all_classes', 
    nameKey: 'achievements.play_all_classes.name', 
    descKey: 'achievements.play_all_classes.desc', 
    icon: 'sports_score', 
    rewardKey: 'achievements.play_all_classes.reward', 
    check: (s) => (s.classesPlayed || []).length >= 3 
  },
  { 
    id: 'collect_20', 
    nameKey: 'achievements.collect_20.name', 
    descKey: 'achievements.collect_20.desc', 
    icon: 'collections_bookmark', 
    rewardKey: 'achievements.collect_20.reward', 
    check: (s) => (s.ownedCards || 0) >= 20 
  },
];

export default function Achievements({ stats = {} }) {
  const { t } = useLanguage();
  const [claimed, setClaimed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vamort_achievements') || '{}'); } catch { return {}; }
  });

  const handleClaim = (id) => {
    const newClaimed = { ...claimed, [id]: true };
    setClaimed(newClaimed);
    try { localStorage.setItem('vamort_achievements', JSON.stringify(newClaimed)); } catch {}
  };

  const unlocked = useMemo(() => ACHIEVEMENTS.filter(a => a.check(stats)), [stats]);
  const locked = useMemo(() => ACHIEVEMENTS.filter(a => !a.check(stats)), [stats]);
  const allAchievements = [...unlocked, ...locked];

  return (
    <StitchCard variant="outlined" className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <StitchSectionHeader title={t('achievements.title')} icon="emoji_events" subtitle={t('achievements.subtitle').replace('{unlocked}', unlocked.length).replace('{total}', ACHIEVEMENTS.length)} />
        <StitchBadge variant="tonal" icon="check_circle" className="self-start">
          {t('achievements.unlockedLabel').replace('{count}', unlocked.length)}
        </StitchBadge>
      </div>

      <StitchDivider />

      <StitchGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} gap="md" className="gap-3 sm:gap-4">
        {allAchievements.map(a => {
          const IconComp = a.icon;
          const isUnlocked = a.check(stats);
          const isClaimed = claimed[a.id];

          return (
            <StitchCard
              key={a.id}
              variant={isUnlocked ? 'tonal' : 'outlined'}
              className="p-4 flex flex-col transition-all duration-200"
              style={{
                background: isUnlocked 
                  ? 'rgba(255,215,0,0.08)' 
                  : 'var(--md-sys-color-surface-container-low)',
                borderColor: isUnlocked 
                  ? 'var(--md-sys-color-tertiary)' 
                  : 'var(--md-sys-color-outline-variant)',
                opacity: isUnlocked ? 1 : 0.6,
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isUnlocked 
                      ? 'rgba(255,215,0,0.15)' 
                      : 'var(--md-sys-color-surface-container)',
                    color: isUnlocked 
                      ? 'var(--md-sys-color-tertiary)' 
                      : 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  <span className="material-symbols-outlined text-xl sm:text-2xl" aria-hidden="true">
                    {IconComp}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate" style={{ color: isUnlocked ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-on-surface-variant)' }}>
                    {t(a.nameKey)}
                  </h4>
                  <p className="text-sm mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    {t(a.descKey)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StitchBadge variant={isUnlocked && !isClaimed ? 'primary' : 'ghost'} size="sm" className="whitespace-nowrap">
                    {isClaimed ? t('achievements.claimed') : isUnlocked ? t('achievements.claim') : t('achievements.locked')}
                  </StitchBadge>
                </div>
              </div>

              <StitchDivider className="my-2" />

              <div className="flex items-center justify-between">
                <StitchStat 
                  label={t('achievements.rewardLabel')} 
                  value={t(a.rewardKey)}
                  icon="card_giftcard"
                  variant="tonal"
                />
                {isUnlocked && !isClaimed && (
                  <StitchButton
                    variant="filled"
                    size="sm"
                    leftIcon="redeem"
                    onClick={() => handleClaim(a.id)}
                    className="whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg, var(--md-sys-color-tertiary), var(--md-sys-color-tertiary-container))', color: 'var(--md-sys-color-on-tertiary)' }}
                  >
                    {t('achievements.claim')}
                  </StitchButton>
                )}
                {isClaimed && (
                  <StitchBadge variant="success" icon="check_circle" size="sm">
                    {t('achievements.collected')}
                  </StitchBadge>
                )}
              </div>
            </StitchCard>
          );
        })}
      </StitchGrid>
    </StitchCard>
  );
}