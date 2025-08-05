export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  functionCalls?: FunctionCallInfo[];
  dataVisualization?: DataVisualization;
  actionButtons?: ActionButton[];
  metadata?: MessageMetadata;
}

export interface FunctionCallInfo {
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'success' | 'error';
  executionTime?: number;
  error?: string;
}

export interface DataVisualization {
  type: 'campaign-cards' | 'performance-chart' | 'metrics-table' | 'insights-list';
  data: unknown;
  config?: VisualizationConfig;
}

export interface VisualizationConfig {
  title?: string;
  timeframe?: string;
  metrics?: string[];
  chartType?: 'line' | 'bar' | 'pie' | 'area';
  showTrends?: boolean;
  highlightThresholds?: boolean;
}

export interface ActionButton {
  id: string;
  label: string;
  action: string;
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  confirmationRequired?: boolean;
  confirmationMessage?: string;
}

export interface MessageMetadata {
  tokensUsed?: number;
  responseTime?: number;
  confidence?: number;
  functionCallsCount?: number;
  dataSourcesUsed?: string[];
  recommendationLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  context: ConversationContext;
  sessionId: string;
  lastActivity: Date;
}

// Unified ConversationContext interface
export interface ConversationContext {
  businessInfo: {
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
  campaignContext: {
    activeCampaigns: string[];
    recentlyDiscussed: string[];
    currentFocus: string[];
    performanceAlerts: string[];
    optimizationOpportunities: string[];
  };
  userPreferences: {
    communicationStyle: 'concise' | 'detailed' | 'technical' | 'business-focused';
    dataVisualizationPreference: 'charts' | 'tables' | 'cards' | 'mixed';
    notificationLevel: 'all' | 'critical-only' | 'minimal';
    autoExecuteRecommendations: boolean;
    preferredMetrics: string[];
  };
  sessionMemory: {
    queriesAsked: string[];
    actionsPerformed: string[];
    campaignsMentioned: string[];
    insightsProvided: string[];
    recommendationsGiven: string[];
    issuesIdentified: string[];
    goalsDiscussed: string[];
  };
  // Properties expected by gemini service
  conversationHistory?: GeminiMessage[];
  previousQueries?: string[];
  mentionedCampaigns?: string[];
  actionsTaken?: string[];
  businessGoals?: string[];
}

// Support for Gemini message format
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

export interface BusinessInfo {
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
}

export interface CampaignContext {
  activeCampaigns: string[];
  recentlyDiscussed: string[];
  currentFocus: string[];
  performanceAlerts: string[];
  optimizationOpportunities: string[];
}

export interface UserPreferences {
  communicationStyle: 'concise' | 'detailed' | 'technical' | 'business-focused';
  dataVisualizationPreference: 'charts' | 'tables' | 'cards' | 'mixed';
  notificationLevel: 'all' | 'critical-only' | 'minimal';
  autoExecuteRecommendations: boolean;
  preferredMetrics: string[];
}

export interface SessionMemory {
  queriesAsked: string[];
  actionsPerformed: string[];
  campaignsMentioned: string[];
  insightsProvided: string[];
  recommendationsGiven: string[];
  issuesIdentified: string[];
  goalsDiscussed: string[];
}

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  suggestions?: string[];
}

export interface ChatMessageProps {
  message: ChatMessage;
  onActionClick?: (action: string, messageId: string) => void;
  onRetry?: (messageId: string) => void;
  isLatest?: boolean;
}

export interface ChatHeaderProps {
  sessionInfo: SessionInfo;
  onClearChat?: () => void;
  onExportChat?: () => void;
  onSettingsOpen?: () => void;
}

export interface SessionInfo {
  id: string;
  startTime: Date;
  messageCount: number;
  campaignsDiscussed: number;
  actionsPerformed: number;
  currentFocus?: string;
}

export interface AgentStatus {
  isOnline: boolean;
  lastSeen?: Date;
  currentActivity?: string;
  capabilities: AgentCapability[];
  responseTime: 'fast' | 'normal' | 'slow';
}

export interface AgentCapability {
  name: string;
  description: string;
  isEnabled: boolean;
  lastUsed?: Date;
  usageCount: number;
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  category: 'analysis' | 'optimization' | 'reporting' | 'management';
  parameters?: QuickActionParameter[];
  estimatedTime?: string;
}

export interface QuickActionParameter {
  name: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean';
  required: boolean;
  description: string;
  options?: string[];
  defaultValue?: unknown;
}

export interface ConversationSummary {
  sessionId: string;
  duration: number;
  messageCount: number;
  topicsDiscussed: string[];
  actionsPerformed: string[];
  keyInsights: string[];
  recommendationsGiven: string[];
  nextSteps: string[];
  unresolvedIssues: string[];
}

export interface ChatAnalytics {
  totalSessions: number;
  averageSessionDuration: number;
  mostDiscussedTopics: string[];
  mostUsedFunctions: string[];
  userSatisfactionScore?: number;
  resolutionRate: number;
  escalationRate: number;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
  lastErrorTime?: Date;
  errorCount: number;
}