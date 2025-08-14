// scripts/debug-oauth.ts
// Run with: npx ts-node scripts/debug-oauth.ts

// Load environment variables first
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('🔍 Google OAuth Configuration Debug\n');

// Check environment variables
const requiredVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET', 
  'GOOGLE_REDIRECT_URI',
  'NEXTAUTH_URL'
];

console.log('📋 Environment Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive data
    const maskedValue = varName.includes('SECRET') 
      ? value.substring(0, 8) + '*'.repeat(Math.max(0, value.length - 8))
      : value;
    console.log(`✅ ${varName}: ${maskedValue}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\n🔧 Configuration Check:');

// Validate Client ID format
const clientId = process.env.GOOGLE_CLIENT_ID;
if (clientId) {
  if (clientId.endsWith('.apps.googleusercontent.com')) {
    console.log('✅ Client ID format looks correct');
  } else {
    console.log('❌ Client ID format is incorrect - should end with .apps.googleusercontent.com');
  }
  
  if (clientId.includes('your-') || clientId.includes('INSERT')) {
    console.log('❌ Client ID appears to be a placeholder');
  }
} else {
  console.log('❌ Client ID is missing');
}

// Validate Redirect URI
const redirectUri = process.env.GOOGLE_REDIRECT_URI;
if (redirectUri) {
  try {
    const url = new URL(redirectUri);
    console.log(`✅ Redirect URI is valid: ${redirectUri}`);
    
    if (!redirectUri.includes('/api/auth/google/callback')) {
      console.log('⚠️  Redirect URI should end with /api/auth/google/callback');
    }
  } catch {
    console.log('❌ Redirect URI is not a valid URL');
  }
} else {
  console.log('❌ Redirect URI is missing');
}

console.log('\n🌐 Google Cloud Console Setup Required:');
console.log('✅ Your OAuth Client ID: 929348376106-1g0mgp39us84660uv6jqm0iqld9lj001.apps.googleusercontent.com');
console.log('✅ Add this Authorized Redirect URI:');
console.log(`   ${redirectUri || 'YOUR_REDIRECT_URI'}`);
console.log('✅ Add this Authorized JavaScript Origin:');
console.log(`   ${process.env.NEXTAUTH_URL || 'YOUR_NEXTAUTH_URL'}`);

console.log('\n🔧 Google Cloud Console Steps:');
console.log('1. Go to https://console.cloud.google.com/');
console.log('2. Select your project');
console.log('3. Navigate to APIs & Services > Credentials');
console.log('4. Find OAuth client: 929348376106-1g0mgp39us84660uv6jqm0iqld9lj001.apps.googleusercontent.com');
console.log('5. Click on it to edit');
console.log('6. Under "Authorized redirect URIs", add:');
console.log(`   ${redirectUri}`);
console.log('7. Under "Authorized JavaScript origins", add:');
console.log(`   ${process.env.NEXTAUTH_URL}`);
console.log('8. Save changes');

// Test OAuth URL generation
if (clientId && redirectUri) {
  const scopes = [
    'openid',
    'profile', 
    'email',
    'https://www.googleapis.com/auth/adwords'
  ];
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scopes.join(' '))}&` +
    `access_type=offline&` +
    `prompt=consent`;
    
  console.log('\n🔗 Generated OAuth URL (first 100 chars):');
  console.log(authUrl.substring(0, 100) + '...');
  console.log('\n✅ OAuth URL generation successful!');
}

console.log('\n🚀 Next Steps:');
console.log('1. Configure the redirect URI in Google Cloud Console (see steps above)');
console.log('2. Restart your development server: npm run dev');
console.log('3. Go to http://localhost:3000/auth/signin');
console.log('4. Click "Continue with Google"');
console.log('5. You should be redirected to Google OAuth consent screen');