// app/api/auth/accounts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuthService } from '@/lib/googleAuthService';
import { getAuthSession } from '@/lib/authUtils';

const googleAuthService = new GoogleAuthService(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI!
);

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if token needs refresh
    let accessToken = session.accessToken;
    if (Date.now() >= session.expiresAt) {
      const refreshedTokens = await googleAuthService.refreshAccessToken(session.refreshToken);
      accessToken = refreshedTokens.access_token;
    }

    // Get accessible customers
    const customers = await googleAuthService.listAccessibleCustomers(
      accessToken,
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN!
    );

    // For manager accounts, get hierarchy
    const accountsWithHierarchy = [];
    
    for (const customer of customers) {
      if (customer.manager) {
        try {
          const hierarchy = await googleAuthService.getAccountHierarchy(
            accessToken,
            process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
            customer.id
          );
          
          accountsWithHierarchy.push({
            ...customer,
            hierarchy
          });
        } catch (error) {
          console.warn(`Failed to fetch hierarchy for ${customer.id}:`, error);
          accountsWithHierarchy.push(customer);
        }
      } else {
        accountsWithHierarchy.push(customer);
      }
    }

    return NextResponse.json({
      accounts: accountsWithHierarchy,
      user: {
        email: session.email,
        name: session.name,
        picture: session.picture
      }
    });

  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' }, 
      { status: 500 }
    );
  }
}
