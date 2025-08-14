// app/api/auth/select-accounts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getAuthSession } from '@/lib/authUtils';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { selectedAccounts, masterAccountId } = body;

    if (!selectedAccounts || !Array.isArray(selectedAccounts) || selectedAccounts.length === 0) {
      return NextResponse.json({ error: 'No accounts selected' }, { status: 400 });
    }

    // Update session with selected accounts
    const updatedSession = {
      ...session,
      selectedAccounts,
      masterAccountId: masterAccountId || selectedAccounts[0],
      accountsConfigured: true
    };

    // Create new session token
    const sessionToken = jwt.sign(
      updatedSession,
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Update cookie
    const cookieStore = cookies();
    cookieStore.set('auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error selecting accounts:', error);
    return NextResponse.json(
      { error: 'Failed to select accounts' }, 
      { status: 500 }
    );
  }
}