/**
 * Diagnose connectivity to Supabase from this machine.
 * Run from backend folder: node scripts/check-supabase.mjs
 */
import { config } from 'dotenv';
import dns from 'node:dns';
import net from 'node:net';
import { promisify } from 'node:util';

config({ path: '.env.local' });
config();

const resolve4 = promisify(dns.resolve4);
const host = (() => {
  const url = process.env.SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
})();

function tcpConnect(host, port, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      socket.destroy();
      resolve({ ok: true, ms: Date.now() - start });
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve({ ok: false, error: `timeout after ${timeoutMs}ms` });
    });
    socket.once('error', (e) => {
      resolve({ ok: false, error: e.message });
    });
    socket.connect(port, host);
  });
}

async function main() {
  console.log('\n--- Supabase connectivity check ---\n');

  if (!host) {
    console.log('SUPABASE_URL is missing or invalid in .env / .env.local');
    process.exit(1);
  }
  console.log('Supabase host:', host);

  // 1. DNS
  let addresses = [];
  try {
    addresses = await resolve4(host);
    console.log('DNS (A):', addresses?.length ? addresses.join(', ') : 'no result');
    const isPrivate = (ip) => {
      if (ip.startsWith('10.')) return true;
      if (ip.startsWith('172.') && parseInt(ip.split('.')[1], 10) >= 16 && parseInt(ip.split('.')[1], 10) <= 31) return true;
      if (ip.startsWith('192.168.')) return true;
      return false;
    };
    if (addresses.some(isPrivate)) {
      console.log('\nWARNING: Supabase host resolved to a PRIVATE IP (10.x, 172.16-31.x, 192.168.x).');
      console.log('Supabase uses public IPs. Your DNS (or network) is returning a wrong address.');
      console.log('\nFix: Change your DNS to a public resolver:');
      console.log('  - Preferred: 8.8.8.8 (Google), Alternate: 1.1.1.1 (Cloudflare)');
      console.log('  Windows: Settings > Network & Internet > Ethernet/Wi-Fi > your connection > Edit DNS > Manual > 8.8.8.8 / 1.1.1.1');
      console.log('  Then run: ipconfig /flushdns (in Command Prompt as Admin)');
      process.exit(1);
    }
  } catch (e) {
    console.log('DNS: FAIL -', e.message);
    console.log('\nTry changing DNS to 8.8.8.8 (Google) or 1.1.1.1 (Cloudflare).');
    console.log('On Windows: Settings > Network > Ethernet/Wi-Fi > Edit DNS.');
    process.exit(1);
  }

  // 2. TCP 443
  const tcp = await tcpConnect(host, 443);
  if (tcp.ok) {
    console.log('TCP 443: OK (' + tcp.ms + ' ms)');
  } else {
    console.log('TCP 443: FAIL -', tcp.error);
    console.log('\nPossible causes:');
    console.log('  - Firewall or antivirus blocking outbound HTTPS');
    console.log('  - Corporate/school network blocking Supabase');
    console.log('  - ISP or country restriction');
    console.log('\nTry:');
    console.log('  1. Allow Node.js in Windows Firewall (outbound port 443)');
    console.log('  2. Temporarily disable antivirus to test');
    console.log('  3. Use mobile hotspot to see if it works on another network');
    console.log('  4. Use Local Supabase (Docker) - see docs in repo');
    process.exit(1);
  }

  console.log('\nConnectivity looks OK. If the app still fails, check SUPABASE_SERVICE_ROLE_KEY and CORS.\n');
}

main();
