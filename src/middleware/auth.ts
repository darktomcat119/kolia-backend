import type { Context, Next } from 'hono';
import { supabaseAdmin } from '../lib/supabase.js';
import type { AuthUser } from '../types/index.js';

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

export async function authMiddleware(c: Context, next: Next) {
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

    c.set('user', {
      id: user.id,
      email: user.email!,
      role: profile?.role ?? 'customer',
    } as AuthUser);
  } catch (err: unknown) {
    const name = err && typeof err === 'object' && 'name' in err ? (err as { name?: string }).name : undefined;
    const message = err instanceof Error ? err.message : String(err ?? '');
    const msg = message.toLowerCase();
    const cause = err instanceof Error ? err.cause : null;
    const causeObj = cause && typeof cause === 'object' ? (cause as Record<string, unknown>) : null;
    const causeCode = typeof causeObj?.code === 'string' ? causeObj.code : undefined;

    const isAbort = name === 'AbortError' || msg.includes('aborted');
    const isTimeout =
      msg.includes('timeout') ||
      causeCode === 'ETIMEDOUT' ||
      (typeof causeCode === 'string' && causeCode.includes('TIMEOUT'));
    const isUndici = typeof causeCode === 'string' && causeCode.startsWith('UND_ERR_');
    const isFetchFailed = msg.includes('fetch failed') || msg.includes('network');
    const isConnRefused = causeCode === 'ECONNREFUSED' || causeCode === 'ENOTFOUND' || causeCode === 'ECONNRESET';
    const isNetworkError = isAbort || isTimeout || isUndici || isFetchFailed || isConnRefused;

    if (isNetworkError) {
      return c.json(
        { error: 'Auth service unavailable. Check your connection or try again later.', code: 'SERVICE_UNAVAILABLE' },
        503
      );
    }
    return c.json({ error: 'Invalid or expired token', code: 'UNAUTHORIZED' }, 401);
  }

  await next();
}
