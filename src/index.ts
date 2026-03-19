import { config } from 'dotenv';
config({ path: '.env.local' });
config();
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import orders from './routes/orders.js';
import admin from './routes/admin.js';
import owner from './routes/owner.js';
import webhooks from './routes/webhooks.js';
import notifications from './routes/notifications.js';
import { checkTcpConnectivity, getSupabaseHostFromEnv } from './lib/supabaseConnectivity.js';

const app = new Hono();

// Middleware
app.use('*', logger());
const corsOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:8081',
  'http://localhost:19006',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];
// Add VPS / production origin from env (e.g. http://45.55.175.194 or https://yourdomain.com)
if (process.env.CORS_ORIGIN) {
  corsOrigins.push(process.env.CORS_ORIGIN);
}
if (process.env.CORS_ORIGINS) {
  corsOrigins.push(...process.env.CORS_ORIGINS.split(',').map((s) => s.trim()));
}
app.use(
  '*',
  cors({
    origin: corsOrigins,
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Health check
app.get('/', (c) => c.json({ status: 'ok', service: 'kolia-api', version: '1.0.0' }));
app.get('/health', (c) => c.json({ status: 'ok' }));

// Routes
app.route('/api/orders', orders);
app.route('/api/admin', admin);
app.route('/api/owner', owner);
app.route('/api/webhooks', webhooks);
app.route('/api/notifications', notifications);

// 404 handler
app.notFound((c) => c.json({ error: 'Not found', code: 'NOT_FOUND' }, 404));

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500);
});

const port = Number(process.env.PORT) || 3000;

console.log(`Kolia API starting on port ${port}...`);

serve({ fetch: app.fetch, port }, () => {
  console.log(`Kolia API running at http://localhost:${port}`);
});

// Best-effort startup signal for common "Supabase unreachable" issues.
// If using VPN, try split-tunnelling so Supabase traffic bypasses VPN, or set SUPABASE_CONNECTIVITY_TIMEOUT_MS=5000
setTimeout(async () => {
  const host = getSupabaseHostFromEnv();                                                           
  if (!host) {
    console.warn('[startup] SUPABASE_URL missing/invalid; cannot check connectivity');
    return;
  }

  const timeoutMs = Number(process.env.SUPABASE_CONNECTIVITY_TIMEOUT_MS) || 2000;
  const result = await checkTcpConnectivity(host, 443, timeoutMs);
  if (result.ok) {
    console.log(`[startup] Supabase TCP OK ${result.host}:443 (${result.latencyMs}ms)`);
  } else {
    console.warn(`[startup] Supabase TCP FAIL ${result.host}:443 (${result.error})`);
  }
}, 0);
