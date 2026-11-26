import React, { useState } from 'react';
import { Gift, Star, Sparkles, X, Crown } from 'lucide-react';

export default function FirstPurchaseOffer({ onBuy }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('vamort_first_offer_dismissed') === 'true'; } catch { return false; }
  });
  const [claimed, setClaimed] = useState(() => {
    try { return localStorage.getItem('vamort_first_offer_claimed') === 'true'; } catch { return false; }
  });

  if (dismissed || claimed) return null;

  const handleBuy = () => {
    setClaimed(true);
    try { localStorage.setItem('vamort_first_offer_claimed', 'true'); } catch {}
    if (onBuy) onBuy();
  };
  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem('vamort_first_offer_dismissed', 'true'); } catch {}
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000, maxWidth: 360 }}>
      <div className="panel-background themed-border" style={{ padding: '20px', borderRadius: 8, background: 'linear-gradient(135deg, rgba(22,18,28,0.98), rgba(16,12,22,0.98))', borderColor: 'var(--gold)', boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 30px rgba(229,169,60,0.3)' }}>
        <button onClick={handleDismiss} style={{ position: 'absolute', top: 8, right: 8, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={16} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Gift size={20} color="#16121c" />
          </div>
          <div>
            <div style={{ fontFamily: 'Newsreader, serif', fontSize: '1rem', color: '#fabc4d', fontWeight: 600 }}>Oferta de Boas-Vindas</div>
            <div style={{ fontSize: '0.72rem', color: '#e8dfee' }}>Apenas uma vez!</div>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          {[
            { icon: Crown, label: 'Passe Premium' },
            { icon: Star, label: '500 Gemas' },
            { icon: Sparkles, label: 'Skin Exclusiva' },
          ].map((r, i) => {
            const IconComp = r.icon;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: '0.82rem', color: '#fff' }}>
                <IconComp size={14} color="var(--gold)" /> {r.label}
              </div>
            );
          })}
        </div>
        <button onClick={handleBuy} className="button-theme" style={{ width: '100%', padding: '10px', borderRadius: '999px', background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))', color: '#16121c', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Sparkles size={14} /> Resgatar Oferta
        </button>
      </div>
    </div>
  );
}

