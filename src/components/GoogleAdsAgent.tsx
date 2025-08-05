'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2, 
  Send, 
  Bot, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  Filter,
  X
} from 'lucide-react';

import { GeminiService } from '@/lib/geminiService';
import { FunctionCallHandler } from '@/lib/functionCallHandler';
import { BUSINESS_CONTEXT } from '@/lib/mockData';
import { 
  ChatMessage, 
  ChatState, 
  ConversationContext,
  FunctionCallInfo,
  DataVisualization,
  GeminiMessage,

} from '@/types/agent';
import ChatMessageComponent from './ChatMessage';

interface GoogleAdsAgentProps {
  apiKey: string;
}

const INITIAL_CONTEXT: ConversationContext = {
  businessInfo: {
    companyName: BUSINESS_CONTEXT.companyName,
    industry: BUSINESS_CONTEXT.industry,
    avgOrderValue: BUSINESS_CONTEXT.avgOrderValue,
    targetMetrics: {
      roas: BUSINESS_CONTEXT.targetROAS,
      cpa: BUSINESS_CONTEXT.targetCPA,
      conversionRate: 3.5
    },
    seasonality: BUSINESS_CONTEXT.seasonality,
    competitors: BUSINESS_CONTEXT.competitors,
    currentChallenges: BUSINESS_CONTEXT.urgentIssues,
    businessGoals: BUSINESS_CONTEXT.businessGoals
  },
  campaignContext: {
    activeCampaigns: [],
    recentlyDiscussed: [],
    currentFocus: [],
    performanceAlerts: [],
    optimizationOpportunities: []
  },
  userPreferences: {
    communicationStyle: 'business-focused',
    dataVisualizationPreference: 'mixed',
    notificationLevel: 'critical-only',
    autoExecuteRecommendations: false,
    preferredMetrics: ['ROAS', 'CPA', 'Conversion Rate']
  },
  sessionMemory: {
    queriesAsked: [],
    actionsPerformed: [],
    campaignsMentioned: [],
    insightsProvided: [],
    recommendationsGiven: [],
    issuesIdentified: [],
    goalsDiscussed: []
  },
  // Add the properties that the geminiService expects
  conversationHistory: [],
  mentionedCampaigns: [],
  actionsTaken: [],
  previousQueries: [],
  businessGoals: BUSINESS_CONTEXT.businessGoals
};

const SUGGESTED_QUERIES = [
  "How is my Performance Max campaign doing?",
  "Should I increase my budget for the holidays?",
  "What competitor opportunities am I missing?",
  "Analyze my campaign performance",
  "Show me my top performing campaigns"
];

interface CampaignOption {
  id: string;
  name: string;
  type: string;
  status: string;
}

export default function GoogleAdsAgent({ apiKey }: GoogleAdsAgentProps) {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    context: INITIAL_CONTEXT,
    sessionId: `session_${Date.now()}`,
    lastActivity: new Date()
  });

  const [inputValue, setInputValue] = useState('');
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);
  const [functionHandler, setFunctionHandler] = useState<FunctionCallHandler | null>(null);
  const [selectedFilters, setSelectedFilters] = useState({
    account: 'all',
    campaign: 'all',
    campaignType: 'all',
    status: 'all'
  });

  const [showFilters, setShowFilters] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('Starting initialization...');
        
        const gemini = new GeminiService(apiKey);
        const functions = new FunctionCallHandler();
        
        console.log('Services created');
        
        // Test connection
        const isConnected = await gemini.validateConnection();
        if (!isConnected) {
          throw new Error('Failed to connect to Gemini API');
        }
        
        setGeminiService(gemini);
        setFunctionHandler(functions);
        setIsInitialized(true);
        
        // Send welcome message
        const welcomeMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: `Hello! I'm your Google Ads expert for ${BUSINESS_CONTEXT.companyName}. I can help you optimize your ${BUSINESS_CONTEXT.seasonality} campaigns, analyze performance, and scale your fashion e-commerce business.\n\nWhat would you like to know about your campaigns today?`,
          timestamp: new Date(),
          metadata: {
            confidence: 1.0,
            responseTime: 0,
            recommendationLevel: 'medium'
          }
        };
        
        setChatState(prev => ({
          ...prev,
          messages: [welcomeMessage]
        }));
        
      } catch (error) {
        console.error('Failed to initialize services:', error);
        setChatState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to initialize AI services'
        }));
        setIsInitialized(false);
      }
    };

    if (apiKey && apiKey.length > 20) {
      console.log('API key provided, starting initialization...');
      initializeServices();
    } else {
      console.error('Invalid API key provided');
      setChatState(prev => ({
        ...prev,
        error: 'Invalid API key provided'
      }));
      setIsInitialized(false);
    }
  }, [apiKey]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messages]);

  // Handle message submission
  const handleSubmit = async (message: string) => {
    if (!message.trim() || !geminiService || !functionHandler || chatState.isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
      lastActivity: new Date()
    }));

    setInputValue('');

    try {
      // Convert chat messages to Gemini format
      const geminiMessages: GeminiMessage[] = chatState.messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Add current user message
      geminiMessages.push({
        role: 'user',
        parts: [{ text: message }]
      });

      // Get function declarations
      const functions = functionHandler.getFunctionDeclarations();

      // Generate response
      const response = await geminiService.generateResponse(
        geminiMessages,
        chatState.context,
        functions
      );

      // Handle function calls if present
      let finalResponse = response;
      let functionResults: FunctionCallInfo[] = [];

      if (response.functionCalls && response.functionCalls.length > 0) {
        functionResults = await Promise.all(
          response.functionCalls.map(async (functionCall) => {
            const result = await functionHandler.executeFunctionCall(functionCall);
            return {
              name: functionCall.name,
              arguments: functionCall.args,
              result: result.data,
              status: result.success ? 'success' : 'error',
              executionTime: result.executionTime,
              error: result.error
            } as FunctionCallInfo;
          })
        );

        // If function calls were made, generate final response with results
        if (functionResults.some(r => r.status === 'success')) {
          const updatedMessages: GeminiMessage[] = [...geminiMessages];
          
          // Add function responses
          response.functionCalls.forEach((call, index) => {
            const result = functionResults[index];
            updatedMessages.push({
              role: 'model',
              parts: [{
                functionCall: call
              }]
            });
            updatedMessages.push({
              role: 'user',
              parts: [{
                functionResponse: {
                  name: call.name,
                  response: {
                    result: result.result,
                    success: result.status === 'success',
                    error: result.error
                  }
                }
              }]
            });
          });

          finalResponse = await geminiService.generateResponse(
            updatedMessages,
            chatState.context,
            functions
          );
        }
      }

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: finalResponse.text,
        timestamp: new Date(),
        functionCalls: functionResults.length > 0 ? functionResults : undefined,
        dataVisualization: generateDataVisualization(functionResults),
        metadata: {
          tokensUsed: finalResponse.metadata.tokensUsed,
          responseTime: finalResponse.metadata.processingTime,
          confidence: finalResponse.confidence,
          functionCallsCount: functionResults.length,
          recommendationLevel: determineRecommendationLevel(finalResponse.text)
        }
      };

      // Update context with new conversation
      const updatedContext = geminiService.updateContext(
        chatState.context,
        message,
        finalResponse.text,
        response.functionCalls
      );

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
        context: updatedContext
      }));

    } catch (error) {
      console.error('Error generating response:', error);
      
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `I apologize, but I encountered an error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or rephrase your question.`,
        timestamp: new Date(),
        metadata: {
          confidence: 0,
          responseTime: 0,
          recommendationLevel: 'low'
        }
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  };

  // Handle action clicks from messages
  const handleActionClick = async (action: string, messageId: string) => {
    console.log(`Action clicked: ${action} for message ${messageId}`);
    
    // Handle predefined actions
    switch (action) {
      case 'scale_pmax':
        await handleSubmit('Increase Performance Max budget by $50 per day');
        break;
      case 'reallocate_budget':
        await handleSubmit('Reallocate the paused Display campaign budget to better performing campaigns');
        break;
      case 'competitor_analysis':
        await handleSubmit('Show me competitor keyword opportunities');
        break;
      case 'mobile_optimization':
        await handleSubmit('Generate a mobile conversion optimization report');
        break;
      default:
        await handleSubmit(action);
    }
  };

  // Handle suggestion clicks
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    
    // Update context to include filter information
    if (geminiService) {
      const updatedContext = geminiService.updateContext(
        chatState.context,
        `User updated filters: ${filterType} = ${value}`,
        `I understand you want to focus on ${filterType}: ${value}. I'll prioritize information related to this selection.`,
        []
      );
      setChatState(prev => ({
        ...prev,
        context: updatedContext
      }));
    }
  };

  // Get available campaigns for dropdown
  const getAvailableCampaigns = (): CampaignOption[] => {
    return [
      { id: 'camp_001', name: 'Brand Awareness - StylePlus Fashion', type: 'SEARCH', status: 'ENABLED' },
      { id: 'camp_002', name: 'Performance Max - Holiday Fashion Sale', type: 'PERFORMANCE_MAX', status: 'ENABLED' },
      { id: 'camp_003', name: 'Display Retargeting - Cart Abandoners', type: 'DISPLAY', status: 'PAUSED' },
      { id: 'camp_004', name: 'Competitor Targeting - Nike Keywords', type: 'SEARCH', status: 'ENABLED' },
      { id: 'camp_005', name: 'Shopping - Winter Collection', type: 'SHOPPING', status: 'ENABLED' }
    ];
  };

  // Get display name for selected campaign
  const getSelectedCampaignName = (campaignId: string): string => {
    if (campaignId === 'all') return 'All Campaigns';
    const campaign = getAvailableCampaigns().find(c => c.id === campaignId);
    return campaign ? campaign.name : campaignId;
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedFilters({
      account: 'all',
      campaign: 'all',
      campaignType: 'all',
      status: 'all'
    });
  };

  // Get active filter count
  const getActiveFilterCount = (): number => {
    return Object.values(selectedFilters).filter(value => value !== 'all').length;
  };

  // Clear chat
  const handleClearChat = () => {
    setChatState(prev => ({
      ...prev,
      messages: [],
      context: INITIAL_CONTEXT,
      sessionId: `session_${Date.now()}`
    }));
  };

  // Generate data visualization based on function results
  const generateDataVisualization = (functionResults: FunctionCallInfo[]): DataVisualization | undefined => {
    if (!functionResults.length) return undefined;

    const campaignResult = functionResults.find(r => r.name === 'getCampaigns');
    if (campaignResult && campaignResult.result) {
      return {
        type: 'campaign-cards',
        data: campaignResult.result,
        config: {
          title: 'Campaign Performance',
          showTrends: true,
          highlightThresholds: true
        }
      };
    }

    const performanceResult = functionResults.find(r => r.name === 'analyzeCampaignPerformance');
    if (performanceResult && performanceResult.result) {
      return {
        type: 'performance-chart',
        data: performanceResult.result,
        config: {
          title: 'Performance Analysis',
          timeframe: '7 days',
          chartType: 'line',
          metrics: ['ROAS', 'Conversion Rate', 'CPA']
        }
      };
    }

    return undefined;
  };

  // Determine recommendation level based on response content
  const determineRecommendationLevel = (content: string): 'low' | 'medium' | 'high' | 'critical' => {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('critical') || lowerContent.includes('urgent') || lowerContent.includes('immediate')) {
      return 'critical';
    }
    if (lowerContent.includes('recommend') || lowerContent.includes('should') || lowerContent.includes('optimize')) {
      return 'high';
    }
    if (lowerContent.includes('consider') || lowerContent.includes('might') || lowerContent.includes('could')) {
      return 'medium';
    }
    return 'low';
  };

  // Helper function to get campaign display name for filter badges
  const getCampaignDisplayName = (value: string): string => {
    const campaignMap: Record<string, string> = {
      'camp_002': 'Performance Max',
      'camp_001': 'Brand Awareness',
      'camp_003': 'Display Retargeting',
      'camp_004': 'Competitor Targeting',
      'camp_005': 'Shopping'
    };
    return campaignMap[value] || value;
  };

  // Filters Panel Component
  const FiltersPanel = () => (
    showFilters ? (
      <div className="border-b bg-slate-50 shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Campaign Context Filters</h3>
              <Badge variant="outline" className="text-xs">
                Focus your conversation
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              {getActiveFilterCount() > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  Clear All
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Account Filter */}
            <div className="space-y-2 min-w-0">
              <label className="text-sm font-medium text-slate-700">Account</label>
              <Select
                value={selectedFilters.account}
                onValueChange={(value) => handleFilterChange('account', value)}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Select account" className="truncate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  <SelectItem value="styleplus_main">StylePlus Main</SelectItem>
                  <SelectItem value="styleplus_intl">StylePlus International</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campaign Filter */}
            <div className="space-y-2 min-w-0">
              <label className="text-sm font-medium text-slate-700">Campaign</label>
              <Select
                value={selectedFilters.campaign}
                onValueChange={(value) => handleFilterChange('campaign', value)}
              >
                <SelectTrigger className="h-9 w-full">
                  <div className="flex items-center w-full">
                    <span className="truncate text-left" title={getSelectedCampaignName(selectedFilters.campaign)}>
                      {getSelectedCampaignName(selectedFilters.campaign)}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {getAvailableCampaigns().map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id} className="max-w-full">
                      <span className="truncate block" title={campaign.name}>
                        {campaign.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campaign Type Filter */}
            <div className="space-y-2 min-w-0">
              <label className="text-sm font-medium text-slate-700">Type</label>
              <Select
                value={selectedFilters.campaignType}
                onValueChange={(value) => handleFilterChange('campaignType', value)}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Select type" className="truncate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="SEARCH">Search</SelectItem>
                  <SelectItem value="DISPLAY">Display</SelectItem>
                  <SelectItem value="SHOPPING">Shopping</SelectItem>
                  <SelectItem value="PERFORMANCE_MAX">Performance Max</SelectItem>
                  <SelectItem value="VIDEO">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2 min-w-0">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <Select
                value={selectedFilters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Select status" className="truncate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ENABLED">Enabled</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="REMOVED">Removed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {getActiveFilterCount() > 0 && (
            <div className="mt-4 pt-3 border-t">
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-sm text-slate-600">Active filters:</span>
                {Object.entries(selectedFilters).map(([key, value]) => 
                  value !== 'all' && (
                    <Badge key={key} variant="secondary" className="text-xs">
                      {key}: {getCampaignDisplayName(value)}
                    </Badge>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    ) : null
  );

  if (!isInitialized) {
    console.log('Rendering loading state, isInitialized:', isInitialized);
    return (
      <div className="flex flex-col h-screen max-w-4xl mx-auto bg-background">
        {/* Show filters even during loading */}
        <FiltersPanel />
        
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Initializing Google Ads AI Agent...</p>
            {chatState.error && (
              <Alert className="max-w-md mx-auto">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{chatState.error}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    );
  }

  console.log('Rendering main chat interface, isInitialized:', isInitialized);

  try {
    return (
      <div className="flex flex-col h-screen max-w-4xl mx-auto bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Bot className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-lg font-semibold">Google Ads AI Agent</h1>
                  <p className="text-sm text-muted-foreground">
                    {BUSINESS_CONTEXT.companyName} • {BUSINESS_CONTEXT.seasonality}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearChat}
                disabled={chatState.messages.length === 0}
              >
                Clear Chat
              </Button>
              {!showFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(true)}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Show Filters
                </Button>
              )}
            </div>
          </div>
          
          {/* Business Context Banner */}
          <div className="px-4 pb-4">
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">
                      Q4 Holiday Peak Active
                    </span>
                  </div>
                  <div className="flex space-x-4 text-xs text-orange-700">
                    <span>Target ROAS: {BUSINESS_CONTEXT.targetROAS}x</span>
                    <span>AOV: ${BUSINESS_CONTEXT.avgOrderValue}</span>
                    <span>Target CPA: ${BUSINESS_CONTEXT.targetCPA}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters Panel */}
        <FiltersPanel />

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {chatState.messages.map((message) => (
              <ChatMessageComponent
                key={message.id}
                message={message}
                onActionClick={handleActionClick}
                isLatest={message.id === chatState.messages[chatState.messages.length - 1]?.id}
              />
            ))}
            
            {chatState.isLoading && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Bot className="h-4 w-4" />
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Analyzing your campaigns...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Suggestions (shown when no messages or empty) */}
        {chatState.messages.length <= 1 && (
          <div className="px-4 pb-4">
            <div className="text-sm text-muted-foreground mb-2">Suggested questions:</div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t bg-card p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(inputValue);
            }}
            className="flex space-x-2"
          >
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about your campaigns, performance, or optimization opportunities..."
              disabled={chatState.isLoading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!inputValue.trim() || chatState.isLoading}
              size="icon"
            >
              {chatState.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          
          {chatState.error && (
            <Alert className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{chatState.error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>
              Session: {chatState.sessionId.slice(-8)} • 
              Messages: {chatState.messages.length} • 
              Last activity: {chatState.lastActivity.toLocaleTimeString()}
            </span>
            <span>
              Powered by Gemini 2.5 Flash
            </span>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering main interface:', error);
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="text-red-600">Error rendering interface: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
}