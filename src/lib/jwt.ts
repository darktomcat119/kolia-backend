import { jwtVerify } from 'jose';

const jwtSecret = process.env.SUPABASE_JWT_SECRET || '';

export interface JwtPayload {
  sub: string;
  email: string;
  app_metadata: { role?: string };
}

export async function verifyJwt(token: string): Promise<JwtPayload> {
  if (!jwtSecret) throw new Error('SUPABASE_JWT_SECRET not configured');
  const secret = new TextEncoder().encode(jwtSecret);
  const { payload } = await jwtVerify(token, secret, { audience: 'authenticated' });
  return payload as unknown as JwtPayload;
}
