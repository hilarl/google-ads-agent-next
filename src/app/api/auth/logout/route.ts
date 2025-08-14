// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuthService } from '@/lib/googleAuthService';
import { getAuthSession, clearAuthCookie } from '@/lib/authUtils';

const googleAuthService = new GoogleAuthService(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI!
);

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (session) {
      // Revoke Google tokens
      try {
        await googleAuthService.revokeTokens(session.accessToken);
      } catch (error) {
        console.warn('Failed to revoke Google tokens:', error);
      }
    }

    // Clear cookie
    await clearAuthCookie();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' }, 
      { status: 500 }
    );
  }
}
