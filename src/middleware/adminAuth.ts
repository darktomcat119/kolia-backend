import type { Context, Next } from 'hono';
import { supabaseAdmin } from '../lib/supabase.js';
import type { AuthUser } from '../types/index.js';

export async function adminAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing authorization token', code: 'UNAUTHORIZED' }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return c.json({ error: 'Invalid or expired token', code: 'UNAUTHORIZED' }, 401);
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return c.json({ error: 'Admin access required', code: 'FORBIDDEN' }, 403);
    }

    c.set('user', {
      id: user.id,
      email: user.email!,
      role: profile.role,
    } as AuthUser);
  } catch (err: unknown) {
    const cause = err instanceof Error ? err.cause : null;
    const causeCode =
      cause && typeof cause === 'object' && 'code' in cause ? (cause as { code?: string }).code : undefined;
    const isAbort = err instanceof Error && ((err as { name?: string }).name === 'AbortError' || err.message.toLowerCase().includes('aborted'));
    const isNetworkError =
      isAbort ||
      (typeof causeCode === 'string' && causeCode.startsWith('UND_ERR_')) ||
      (err instanceof Error && err.message.toLowerCase().includes('fetch failed'));
    if (isNetworkError) {
      return c.json(
        { error: 'Auth service unavailable (network error)', code: 'SERVICE_UNAVAILABLE' },
        503
      );
    }
    return c.json({ error: 'Invalid or expired token', code: 'UNAUTHORIZED' }, 401);
  }

  await next();
}
