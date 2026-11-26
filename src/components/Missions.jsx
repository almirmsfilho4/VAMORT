import React, { useState, useEffect } from 'react';
import { Target, Check, Clock, Star, Zap, Trophy, Gift, Crown } from 'lucide-react';

const DAILY_MISSIONS = [
  { id: 'd1', text: 'Jogue 3 partidas', target: 3, type: 'games', reward: '50 Ouro', icon: Zap },
  { id: 'd2', text: 'Vença 2 partidas', target: 2, type: 'wins', reward: '1 Pacote', icon: Trophy },
  { id: 'd3', text: 'Cause 100 de dano', target: 100, type: 'damage', reward: '30 Ouro', icon: Star },
  { id: 'd4', text: 'Invoque 10 lacaios', target: 10, type: 'minions', reward: '40 Ouro', icon: Target },
];

const WEEKLY_MISSIONS = [
  { id: 'w1', text: 'Vença 15 partidas', target: 15, type: 'wins', reward: 'Carta Lendária', icon: Crown },
  { id: 'w2', text: 'Jogue 30 partidas', target: 30, type: 'games', reward: '500 Ouro', icon: Zap },
  { id: 'w3', text: 'Cause 1000 de dano', target: 1000, type: 'damage', reward: '3 Pacotes', icon: Star },
];

function getProgress(type, stats) {
  if (type === 'games') return stats.games || 0;
  if (type === 'wins') return stats.wins || 0;
  if (type === 'damage') return stats.totalDamage || 0;
  if (type === 'minions') return stats.minionsPlayed || 0;
  return 0;
}

export default function Missions({ stats = {} }) {
  const [claimed, setClaimed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vamort_missions_claimed') || '{}'); } catch { return {}; }
  });

  const handleClaim = (id) => {
    const newClaimed = { ...claimed, [id]: true };
    setClaimed(newClaimed);
    try { localStorage.setItem('vamort_missions_claimed', JSON.stringify(newClaimed)); } catch {}
  };

  const renderMission = (m) => {
    const progress = Math.min(getProgress(m.type, stats), m.target);
    const pct = (progress / m.target) * 100;
    const complete = progress >= m.target;
    const isClaimed = claimed[m.id];
    const IconComp = m.icon;
    return (
      <div key={m.id} style={{ padding: '14px', borderRadius: 8, background: complete ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)', border: complete ? '1px solid #22c55e' : '1px solid rgba(229,169,60,0.15)', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <IconComp size={18} color={complete ? '#22c55e' : 'var(--gold)'} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>{m.text}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Recompensa: {m.reward}</div>
          </div>
          {complete && !isClaimed && (
            <button onClick={() => handleClaim(m.id)} style={{ padding: '4px 12px', borderRadius: '999px', background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))', color: '#16121c', fontWeight: 700, fontSize: '0.78rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Gift size={12} /> Coletar
            </button>
          )}
          {isClaimed && <Check size={16} color="#22c55e" />}
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.4)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: complete ? '#22c55e' : 'linear-gradient(90deg, var(--gold), var(--gold-dim))', transition: 'width 0.5s' }} />
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2, textAlign: 'right' }}>{progress}/{m.target}</div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
      <div className="panel-background themed-border" style={{ padding: '22px 26px', borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Target size={22} color="var(--gold)" />
          <div>
            <div style={{ fontFamily: 'Newsreader, serif', fontSize: '1.2rem', color: 'var(--gold)' }}>Missões</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Complete para ganhar recompensas</div>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} /> Diárias
          </div>
          {DAILY_MISSIONS.map(renderMission)}
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', color: '#a78bfa', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Star size={14} /> Semanais
          </div>
          {WEEKLY_MISSIONS.map(renderMission)}
        </div>
      </div>
    </div>
  );
}


