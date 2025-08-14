// lib/authUtils.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  picture: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  selectedAccounts?: string[];
  masterAccountId?: string;
  accountsConfigured?: boolean;
}

export async function getAuthSession(request: NextRequest): Promise<AuthSession | null> {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthSession;
    return decoded;
    
  } catch (error) {
    console.error('Error verifying auth session:', error);
    return null;
  }
}

export async function getAuthSessionFromServer(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthSession;
    return decoded;
    
  } catch (error) {
    console.error('Error verifying auth session:', error);
    return null;
  }
}

export async function setAuthCookie(sessionData: Omit<AuthSession, 'expiresAt'> & { expiresIn: number }) {
  try {
    const sessionToken = jwt.sign(
      {
        ...sessionData,
        expiresAt: Date.now() + (sessionData.expiresIn * 1000)
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    const cookieStore = await cookies();
    cookieStore.set('auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return sessionToken;
  } catch (error) {
    console.error('Error setting auth cookie:', error);
    throw error;
  }
}

export async function clearAuthCookie() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
  } catch (error) {
    console.error('Error clearing auth cookie:', error);
    throw error;
  }
}

export function requireAuth() {
  return async (request: NextRequest) => {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.accountsConfigured) {
      return NextResponse.json({ error: 'Accounts not configured' }, { status: 403 });
    }

    return session;
  };
}

export function createSessionToken(data: AuthSession): string {
  return jwt.sign(data, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

export function verifySessionToken(token: string): AuthSession {
  return jwt.verify(token, process.env.JWT_SECRET!) as AuthSession;
}

// Middleware helper for protected routes
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, session: AuthSession) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return await handler(request, session);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// Type guard to check if session has required properties
export function isSessionComplete(session: AuthSession): session is AuthSession & { 
  selectedAccounts: string[];
  masterAccountId: string;
  accountsConfigured: true;
} {
  return !!(
    session.selectedAccounts &&
    session.selectedAccounts.length > 0 &&
    session.masterAccountId &&
    session.accountsConfigured
  );
}