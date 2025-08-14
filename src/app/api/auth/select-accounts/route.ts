// app/api/auth/select-accounts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, setAuthCookie } from '@/lib/authUtils';

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
    await setAuthCookie({
      ...session,
      selectedAccounts,
      masterAccountId: masterAccountId || selectedAccounts[0],
      accountsConfigured: true,
      expiresIn: Math.floor((session.expiresAt - Date.now()) / 1000)
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
