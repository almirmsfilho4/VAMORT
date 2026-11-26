import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import {
  StitchButton,
  StitchCard,
  StitchBadge,
  StitchGrid,
} from './StitchUI.jsx';

const STEPS = [
  { titleKey: 'tutorial.step1.title', textKey: 'tutorial.step1.text', highlight: null },
  { titleKey: 'tutorial.step2.title', textKey: 'tutorial.step2.text', highlight: 'hand' },
  { titleKey: 'tutorial.step3.title', textKey: 'tutorial.step3.text', highlight: 'board' },
  { titleKey: 'tutorial.step4.title', textKey: 'tutorial.step4.text', highlight: 'attack' },
  { titleKey: 'tutorial.step5.title', textKey: 'tutorial.step5.text', highlight: 'keywords' },
  { titleKey: 'tutorial.step6.title', textKey: 'tutorial.step6.text', highlight: 'endturn' },
  { titleKey: 'tutorial.step7.title', textKey: 'tutorial.step7.text', highlight: null, reward: true },
];

export default function Tutorial({ onComplete }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(() => {
    try { return localStorage.getItem('vamort_tutorial_done') === 'true'; } catch { return false; }
  });

  if (done) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      setDone(true);
      try { localStorage.setItem('vamort_tutorial_done', 'true'); } catch {}
      if (onComplete) onComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => {
    setDone(true);
    try { localStorage.setItem('vamort_tutorial_done', 'true'); } catch {}
    if (onComplete) onComplete();
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-3 sm:p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <StitchCard variant="elevated" className="w-full max-w-md p-4 sm:p-6 text-center" style={{ borderColor: 'var(--md-sys-color-tertiary)' }}>
        <StitchBadge variant="tonal" className="mb-3" icon="menu_book">
          {t('tutorial.stepLabel').replace('{current}', step + 1).replace('{total}', STEPS.length)}
        </StitchBadge>
        
        <h3 className="text-lg sm:text-xl font-bold mb-3" style={{ fontFamily: 'var(--md-sys-typescale-headline-small-font-family)', color: 'var(--md-sys-color-on-surface)' }}>
          {t(current.titleKey)}
        </h3>
        <p className="text-base sm:text-lg mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.6 }}>
          {t(current.textKey)}
        </p>
        
        {current.reward && (
          <StitchCard variant="tonal" className="mb-4 flex items-center justify-center gap-2" style={{ background: 'rgba(255,215,0,0.1)', borderColor: 'var(--md-sys-color-tertiary)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-tertiary)' }}>stars</span>
            <span className="font-semibold" style={{ color: 'var(--md-sys-color-tertiary)' }}>
              {t('tutorial.reward')}
            </span>
          </StitchCard>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <StitchButton
            variant="ghost"
            fullWidth={false}
            onClick={handleSkip}
            className="sm:w-auto"
            leftIcon="skip_next"
          >
            {t('tutorial.skip')}
          </StitchButton>
          <StitchButton
            variant="filled"
            fullWidth={false}
            onClick={handleNext}
            className="sm:w-auto"
            rightIcon={isLast ? 'check' : 'arrow_forward'}
          >
            {isLast ? t('tutorial.start') : t('tutorial.next')}
          </StitchButton>
        </div>

        <StitchGrid columns={7} gap="xs" className="mt-4 justify-center">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors"
              style={{
                background: i === step 
                  ? 'var(--md-sys-color-tertiary)' 
                  : i < step 
                    ? '#22c55e' 
                    : 'rgba(255,215,0,0.2)',
              }}
            />
          ))}
        </StitchGrid>
      </StitchCard>
    </div>
  );
}