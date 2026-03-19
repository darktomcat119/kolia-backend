import { supabaseAdmin } from '../lib/supabase.js';
import { createPaymentIntent } from './stripe.js';
import type { CreateOrderInput } from '../types/index.js';

interface OrderResult {
  order_id: string;
  order_number: string;
  client_secret: string;
}

export async function createOrder(
  userId: string,
  userEmail: string,
  input: CreateOrderInput,
): Promise<OrderResult> {
  // 1. Fetch restaurant
  const { data: restaurant, error: restError } = await supabaseAdmin
    .from('restaurants')
    .select('*')
    .eq('id', input.restaurant_id)
    .eq('is_active', true)
    .single();

  if (restError || !restaurant) {
    throw new Error('Restaurant not found or inactive');
  }

  // 2. Fetch menu items and verify prices server-side
  const menuItemIds = input.items.map((i) => i.menu_item_id);
  const { data: menuItems, error: menuError } = await supabaseAdmin
    .from('menu_items')
    .select('*')
    .in('id', menuItemIds)
    .eq('restaurant_id', input.restaurant_id)
    .eq('is_available', true);

  if (menuError || !menuItems) {
    throw new Error('Failed to fetch menu items');
  }

  if (menuItems.length !== input.items.length) {
    throw new Error('Some items are unavailable or not found');
  }

  // 3. Calculate totals server-side
  const itemsWithPrices = input.items.map((orderItem) => {
    const menuItem = menuItems.find((mi) => mi.id === orderItem.menu_item_id);
    if (!menuItem) throw new Error(`Item ${orderItem.menu_item_id} not found`);
    return {
      menu_item_id: menuItem.id,
      name: menuItem.name,
      price: Number(menuItem.price),
      quantity: orderItem.quantity,
    };
  });

  const subtotal = itemsWithPrices.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const deliveryFee =
    input.order_type === 'delivery' ? Number(restaurant.delivery_fee) : 0;
  const total = subtotal + deliveryFee;

  // 4. Check minimum order
  if (subtotal < Number(restaurant.minimum_order)) {
    throw new Error(
      `Minimum order is €${Number(restaurant.minimum_order).toFixed(2)}`,
    );
  }

  // 5. Create order in database
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: userId,
      restaurant_id: input.restaurant_id,
      order_type: input.order_type,
      delivery_address: input.delivery_address ?? null,
      delivery_latitude: input.delivery_lat ?? null,
      delivery_longitude: input.delivery_lng ?? null,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      notes: input.notes ?? null,
      estimated_delivery_minutes: restaurant.estimated_delivery_max,
      order_number: 'TEMP', // Will be overwritten by trigger
    })
    .select()
    .single();

  if (orderError || !order) {
    throw new Error('Failed to create order');
  }

  // 6. Insert order items
  const orderItems = itemsWithPrices.map((item) => ({
    order_id: order.id,
    menu_item_id: item.menu_item_id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
  }));

  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    // Rollback order
    await supabaseAdmin.from('orders').delete().eq('id', order.id);
    throw new Error('Failed to create order items');
  }

  // 7. Create Stripe PaymentIntent
  const { clientSecret, paymentIntentId } = await createPaymentIntent(
    total,
    order.id,
    userEmail,
  );

  // 8. Update order with payment intent ID
  await supabaseAdmin
    .from('orders')
    .update({ stripe_payment_intent_id: paymentIntentId })
    .eq('id', order.id);

  return {
    order_id: order.id,
    order_number: order.order_number,
    client_secret: clientSecret,
  };
}
