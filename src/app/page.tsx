'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Bot,
  ArrowRight
} from 'lucide-react';

import GoogleAdsAgent from '@/components/GoogleAdsAgent';

export default function Home() {
  const [showAgent, setShowAgent] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // Load API key from environment variable on mount
  useEffect(() => {
    const envApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (envApiKey) {
      setApiKey(envApiKey);
    }
  }, []);

  const handleSignIn = () => {
    if (apiKey) {
      setShowAgent(true);
    }
  };

  const handleBack = () => {
    setShowAgent(false);
  };

  if (showAgent && apiKey) {
    return (
      <div className="min-h-screen bg-background">
        <div className="absolute top-4 left-4 z-10">
          <Button variant="outline" size="sm" onClick={handleBack}>
            ← Settings
          </Button>
        </div>
        <GoogleAdsAgent apiKey={apiKey} />
      </div>
    );
  }

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
                Intelligent campaign management for StylePlus Fashion
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Powered by Gemini 2.5 Flash
            </Badge>
            <Badge variant="outline" className="text-xs">
              Q4 Holiday Optimization
            </Badge>
          </div>
        </div>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What This Agent Can Do</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Campaign Analysis</div>
                    <div className="text-xs text-muted-foreground">
                      Real-time performance insights and optimization recommendations
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Budget Optimization</div>
                    <div className="text-xs text-muted-foreground">
                      Smart budget allocation and scaling recommendations
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Competitor Analysis</div>
                    <div className="text-xs text-muted-foreground">
                      Identify keyword gaps and competitive opportunities
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Holiday Urgency</div>
                    <div className="text-xs text-muted-foreground">
                      Q4-focused strategies with seasonal optimization
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Data Visualization</div>
                    <div className="text-xs text-muted-foreground">
                      Interactive campaign cards and performance charts
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Conversational AI</div>
                    <div className="text-xs text-muted-foreground">
                      Natural language queries with contextual responses
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sign In Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Ready to Optimize Your Campaigns?</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {apiKey ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>API configured and ready to use</span>
                </div>

                <Button 
                  onClick={handleSignIn}
                  className="w-full"
                  size="lg"
                >
                  Sign In to Google Ads AI Agent
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  API key not found. Please check your environment configuration.
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Your API key is securely managed through environment variables. 
                Get your free API key from{' '}
                <a 
                  href="https://ai.google.dev/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:no-underline inline-flex items-center"
                >
                  Google AI Studio
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Demo Context */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">Demo Context</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-blue-800">
              <div><strong>Business:</strong> StylePlus Fashion E-commerce</div>
              <div><strong>Industry:</strong> Fashion & Apparel</div>
              <div><strong>Season:</strong> Q4 Holiday Peak (Urgent Optimization Needed)</div>
              <div><strong>Campaigns:</strong> 5 active campaigns with realistic performance data</div>
              <div><strong>Key Issues:</strong> Display campaign burning budget, Performance Max ready to scale</div>
            </div>
          </CardContent>
        </Card>

        {/* Important Update Notice */}
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-lg text-yellow-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Using Latest Google Gen AI SDK
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-yellow-800">
              <div><strong>Updated SDK:</strong> Now using @google/genai (new official SDK)</div>
              <div><strong>Model:</strong> Gemini 2.5 Flash with advanced function calling</div>
              <div><strong>Compatibility:</strong> Full support for Gemini 2.0+ features</div>
              <div><strong>Performance:</strong> Optimized for latest AI capabilities</div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>Built with Next.js 15, TypeScript, ShadCN UI, and Gemini 2.5 Flash</p>
          <p>Real AI intelligence with function calling - no hardcoded responses</p>
        </div>
      </div>
    </div>
  );
}