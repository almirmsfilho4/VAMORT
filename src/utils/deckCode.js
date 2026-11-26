import cards from '../data/hv_cards.json';

// Create a stable mapping of card IDs to indices for compact encoding
const cardIdToIndex = {};
const indexToCardId = [];
cards.forEach((card, i) => {
  cardIdToIndex[card.id] = i;
  indexToCardId[i] = card.id;
});

/**
 * Encode a deck (array of card IDs) into a compact base64 string
 * Format: [version, cardCount, cardIndex1, count1, cardIndex2, count2, ...]
 * Uses base64url encoding for URL-safe sharing
 */
export function encodeDeck(deckIds) {
  if (!deckIds || deckIds.length === 0) return '';
  
  // Count cards
  const counts = {};
  for (const id of deckIds) {
    counts[id] = (counts[id] || 0) + 1;
  }
  
  // Build payload: [version=1, numUniqueCards, index1, count1, index2, count2, ...]
  const entries = Object.entries(counts);
  const payload = [1, entries.length];
  
  for (const [cardId, count] of entries) {
    const index = cardIdToIndex[cardId];
    if (index === undefined) continue; // Skip unknown cards
    payload.push(index, count);
  }
  
  // Convert to bytes and base64url encode
  const bytes = new Uint8Array(payload);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 = btoa(binary);
  // Make URL-safe
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Decode a deck code back into an array of card IDs
 */
export function decodeDeck(code) {
  if (!code) return [];
  
  try {
    // Restore standard base64
    let b64 = code.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (b64.length % 4) b64 += '=';
    
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    if (bytes.length < 2) return [];
    const version = bytes[0];
    if (version !== 1) return []; // Unsupported version
    
    const numEntries = bytes[1];
    const deckIds = [];
    
    let offset = 2;
    for (let i = 0; i < numEntries; i++) {
      if (offset + 1 >= bytes.length) break;
      const index = bytes[offset];
      const count = bytes[offset + 1];
      offset += 2;
      
      const cardId = indexToCardId[index];
      if (!cardId) continue;
      
      for (let c = 0; c < count; c++) {
        deckIds.push(cardId);
      }
    }
    
    return deckIds;
  } catch (e) {
    console.warn('Failed to decode deck code:', e);
    return [];
  }
}

/**
 * Generate a shareable URL for a deck
 */
export function getDeckShareUrl(deckIds) {
  const code = encodeDeck(deckIds);
  if (!code) return null;
  return `${window.location.origin}${window.location.pathname}#deck=${code}`;
}

/**
 * Extract deck code from URL hash
 */
export function getDeckCodeFromUrl() {
  const hash = window.location.hash;
  const match = hash.match(/[#&]deck=([^&]+)/);
  return match ? match[1] : null;
}

/**
 * Validate deck code format
 */
export function isValidDeckCode(code) {
  if (!code) return false;
  try {
    const deckIds = decodeDeck(code);
    return deckIds.length > 0;
  } catch {
    return false;
  }
}