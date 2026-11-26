/**
 * Stripe Checkout Service
 * Handles VIP subscription payments via Stripe
 */

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

// Price IDs for each tier (configure in Stripe Dashboard)
const PRICE_IDS = {
  silver: import.meta.env.VITE_STRIPE_SILVER_PRICE_ID || 'price_silver',
  gold: import.meta.env.VITE_STRIPE_GOLD_PRICE_ID || 'price_gold',
  platinum: import.meta.env.VITE_STRIPE_PLATINUM_PRICE_ID || 'price_platinum',
  diamond: import.meta.env.VITE_STRIPE_DIAMOND_PRICE_ID || 'price_diamond',
};

class StripeService {
  constructor() {
    this.stripe = null;
    this.isLoaded = false;
  }

  async init() {
    if (this.isLoaded) return true;
    if (!STRIPE_PUBLISHABLE_KEY) {
      console.log('[Stripe] No publishable key configured');
      return false;
    }

    try {
      // Load Stripe.js dynamically
      if (!window.Stripe) {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;
        document.head.appendChild(script);
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }
      this.stripe = window.Stripe(STRIPE_PUBLISHABLE_KEY);
      this.isLoaded = true;
      return true;
    } catch (error) {
      console.error('[Stripe] Failed to load:', error);
      return false;
    }
  }

  async createCheckoutSession(tierId, userId) {
    const sb = (await import('../supabase.js')).getSupabase();
    if (!sb) throw new Error('Supabase not available');

    // Call Supabase Edge Function to create checkout session
    const { data, error } = await sb.functions.invoke('create-checkout-session', {
      body: {
        priceId: PRICE_IDS[tierId],
        userId,
        tierId,
        successUrl: `${window.location.origin}/#vip?success=true`,
        cancelUrl: `${window.location.origin}/#vip?canceled=true`,
      },
    });

    if (error) throw error;
    return data;
  }

  async redirectToCheckout(tierId, userId) {
    const loaded = await this.init();
    if (!loaded) {
      // Fallback: simulate subscription for demo
      console.log('[Stripe] Not configured, simulating subscription');
      return { simulated: true };
    }

    try {
      const session = await this.createCheckoutSession(tierId, userId);
      if (session?.url) {
        window.location.href = session.url;
      } else if (session?.sessionId) {
        const { error } = await this.stripe.redirectToCheckout({ sessionId: session.sessionId });
        if (error) throw error;
      }
    } catch (error) {
      console.error('[Stripe] Checkout failed:', error);
      throw error;
    }
  }

  async handleSubscriptionSuccess(sessionId) {
    // Verify subscription with backend
    const sb = (await import('../supabase.js')).getSupabase();
    if (!sb) return false;

    try {
      const { data, error } = await sb.functions.invoke('verify-subscription', {
        body: { sessionId },
      });
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('[Stripe] Verification failed:', e);
      return false;
    }
  }
}

let instance = null;

export function getStripeService() {
  if (!instance) {
    instance = new StripeService();
  }
  return instance;
}

export default StripeService;