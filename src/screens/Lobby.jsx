import React, { useState, useEffect, useCallback } from 'react';
import { SCREENS } from '../data/constants.js';
import StitchLayout from '../components/StitchLayout.jsx';
import { multiplayer } from '../services/multiplayer.js';
import PrivateMatch from '../components/PrivateMatch.jsx';
import {
  StitchButton,
  StitchCard,
  StitchHeroPanel,
  StitchBadge,
  StitchProgress,
  StitchSectionHeader,
  StitchStat,
  StitchDivider,
  StitchIconButton,
  StitchGrid,
  StitchTabs,
} from '../components/StitchUI.jsx';
import { getStitchAsset } from '../data/stitchAssets.js';

const QUEUE_STATUS = {
  searching: { label: 'Procurando partida...', color: 'var(--md-sys-color-tertiary)', icon: 'search' },
  matched: { label: 'Partida encontrada!', color: 'var(--md-sys-color-secondary)', icon: 'check_circle' },
  cancelled: { label: 'Cancelado', color: 'var(--md-sys-color-error)', icon: 'cancel' },
};

export default function Lobby({ go, stats, playerClass, deckIds }) {
  const [queueStatus, setQueueStatus] = useState('idle'); // idle, searching, matched, cancelled
  const [queueId, setQueueId] = useState(null);
  const [estimatedWait, setEstimatedWait] = useState(0);
  const [playersInQueue, setPlayersInQueue] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState(null);
  const [showPrivateMatch, setShowPrivateMatch] = useState(false);
  const [joinCode, setJoinCode] = useState(null);

  // Check for private match code in URL on mount
  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/[#&?]code=([A-Z0-9]{6})/i);
    if (match) {
      setJoinCode(match[1].toUpperCase());
      setShowPrivateMatch(true);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (queueId && queueStatus === 'searching') {
        multiplayer.leaveQueue(queueId);
      }
      multiplayer.destroy();
    };
  }, [queueId, queueStatus]);

  // Listen for match found (ranked)
  useEffect(() => {
    const unsub = multiplayer.on('matchFound', ({ matchId }) => {
      setQueueStatus('matched');
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(timer);
            go(SCREENS.Battle, { matchId, isPvP: true });
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    });
    return unsub;
  }, [go]);

  // Listen for private match started
  useEffect(() => {
    const unsub = multiplayer.on('playerJoined', ({ players }) => {
      if (players.length === 2 && showPrivateMatch) {
        // Small delay to let UI update
        setTimeout(() => {
          go(SCREENS.Battle, { matchId: multiplayer.matchId, isPvP: true, isPrivate: true });
        }, 500);
      }
    });
    return unsub;
  }, [go, showPrivateMatch]);

  // Listen for queue updates (would come from server broadcast)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (queueStatus === 'searching') {
        setEstimatedWait(e => Math.min(120, e + 5));
        // In real app, fetch from server
        setPlayersInQueue(Math.floor(Math.random() * 20) + 5);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [queueStatus]);

  const handleFindMatch = async () => {
    if (!deckIds || deckIds.length === 0) {
      setError('Monte um deck primeiro no Forjador de Grimórios');
      return;
    }
    if (deckIds.length < 30) {
      setError('Deck deve ter exatamente 30 cartas');
      return;
    }
    
    setError(null);
    setQueueStatus('searching');
    setEstimatedWait(0);
    setPlayersInQueue(0);
    
    try {
      const result = await multiplayer.joinQueue(playerClass, deckIds, 'ranked');
      setQueueId(result.queueId);
    } catch (err) {
      setQueueStatus('idle');
      setError(err.message);
    }
  };

  const handleCancel = async () => {
    if (queueId) {
      await multiplayer.leaveQueue(queueId);
    }
    setQueueStatus('idle');
    setQueueId(null);
  };

  const handleBack = () => {
    if (queueStatus === 'searching') {
      handleCancel();
    } else {
      go(SCREENS.MainMenu);
    }
  };

  const statusInfo = QUEUE_STATUS[queueStatus] || { label: 'Aguardando', color: 'var(--md-sys-color-on-surface-variant)', icon: 'hourglass_empty' };

  return (
    <StitchLayout go={go} stats={stats} playerClass={playerClass} currentScreen={SCREENS.Lobby}>
      <main className="stitch-main-with-nav">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-6">
          {/* Hero Panel */}
          <StitchHeroPanel
            image={getStitchAsset('Lobby', 'arena')}
            imageAlt="Gothic arena entrance with glowing runes"
            className="relative overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline)] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="relative flex flex-col gap-4 min-[720px]:flex-row min-[720px]:items-end min-[720px]:justify-between">
              <div>
                <StitchBadge variant="secondary" className="mb-2">Salão de Batalha PvP</StitchBadge>
                <h1 className="font-serif text-[clamp(1.9rem,4.3vw,3.1rem)] leading-[1.02] tracking-[-0.02em] text-[var(--md-sys-color-on-surface)]">
                  Enfrente <span className="text-[var(--md-sys-color-secondary)]">Outros Heróis</span>
                </h1>
                <p className="mt-3 max-w-lg text-pretty text-base leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
                  Matchmaking ranqueado em tempo real. Partidas determinísticas, sem lag, reconexão automática.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <StitchStat value={stats?.rankPoints || 0} label="Pontos de Ranque" variant="secondary" />
                <StitchBadge variant={playerClass === 'VAMPIRE' ? 'primary' : 'tertiary'} className="ml-auto">
                  {playerClass === 'VAMPIRE' ? '🦇 Lorde Vampiro' : '⚔️ Paladino Humano'}
                </StitchBadge>
              </div>
            </div>
          </StitchHeroPanel>

          {/* Error Toast */}
          {error && (
            <StitchCard variant="outlined" className="border-[var(--md-sys-color-error)] bg-[var(--md-sys-color-error-container)]/20">
              <div className="flex items-center gap-3 p-3">
                <span className="material-symbols-outlined text-[var(--md-sys-color-error)]">error</span>
                <span className="text-[var(--md-sys-color-on-error-container)]">{error}</span>
                <StitchIconButton icon="close" size="sm" onClick={() => setError(null)} className="ml-auto" />
              </div>
            </StitchCard>
          )}

          {/* Queue Status */}
          <StitchCard variant="filled" className="relative overflow-hidden">
            <StitchSectionHeader title="Matchmaking" icon="match" className="mb-4" />
            
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full flex items-center justify-center border-4" 
                     style={{ 
                       borderColor: statusInfo.color,
                       background: `${statusInfo.color}15`,
                       animation: queueStatus === 'searching' ? 'pulse 2s infinite' : 'none',
                     }}>
                  <span className="material-symbols-outlined text-5xl" style={{ color: statusInfo.color }}>
                    {statusInfo.icon}
                  </span>
                </div>
                {queueStatus === 'searching' && (
                  <div className="absolute -inset-4 rounded-full border-4" 
                       style={{ borderColor: statusInfo.color, opacity: 0.3, animation: 'pulse 2s infinite' }} />
                )}
              </div>
              
              <div className="text-center">
                <h2 className="font-serif text-2xl" style={{ color: statusInfo.color }}>
                  {statusInfo.label}
                </h2>
                {queueStatus === 'searching' && (
                  <>
                    <StitchProgress value={Math.min(100, estimatedWait)} max={120} variant="secondary" className="w-64 mx-auto mt-4 h-2" />
                    <p className="mt-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                      Tempo estimado: ~{estimatedWait}s &nbsp;|&nbsp; {playersInQueue} jogadores na fila
                    </p>
                  </>
                )}
                {queueStatus === 'matched' && countdown > 0 && (
                  <div className="mt-4 text-4xl font-bold font-serif" style={{ color: statusInfo.color }}>
                    Entrando em {countdown}s...
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-4">
                {queueStatus === 'idle' && (
                  <StitchButton 
                    variant="filled" 
                    size="lg" 
                    leftIcon="sports_mma"
                    onClick={handleFindMatch}
                    className="min-w-[200px]"
                    style={{ background: 'linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-primary-dark))' }}
                  >
                    Encontrar Partida Ranqueada
                  </StitchButton>
                )}
                {queueStatus === 'searching' && (
                  <StitchButton 
                    variant="outlined" 
                    size="lg" 
                    leftIcon="cancel"
                    onClick={handleCancel}
                    className="min-w-[200px] border-[var(--md-sys-color-error)] text-[var(--md-sys-color-error)]"
                  >
                    Cancelar Busca
                  </StitchButton>
                )}
                {queueStatus === 'matched' && (
                  <StitchButton variant="filled" size="lg" disabled className="min-w-[200px]">
                    Conectando...
                  </StitchButton>
                )}
              </div>
            </div>
          </StitchCard>

          {/* Deck Preview */}
          <StitchCard variant="outlined">
            <StitchSectionHeader title="Seu Deck Atual" icon="auto_stories" className="mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StitchStat value={deckIds?.length || 0} label="Cartas" variant="secondary" />
              <StitchStat value={deckIds?.filter((_, i, arr) => arr.indexOf(deckIds[i]) === i).length || 0} label="Únicas" variant="tertiary" />
              <StitchStat value={playerClass} label="Facção" variant="surface" />
              <StitchStat value="30/30" label="Status" variant={deckIds?.length === 30 ? 'secondary' : 'primary'} />
            </div>
            {deckIds && deckIds.length > 0 && (
              <StitchDivider className="my-4" />
            )}
            {deckIds && deckIds.length > 0 && (
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] text-center">
                {deckIds.length === 30 
                  ? 'Deck válido para ranqueada' 
                  : `Deck incompleto (${deckIds.length}/30). Complete no Forjador.`}
              </p>
            )}
          </StitchCard>

          {/* Info Cards */}
          <StitchGrid columns={3} gap="md">
            <StitchCard variant="outlined">
              <StitchSectionHeader title="Como Funciona" icon="info" className="mb-3" />
              <ul className="space-y-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                <li className="flex gap-2"><span className="material-symbols-outlined text-[var(--md-sys-color-secondary)] text-base">check</span>Matchmaking por rating (ELO)</li>
                <li className="flex gap-2"><span className="material-symbols-outlined text-[var(--md-sys-color-secondary)] text-base">check</span>Simulação determinística</li>
                <li className="flex gap-2"><span className="material-symbols-outlined text-[var(--md-sys-color-secondary)] text-base">check</span>Reconexão automática (30s)</li>
                <li className="flex gap-2"><span className="material-symbols-outlined text-[var(--md-sys-color-secondary)] text-base">check</span>Anti-cheat server-side</li>
              </ul>
            </StitchCard>
            <StitchCard variant="outlined">
              <StitchSectionHeader title="Recompensas" icon="card_giftcard" className="mb-3" />
              <ul className="space-y-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                <li className="flex gap-2"><span className="material-symbols-outlined text-[var(--md-sys-color-secondary)] text-base">check</span>+25 pts ranque por vitória</li>
                <li className="flex gap-2"><span className="material-symbols-outlined text-[var(--md-sys-color-secondary)] text-base">check</span>+50 Pó Arcano</li>
                <li className="flex gap-2"><span className="material-symbols-outlined text-[var(--md-sys-color-secondary)] text-base">check</span>+100 Ouro</li>
                <li className="flex gap-2"><span className="material-symbols-outlined text-[var(--md-sys-color-secondary)] text-base">check</span>XP para Battle Pass</li>
              </ul>
            </StitchCard>
            <StitchCard variant="outlined">
              <StitchSectionHeader title="Temporadas" icon="calendar_month" className="mb-3" />
              <ul className="space-y-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                <li className="flex gap-2"><span className="material-symbols-outlined text-[var(--md-sys-color-secondary)] text-base">check</span>Temporadas mensais</li>
                <li className="flex gap-2"><span className="material-symbols-outlined text-[var(--md-sys-color-secondary)] text-base">check</span>Reset parcial de rating</li>
                <li className="flex gap-2"><span className="material-symbols-outlined text-[var(--md-sys-color-secondary)] text-base">check</span>Recompensas por tier</li>
                <li className="flex gap-2"><span className="material-symbols-outlined text-[var(--md-sys-color-secondary)] text-base">check</span>Títulos exclusivos</li>
              </ul>
            </StitchCard>
          </StitchGrid>

          {/* Private Match Tab */}
          <StitchCard variant="outlined">
            <StitchTabs
              tabs={[
                { id: 'matchmaking', label: 'Ranqueada', icon: 'sports_mma' },
                { id: 'private', label: 'Privada', icon: 'lock' },
              ]}
              activeTab={showPrivateMatch ? 'private' : 'matchmaking'}
              onChange={(tab) => setShowPrivateMatch(tab === 'private')}
            />
            {showPrivateMatch && (
              <PrivateMatch
                playerClass={playerClass}
                deckIds={deckIds}
                initialCode={joinCode}
                onMatchCreated={(matchId, code) => {
                  console.log('Private match created:', matchId, code);
                  // Clean URL
                  history.replaceState(null, '', '#lobby');
                  setJoinCode(null);
                }}
                onMatchJoined={(matchId) => {
                  history.replaceState(null, '', '#lobby');
                  setJoinCode(null);
                  go(SCREENS.Battle, { matchId, isPvP: true, isPrivate: true });
                }}
                onError={(err) => setError(err)}
              />
            )}
          </StitchCard>
        </div>
      </main>
    </StitchLayout>
  );
}