import { FunctionDeclaration } from '@google/genai';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export interface GeminiPart {
  text?: string;
  functionCall?: GeminiFunctionCall;
  functionResponse?: GeminiFunctionResponse;
}

export interface GeminiFunctionCall {
  name: string;
  args: Record<string, unknown>;
}

export interface GeminiFunctionResponse {
  name: string;
  response: {
    result: unknown;
    success: boolean;
    error?: string;
  };
}

export interface GeminiResponse {
  text: string;
  functionCalls?: GeminiFunctionCall[];
  candidates?: GeminiCandidate[];
}

export interface GeminiCandidate {
  content: {
    parts: GeminiPart[];
    role: string;
  };
  finishReason?: string;
  index?: number;
  safetyRatings?: SafetyRating[];
}

export interface SafetyRating {
  category: string;
  probability: string;
}

export interface GenerateContentConfig {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
  candidateCount?: number;
  stopSequences?: string[];
  responseMimeType?: string;
  responseSchema?: Record<string, unknown>;
}

export interface GoogleAdsFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, FunctionParameter>;
    required?: string[];
  };
}

export interface FunctionParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: FunctionParameter;
  properties?: Record<string, FunctionParameter>;
}

// Updated ConversationContext to match agent.ts
export interface ConversationContext {
  businessInfo?: {
    companyName: string;
    industry: string;
    avgOrderValue: number;
    targetMetrics: {
      roas: number;
      cpa: number;
      conversionRate: number;
    };
    seasonality: string;
    competitors: string[];
    currentChallenges: string[];
    businessGoals: string[];
  };
  campaignContext?: {
    activeCampaigns: string[];
    recentlyDiscussed: string[];
    currentFocus: string[];
    performanceAlerts: string[];
    optimizationOpportunities: string[];
  };
  userPreferences?: {
    communicationStyle: 'concise' | 'detailed' | 'technical' | 'business-focused';
    dataVisualizationPreference: 'charts' | 'tables' | 'cards' | 'mixed';
    notificationLevel: 'all' | 'critical-only' | 'minimal';
    autoExecuteRecommendations: boolean;
    preferredMetrics: string[];
  };
  sessionMemory?: {
    queriesAsked: string[];
    actionsPerformed: string[];
    campaignsMentioned: string[];
    insightsProvided: string[];
    recommendationsGiven: string[];
    issuesIdentified: string[];
    goalsDiscussed: string[];
  };
  conversationHistory?: GeminiMessage[];
  previousQueries?: string[];
  mentionedCampaigns?: string[];
  actionsTaken?: string[];
  businessGoals?: string[];
}

export interface AgentCapabilities {
  canAnalyzeCampaigns: boolean;
  canOptimizeBudgets: boolean;
  canProvideInsights: boolean;
  canExecuteActions: boolean;
  canAccessRealTimeData: boolean;
  canGenerateReports: boolean;
}

export interface SystemPromptConfig {
  basePersonality: string;
  businessContext: string;
  availableFunctions: string;
  responseStyle: string;
  urgencyLevel: string;
  expertiseLevel: string;
}

export interface FunctionCallResult {
  success: boolean;
  data?: unknown;
  error?: string;
  executionTime?: number;
  metadata?: Record<string, unknown>;
}

export interface ChatSession {
  id: string;
  userId?: string;
  startTime: Date;
  lastActivity: Date;
  messageCount: number;
  context: ConversationContext;
  isActive: boolean;
}

export interface ModelConfig {
  model: string;
  temperature: number;
  maxOutputTokens: number;
  topP: number;
  topK: number;
  safetySettings?: SafetySetting[];
}

export interface SafetySetting {
  category: string;
  threshold: string;
}

// Function calling specific types
export interface ToolConfig {
  functionCallingConfig?: {
    mode: 'AUTO' | 'ANY' | 'NONE';
    allowedFunctionNames?: string[];
  };
}

export interface Tool {
  functionDeclarations: FunctionDeclaration[];
}

// Error types
export interface GeminiError {
  code: number;
  message: string;
  status: string;
  details?: Record<string, unknown>;
}

export interface FunctionCallError extends Error {
  functionName: string;
  arguments: Record<string, unknown>;
  originalError?: Error;
}

// Response processing types
export interface ProcessedResponse {
  text: string;
  functionCalls: GeminiFunctionCall[];
  needsFollowUp: boolean;
  confidence: number;
  responseType: 'text' | 'function_call' | 'mixed';
  metadata: {
    tokensUsed?: number;
    processingTime?: number;
    modelUsed?: string;
  };
}

// Analytics and logging types
export interface ConversationAnalytics {
  sessionId: string;
  messageCount: number;
  functionCallsCount: number;
  averageResponseTime: number;
  topFunctions: string[];
  userSatisfaction?: number;
  resolvedQueries: number;
  escalatedQueries: number;
}

export interface PerformanceMetrics {
  requestLatency: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  functionCallLatency: Record<string, number>;
  cacheHitRate?: number;
  errorRate: number;
}