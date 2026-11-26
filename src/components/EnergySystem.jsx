import React, { useState, useEffect } from 'react';
import { Zap, Clock, Plus } from 'lucide-react';

const MAX_ENERGY = 30;
const REGEN_MINUTES = 20;

export default function EnergySystem({ onSpend, onBuy }) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem('vamort_energy');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { current: MAX_ENERGY, lastRegen: Date.now() };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        if (prev.current >= MAX_ENERGY) return prev;
        const now = Date.now();
        const elapsed = now - prev.lastRegen;
        const regenCount = Math.floor(elapsed / (REGEN_MINUTES * 60 * 1000));
        if (regenCount > 0) {
          const newCurrent = Math.min(MAX_ENERGY, prev.current + regenCount);
          const newState = { current: newCurrent, lastRegen: prev.lastRegen + regenCount * REGEN_MINUTES * 60 * 1000 };
          try { localStorage.setItem('vamort_energy', JSON.stringify(newState)); } catch {}
          return newState;
        }
        return prev;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const spend = (amount = 1) => {
    if (state.current < amount) return false;
    const newState = { ...state, current: state.current - amount };
    setState(newState);
    try { localStorage.setItem('vamort_energy', JSON.stringify(newState)); } catch {}
    if (onSpend) onSpend(amount);
    return true;
  };

  const buyEnergy = () => {
    const newState = { current: MAX_ENERGY, lastRegen: Date.now() };
    setState(newState);
    try { localStorage.setItem('vamort_energy', JSON.stringify(newState)); } catch {}
    if (onBuy) onBuy();
  };

  const minutesToNext = state.current >= MAX_ENERGY ? 0 : REGEN_MINUTES - Math.floor((Date.now() - state.lastRegen) / 60000) % REGEN_MINUTES;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(229,169,60,0.2)' }}>
      <Zap size={16} color="var(--gold)" />
      <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>{state.current}/{MAX_ENERGY}</span>
      {state.current < MAX_ENERGY && (
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
          <Clock size={11} /> {minutesToNext}m
        </span>
      )}
      <button onClick={buyEnergy} style={{ padding: '4px 8px', borderRadius: '999px', background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))', color: '#16121c', fontWeight: 800, fontSize: '0.72rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
        <Plus size={11} /> Recarregar
      </button>
    </div>
  );
}

