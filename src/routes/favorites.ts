import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';

const favorites = new Hono();

// All favorites routes require authentication
favorites.use('*', authMiddleware);

// GET /api/favorites — Return array of restaurant_ids the user has favorited
favorites.get('/', async (c) => {
  const user = c.get('user');

  const { data, error } = await supabaseAdmin
    .from('restaurant_favorites')
    .select('restaurant_id')
    .eq('user_id', user.id);

  if (error) {
    return c.json({ error: 'Failed to fetch favorites', code: 'FETCH_ERROR' }, 500);
  }

  return c.json({ data: (data ?? []).map((r) => r.restaurant_id as string) });
});

// POST /api/favorites/:restaurantId — Add a restaurant to favorites
favorites.post('/:restaurantId', async (c) => {
  const user = c.get('user');
  const restaurantId = c.req.param('restaurantId');

  const { error } = await supabaseAdmin
    .from('restaurant_favorites')
    .upsert({ user_id: user.id, restaurant_id: restaurantId }, { onConflict: 'user_id,restaurant_id' });

  if (error) {
    return c.json({ error: 'Failed to add favorite', code: 'INSERT_ERROR' }, 500);
  }

  return c.json({ data: { restaurant_id: restaurantId } }, 201);
});

// DELETE /api/favorites/:restaurantId — Remove a restaurant from favorites
favorites.delete('/:restaurantId', async (c) => {
  const user = c.get('user');
  const restaurantId = c.req.param('restaurantId');

  const { error } = await supabaseAdmin
    .from('restaurant_favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('restaurant_id', restaurantId);

  if (error) {
    return c.json({ error: 'Failed to remove favorite', code: 'DELETE_ERROR' }, 500);
  }

  return c.json({ data: null }, 200);
});

export default favorites;
