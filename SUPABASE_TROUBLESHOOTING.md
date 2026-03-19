# When Supabase is unreachable (VPN off, still failing)

If you see `[startup] Supabase TCP FAIL` or `TypeError: Network request failed` **even with VPN off**, something on your machine or network is blocking access to Supabase.

## 1. Run the diagnostic

From the **backend** folder:

```bash
npm run check-supabase
```

- If **DNS** fails: your PC can't resolve `*.supabase.co`. Try changing DNS (see below).
- If **TCP 443** fails: something is blocking outbound HTTPS to Supabase (firewall, antivirus, or network).

## 2. Things to try (in order)

### A. Test in the browser

On the same PC, open:

**https://axktqgrpxoucnztqqbgw.supabase.co**

- If the page **does not load** (timeout, connection reset): the block is at the network/firewall level for this machine.
- If it **loads** in the browser but the backend still fails: Node might be blocked by firewall/antivirus (e.g. only browsers allowed).

### B. Change DNS

Sometimes the default DNS fails to resolve or returns bad results.

- **Windows:** Settings → Network & Internet → Ethernet/Wi‑Fi → your connection → Edit DNS → Manual → IPv4 → Preferred: `8.8.8.8`, Alternate: `1.1.1.1`.
- Then open Command Prompt as Administrator and run: `ipconfig /flushdns`
- Run `npm run check-supabase` again.

### C. Firewall / antivirus

- **Windows Firewall:** Allow **Node.js** (or `node.exe`) for **outbound** connections (port 443 / HTTPS). Or temporarily turn the firewall off to test.
- **Antivirus:** Temporarily disable it and run `npm run check-supabase` again. If it passes, add an exception for Node.js.

### D. Different network

- Use **mobile hotspot** (phone data) and connect your PC to it. Run the backend and app again.
- If it **works on hotspot** but not on your usual Wi‑Fi: the problem is your router, ISP, or corporate/school network (they may block Supabase). You can’t fix that from code; use hotspot or Local Supabase (below) for development.

## 3. Use Local Supabase (no internet to Supabase needed)

If you can’t fix the network (e.g. strict corporate firewall), run Supabase **on your PC** and point the app to it. No connection to Supabase cloud is required.

1. Install **Docker Desktop** and start it.
2. Install Supabase CLI: `npm install -g supabase`
3. In your project root: `supabase start`
4. In the output you’ll see **API URL** (e.g. `http://127.0.0.1:54321`) and **service_role** key.
5. In **backend/.env.local** set:
   - `SUPABASE_URL=http://127.0.0.1:54321`
   - `SUPABASE_SERVICE_ROLE_KEY=<the service_role key from supabase start>`
6. In **admin**, **restaurant**, and **mobile** env files, set:
   - `VITE_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL` to `http://127.0.0.1:54321`
   - `VITE_SUPABASE_ANON_KEY` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` to the **anon** key from `supabase start`
7. Apply your schema/migrations to the local DB (e.g. run your SQL or `supabase db reset`).
8. Restart backend and frontends.

After that, the backend and app talk to Supabase on localhost only, so VPN and firewall no longer affect Supabase connectivity.
