import React, { useState, useEffect } from 'react';
import { Clock, Gift, Flame, Star, Check } from 'lucide-react';

const EVENT_END = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

export default function LimitedEvent({ onClaim }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [claimed, setClaimed] = useState(() => {
    try { return localStorage.getItem('vamort_event_claimed') === 'true'; } catch { return false; }
  });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const diff = EVENT_END - now;
      if (diff <= 0) { setTimeLeft('Encerrado'); return; }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${d}d ${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  const handleClaim = () => {
    if (claimed) return;
    setClaimed(true);
    try { localStorage.setItem('vamort_event_claimed', 'true'); } catch {}
    if (onClaim) onClaim();
  };

  return (
    <div className="w-full">
      <div className="panel-background themed-border" style={{ padding: '20px 26px', borderRadius: 8, background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(18,10,16,0.9))', borderColor: 'rgba(139,92,246,0.4)' }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 0 20px rgba(139,92,246,0.5)' }}>
              <Flame size={26} color="#fff" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#a78bfa', fontFamily: 'Newsreader, serif' }}>Evento por Tempo Limitado</div>
              <h3 className="text-lg font-bold" style={{ fontFamily: 'Newsreader, serif', color: '#e8dfee' }}>Festival das Sombras</h3>
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <Clock size={13} /> Termina em {timeLeft}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              {[{ icon: Gift, label: 'Pacote Exclusivo' }, { icon: Star, label: 'Moldura Rara' }].map((r, i) => {
                const IconComp = r.icon;
                return (
                  <div key={i} className="px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.3)' }}>
                    <IconComp size={14} color="#a78bfa" />
                    <span className="text-sm text-white">{r.label}</span>
                  </div>
                );
              })}
            </div>
            <button onClick={handleClaim} disabled={claimed} className="button-theme px-5 py-2 rounded-full font-bold flex items-center gap-2" style={{ padding: '10px 20px', borderRadius: '999px', background: claimed ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: claimed ? '#86efac' : '#fff', fontWeight: 800, cursor: claimed ? 'default' : 'pointer' }}>
              {claimed ? <><Check size={16} /> Coletado</> : 'Participar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


