// app/api/auth/google/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuthService } from '@/lib/googleAuthService';

const googleAuthService = new GoogleAuthService(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI!
);

export async function GET(request: NextRequest) {
  try {
    const authUrl = googleAuthService.generateAuthUrl();
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication URL' }, 
      { status: 500 }
    );
  }
}
