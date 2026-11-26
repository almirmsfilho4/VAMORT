import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.0.0';

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
  });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature || '',
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.deleted':
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;
      
      // Find user by customer ID
      const { data: profile } = await supabase
        .from('player_profiles')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (profile) {
        const isActive = subscription.status === 'active';
        const tier = isActive ? (subscription.metadata?.tierId || 'free') : 'free';
        
        await supabase
          .from('player_profiles')
          .update({
            vip_tier: tier,
            vip_active_until: isActive 
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
          })
          .eq('user_id', profile.user_id);

        await supabase
          .from('player_stats')
          .update({
            vip_tier: tier,
            vip_active_until: isActive 
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
          })
          .eq('user_id', profile.user_id);
      }
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});