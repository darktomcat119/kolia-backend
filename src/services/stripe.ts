import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  if (stripeClient) return stripeClient;
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY.');
  }
  stripeClient = new Stripe(apiKey);
  return stripeClient;
}

export async function createPaymentIntent(
  amount: number,
  orderId: string,
  customerEmail: string,
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const stripe = getStripeClient();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'eur',
    metadata: { order_id: orderId },
    receipt_email: customerEmail,
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  };
}

export function constructWebhookEvent(
  body: string,
  signature: string,
): Stripe.Event {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('Stripe webhook is not configured. Set STRIPE_WEBHOOK_SECRET.');
  }
  return stripe.webhooks.constructEvent(
    body,
    signature,
    webhookSecret,
  );
}
