import net from 'node:net';

export type SupabaseConnectivityResult =
  | { ok: true; host: string; port: number; latencyMs: number }
  | { ok: false; host: string; port: number; error: string };

export function getSupabaseHostFromEnv(): string | null {
  const raw = process.env.SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

export async function checkTcpConnectivity(
  host: string,
  port = 443,
  timeoutMs = 2000
): Promise<SupabaseConnectivityResult> {
  const start = Date.now();

  return await new Promise((resolve) => {
    const socket = new net.Socket();

    const finishOk = () => {
      const latencyMs = Date.now() - start;
      socket.destroy();
      resolve({ ok: true, host, port, latencyMs });
    };

    const finishErr = (msg: string) => {
      socket.destroy();
      resolve({ ok: false, host, port, error: msg });
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', finishOk);
    socket.once('timeout', () => finishErr(`timeout after ${timeoutMs}ms`));
    socket.once('error', (e) => finishErr(e.message || 'socket error'));

    socket.connect(port, host);
  });
}

