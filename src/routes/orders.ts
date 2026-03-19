import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { createOrder } from '../services/orders.js';
import { createOrderSchema } from '../types/index.js';

const orders = new Hono();

// All order routes require authentication
orders.use('*', authMiddleware);

// POST /api/orders — Create a new order
orders.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: 'Invalid request', code: 'VALIDATION_ERROR', details: parsed.error.issues },
      400,
    );
  }

  try {
    const result = await createOrder(user.id, user.email, parsed.data);
    return c.json({ data: result }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create order';
    return c.json({ error: message, code: 'ORDER_CREATION_FAILED' }, 400);
  }
});

// GET /api/orders — Get authenticated user's orders
orders.get('/', async (c) => {
  const user = c.get('user');

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, restaurant:restaurants(id, name, image_url, logo_url), order_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return c.json({ error: 'Failed to fetch orders', code: 'FETCH_ERROR' }, 500);
  }

  return c.json({ data });
});

// GET /api/orders/:id — Get a specific order
orders.get('/:id', async (c) => {
  const user = c.get('user');
  const orderId = c.req.param('id');

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, restaurant:restaurants(id, name, image_url, logo_url, address, phone), order_items(*)')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return c.json({ error: 'Order not found', code: 'NOT_FOUND' }, 404);
  }

  return c.json({ data });
});

// PATCH /api/orders/:id/cancel — Cancel an order
orders.patch('/:id/cancel', async (c) => {
  const user = c.get('user');
  const orderId = c.req.param('id');

  // Check order exists and belongs to user
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single();

  if (!order) {
    return c.json({ error: 'Order not found', code: 'NOT_FOUND' }, 404);
  }

  if (order.status !== 'received') {
    return c.json(
      { error: 'Can only cancel orders with status "received"', code: 'INVALID_STATUS' },
      400,
    );
  }

  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId);

  if (error) {
    return c.json({ error: 'Failed to cancel order', code: 'UPDATE_ERROR' }, 500);
  }

  return c.json({ data: { message: 'Order cancelled' } });
});

export default orders;
