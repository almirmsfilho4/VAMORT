/**
 * Push Notifications Service
 * Gerencia subscrição, permissão e envio de notificações push via VAPID
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 
  'BEk_RD30qJlu_dGrdsppgUoTGiLAhnAqKCSC5Go6KCJG-5-MuK1SzXNJ1lhJJbQijh0V3E18_GDXUz-HPPVMs74';

class PushNotificationService {
  constructor() {
    this.swRegistration = null;
    this.subscription = null;
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.permission = Notification.permission;
  }

  async init() {
    if (!this.isSupported) {
      console.log('[Push] Not supported in this browser');
      return false;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.ready;
      this.subscription = await this.swRegistration.pushManager.getSubscription();
      this.permission = Notification.permission;
      console.log('[Push] Initialized, permission:', this.permission);
      return true;
    } catch (error) {
      console.error('[Push] Init failed:', error);
      return false;
    }
  }

  // Converter VAPID key para Uint8Array
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
  }

  // Solicitar permissão e subscrever
  async subscribe() {
    if (!this.isSupported) {
      throw new Error('Push notifications not supported');
    }

    if (this.permission === 'denied') {
      throw new Error('Permission denied. Enable in browser settings.');
    }

    if (!this.swRegistration) {
      await this.init();
    }

    // Solicitar permissão
    const permission = await Notification.requestPermission();
    this.permission = permission;

    if (permission !== 'granted') {
      throw new Error('Permission not granted');
    }

    // Subscrever
    try {
      this.subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log('[Push] Subscribed:', this.subscription.endpoint);
      
      // Enviar subscrição para o servidor
      await this.sendSubscriptionToServer(this.subscription);
      
      return this.subscription;
    } catch (error) {
      console.error('[Push] Subscribe failed:', error);
      throw error;
    }
  }

  // Cancelar subscrição
  async unsubscribe() {
    if (!this.subscription) return true;

    try {
      await this.subscription.unsubscribe();
      await this.removeSubscriptionFromServer(this.subscription);
      this.subscription = null;
      console.log('[Push] Unsubscribed');
      return true;
    } catch (error) {
      console.error('[Push] Unsubscribe failed:', error);
      return false;
    }
  }

  // Enviar subscrição para o backend
  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')))),
          },
        }),
      });
      return response.ok;
    } catch (error) {
      console.error('[Push] Failed to send subscription to server:', error);
      // Store locally for retry
      localStorage.setItem('vamort-push-subscription', JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')))),
        },
        timestamp: Date.now(),
      }));
      return false;
    }
  }

  // Remover subscrição do backend
  async removeSubscriptionFromServer(subscription) {
    try {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    } catch (error) {
      console.error('[Push] Failed to remove subscription from server:', error);
    }
  }

  // Verificar status
  getStatus() {
    return {
      supported: this.isSupported,
      permission: this.permission,
      subscribed: !!this.subscription,
      endpoint: this.subscription?.endpoint,
    };
  }

  // Notificação local (fallback quando push não disponível)
  showLocalNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') return;

    const defaultOptions = {
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      vibrate: [100, 50, 100],
      tag: 'vamort-local',
      renotify: true,
      requireInteraction: false,
      ...options,
    };

    this.swRegistration?.showNotification(title, defaultOptions);
  }

  // Tipos de notificação do jogo
  notifyMatchFound(matchId) {
    this.showLocalNotification('Partida Encontrada!', {
      body: 'Sua partida está pronta. Toque para entrar.',
      tag: `match-${matchId}`,
      data: { url: `#pvp?match=${matchId}`, type: 'match_found' },
      actions: [{ action: 'join', title: 'Entrar' }],
      requireInteraction: true,
    });
  }

  notifyTurnStart(matchId, turnTime) {
    this.showLocalNotification('Sua Vez!', {
      body: `Você tem ${turnTime}s para jogar.`,
      tag: `turn-${matchId}`,
      data: { url: `#replay/${matchId}?turn=current`, type: 'turn_start' },
      actions: [{ action: 'play', title: 'Jogar' }],
    });
  }

  notifyRewardClaimed(rewardName) {
    this.showLocalNotification('Recompensa Resgatada!', {
      body: `Você recebeu: ${rewardName}`,
      tag: 'reward',
      data: { url: '/#rewards', type: 'reward' },
    });
  }

  notifyDailyRewardAvailable() {
    this.showLocalNotification('Recompensa Diária Disponível', {
      body: 'Volte amanhã para resgatar sua recompensa diária!',
      tag: 'daily-reward',
      data: { url: '/#daily', type: 'daily_reward' },
      actions: [{ action: 'claim', title: 'Resgatar' }],
    });
  }

  notifyPrivateMatchInvite(inviterName, matchCode) {
    this.showLocalNotification('Convite de Partida Privada', {
      body: `${inviterName} te convidou para uma partida privada. Código: ${matchCode}`,
      tag: `invite-${matchCode}`,
      data: { url: `#pvp?code=${matchCode}`, type: 'private_invite' },
      actions: [{ action: 'join', title: 'Entrar' }],
      requireInteraction: true,
    });
  }

  notifyTournamentStart(tournamentName) {
    this.showLocalNotification('Torneio Iniciado!', {
      body: `${tournamentName} começou. Boa sorte!`,
      tag: 'tournament',
      data: { url: '/#tournaments', type: 'tournament' },
    });
  }

  notifyVIPBenefitReady(benefitName) {
    this.showLocalNotification('Benefício VIP Pronto', {
      body: `Seu benefício "${benefitName}" está disponível para resgate.`,
      tag: 'vip-benefit',
      data: { url: '/#vip', type: 'vip_benefit' },
      actions: [{ action: 'claim', title: 'Resgatar' }],
    });
  }
}

// Singleton
let instance = null;

export function getPushNotifications() {
  if (!instance) {
    instance = new PushNotificationService();
  }
  return instance;
}

// React hook
export function usePushNotifications() {
  const push = getPushNotifications();
  const [status, setStatus] = React.useState(push.getStatus());

  React.useEffect(() => {
    push.init().then(() => setStatus(push.getStatus()));
  }, [push]);

  const subscribe = async () => {
    await push.subscribe();
    setStatus(push.getStatus());
  };

  const unsubscribe = async () => {
    await push.unsubscribe();
    setStatus(push.getStatus());
  };

  return { push, status, subscribe, unsubscribe };
}

import React from 'react';

export default PushNotificationService;