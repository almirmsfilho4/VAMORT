import React, { useState, useEffect } from 'react';
import { multiplayer } from '../services/multiplayer.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import {
  StitchButton,
  StitchCard,
  StitchSectionHeader,
  StitchTextField,
  StitchModal,
  StitchBadge,
  StitchIconButton,
  StitchDivider,
  StitchStat,
  StitchTooltip,
} from './StitchUI.jsx';

export default function PrivateMatch({ 
  playerClass, 
  deckIds, 
  onMatchCreated, 
  onMatchJoined,
  onError,
  initialCode = null
}) {
  const { t } = useLanguage();
  const [mode, setMode] = useState(initialCode ? 'join' : 'create'); // create, join, waiting
  const [matchCode, setMatchCode] = useState(initialCode || '');
  const [createdCode, setCreatedCode] = useState(null);
  const [matchId, setMatchId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  // Auto-join if initialCode provided
  useEffect(() => {
    if (initialCode && mode === 'join' && !isLoading) {
      handleJoinMatch();
    }
  }, [initialCode]);

  // Countdown timer
  useEffect(() => {
    if (!waitingForOpponent) return;
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          setWaitingForOpponent(false);
          setMode('create');
          setError(t('privateMatch.timeout'));
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [waitingForOpponent, t]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCreateMatch = async () => {
    if (!deckIds || deckIds.length === 0) {
      setError(t('privateMatch.noDeck'));
      return;
    }
    if (deckIds.length !== 30) {
      setError(t('privateMatch.requireDeck30'));
      return;
    }

    setError(null);
    setIsLoading(true);
    setWaitingForOpponent(true);
    setCountdown(300);

    try {
      const result = await multiplayer.createPrivateMatch(playerClass, deckIds, 'friendly');
      setCreatedCode(result.matchCode);
      setMatchId(result.matchId);
      setMode('waiting');
      onMatchCreated?.(result.matchId, result.matchCode);
    } catch (err) {
      setWaitingForOpponent(false);
      setError(err.message);
      onError?.(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinMatch = async () => {
    const code = matchCode.trim().toUpperCase();
    if (!code || code.length !== 6) {
      setError(t('privateMatch.invalidCode'));
      return;
    }
    if (!deckIds || deckIds.length === 0) {
      setError(t('privateMatch.noDeck'));
      return;
    }
    if (deckIds.length !== 30) {
      setError(t('privateMatch.requireDeck30'));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await multiplayer.joinPrivateMatch(code, playerClass, deckIds);
      setMatchId(result.matchId);
      setMode('joined');
      onMatchJoined?.(result.matchId);
    } catch (err) {
      setError(err.message);
      onError?.(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    const url = `${window.location.origin}${window.location.pathname}#pvp?code=${createdCode}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancel = async () => {
    if (matchId) {
      await multiplayer.cancelPrivateMatch(matchId);
    }
    setWaitingForOpponent(false);
    setMode('create');
    setCreatedCode(null);
    setMatchId(null);
  };

  const handleBack = () => {
    if (waitingForOpponent) {
      handleCancel();
    } else {
      setMode('create');
      setMatchCode('');
      setError(null);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-3 sm:px-0">
      {/* Mode Selection */}
      {mode === 'create' && (
        <StitchCard variant="elevated" className="p-6 space-y-6">
          <StitchSectionHeader 
            title={t('privateMatch.title')} 
            icon="lock" 
            subtitle={t('privateMatch.subtitle')} 
          />
          
          <StitchDivider label={t('privateMatch.create')} />
          
          <div className="space-y-3">
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] text-center">
              {t('privateMatch.createDesc')}
            </p>
            <StitchButton
              variant="filled"
              fullWidth
              leftIcon="add"
              onClick={handleCreateMatch}
              disabled={isLoading || !deckIds || deckIds.length !== 30}
              className="py-3 text-lg"
            >
              {isLoading ? t('common.creating') : t('privateMatch.create')}
            </StitchButton>
          </div>

          <StitchDivider label={t('privateMatch.join')} />
          
          <div className="space-y-3">
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] text-center">
              {t('privateMatch.joinDesc')}
            </p>
            <StitchTextField
              label={t('privateMatch.code')}
              value={matchCode}
              onChange={e => setMatchCode(e.target.value.toUpperCase())}
              placeholder={t('privateMatch.codePlaceholder')}
              maxLength={6}
              className="text-center text-xl tracking-widest font-mono"
              leftIcon="vpn_key"
              error={error && mode === 'join' ? error : undefined}
            />
            <StitchButton
              variant="tonal"
              fullWidth
              leftIcon="login"
              onClick={handleJoinMatch}
              disabled={isLoading || !deckIds || deckIds.length !== 30 || matchCode.length !== 6}
            >
              {isLoading ? t('common.joining') : t('privateMatch.join')}
            </StitchButton>
          </div>
        </StitchCard>
      )}

      {/* Waiting for opponent */}
      {mode === 'waiting' && (
        <StitchCard variant="elevated" className="p-6 space-y-6 text-center">
          <div className="relative">
            <div className="w-24 h-24 mx-auto mb-4">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="var(--md-sys-color-surface-variant)"
                  strokeWidth="8"
                />
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="var(--md-sys-color-secondary)"
                  strokeWidth="8"
                  strokeDasharray="283"
                  strokeDashoffset={283 * (1 - (300 - countdown) / 300)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 linear"
                  style={{ filter: 'drop-shadow(0 0 8px var(--md-sys-color-secondary))' }}
                />
              </svg>
            </div>
            <div className="text-4xl font-bold font-serif text-[var(--md-sys-color-secondary)]">
              {formatTime(countdown)}
            </div>
          </div>

          <StitchBadge variant="secondary" className="mx-auto mb-4" icon="schedule">
            {t('privateMatch.waiting')}
          </StitchBadge>

          <StitchCard variant="filled" className="p-4 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[var(--md-sys-color-secondary)]" aria-hidden="true">vpn_key</span>
              <code className="text-2xl font-mono tracking-widest letter-spacing-[0.2em] text-[var(--md-sys-color-on-surface)]">
                {createdCode}
              </code>
            </div>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
              {t('privateMatch.shareCode')}
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <StitchTooltip label={copied ? t('privateMatch.copied') : t('privateMatch.copyLink')}>
                <StitchButton
                  variant="tonal"
                  leftIcon={copied ? 'check' : 'content_copy'}
                  onClick={handleCopyCode}
                  disabled={copied}
                >
                  {copied ? t('privateMatch.copied') : t('privateMatch.copyLink')}
                </StitchButton>
              </StitchTooltip>
              <StitchButton
                variant="outlined"
                leftIcon="share"
                onClick={() => navigator.share?.({ 
                  title: 'VAMORT - ' + t('privateMatch.title'), 
                  text: `${t('privateMatch.shareCode')}: ${createdCode}`, 
                  url: `${window.location.origin}${window.location.pathname}#pvp?code=${createdCode}` 
                })}
              >
                {t('common.share')}
              </StitchButton>
            </div>
          </StitchCard>

          <StitchButton
            variant="outlined"
            fullWidth
            leftIcon="cancel"
            onClick={handleCancel}
            className="mt-4"
          >
            {t('privateMatch.cancel')}
          </StitchButton>
        </StitchCard>
      )}

      {/* Joined successfully */}
      {mode === 'joined' && (
        <StitchCard variant="elevated" className="p-6 space-y-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(34, 197, 94, 0.15)' }}>
            <span className="material-symbols-outlined text-5xl" style={{ color: '#22c55e' }} aria-hidden="true">check_circle</span>
          </div>
          <h3 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">{t('privateMatch.matchFound')}</h3>
          <p className="text-[var(--md-sys-color-on-surface-variant)]">
            {t('privateMatch.preparing')}
          </p>
          <StitchButton
            variant="filled"
            fullWidth
            leftIcon="sports_esports"
            disabled
          >
            {t('privateMatch.starting')}
          </StitchButton>
        </StitchCard>
      )}

      {/* Error Toast */}
      {error && (
        <StitchCard 
          variant="elevated" 
          className="mt-4 p-4 animate-slide-in-right"
          style={{ borderLeft: '4px solid var(--md-sys-color-error)' }}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[var(--md-sys-color-error)]" aria-hidden="true">error</span>
            <span className="flex-1 text-sm text-[var(--md-sys-color-error)]">{error}</span>
            <StitchIconButton icon="close" size="sm" onClick={() => setError(null)} aria-label={t('common.close')} />
          </div>
        </StitchCard>
      )}
    </div>
  );
}