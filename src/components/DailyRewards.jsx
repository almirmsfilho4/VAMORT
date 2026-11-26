import React, { useState, useEffect } from 'react';
import { calculateDailyReward, canClaimDailyReward, getVIPBenefits } from '../services/vipBenefits.js';
import { Gift, Flame, Star, Coins, Package, Check, Lock } from 'lucide-react';

const REWARD_TRACK = [
  { day: 1, type: 'gold', amount: 50, icon: Coins, label: '50 Ouro' },
  { day: 2, type: 'dust', amount: 20, icon: Star, label: '20 Pó Arcano' },
  { day: 3, type: 'pack', amount: 1, icon: Package, label: '1 Pacote' },
  { day: 4, type: 'gold', amount: 100, icon: Coins, label: '100 Ouro' },
  { day: 5, type: 'dust', amount: 40, icon: Star, label: '40 Pó Arcano' },
  { day: 6, type: 'pack', amount: 1, icon: Package, label: '1 Pacote' },
  { day: 7, type: 'legendary', amount: 1, icon: Gift, label: 'Carta Lendária' },
];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function DailyRewards({ onClaim, vipTier = 'free' }) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem('vamort_daily_rewards');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { lastClaim: null, streak: 0, claimedToday: false };
  });

  useEffect(() => {
    // Reset claimedToday if it's a new day
    if (state.lastClaim && state.lastClaim !== todayKey()) {
      setState(prev => ({ ...prev, claimedToday: false }));
    }
  }, []);

  const handleClaim = () => {
    if (state.claimedToday) return;
    const newStreak = (state.lastClaim === yesterdayKey()) ? state.streak + 1 : 1;
    const reward = REWARD_TRACK[(newStreak - 1) % REWARD_TRACK.length];
    
    // VIP bonus rewards
    const vipBenefits = getVIPBenefits(vipTier);
    const vipReward = calculateDailyReward(vipTier);
    if (vipReward) {
      if (vipReward.gold) reward.gold = (reward.gold || 0) + vipReward.gold;
      if (vipReward.dust) reward.dust = (reward.dust || 0) + vipReward.dust;
      if (vipReward.pack) reward.pack = (reward.pack || 0) + 1;
    }
    
    const newState = {
      lastClaim: todayKey(),
      streak: newStreak,
      claimedToday: true,
      lastReward: reward,
    };
    setState(newState);
    try { localStorage.setItem('vamort_daily_rewards', JSON.stringify(newState)); } catch {}
    if (onClaim) onClaim(reward);
  };

  const currentDay = ((state.streak || 0) % REWARD_TRACK.length) + (state.claimedToday ? 0 : 1);
  const claimed = state.claimedToday;

  return (
    <div className="w-full">
      <div className="panel-background themed-border" style={{ padding: '20px 26px', borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Flame size={22} color="var(--gold)" />
            <div>
              <div style={{ fontFamily: 'Newsreader, serif', fontSize: '1.15rem', color: 'var(--gold)' }}>Recompensas Diárias</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sequência: {state.streak || 0} dias · Volte amanhã para manter a chama acesa</div>
            </div>
          </div>
          <button
            onClick={handleClaim}
            disabled={claimed}
            className="button-theme"
            style={{
              padding: '10px 22px',
              borderRadius: '999px',
              background: claimed ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg, var(--gold), var(--gold-dim))',
              color: claimed ? '#86efac' : '#16121c',
              fontWeight: 800,
              cursor: claimed ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {claimed ? <><Check size={16} /> Coletado</> : 'Coletar Hoje'}
          </button>
        </div>

        <div className="w-full flex gap-2 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
          {REWARD_TRACK.map((r, i) => {
            const IconComp = r.icon;
            const dayNum = i + 1;
            const isPast = dayNum < currentDay || claimed;
            const isToday = dayNum === currentDay && !claimed;
            const isFuture = dayNum > currentDay;
            return (
              <div
                key={`reward-${r.day || i}`}
                className="snap-start min-w-[72px] sm:min-w-[88px] flex-shrink-0"
                style={{
                  padding: '12px 8px',
                  borderRadius: 8,
                  textAlign: 'center',
                  background: isToday ? 'rgba(229,169,60,0.15)' : 'rgba(255,255,255,0.03)',
                  border: isToday ? '2px solid var(--gold)' : '1px solid rgba(229,169,60,0.2)',
                  opacity: isFuture ? 0.5 : 1,
                  position: 'relative',
                }}
              >
                {isPast && (
                  <div style={{ position: 'absolute', top: 4, right: 6, color: '#22c55e' }}>
                    <Check size={14} />
                  </div>
                )}
                {isFuture && (
                  <div style={{ position: 'absolute', top: 4, right: 6, color: 'var(--text-muted)' }}>
                    <Lock size={12} />
                  </div>
                )}
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 3 }}>Dia {dayNum}</div>
                <IconComp size={22} color={isToday ? 'var(--gold)' : 'var(--text-secondary)'} style={{ margin: '0 auto 3px' }} />
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#fff' }}>{r.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}


