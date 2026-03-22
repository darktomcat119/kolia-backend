import { Hono } from 'hono';
import { ownerAuthMiddleware } from '../middleware/ownerAuth.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { uploadRestaurantImage } from '../lib/upload.js';
import { createRestaurantSchema, createCategorySchema, createMenuItemSchema, updateOrderStatusSchema } from '../types/index.js';

const OWNER_MAX_UPLOAD = 5 * 1024 * 1024;
const OWNER_ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

const owner = new Hono();

// All routes require owner auth (except registration)
owner.use('/*', ownerAuthMiddleware);

// ============================================
// RESTAURANT (own restaurant)
// ============================================

// GET /api/owner/restaurant — get own restaurant(s)
owner.get('/restaurant', async (c) => {
  const user = c.get('user');

  const { data, error } = await supabaseAdmin
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at');

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

// POST /api/owner/restaurant — create own restaurant
owner.post('/restaurant', async (c) => {
  const user = c.get('user');

  // Check if owner already has a restaurant
  const { data: existing } = await supabaseAdmin
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1);

  if (existing && existing.length > 0) {
    return c.json({ error: 'You already have a restaurant', code: 'ALREADY_EXISTS' }, 409);
  }

  const body = await c.req.json();
  const result = createRestaurantSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Invalid data', details: result.error.flatten(), code: 'VALIDATION_ERROR' }, 400);
  }

  const { data, error } = await supabaseAdmin
    .from('restaurants')
    .insert({ ...result.data, owner_id: user.id })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data }, 201);
});

// PATCH /api/owner/restaurant/:id — update own restaurant
owner.patch('/restaurant/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();

  // Verify ownership
  const { data: restaurant } = await supabaseAdmin
    .from('restaurants')
    .select('owner_id')
    .eq('id', id)
    .single();

  if (!restaurant || restaurant.owner_id !== user.id) {
    return c.json({ error: 'Not found or not authorized', code: 'FORBIDDEN' }, 403);
  }

  const { data, error } = await supabaseAdmin
    .from('restaurants')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

// ============================================
// ORDERS (for own restaurant)
// ============================================

// GET /api/owner/orders — get orders for own restaurant
owner.get('/orders', async (c) => {
  const user = c.get('user');
  const status = c.req.query('status');

  // Get owner's restaurant IDs
  const { data: restaurants } = await supabaseAdmin
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id);

  if (!restaurants?.length) return c.json({ data: [] });

  const restaurantIds = restaurants.map((r) => r.id);

  let query = supabaseAdmin
    .from('orders')
    .select('*, profile:profiles(full_name, email, phone), order_items(*)')
    .in('restaurant_id', restaurantIds)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

// PATCH /api/owner/orders/:id/status — update order status
owner.patch('/orders/:id/status', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();

  const result = updateOrderStatusSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Invalid status', code: 'VALIDATION_ERROR' }, 400);
  }

  // Verify order belongs to owner's restaurant
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('restaurant_id')
    .eq('id', id)
    .single();

  if (!order) return c.json({ error: 'Order not found' }, 404);

  const { data: restaurant } = await supabaseAdmin
    .from('restaurants')
    .select('owner_id')
    .eq('id', order.restaurant_id)
    .single();

  if (!restaurant || restaurant.owner_id !== user.id) {
    return c.json({ error: 'Not authorized', code: 'FORBIDDEN' }, 403);
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ status: result.data.status })
    .eq('id', id)
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

// ============================================
// STATS (dashboard)
// ============================================

// GET /api/owner/stats — dashboard stats for own restaurant
owner.get('/stats', async (c) => {
  const user = c.get('user');

  const { data: restaurants } = await supabaseAdmin
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id);

  if (!restaurants?.length) {
    return c.json({ data: { orders_today: 0, revenue_today: 0, pending_orders: 0, total_orders: 0 } });
  }

  const restaurantIds = restaurants.map((r) => r.id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayOrders, pendingOrders, totalOrders] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select('total')
      .in('restaurant_id', restaurantIds)
      .gte('created_at', today.toISOString())
      .neq('status', 'cancelled'),
    supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact' })
      .in('restaurant_id', restaurantIds)
      .in('status', ['received', 'preparing']),
    supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact' })
      .in('restaurant_id', restaurantIds),
  ]);

  const ordersToday = todayOrders.data?.length ?? 0;
  const revenueToday = todayOrders.data?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;

  return c.json({
    data: {
      orders_today: ordersToday,
      revenue_today: revenueToday,
      pending_orders: pendingOrders.count ?? 0,
      total_orders: totalOrders.count ?? 0,
    },
  });
});

// ============================================
// MENU CATEGORIES
// ============================================

// GET /api/owner/categories — categories for own restaurant
owner.get('/categories', async (c) => {
  const user = c.get('user');

  const { data: restaurants } = await supabaseAdmin
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id);

  if (!restaurants?.length) return c.json({ data: [] });

  const { data, error } = await supabaseAdmin
    .from('menu_categories')
    .select('*')
    .in('restaurant_id', restaurants.map((r) => r.id))
    .order('sort_order');

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

// POST /api/owner/categories — add category
owner.post('/categories', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  const result = createCategorySchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Invalid data', code: 'VALIDATION_ERROR' }, 400);
  }

  // Verify restaurant ownership
  const { data: restaurant } = await supabaseAdmin
    .from('restaurants')
    .select('id')
    .eq('id', body.restaurant_id)
    .eq('owner_id', user.id)
    .single();

  if (!restaurant) return c.json({ error: 'Restaurant not found or not authorized' }, 403);

  const { data, error } = await supabaseAdmin
    .from('menu_categories')
    .insert({ ...result.data, restaurant_id: body.restaurant_id })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data }, 201);
});

// PATCH /api/owner/categories/:id — update category
owner.patch('/categories/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();

  // Verify ownership via restaurant
  const { data: category } = await supabaseAdmin
    .from('menu_categories')
    .select('restaurant_id')
    .eq('id', id)
    .single();

  if (!category) return c.json({ error: 'Not found' }, 404);

  const { data: restaurant } = await supabaseAdmin
    .from('restaurants')
    .select('owner_id')
    .eq('id', category.restaurant_id)
    .single();

  if (!restaurant || restaurant.owner_id !== user.id) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const { data, error } = await supabaseAdmin
    .from('menu_categories')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

// DELETE /api/owner/categories/:id — delete category
owner.delete('/categories/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const { data: category } = await supabaseAdmin
    .from('menu_categories')
    .select('restaurant_id')
    .eq('id', id)
    .single();

  if (!category) return c.json({ error: 'Not found' }, 404);

  const { data: restaurant } = await supabaseAdmin
    .from('restaurants')
    .select('owner_id')
    .eq('id', category.restaurant_id)
    .single();

  if (!restaurant || restaurant.owner_id !== user.id) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const { error } = await supabaseAdmin.from('menu_categories').delete().eq('id', id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data: { success: true } });
});

// ============================================
// UPLOAD (menu item images — own restaurant only)
// ============================================

// POST /api/owner/upload/menu-item-image — returns public URL
owner.post('/upload/menu-item-image', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.parseBody();
    const file = body['file'];
    const restaurantId = (body['restaurant_id'] as string) || '';

    if (!restaurantId) {
      return c.json({ error: 'restaurant_id is required', code: 'VALIDATION_ERROR' }, 400);
    }

    const { data: restaurant } = await supabaseAdmin
      .from('restaurants')
      .select('id, owner_id')
      .eq('id', restaurantId)
      .single();

    if (!restaurant || restaurant.owner_id !== user.id) {
      return c.json({ error: 'Not authorized', code: 'FORBIDDEN' }, 403);
    }

    if (!file || typeof file === 'string') {
      return c.json({ error: 'Missing file', code: 'VALIDATION_ERROR' }, 400);
    }

    const f = file as File;
    if (f.size > OWNER_MAX_UPLOAD) {
      return c.json({ error: 'File too large (max 5 MB)', code: 'VALIDATION_ERROR' }, 400);
    }
    if (!OWNER_ALLOWED_IMAGE_TYPES.includes(f.type as (typeof OWNER_ALLOWED_IMAGE_TYPES)[number])) {
      return c.json({ error: 'Invalid type (use JPEG, PNG or WebP)', code: 'VALIDATION_ERROR' }, 400);
    }

    const ext = f.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
    const timestamp = Date.now();
    const path = `menu-item/${restaurantId}/${timestamp}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;

    const buffer = Buffer.from(await f.arrayBuffer());
    const { url } = await uploadRestaurantImage(buffer, f.type, path);
    return c.json({ data: { url } });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Upload failed', code: 'UPLOAD_ERROR' }, 500);
  }
});

// ============================================
// MENU ITEMS
// ============================================

// GET /api/owner/items — items for own restaurant
owner.get('/items', async (c) => {
  const user = c.get('user');

  const { data: restaurants } = await supabaseAdmin
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id);

  if (!restaurants?.length) return c.json({ data: [] });

  const { data, error } = await supabaseAdmin
    .from('menu_items')
    .select('*')
    .in('restaurant_id', restaurants.map((r) => r.id))
    .order('sort_order');

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

// POST /api/owner/items — add item
owner.post('/items', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  const { data: restaurant } = await supabaseAdmin
    .from('restaurants')
    .select('id')
    .eq('id', body.restaurant_id)
    .eq('owner_id', user.id)
    .single();

  if (!restaurant) return c.json({ error: 'Not authorized' }, 403);

  const { data, error } = await supabaseAdmin
    .from('menu_items')
    .insert({ ...body, restaurant_id: restaurant.id })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data }, 201);
});

// PATCH /api/owner/items/:id — update item
owner.patch('/items/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();

  const { data: item } = await supabaseAdmin
    .from('menu_items')
    .select('restaurant_id')
    .eq('id', id)
    .single();

  if (!item) return c.json({ error: 'Not found' }, 404);

  const { data: restaurant } = await supabaseAdmin
    .from('restaurants')
    .select('owner_id')
    .eq('id', item.restaurant_id)
    .single();

  if (!restaurant || restaurant.owner_id !== user.id) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const { data, error } = await supabaseAdmin
    .from('menu_items')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

// DELETE /api/owner/items/:id — delete item
owner.delete('/items/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const { data: item } = await supabaseAdmin
    .from('menu_items')
    .select('restaurant_id')
    .eq('id', id)
    .single();

  if (!item) return c.json({ error: 'Not found' }, 404);

  const { data: restaurant } = await supabaseAdmin
    .from('restaurants')
    .select('owner_id')
    .eq('id', item.restaurant_id)
    .single();

  if (!restaurant || restaurant.owner_id !== user.id) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const { error } = await supabaseAdmin.from('menu_items').delete().eq('id', id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data: { success: true } });
});

export default owner;
