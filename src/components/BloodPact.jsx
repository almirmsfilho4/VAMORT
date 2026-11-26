import React, { useState, useEffect, useMemo } from 'react';
import {
  StitchCard,
  StitchButton,
  StitchBadge,
  StitchSectionHeader,
  StitchDivider,
  StitchGrid,
} from './StitchUI.jsx';

const REWARDS_BASE = [
  { id: 'coffers', icon: 'card_giftcard', label: 'Baús', base: 3 },
  { id: 'blood', icon: 'bloodtype', label: 'Essência', base: 250 },
  { id: 'cards', icon: 'menu_book', label: 'Grimório', base: 15 },
  { id: 'gold', icon: 'monetization_on', label: 'Ouro', base: 500 },
];

const COVENANTS = [
  {
    id: 'dawn',
    title: 'Aliança da Alvorada',
    subtitle: 'Pacto da Ordem Humana',
    icon: 'wb_sunny',
    color: '#fabc4d',
    colorDim: '#bd8718',
    glow: 'rgba(250,188,77,0.5)',
    rewards: { coffers: 1.5, blood: 1.2, cards: 1.3, gold: 1.1 },
    desc: 'A luz da alvorada fortalece a fé e a disciplina. Recompensas focadas em grimório e essência.',
  },
  {
    id: 'dusk',
    title: 'Juramento do Crepúsculo',
    subtitle: 'Pacto da Corte Vampírica',
    icon: 'nightlight_round',
    color: '#e6194b',
    colorDim: '#92002a',
    glow: 'rgba(230,25,75,0.5)',
    rewards: { coffers: 1.2, blood: 1.5, cards: 1.1, gold: 1.3 },
    desc: 'As sombras do crepúsculo amplificam o sangue e a riqueza. Recompensas focadas em essência e ouro.',
  },
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const EPOCH_MS = new Date('2026-01-01T00:00:00Z').getTime();

function getWeekKey(date) {
  const diff = (date || new Date()).getTime() - EPOCH_MS;
  const weekIndex = Math.floor(diff / WEEK_MS);
  return `2026-W${String(weekIndex + 1).padStart(2, '0')}`;
}

function getWeekBounds(date) {
  const d = date || new Date();
  const weekKey = getWeekKey(d);
  const weekIndex = parseInt(weekKey.split('-W')[1], 10) - 1;
  const start = new Date(EPOCH_MS + weekIndex * WEEK_MS);
  const end = new Date(start.getTime() + WEEK_MS - 1);
  return { start, end, weekKey };
}

function getFeaturedCovenantIndex(weekKey) {
  const weekNum = parseInt(weekKey.split('-W')[1], 10);
  return weekNum % COVENANTS.length;
}

function formatDate(d) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function BloodPact({ onClaim }) {
  const [claimedThisWeek, setClaimedThisWeek] = useState(null);
  const [selectedCovenant, setSelectedCovenant] = useState(null);
  const [streak, setStreak] = useState(() => {
    try { return parseInt(localStorage.getItem('vamort_blood_pact_streak') || '0', 10); } catch { return 0; }
  });

  const week = useMemo(() => getWeekBounds(), []);
  const featuredIdx = getFeaturedCovenantIndex(week.weekKey);
  const featuredCovenant = COVENANTS[featuredIdx];

  useEffect(() => {
    try {
      const stored = localStorage.getItem('vamort_blood_pact_sealed');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.week === week.weekKey) {
          setClaimedThisWeek(data);
          if (data.covenant) setSelectedCovenant(data.covenant);
        }
      }
    } catch {}
  }, [week.weekKey]);

  const handleClaim = (covenantId) => {
    const covenant = COVENANTS.find(c => c.id === covenantId) || COVENANTS[0];
    const mult = covenant.rewards;
    const bonus = covenantId === featuredCovenant.id ? 1.25 : 1.0;
    const rewards = REWARDS_BASE.map(r => ({
      ...r,
      value: Math.round(r.base * (mult[r.id] || 1) * bonus),
    }));

    const payload = { week: week.weekKey, covenant: covenantId, rewards };
    setClaimedThisWeek(payload);
    setSelectedCovenant(covenantId);

    try {
      localStorage.setItem('vamort_blood_pact_sealed', JSON.stringify({ ...payload, timestamp: Date.now() }));
      const newStreak = (claimedThisWeek && claimedThisWeek.covenant === covenantId) ? streak + 1 : streak;
      setStreak(newStreak);
      localStorage.setItem('vamort_blood_pact_streak', String(newStreak));
    } catch {}

    if (onClaim) onClaim(rewards);
  };

  const renderRewardChips = (rewards) => (
    <div className="flex flex-wrap gap-2">
      {rewards.map(r => (
        <StitchBadge key={r.id} variant="surface" className="gap-1">
          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">{r.icon}</span>
          <span className="font-bold">{r.value}</span>
          <span className="text-[var(--md-sys-color-on-surface-variant)] text-xs">{r.label}</span>
        </StitchBadge>
      ))}
    </div>
  );

  if (claimedThisWeek && claimedThisWeek.week === week.weekKey) {
    const claimedCov = COVENANTS.find(c => c.id === claimedThisWeek.covenant) || COVENANTS[0];
    const IconComp = claimedCov.icon;

    return (
      <StitchCard
        variant="elevated"
        className="p-6"
        style={{
          borderColor: claimedCov.color,
          background: `linear-gradient(135deg, ${claimedCov.color}15, ${claimedCov.colorDim}10)`,
          boxShadow: `0 12px 40px rgba(0,0,0,0.6), 0 0 30px ${claimedCov.glow}`,
        }}
      >
        <StitchSectionHeader
          title="Pacto Selado"
          icon={IconComp}
          className="mb-4"
          action={
            <StitchBadge variant="secondary">{week.weekKey}</StitchBadge>
          }
        />

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div
            className="flex items-center justify-center flex-shrink-0 rounded-full"
            style={{ width: 60, height: 60, background: `linear-gradient(135deg, ${claimedCov.color}, ${claimedCov.colorDim})`, boxShadow: `0 0 20px ${claimedCov.glow}` }}
          >
            <span className="material-symbols-outlined text-[30px] text-white" aria-hidden="true">{IconComp}</span>
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-[var(--md-sys-color-on-surface)]">{claimedCov.title}</h3>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">{claimedCov.desc}</p>
          </div>
        </div>

        <StitchDivider className="my-4" />

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex flex-wrap gap-2">
            {renderRewardChips(claimedThisWeek.rewards)}
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--md-sys-color-outline)]/20">
            <span className="material-symbols-outlined text-[16px] text-[var(--md-sys-color-secondary)]" aria-hidden="true">event</span>
            <span className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Próximo pacto: {formatDate(week.end)}</span>
          </div>
          {streak > 0 && (
            <StitchBadge variant="primary" className="gap-1">
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">local_fire_department</span>
              <span className="font-bold">Sequência: {streak}</span>
            </StitchBadge>
          )}
        </div>

        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
          As recompensas foram creditadas em seu acervo. O próximo pacto estará disponível em {formatDate(week.end)}.
        </p>
      </StitchCard>
    );
  }

  return (
    <StitchCard variant="filled" className="p-6">
      <StitchSectionHeader
        title="Escolha seu Juramento"
        icon="gavel"
        className="mb-6"
        action={
          <StitchBadge variant="secondary">{week.weekKey} ({formatDate(week.start)} a {formatDate(week.end)})</StitchBadge>
        }
      />
      <p className="text-[var(--md-sys-color-on-surface-variant)] mb-6">
        A cada semana, dois pactos estão disponíveis. O pacto em destaque concede <strong>+25%</strong> nas recompensas.
        Sem RNG, sem roleta — recompensas fixas e determinísticas.
      </p>

      <StitchGrid columns={2} gap="md">
        {COVENANTS.map(cov => {
          const isFeatured = cov.id === featuredCovenant.id;
          const rewards = REWARDS_BASE.map(r => ({
            ...r,
            value: Math.round(r.base * (cov.rewards[r.id] || 1) * (isFeatured ? 1.25 : 1)),
          }));

          return (
            <StitchCard
              key={cov.id}
              variant={selectedCovenant === cov.id ? 'elevated' : 'outlined'}
              className="p-5 relative cursor-pointer transition-all duration-200"
              style={{
                borderColor: selectedCovenant === cov.id ? cov.color : undefined,
                boxShadow: selectedCovenant === cov.id ? `0 0 24px ${cov.glow}` : undefined,
              }}
              onClick={() => setSelectedCovenant(cov.id)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedCovenant(cov.id); } }}
              tabIndex={0}
              role="button"
              aria-pressed={selectedCovenant === cov.id}
            >
              {isFeatured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <StitchBadge variant="primary">EM DESTAQUE +25%</StitchBadge>
                </div>
              )}

              <div className="flex items-center gap-3 mb-3">
                <div
                  className="flex items-center justify-center flex-shrink-0 rounded-full"
                  style={{ width: 48, height: 48, background: `linear-gradient(135deg, ${cov.color}, ${cov.colorDim})`, boxShadow: `0 0 16px ${cov.glow}` }}
                >
                  <span className="material-symbols-outlined text-[24px] text-white" aria-hidden="true">{cov.icon}</span>
                </div>
                <div>
                  <div className="font-serif text-lg font-bold text-[var(--md-sys-color-on-surface)]">{cov.title}</div>
                  <div className="text-xs uppercase tracking-wide" style={{ color: cov.color }}>{cov.subtitle}</div>
                </div>
              </div>

              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-3">{cov.desc}</p>

              {renderRewardChips(rewards)}

              {selectedCovenant === cov.id && (
                <div className="mt-4 pt-4 border-t border-[var(--md-sys-color-outline)]/20">
                  <StitchButton
                    variant="filled"
                    className="w-full"
                    onClick={() => handleClaim(cov.id)}
                    leftIcon="local_fire_department"
                    style={{ background: `linear-gradient(135deg, ${cov.color}, ${cov.colorDim})`, borderColor: cov.color }}
                  >
                    Selar Pacto
                  </StitchButton>
                </div>
              )}
            </StitchCard>
          );
        })}
      </StitchGrid>
    </StitchCard>
  );
}