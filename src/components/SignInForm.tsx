// components/SignInForm.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Bot,
  ArrowRight,
  Chrome,
  Users,
  Building2,
  BarChart3,
  Target
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const error = searchParams?.get('error');

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      // Redirect to our Google OAuth endpoint
      window.location.href = '/api/auth/google';
    } catch (error) {
      console.error('Sign-in error:', error);
      setIsLoading(false);
    }
  };

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'callback_failed':
        return 'Authentication failed. Please try again.';
      case 'no_ads_access':
        return 'Your Google account does not have access to any Google Ads accounts. Please ensure you have the necessary permissions.';
      case 'missing_code':
        return 'Authentication was cancelled or incomplete. Please try again.';
      default:
        return error ? `Authentication error: ${error}` : null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="bg-primary rounded-full p-3">
              <Bot className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Google Ads AI Agent
              </h1>
              <p className="text-muted-foreground">
                Sign in to connect your Google Ads accounts
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Powered by Gemini 2.5 Flash
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Secure OAuth 2.0
            </Badge>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{getErrorMessage(error)}</AlertDescription>
          </Alert>
        )}

        {/* Sign In Card */}
        <Card className="border-2">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Chrome className="h-5 w-5 text-blue-600" />
              <span>Sign in with Google</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Connect your Google account to access your Google Ads campaigns
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              size="lg"
              className="w-full h-12"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <Chrome className="h-5 w-5 mr-2" />
                  Continue with Google
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              You&apos;ll be redirected to Google to grant permissions
            </div>
          </CardContent>
        </Card>

        {/* What You Get */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What you&apos;ll get access to:</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Campaign Analytics</div>
                    <div className="text-xs text-muted-foreground">
                      Real-time performance insights and optimization recommendations
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Target className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Smart Optimization</div>
                    <div className="text-xs text-muted-foreground">
                      AI-powered budget allocation and bid management
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Building2 className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Multi-Account Support</div>
                    <div className="text-xs text-muted-foreground">
                      Manage multiple Google Ads accounts from one dashboard
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Audience Insights</div>
                    <div className="text-xs text-muted-foreground">
                      Understand your customers and improve targeting
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Privacy */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900 text-sm">Security & Privacy</h4>
                <ul className="text-xs text-green-700 mt-1 space-y-1">
                  <li>• We use OAuth 2.0 for secure authentication</li>
                  <li>• Your credentials are never stored on our servers</li>
                  <li>• You can revoke access at any time in your Google Account</li>
                  <li>• We only access the data you explicitly grant permission for</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 text-sm">Required Permissions</h4>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• <strong>Profile Information:</strong> Your name and email for account identification</li>
                  <li>• <strong>Google Ads Access:</strong> Read and manage your Google Ads campaigns</li>
                  <li>• <strong>Account Information:</strong> List your accessible Google Ads accounts</li>
                </ul>
                <p className="text-xs text-blue-600 mt-2">
                  You&apos;ll see these permissions on Google&apos;s consent screen
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Link */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Need help? Contact support or visit our{' '}
            <a 
              href="#" 
              className="underline hover:no-underline inline-flex items-center"
            >
              documentation
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}