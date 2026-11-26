import React, { useState, useEffect } from 'react';
import cards from '../data/hv_cards.json';
import {
  StitchCard,
  StitchButton,
  StitchInput,
  StitchSelect,
  StitchBadge,
  StitchSectionHeader,
  StitchDivider,
  StitchGrid,
  StitchModal,
} from './StitchUI.jsx';

const TAX_RATE = 0.05;

const SEED_LISTINGS = [
  { id: 'l1', cardId: cards[0]?.id, seller: 'Conde Drácula', price: 120, listedAt: Date.now() - 3600000 },
  { id: 'l2', cardId: cards[5]?.id, seller: 'Sir Galahad', price: 200, listedAt: Date.now() - 7200000 },
  { id: 'l3', cardId: cards[10]?.id, seller: 'Mago Errante', price: 80, listedAt: Date.now() - 1800000 },
  { id: 'l4', cardId: cards[15]?.id, seller: 'Lady Carmilla', price: 350, listedAt: Date.now() - 86400000 },
  { id: 'l5', cardId: cards[20]?.id, seller: 'Inquisidor Vane', price: 280, listedAt: Date.now() - 5400000 },
  { id: 'l6', cardId: cards[25]?.id, seller: 'Necromante Obscuro', price: 450, listedAt: Date.now() - 10800000 },
];

export default function Marketplace({ gold = 0, onSpend, onEarn, ownedCards = [] }) {
  const [listings, setListings] = useState(() => {
    try {
      const raw = localStorage.getItem('vamort_marketplace');
      if (raw) return JSON.parse(raw);
    } catch {}
    return SEED_LISTINGS;
  });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [sellPrice, setSellPrice] = useState(100);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    try { localStorage.setItem('vamort_marketplace', JSON.stringify(listings)); } catch {}
  }, [listings]);

  const cardMap = Object.fromEntries(cards.map(c => [c.id, c]));

  const filtered = listings.filter(l => {
    const card = cardMap[l.cardId];
    if (!card) return false;
    if (search && !card.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter !== 'all' && (card.rarity || 'COMUM') !== filter) return false;
    return true;
  });

  const handleBuy = (listing) => {
    if (gold < listing.price) {
      setMessage({ type: 'error', text: 'Ouro insuficiente!' });
      return;
    }
    const tax = Math.ceil(listing.price * TAX_RATE);
    const sellerReceives = listing.price - tax;
    setListings(prev => prev.filter(l => l.id !== listing.id));
    if (onSpend) onSpend(listing.price);
    if (onEarn) onEarn(sellerReceives);
    setMessage({ type: 'success', text: `Comprou ${cardMap[listing.cardId]?.name}! Taxa: ${tax} ouro` });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSell = () => {
    if (!selectedCard || sellPrice < 10) return;
    const newListing = {
      id: 'l_' + Date.now(),
      cardId: selectedCard.id,
      seller: 'Você',
      price: sellPrice,
      listedAt: Date.now(),
    };
    setListings(prev => [newListing, ...prev]);
    setSellModalOpen(false);
    setSelectedCard(null);
    setSellPrice(100);
    setMessage({ type: 'success', text: 'Carta listada no mercado!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const exportMarketlist = () => {
    const csvContent = [
      'Seller,Card Name,Price (Gold),Date Listed',
      ...listings.map(l => [
        l.seller,
        cards.find(c => c.id === l.cardId)?.name || 'Unknown',
        l.price,
        new Date(l.listedAt).toLocaleString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'marketplace_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportMarketlistJSON = () => {
    const jsonData = {
      listings: listings.map(l => ({
        id: l.id,
        cardId: l.cardId,
        seller: l.seller,
        price: l.price,
        listedAt: l.listedAt,
      })),
      totalItems: listings.length,
      timestamp: new Date().toISOString()
    };

    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'marketplace_export.json');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const timeAgo = (ts) => {
    const diff = Date.now() - ts;
    const h = Math.floor(diff / 3600000);
    if (h < 1) return 'agora';
    if (h < 24) return `${h}h atrás`;
    return `${Math.floor(h / 24)}d atrás`;
  };

  const rarityOptions = [
    { value: 'all', label: 'Todas Raridades' },
    { value: 'COMUM', label: 'Comum' },
    { value: 'RARA', label: 'Rara' },
    { value: 'EPICA', label: 'Épica' },
    { value: 'LENDARIA', label: 'Lendária' },
  ];

  const sellableCards = cards.filter(c => ownedCards.includes(c.id));

  return (
    <StitchCard variant="filled" className="p-4">
      <StitchSectionHeader
        title="Mercado Arcano"
        icon="storefront"
        className="mb-4"
        action={
          <div className="flex items-center gap-2">
            <StitchBadge variant="secondary" className="gap-1">
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">monetization_on</span>
              {gold}
            </StitchBadge>
            <StitchButton variant="filled" size="sm" leftIcon="add" onClick={() => setSellModalOpen(true)}>
              Vender Carta
            </StitchButton>
          </div>
        }
      />
      <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-4">
        Compre e venda cartas entre jogadores · Taxa de {Math.round(TAX_RATE * 100)}% · 10% vai para o fundo da guilda
      </p>

      {message && (
        <StitchCard
          variant="filled"
          className="mb-4 p-3"
          style={{
            backgroundColor: message.type === 'success' ? 'var(--md-sys-color-tertiary-container)' : 'var(--md-sys-color-error-container)',
            borderColor: message.type === 'success' ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-error)',
          }}
        >
          <p className="text-sm font-medium" style={{ color: message.type === 'success' ? 'var(--md-sys-color-on-tertiary-container)' : 'var(--md-sys-color-on-error-container)' }}>
            {message.text}
          </p>
        </StitchCard>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <StitchButton variant="outlined" size="sm" leftIcon="download" onClick={exportMarketlist}>
          Exportar CSV
        </StitchButton>
        <StitchButton variant="tonal" size="sm" leftIcon="download" onClick={exportMarketlistJSON}>
          JSON
        </StitchButton>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <StitchInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar carta..."
          leftIcon="search"
          className="flex-1 min-w-[200px]"
        />
        <StitchSelect
          value={filter}
          onChange={setFilter}
          options={rarityOptions}
          className="min-w-[160px]"
        />
      </div>

      <StitchGrid columns={4} gap="md">
        {filtered.map(l => {
          const card = cardMap[l.cardId];
          if (!card) return null;
          const canAfford = gold >= l.price;
          const isOwnListing = l.seller === 'Você';

          return (
            <StitchCard
              key={l.id}
              variant={isOwnListing ? 'outlined' : 'filled'}
              className="p-4 flex flex-col"
              style={{ borderColor: isOwnListing ? 'var(--md-sys-color-secondary)' : undefined }}
            >
              <div className="text-3xl mb-2" aria-hidden="true">{card.effectSymbol || '🃏'}</div>
              <div className="font-bold text-sm text-[var(--md-sys-color-on-surface)] mb-1 line-clamp-1">{card.name}</div>
              <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-2">
                {card.rarity || 'COMUM'} · {l.seller}
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-[var(--md-sys-color-secondary)]">
                  <span className="material-symbols-outlined text-[16px] align-middle" aria-hidden="true">monetization_on</span>
                  {l.price}
                </span>
                <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]" aria-hidden="true">schedule</span>
                  {timeAgo(l.listedAt)}
                </span>
              </div>
              <StitchButton
                variant={isOwnListing ? 'ghost' : canAfford ? 'filled' : 'outlined'}
                className="w-full"
                onClick={() => handleBuy(l)}
                disabled={!canAfford || isOwnListing}
                aria-label={isOwnListing ? 'Seu anúncio' : canAfford ? `Comprar ${card.name} por ${l.price} ouro` : 'Sem ouro suficiente'}
              >
                {isOwnListing ? 'Seu anúncio' : canAfford ? 'Comprar' : 'Sem ouro'}
              </StitchButton>
            </StitchCard>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-8 text-[var(--md-sys-color-on-surface-variant)]">
            Nenhum anúncio encontrado.
          </div>
        )}
      </StitchGrid>

      {/* Sell Modal */}
      <StitchModal
        isOpen={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        title="Vender Carta"
        size="md"
      >
        <div className="space-y-4">
          <StitchSelect
            label="Selecione a carta:"
            value={selectedCard?.id || ''}
            onChange={e => setSelectedCard(cards.find(c => c.id === e.target.value))}
            options={sellableCards.map(c => ({ value: c.id, label: `${c.name} (${c.rarity || 'COMUM'})` }))}
            placeholder="-- Escolha --"
            required
          />

          <StitchInput
            label="Preço (ouro):"
            type="number"
            value={sellPrice}
            onChange={e => setSellPrice(parseInt(e.target.value) || 0)}
            min={10}
            helperText={`Taxa (${Math.round(TAX_RATE * 100)}%): ${Math.ceil(sellPrice * TAX_RATE)} ouro · Você recebe: ${sellPrice - Math.ceil(sellPrice * TAX_RATE)} ouro`}
          />

          <StitchButton
            variant="filled"
            className="w-full"
            onClick={handleSell}
            disabled={!selectedCard}
          >
            Listar no Mercado
          </StitchButton>
        </div>
      </StitchModal>
    </StitchCard>
  );
}