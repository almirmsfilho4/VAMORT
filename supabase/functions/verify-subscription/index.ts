import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const { sessionId } = await req.json();

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }

    const userId = session.metadata?.userId;
    const tierId = session.metadata?.tierId;

    if (!userId || !tierId) {
      throw new Error('Missing metadata');
    }

    // Update player profile with VIP tier
    await supabase
      .from('player_profiles')
      .upsert({
        user_id: userId,
        vip_tier: tierId,
        vip_active_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        stripe_subscription_id: session.subscription,
        updated_at: new Date().toISOString(),
      });

    // Update player_stats
    await supabase
      .from('player_stats')
      .upsert({
        user_id: userId,
        vip_tier: tierId,
        vip_active_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    return new Response(
      JSON.stringify({ success: true, tier: tierId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});