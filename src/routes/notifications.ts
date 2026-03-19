import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { registerPushTokenSchema } from '../types/index.js';

const notifications = new Hono();

notifications.use('*', authMiddleware);

// POST /api/notifications/register — Register push token
notifications.post('/register', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  const parsed = registerPushTokenSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Invalid push token', code: 'VALIDATION_ERROR' }, 400);
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ expo_push_token: parsed.data.expo_push_token })
    .eq('id', user.id);

  if (error) {
    return c.json({ error: 'Failed to register token', code: 'UPDATE_ERROR' }, 500);
  }

  return c.json({ data: { message: 'Push token registered' } });
});

export default notifications;
