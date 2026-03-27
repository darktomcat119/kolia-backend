import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase.js';

const pub = new Hono();

// No auth middleware — these are public read-only endpoints for the customer site.

// ============================================
// LANDING PAGE
// ============================================

// GET /api/public/landing-content/:locale — Active CMS content for a locale
pub.get('/landing-content/:locale', async (c) => {
  const locale = c.req.param('locale');

  if (!['en', 'fr', 'pt'].includes(locale)) {
    return c.json({ error: 'Invalid locale. Must be en, fr or pt.', code: 'VALIDATION_ERROR' }, 400);
  }

  const { data, error } = await supabaseAdmin
    .from('landing_page_content')
    .select('content')
    .eq('locale', locale)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    return c.json({ error: 'Failed to fetch landing content', code: 'FETCH_ERROR' }, 500);
  }

  return c.json({ data: data?.content ?? null });
});

// ============================================
// FEATURED RESTAURANTS
// ============================================

// GET /api/public/restaurants/featured — Active featured restaurants ordered by rank
pub.get('/restaurants/featured', async (c) => {
  const { data, error } = await supabaseAdmin
    .from('restaurants')
    .select('*')
    .eq('is_active', true)
    .eq('featured', true)
    .order('featured_rank', { ascending: true, nullsFirst: false })
    .order('name')
    .limit(4);

  if (error) {
    return c.json({ error: 'Failed to fetch featured restaurants', code: 'FETCH_ERROR' }, 500);
  }

  return c.json({ data: data ?? [] });
});

// ============================================
// POPULAR DISHES
// ============================================

// GET /api/public/menu-items/popular — Available popular dishes with restaurant name
pub.get('/menu-items/popular', async (c) => {
  const { data, error } = await supabaseAdmin
    .from('menu_items')
    .select('id, name, price, image_url, popular_rank, restaurants(name)')
    .eq('is_popular', true)
    .eq('is_available', true)
    .order('popular_rank', { ascending: true, nullsFirst: false })
    .limit(8);

  if (error) {
    return c.json({ error: 'Failed to fetch popular dishes', code: 'FETCH_ERROR' }, 500);
  }

  const items = (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    restaurant: (row.restaurants as { name: string } | null)?.name ?? '',
    price: Number(row.price),
    image: (row.image_url as string | null) ?? '',
  }));

  return c.json({ data: items });
});

export default pub;
