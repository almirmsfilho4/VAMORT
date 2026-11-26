import React, { useState } from 'react';
import { Sparkles, Palette, Crown, Gem, Check, Lock } from 'lucide-react';

const COSMETICS = [
  { id: 'back_vampire', name: 'Verso Vampírico', type: 'cardback', price: 300, color: '#e6194b', preview: '🦇' },
  { id: 'back_human', name: 'Verso Sagrado', type: 'cardback', price: 300, color: '#fabc4d', preview: '⚔️' },
  { id: 'back_neutral', name: 'Verso Arcano', type: 'cardback', price: 300, color: '#6E9ECC', preview: '✨' },
  { id: 'board_dark', name: 'Tabuleiro Sombrio', type: 'board', price: 600, color: '#8b5cf6', preview: '🌑' },
  { id: 'board_light', name: 'Tabuleiro Luminoso', type: 'board', price: 600, color: '#fbbf24', preview: '☀️' },
  { id: 'hero_vampire_alt', name: 'Skin Lorde Carmesim', type: 'hero', price: 1200, color: '#dc2626', preview: '🧛' },
  { id: 'hero_human_alt', name: 'Skin Paladino Dourado', type: 'hero', price: 1200, color: '#f59e0b', preview: '🛡️' },
  { id: 'emote_laugh', name: 'Emote: Risada', type: 'emote', price: 150, color: '#22c55e', preview: '😂' },
  { id: 'emote_roar', name: 'Emote: Rugido', type: 'emote', price: 150, color: '#ef4444', preview: '😡' },
  { id: 'emote_bow', name: 'Emote: Reverência', type: 'emote', price: 150, color: '#3b82f6', preview: '🙇' },
];

const TYPE_LABEL = { cardback: 'Verso de Carta', board: 'Tabuleiro', hero: 'Skin de Herói', emote: 'Emote' };

export default function CosmeticShop({ gold = 0, onSpend, owned = [], onBuy }) {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? COSMETICS : COSMETICS.filter(c => c.type === filter);

  const handleBuy = (item) => {
    if (gold < item.price || owned.includes(item.id)) return;
    if (onSpend) onSpend(item.price);
    if (onBuy) onBuy(item.id);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
      <div className="panel-background themed-border" style={{ padding: '22px 26px', borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Palette size={22} color="var(--gold)" />
          <div>
            <div style={{ fontFamily: 'Newsreader, serif', fontSize: '1.2rem', color: 'var(--gold)' }}>Loja de Cosméticos</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Apenas aparência — sem vantagem competitiva. Cartas são conquistadas jogando.
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold-2)', fontWeight: 800 }}>
            <Gem size={16} /> {gold}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['all', 'cardback', 'board', 'hero', 'emote'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="button-theme small"
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                background: filter === f ? 'linear-gradient(135deg, var(--gold), var(--gold-dim))' : 'rgba(40,30,20,0.5)',
                color: filter === f ? '#16121c' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.78rem',
              }}
            >
              {f === 'all' ? 'Todos' : TYPE_LABEL[f]}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {filtered.map(item => {
            const isOwned = owned.includes(item.id);
            const canAfford = gold >= item.price;
            return (
              <div
                key={item.id}
                style={{
                  padding: '16px',
                  borderRadius: 8,
                  background: `linear-gradient(145deg, ${item.color}22, rgba(0,0,0,0.4))`,
                  border: `1px solid ${item.color}55`,
                  textAlign: 'center',
                  opacity: isOwned ? 0.7 : 1,
                }}
              >
                <div style={{ fontSize: '2.4rem', marginBottom: 8 }}>{item.preview}</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', marginBottom: 2 }}>{item.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 10 }}>{TYPE_LABEL[item.type]}</div>
                <button
                  onClick={() => handleBuy(item)}
                  disabled={isOwned || !canAfford}
                  className="button-theme"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '999px',
                    background: isOwned ? 'rgba(34,197,94,0.15)' : canAfford ? `linear-gradient(135deg, ${item.color}, ${item.color}aa)` : 'rgba(40,30,20,0.5)',
                    color: isOwned ? '#86efac' : canAfford ? '#fff' : 'var(--text-muted)',
                    fontWeight: 800,
                    cursor: isOwned || !canAfford ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    fontSize: '0.82rem',
                  }}
                >
                  {isOwned ? <><Check size={14} /> Possuído</> : <><Gem size={14} /> {item.price}</>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


