// app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuthService } from '@/lib/googleAuthService';
import { setAuthCookie } from '@/lib/authUtils';

const googleAuthService = new GoogleAuthService(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/error?error=${error}`);
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/error?error=missing_code`);
    }

    // Exchange code for tokens
    const tokens = await googleAuthService.exchangeCodeForTokens(code);
    
    // Get user information
    const userInfo = await googleAuthService.getUserInfo(tokens.access_token);
    
    // Validate Google Ads access
    const hasAdsAccess = await googleAuthService.validateGoogleAdsAccess(
      tokens.access_token, 
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN!
    );

    if (!hasAdsAccess) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/error?error=no_ads_access`);
    }

    // Set secure cookie using helper
    await setAuthCookie({
      userId: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in
    });

    // Redirect to account selection
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/select-accounts`);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/error?error=callback_failed`);
  }
}
