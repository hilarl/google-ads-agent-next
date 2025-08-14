// app/auth/error/page.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Shield
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  const getErrorDetails = (error: string | null) => {
    switch (error) {
      case 'callback_failed':
        return {
          title: 'Authentication Failed',
          description: 'There was a problem connecting to Google. This could be due to a network issue or temporary Google service problem.',
          suggestion: 'Please try signing in again. If the problem persists, check your internet connection and try again later.'
        };
      case 'no_ads_access':
        return {
          title: 'No Google Ads Access',
          description: 'Your Google account does not have access to any Google Ads accounts.',
          suggestion: 'Please ensure you have access to at least one Google Ads account, or contact your Google Ads administrator to grant you access.'
        };
      case 'missing_code':
        return {
          title: 'Authentication Cancelled',
          description: 'The authentication process was cancelled or incomplete.',
          suggestion: 'This usually happens when you deny permissions or close the Google sign-in window. Please try again and grant the required permissions.'
        };
      case 'access_denied':
        return {
          title: 'Access Denied',
          description: 'You denied the requested permissions.',
          suggestion: 'Our application needs access to your Google Ads accounts to function properly. Please grant the required permissions when signing in.'
        };
      default:
        return {
          title: 'Unknown Error',
          description: error || 'An unexpected error occurred during authentication.',
          suggestion: 'Please try signing in again. If the problem persists, contact support.'
        };
    }
  };

  const errorDetails = getErrorDetails(error);

  const handleRetry = () => {
    router.push('/auth/signin');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Error Card */}
        <Card className="border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto bg-red-100 rounded-full p-3 w-fit mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-900">
              {errorDetails.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {errorDetails.description}
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 text-sm mb-2">What to do next:</h4>
              <p className="text-sm text-blue-700">
                {errorDetails.suggestion}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleRetry}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleGoHome}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-slate-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-slate-900 text-sm">Need Additional Help?</h4>
                <ul className="text-xs text-slate-600 mt-1 space-y-1">
                  <li>• Make sure you have access to Google Ads accounts</li>
                  <li>• Check that your browser allows pop-ups from this site</li>
                  <li>• Try using an incognito/private browsing window</li>
                  <li>• Contact your Google Ads administrator if needed</li>
                </ul>
                <p className="text-xs text-slate-500 mt-2">
                  Still having issues? {' '}
                  <a 
                    href="#" 
                    className="underline hover:no-underline inline-flex items-center"
                  >
                    Contact support
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info (only show in development) */}
        {process.env.NODE_ENV === 'development' && error && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-yellow-900 text-sm mb-2">Debug Information:</h4>
              <code className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded block">
                Error Code: {error}
              </code>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}