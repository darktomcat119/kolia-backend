import { z } from 'zod';

// ============================================
// Request Validation Schemas
// ============================================

export const createOrderSchema = z.object({
  restaurant_id: z.string().uuid(),
  items: z.array(
    z.object({
      menu_item_id: z.string().uuid(),
      quantity: z.number().int().min(1).max(20),
    }),
  ).min(1),
  order_type: z.enum(['delivery', 'pickup']),
  delivery_address: z.string().optional(),
  delivery_lat: z.number().optional(),
  delivery_lng: z.number().optional(),
  notes: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'received',
    'preparing',
    'ready',
    'on_the_way',
    'completed',
    'cancelled',
  ]),
});

export const registerPushTokenSchema = z.object({
  expo_push_token: z.string().min(1),
});

export const createRestaurantSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  cuisine_type: z.enum([
    'west_african',
    'congolese',
    'north_african',
    'central_african',
    'southern_african',
    'lusophone_african',
    'pan_african',
  ]),
  address: z.string().min(1),
  city: z.string().min(1),
  country: z.string().length(2),
  latitude: z.number(),
  longitude: z.number(),
  phone: z.string().optional(),
  image_url: z.string().url().optional(),
  logo_url: z.string().url().optional(),
  gallery_urls: z.array(z.string().url()).optional(),
  opening_hours: z.record(z.any()).optional(),
  delivery_fee: z.number().min(0).optional(),
  minimum_order: z.number().min(0).optional(),
  estimated_delivery_min: z.number().int().min(1).optional(),
  estimated_delivery_max: z.number().int().min(1).optional(),
  delivery_radius_km: z.number().min(0).optional(),
  pickup_available: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1),
  sort_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export const createMenuItemSchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  image_url: z.string().url().optional(),
  is_available: z.boolean().optional(),
  dietary_tags: z.array(
    z.enum(['halal', 'vegan', 'vegetarian', 'spicy', 'gluten_free', 'contains_nuts']),
  ).optional(),
  sort_order: z.number().int().min(0).optional(),
});

// ============================================
// Types
// ============================================

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export interface AuthUser {
  id: string;
  email: string;
  role: 'customer' | 'restaurant_owner' | 'admin';
}
