import { Hono } from 'hono';
import { constructWebhookEvent } from '../services/stripe.js';
import { supabaseAdmin } from '../lib/supabase.js';

const webhooks = new Hono();

// POST /api/webhooks/stripe — Stripe webhook (no auth middleware)
webhooks.post('/stripe', async (c) => {
  const signature = c.req.header('stripe-signature');

  if (!signature) {
    return c.json({ error: 'Missing stripe-signature header' }, 400);
  }

  const body = await c.req.text();

  let event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook verification failed';
    console.error('Webhook signature verification failed:', message);
    return c.json({ error: message }, 400);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.order_id;

      if (orderId) {
        await supabaseAdmin
          .from('orders')
          .update({ status: 'received' })
          .eq('id', orderId);

        console.log(`Payment succeeded for order ${orderId}`);
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.order_id;

      if (orderId) {
        await supabaseAdmin
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', orderId);

        console.log(`Payment failed for order ${orderId}`);
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return c.json({ received: true });
});

export default webhooks;
