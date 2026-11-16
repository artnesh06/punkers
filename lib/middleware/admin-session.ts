import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET || 'punkers-admin-secret');

/**
 * Verify admin session from cookie (for web admin panel).
 * Returns true if valid admin JWT token found.
 */
export async function verifyAdminSession(request: NextRequest): Promise<boolean> {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) return false;
    const { payload } = await jwtVerify(token, SECRET);
    return payload.role === 'admin';
  } catch {
    return false;
  }
}
