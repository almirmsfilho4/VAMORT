/**
 * Offline Queue Manager
 * Gerencia fila de ações offline com Background Sync
 * Integra com Service Worker via postMessage
 */

import React from 'react';

const SW_MESSAGE_CHANNEL = 'offline-queue';

class OfflineQueueManager {
  constructor() {
    this.swRegistration = null;
    this.isOnline = navigator.onLine;
    this.listeners = new Set();
    this.init();
  }

  async init() {
    // Register SW message handler
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', this.handleSWMessage.bind(this));
      
      // Wait for SW to be ready
      this.swRegistration = await navigator.serviceWorker.ready;
    }

    // Online/offline detection
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Periodic sync registration (if supported)
    if (this.swRegistration && 'periodicSync' in this.swRegistration) {
      try {
        await this.swRegistration.periodicSync.register('periodic-sync-queue', {
          minInterval: 24 * 60 * 60 * 1000, // 24 hours
        });
        console.log('[OfflineQueue] Periodic sync registered');
      } catch (error) {
        console.log('[OfflineQueue] Periodic sync not available:', error.message);
      }
    }
  }

  handleSWMessage(event) {
    const { type, success, id, error, actions } = event.data || {};
    
    switch (type) {
      case 'QUEUE_OFFLINE_ACTION':
        if (success) {
          this.notifyListeners({ type: 'ACTION_QUEUED', id });
        } else {
          this.notifyListeners({ type: 'ACTION_FAILED', id, error });
        }
        break;
    }
  }

  handleOnline() {
    this.isOnline = true;
    console.log('[OfflineQueue] Online - triggering sync');
    this.notifyListeners({ type: 'ONLINE' });
    this.triggerSync();
  }

  handleOffline() {
    this.isOnline = false;
    console.log('[OfflineQueue] Offline');
    this.notifyListeners({ type: 'OFFLINE' });
  }

  // Adicionar ação à fila offline
  async queueAction(type, payload) {
    const action = { type, payload };
    
    if (!this.swRegistration) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      
      channel.port1.onmessage = (event) => {
        const { success, id, error } = event.data;
        if (success) {
          resolve({ id, queued: true });
        } else {
          reject(new Error(error || 'Failed to queue action'));
        }
      };

      if (this.swRegistration?.active) {
        this.swRegistration.active.postMessage(
          { type: 'QUEUE_OFFLINE_ACTION', payload: action },
          [channel.port2]
        );
      } else {
        // SW not ready, store locally and retry
        this.storeLocally(action).then(resolve).catch(reject);
      }
    });
  }

  // Fallback localStorage para quando SW não está disponível
  async storeLocally(action) {
    const key = 'vamort-offline-queue-local';
    const queue = JSON.parse(localStorage.getItem(key) || '[]');
    const id = Date.now() + Math.random();
    queue.push({ ...action, id, timestamp: Date.now(), retries: 0 });
    localStorage.setItem(key, JSON.stringify(queue));
    return { id, queued: true, local: true };
  }

  // Obter fila local
  async getLocalQueue() {
    const key = 'vamort-offline-queue-local';
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  // Limpar fila local
  async clearLocalQueue() {
    localStorage.removeItem('vamort-offline-queue-local');
  }

  // Sincronizar fila local com SW
  async syncLocalQueue() {
    const localQueue = await this.getLocalQueue();
    for (const action of localQueue) {
      await this.queueAction(action.type, action.payload);
    }
    await this.clearLocalQueue();
  }

  // Trigger background sync
  async triggerSync() {
    if (!this.swRegistration) return;
    
    try {
      await this.swRegistration.sync.register('sync-offline-queue');
      console.log('[OfflineQueue] Background sync triggered');
    } catch (error) {
      console.log('[OfflineQueue] Sync registration failed:', error.message);
      // Fallback: process local queue
      await this.syncLocalQueue();
    }
  }

  // Obter status da fila
  async getQueueStatus() {
    if (this.swRegistration?.active) {
      return new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          resolve({ sw: event.data.actions?.length || 0, local: (await this.getLocalQueue()).length });
        };
        this.swRegistration.active.postMessage({ type: 'GET_OFFLINE_QUEUE' }, [channel.port2]);
      });
    }
    return { sw: 0, local: (await this.getLocalQueue()).length };
  }

  // Event listeners
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(event) {
    this.listeners.forEach(listener => listener(event));
  }

  // Helpers para ações comuns do jogo
  
  // Ações de partida
  queuePlayCard(matchId, cardData) {
    return this.queueAction('PLAY_CARD', { matchId, ...cardData });
  }

  queueEndTurn(matchId, turnData) {
    return this.queueAction('END_TURN', { matchId, ...turnData });
  }

  queueConcede(matchId) {
    return this.queueAction('CONCEDE', { matchId });
  }

  queueEmote(matchId, emoteId) {
    return this.queueAction('EMOTE', { matchId, emoteId });
  }

  // Crafting
  queueCraftCard(cardId, quantity = 1) {
    return this.queueAction('CRAFT_CARD', { cardId, quantity });
  }

  queueDisenchantCard(cardId, quantity = 1) {
    return this.queueAction('DISENCHANT_CARD', { cardId, quantity });
  }

  // Packs
  queueOpenPack(packId) {
    return this.queueAction('OPEN_PACK', { packId });
  }

  // Rewards
  queueClaimReward(rewardId, rewardType) {
    return this.queueAction('CLAIM_REWARD', { rewardId, rewardType });
  }

  // Matchmaking
  queueJoinMatch(queueType) {
    return this.queueAction('JOIN_MATCH', { queueType });
  }

  queueCreatePrivateMatch(settings) {
    return this.queueAction('CREATE_PRIVATE_MATCH', settings);
  }
}

// Singleton
let instance = null;

export function getOfflineQueue() {
  if (!instance) {
    instance = new OfflineQueueManager();
  }
  return instance;
}

// React hook
export function useOfflineQueue() {
  const queue = getOfflineQueue();
  const [status, setStatus] = React.useState({ online: queue.isOnline, sw: 0, local: 0 });
  
  React.useEffect(() => {
    const unsubscribe = queue.subscribe((event) => {
      if (event.type === 'ONLINE' || event.type === 'OFFLINE') {
        setStatus(prev => ({ ...prev, online: queue.isOnline }));
      }
    });
    
    // Poll status periodically
    const interval = setInterval(async () => {
      const s = await queue.getQueueStatus();
      setStatus(prev => ({ ...prev, ...s }));
    }, 5000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);
  
  return { queue, status };
}

export default OfflineQueueManager;